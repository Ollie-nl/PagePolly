// server/server.js
const express = require('express');
const path = require('path');
const dotenv = require('dotenv');
const bodyParser = require('body-parser');
const cors = require('cors');
const rateLimit = require('express-rate-limit');

// Configure rate limiter
const healthCheckLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 30, // limit each IP to 30 requests per windowMs
  message: 'Too many health check requests, please try again later.'
});
// Load environment variables first
dotenv.config({ path: path.join(__dirname, '../.env') });

// Initialize puppeteer manager
const puppeteerManager = require('./services/puppeteer/puppeteerManager');
const app = express();
const port = process.env.PORT || 5000;

// Configure CORS
const corsOptions = {
  origin: process.env.FRONTEND_URL || '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'apikey'],
  credentials: true
};

// Middleware
app.use(cors(corsOptions));

// Import and initialize ScrapingBee proxy middleware before body parser
import createScrapingBeeProxy from './middleware/scrapingBeeProxy.js';
app.use('/api/scrapingbee', createScrapingBeeProxy());

// Body parser middleware after proxy configuration
app.use(bodyParser.json({ limit: '10mb' })); // Increased limit for screenshot data
app.use(bodyParser.urlencoded({ extended: true, limit: '10mb' }));

// Add comprehensive health check endpoint
app.get('/api/health', healthCheckLimiter, async (req, res) => {
  // Set CORS headers for health check
  res.set('Access-Control-Allow-Origin', '*');
  res.set('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.set('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  try {
    // Check if Puppeteer manager is initialized
    const puppeteerMetrics = await puppeteerManager.checkHealth();
    
    const healthStatus = {
      success: puppeteerMetrics.success,
      timestamp: new Date().toISOString(),
      version: process.env.npm_package_version || '1.0.0',
      services: {
        puppeteer: {
          status: puppeteerMetrics.degraded ? 'degraded' : 'healthy',
          lastCheck: puppeteerMetrics.timestamp,
          metrics: {
            responseTime: puppeteerMetrics.responseTime,
            activeBrowsers: puppeteerMetrics.activeBrowsers,
            memory: puppeteerMetrics.memory,
            performance: puppeteerMetrics.performance
          },
          error: puppeteerMetrics.error
        },
        server: {
          status: 'healthy',
          uptime: process.uptime(),
          memory: process.memoryUsage(),
          timestamp: new Date().toISOString()
        }
      }
    };

    if (puppeteerMetrics.degraded) {
      return res.status(503).json({
        ...healthStatus,
        message: 'Crawler service is degraded',
        retryAfter: 30
      });
    }

    res.json({
      ...healthStatus,
      message: 'All services are healthy'
    });
  } catch (error) {
    console.error('Health check failed:', error);
    res.status(503).json({
      success: false,
      message: 'Service is experiencing issues',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
      timestamp: new Date().toISOString(),
      retryAfter: 30
    });
  }
});

// Serve static files from the React app
app.use(express.static(path.join(__dirname, '../dist')));

// API Routes
const puppeteerCrawlRoutes = require('./routes/puppeteerCrawlRoutes');

// Use API routes
app.use('/api/crawls', puppeteerCrawlRoutes);

// Handle any requests that don't match the API routes
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../dist', 'index.html'));
});

// Custom error handler for API routes
app.use('/api', (err, req, res, next) => {
  console.error('API Error:', {
    path: req.path,
    method: req.method,
    error: err.message,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
  });

  // Handle different types of errors
  if (err.name === 'ValidationError') {
    return res.status(400).json({
      success: false,
      error: 'Validation Error',
      message: err.message,
      details: err.details
    });
  }

  if (err.name === 'UnauthorizedError') {
    return res.status(401).json({
      success: false,
      error: 'Authentication Error',
      message: 'Invalid or missing authentication token'
    });
  }

  // Handle service unavailable explicitly
  if (err.code === 'SERVICE_UNAVAILABLE' || err.statusCode === 503 || 
      (err.response && err.response.status === 503)) {
    // Get health metrics
    const healthMetrics = req.app.locals.puppeteerManager?.getLatestMetrics() || {};
    
    return res.status(503).json({
      success: false,
      error: 'Service Unavailable',
      message: 'The service is temporarily unavailable. Please try again later.',
      retryAfter: err.retryAfter || 30,
      metrics: healthMetrics,
      degraded: true
    });
  }

  // Default error response
  res.status(err.statusCode || 500).json({
    success: false,
    error: err.name || 'Server Error',
    message: process.env.NODE_ENV === 'development' ? err.message : 'An unexpected error occurred',
    requestId: req.id,
    timestamp: new Date().toISOString()
  });
});

// Fallback error handler for non-API routes
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  if (!res.headersSent) {
    res.status(500).json({
      error: 'Server Error',
      message: process.env.NODE_ENV === 'development' ? err.message : 'An unexpected error occurred'
    });
  }
});

// Start the server
const server = app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});

// Handle graceful shutdown
process.on('SIGTERM', gracefulShutdown);
process.on('SIGINT', gracefulShutdown);

async function gracefulShutdown() {
  console.log('Shutting down server gracefully...');
  
  // Close all active puppeteer browsers
  try {
    await puppeteerManager.closeAllBrowsers();
    console.log('All browser instances closed');
  } catch (err) {
    console.error('Error closing browser instances:', err);
  }
  
  // Close server
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
  
  // Force close if graceful shutdown fails
  setTimeout(() => {
    console.error('Forcing server shutdown after timeout');
    process.exit(1);
  }, 10000);
}

module.exports = server;