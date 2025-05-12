// server/index.js
const express = require('express');
const cors = require('cors');
const path = require('path');
const dotenv = require('dotenv');
const { createClient } = require('@supabase/supabase-js');
const crawlRoutes = require('./routes/crawlRoutes');
const authMiddleware = require('./middlewares/auth');
const scrapingBeeProxy = require('./middlewares/scrapingBeeProxy');

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../.env') });

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 4000;

// Supabase client for auth verification
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Import Supabase Edge Function proxy middleware
const supabaseEdgeProxy = require('./middlewares/supabaseEdgeProxy');

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files from the React app
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../dist')));
}

// Import mock routes
const mockRoutes = require('./routes/mockRoutes');

// API routes - Mock routes need to be first to take precedence
app.use('/api', mockRoutes);

// Original routes - these will run if the mock routes don't handle the request
app.use('/api/crawls', authMiddleware, crawlRoutes);

// Add ScrapingBee proxy route - no auth required for testing purposes
app.use('/api/scrapingbee', scrapingBeeProxy);

// Add Supabase Edge Function proxy route
app.use('/api/edge-functions', supabaseEdgeProxy);

// Serve React app in production
if (process.env.NODE_ENV === 'production') {
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../dist/index.html'));
  });
}

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Server Error:', err.stack);
  res.status(500).json({ 
    error: 'Internal Server Error',
    message: process.env.NODE_ENV === 'development' ? err.message : 'An unexpected error occurred'
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`PagePolly server running on port ${PORT}`);
  console.log(`API available at http://localhost:${PORT}/api`);
});

module.exports = app;