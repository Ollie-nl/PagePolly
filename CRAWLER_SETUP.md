# PagePolly Web Crawler Setup Guide

This guide will help you set up and use the PagePolly web crawler service powered by ScrapingBee API. The crawler enables you to extract content, structure, and screenshots from websites.

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Quick Installation](#quick-installation)
3. [Manual Setup](#manual-setup)
4. [Configuration](#configuration)
5. [Running the Crawler](#running-the-crawler)
6. [API Endpoints](#api-endpoints)
7. [Troubleshooting](#troubleshooting)

## Prerequisites

Before you begin, ensure you have:

- Node.js v16 or higher installed
- A ScrapingBee API key (get one at [ScrapingBee.com](https://www.scrapingbee.com/) - free trial available)
- Supabase project configured with the necessary tables

## Quick Installation

We provide an automated setup script to help you get started quickly:

```bash
node setup-crawler.js
```

The script will:
- Check for required dependencies
- Install necessary packages
- Guide you through setting up your ScrapingBee API key
- Create necessary directories and files
- Generate a start script

## Manual Setup

If you prefer to set up manually or if the automated setup didn't work:

1. **Install dependencies**:

```bash
cd server
npm install
cd ..
```

2. **Configure environment variables**:

Create or edit `.env` file in the project root with:

```
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
SCRAPING_BEE_API_KEY=your_scraping_bee_api_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
```


3. **Set up database tables**:

Execute the SQL script in the Supabase SQL Editor. Create a file named `database/crawl_jobs.sql` with:

```sql
-- Create table for storing crawl jobs
CREATE TABLE IF NOT EXISTS crawl_jobs (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  project_id TEXT NOT NULL,
  urls TEXT[] NOT NULL,
  status TEXT NOT NULL,
  progress INTEGER NOT NULL DEFAULT 0,
  start_time TIMESTAMP WITH TIME ZONE NOT NULL,
  completion_time TIMESTAMP WITH TIME ZONE,
  results JSONB DEFAULT '[]'::jsonb,
  errors JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW())
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS crawl_jobs_user_id_idx ON crawl_jobs(user_id);
CREATE INDEX IF NOT EXISTS crawl_jobs_project_id_idx ON crawl_jobs(project_id);
CREATE INDEX IF NOT EXISTS crawl_jobs_status_idx ON crawl_jobs(status);

-- Enable Row Level Security
ALTER TABLE crawl_jobs ENABLE ROW LEVEL SECURITY;

-- RLS policies to secure the table
CREATE POLICY "Users can view their own crawl jobs" ON crawl_jobs 
  FOR SELECT USING (auth.uid() = user_id);
  
CREATE POLICY "Users can insert their own crawl jobs" ON crawl_jobs 
  FOR INSERT WITH CHECK (auth.uid() = user_id);
  
CREATE POLICY "Users can update their own crawl jobs" ON crawl_jobs 
  FOR UPDATE USING (auth.uid() = user_id);
```

4. **Create authentication middleware**:

Create file `server/src/middleware/authMiddleware.js`:

```javascript
// server/src/middleware/authMiddleware.js
const { createClient } = require('@supabase/supabase-js');
jwt = require('jsonwebtoken');

// Initialize Supabase client
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Middleware to require authentication
exports.requireAuth = async (req, res, next) => {
  try {
    // Get the token from the Authorization header
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'No authentication token provided' });
    }

    const token = authHeader.split(' ')[1];
    
    // Verify the token with Supabase
    const { data: { user }, error } = await supabase.auth.getUser(token);
    
    if (error || !user) {
      return res.status(401).json({ message: 'Invalid or expired authentication token' });
    }
    
    // Set the user info on the request object
    req.user = user;
    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    res.status(500).json({ message: 'Server authentication error' });
  }
};

// Middleware for optional authentication
exports.optionalAuth = async (req, res, next) => {
  try {
    // Get the token from the Authorization header
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      // No token, continue as unauthenticated
      return next();
    }

    const token = authHeader.split(' ')[1];
    
    // Verify the token with Supabase
    const { data: { user }, error } = await supabase.auth.getUser(token);
    
    if (!error && user) {
      // Set the user info on the request object
      req.user = user;
    }
    next();
  } catch (error) {
    // Continue as unauthenticated on error
    next();
  }
};
```

## Running the Crawler

After completing the setup:

1. Start the crawler service:

```bash
node start-crawler.js
```

This will start the crawler API server on port 3001 (or the port specified in your environment variables).

## API Endpoints

The crawler service exposes the following REST API endpoints:

- **POST /api/crawls**
  - Start a new crawl job
  - Request body: `{ "projectId": "project-id", "urls": ["https://example.com"] }`

- **GET /api/crawls/:jobId**
  - Get details of a specific crawl job

- **GET /api/crawls**
  - Get crawl history with optional filtering
  - Query parameters: `projectId`, `status`, `limit`, `page`

- **GET /api/crawls/status**
  - Get all active crawl jobs for current user

- **POST /api/crawls/:jobId/cancel**
  - Cancel an active crawl job

## Integration with PagePolly Frontend

The frontend integration is handled through the Redux store and API client. The main components are:

- **src/api/crawlerApi.js**: API client for the crawler service
- **src/store/reducers/crawlSlice.js**: Redux slice for managing crawler state
- **src/components/crawler/CrawlerInterface.jsx**: UI component for the crawler

## Troubleshooting

### Common Issues

1. **Connection refused errors**:
   - Ensure the crawler service is running
   - Check if the port (default 3001) is available

2. **Authentication errors**:
   - Verify your Supabase configuration
   - Check that the user is properly authenticated

3. **ScrapingBee API errors**:
   - Verify your API key is correct
   - Check if you've reached your API usage limits

### Logs

To see more detailed logs, start the service with debug logging:

```bash
DEBUG=crawler:* node start-crawler.js
```

## Additional Resources

- [ScrapingBee API Documentation](https://www.scrapingbee.com/documentation/)
- [Supabase Authentication Documentation](https://supabase.com/docs/guides/auth)
- [PagePolly Documentation](./docs/index.md)
