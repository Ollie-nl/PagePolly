# PagePolly Web Crawler Service

The PagePolly web crawler service is a Node.js backend that crawls websites and stores structured data in Supabase. It uses Puppeteer for headless browser automation to extract page elements, take screenshots, and analyze web page structure.

## Features

- **Web Crawling**: Crawl specified URLs and extract structured data
- **Screenshot Capture**: Take full-page screenshots of crawled pages
- **Element Extraction**: Extract product elements, navigation, headings, and links
- **Concurrent Processing**: Handle multiple crawl jobs simultaneously
- **Progress Tracking**: Monitor crawl progress in real-time
- **Job Management**: Start, monitor, and cancel crawl jobs
- **Supabase Integration**: Store results in Supabase database
- **Authentication**: Secure API endpoints with Supabase auth

## Prerequisites

- Node.js 16 or higher
- Supabase account with the following setup:
  - Authentication enabled
  - Database tables created (see `database/init.sql` and `database/crawl_jobs.sql`)
  - Service role API key

## Setup Instructions

1. **Install dependencies**

```bash
cd server
npm install
```


2. **Configure environment variables**

Copy the `.env.template` file to `.env` and fill in your Supabase credentials:

```bash
cp ../.env.template ../.env
# Then edit the .env file with your credentials
```


Required environment variables:
- `VITE_SUPABASE_URL`: Your Supabase project URL
- `VITE_SUPABASE_ANON_KEY`: Supabase anonymous key for client-side auth
- `SUPABASE_SERVICE_ROLE_KEY`: Supabase service role key for server-side operations
- `PORT`: Server port (default: 4000)
- `NODE_ENV`: Environment (development, production)

3. **Initialize the database**

Run the SQL scripts in the Supabase SQL editor:
- `database/init.sql` - Creates core tables
- `database/crawl_jobs.sql` - Creates the crawl jobs table

4. **Start the server**

Development mode:

```bash
cd server
npm run dev
```

Production mode:

```bash
cd server
npm start
```

## API Endpoints

### Start a crawl
- **POST** `/api/crawls`
- **Body**: `{ "projectId": "uuid", "urls": ["url1", "url2"] }`
- **Auth**: JWT token required
- **Returns**: Job ID and status

### Get active crawl jobs
- **GET** `/api/crawls/status`
- **Auth**: JWT token required
- **Returns**: List of active crawl jobs

### Cancel a crawl job
- **POST** `/api/crawls/:jobId/cancel`
- **Auth**: JWT token required
- **Returns**: Updated job status

### Get crawl job details
- **GET** `/api/crawls/:jobId`
- **Auth**: JWT token required
- **Returns**: Detailed job information including results

### Get crawl history
- **GET** `/api/crawls?projectId=uuid&status=completed&limit=10&page=1`
- **Auth**: JWT token required
- **Returns**: Paginated list of crawl jobs

## Architecture

- **server/index.js**: Main Express server setup
- **server/routes/crawlRoutes.js**: API route definitions
- **server/services/crawlService.js**: Web crawler implementation
- **server/config/db.js**: Database service for Supabase interaction
- **server/middlewares/auth.js**: Authentication middleware

## Extension Points

- **Custom Element Extraction**: Modify the page evaluator in `crawlSinglePage()` to extract additional elements
- **Result Processing**: Add post-processing of crawl results for specific analysis needs
- **Notifications**: Implement webhooks or notifications when crawls complete

## Troubleshooting

- **Browser Launch Issues**: If Puppeteer fails to launch in production environments, you may need to install additional dependencies or use a Docker container with Chrome included.
- **Memory Issues**: For large crawls, monitor memory usage and adjust the `MAX_CONCURRENT_CRAWLS` environment variable.