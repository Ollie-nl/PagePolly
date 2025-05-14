# PagePolly Architecture

## Overview
PagePolly is a web crawling application that supports multiple crawling methods to monitor vendor websites. The system is built with a modern tech stack including React for the frontend and Node.js for the backend, with Supabase providing database and authentication services.

## Crawling Methods

### 1. API-based Crawling
- Direct API integration with vendor systems
- Structured data retrieval
- Rate limiting compliance

### 2. Puppeteer-based Crawling
- Headless browser automation
- Anti-blocking mechanisms:
  - User agent rotation
  - Request delays and timing randomization
  - Browser fingerprint protection
  - Proxy support (configurable)
- Human behavior simulation:
  - Random scroll patterns
  - Natural mouse movements
  - Varying interaction delays

## System Components

### Frontend (React)
- User Interface Components
  - Vendor Management
  - Crawl Configuration
  - Results Dashboard
  - Test Interface
- State Management (Redux)
- API Client Services

### Backend (Node.js)
- API Routes
- Crawling Services
  - PuppeteerManager
  - APIClient
  - ResultProcessor
- Database Operations
- Authentication

### Database (Supabase)
- Vendors
- CrawlJobs
- CrawlResults
- UserConfigs

## Data Flow

1. **Configuration**
   - User configures vendor settings
   - System stores configuration in Supabase

2. **Crawl Initiation**
   - User triggers crawl through UI
   - System selects appropriate crawler (API/Puppeteer)
   - Job queued in database

3. **Crawl Execution**
   - Crawler service processes job
   - Anti-blocking measures applied
   - Data extracted and validated

4. **Results Processing**
   - Raw data cleaned and normalized
   - Results stored in database
   - Notifications sent if configured

## Security Measures

- Row Level Security (RLS) in Supabase
- JWT-based authentication
- Rate limiting
- Data encryption at rest

## Performance Considerations

- Connection pooling
- Result caching
- Batch processing
- Automatic retries with exponential backoff

## Monitoring and Logging

- Crawl success rates
- Error tracking
- Performance metrics
- Resource utilization
