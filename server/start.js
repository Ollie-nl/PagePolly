#!/usr/bin/env node
// server/start.js
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
const app = require('./src/server');

// Start the server
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`
  🕸️  PagePolly Crawler API Server  🕸️
  
  Server running at http://localhost:${PORT}
  
  API Endpoints:
  - POST   /api/crawls        - Start a new crawl job
  - GET    /api/crawls/:jobId - Get details of a specific crawl
  - GET    /api/crawls        - Get crawl history
  - GET    /api/crawls/status - Get active crawl jobs
  - POST   /api/crawls/:jobId/cancel - Cancel a crawl job
  
  Health check: http://localhost:${PORT}/health
  
  Environment: ${process.env.NODE_ENV || 'development'}
  `);
});