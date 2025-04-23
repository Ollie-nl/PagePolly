// server/src/server.js
const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');
const crawlRoutes = require('./routes/crawlRoutes');

// Load environment variables
dotenv.config();

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logging middleware
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl}`);
  next();
});

// Import authentication middleware
const { requireAuth, optionalAuth } = require('./middleware/authMiddleware');

// Development-only middleware to mock authentication in dev mode
const devAuthMiddleware = (req, res, next) => {
  if (process.env.NODE_ENV === 'development') {
    req.user = {
      id: 'dev-user-id',
      email: 'dev@example.com',
      role: 'admin'
    };
  }
  next();
};

// Choose the appropriate auth middleware based on environment
const authMiddleware = process.env.NODE_ENV === 'development' ? devAuthMiddleware : requireAuth;

// Static files - serve the built frontend in production
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../../dist')));
}

// API Routes
app.use('/api/crawls', authMiddleware, crawlRoutes);

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', environment: process.env.NODE_ENV });
});

// Fallback route for SPA in production
if (process.env.NODE_ENV === 'production') {
  app.get('*', (req, res) => {
    res.sendFile(path.resolve(__dirname, '../../dist/index.html'));
  });
}

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  
  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal Server Error';
  
  res.status(statusCode).json({
    error: true,
    message,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`PagePolly API server running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
  
  // Log ScrapingBee API configuration
  if (!process.env.SCRAPING_BEE_API_KEY) {
    console.warn('WARNING: SCRAPING_BEE_API_KEY environment variable not set');
    console.warn('Crawling functionality will not work correctly');
  } else {
    console.log('ScrapingBee API configured successfully');
  }
});

module.exports = app;