# PagePolly Quick Start Guide

This guide will help you quickly set up PagePolly with the web crawler functionality.

## 1. Prerequisites

- [Node.js](https://nodejs.org/) v16 or newer
- [npm](https://www.npmjs.com/), [pnpm](https://pnpm.io/), or [yarn](https://yarnpkg.com/)
- A [Supabase](https://supabase.com/) account (free tier works fine)

## 2. Environment Setup

1. **Supabase Setup:**
   - Create a new project in Supabase
   - Run the SQL from `database/init.sql` and `database/crawl_jobs.sql` in the SQL Editor
   - Get your project URL, anon key, and service role key from Project Settings → API

2. **Environment Variables:**
   - Copy `.env.template` to `.env`
   - Fill in your Supabase and ScrapingBee credentials:
     ```
     VITE_SUPABASE_URL=your_supabase_url_here
     VITE_SUPABASE_ANON_KEY=your_supabase_anon_key_here
     SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key_here
     SCRAPING_BEE_API_KEY=your_scraping_bee_api_key_here
     ```
   - You can obtain a ScrapingBee API key by signing up at https://www.scrapingbee.com/

## 3. Start the Application

1. **Install frontend dependencies:**
   ```bash
   pnpm install
   ```

2. **Start the frontend:**
   ```bash
   pnpm run dev
   ```

   The frontend will be available at http://localhost:5173

3. **Start the crawler service:**
   ```bash
   node start-crawler.js
   ```
   The crawler API will be available at http://localhost:4000

## 4. Using the Crawler

1. **Register and log in** to your account
2. **Create a project** from the dashboard
3. **Add pages** to your project with the URLs you want to monitor
4. **Start a crawl** by selecting pages and clicking "Start Crawl"
5. **Monitor progress** in the Active Crawls section
6. **View results** once the crawl is complete

## 5. Crawler Features

- Full-page screenshots of vendor websites
- Structured data extraction of products and page elements
- Detailed breakdown of page components and their positions
- Real-time progress monitoring
- Historical crawl data storage

## 6. Common Issues

**Crawler fails to start:**
- Check if all Supabase credentials are correct
- Ensure port 4000 is available
- On Linux, you may need additional Puppeteer dependencies:
  ```bash
  sudo apt-get install -y ca-certificates fonts-liberation libasound2 libatk-bridge2.0-0 libatk1.0-0 libc6 libcairo2 libcups2 libdbus-1-3 libexpat1 libfontconfig1 libgbm1 libgcc1 libglib2.0-0 libgtk-3-0 libnspr4 libnss3 libpango-1.0-0 libpangocairo-1.0-0 libstdc++6 libx11-6 libx11-xcb1 libxcb1 libxcomposite1 libxcursor1 libxdamage1 libxext6 libxfixes3 libxi6 libxrandr2 libxrender1 libxss1 libxtst6 lsb-release wget xdg-utils
  ```

**Authentication issues:**
- Ensure your Supabase URL and keys are correct
- Check that the Supabase site URL is configured properly in Authentication settings

## 7. Next Steps

For more detailed information, see:
- [Full Setup Guide](./CRAWLER_SETUP.md)
- [Server Documentation](./server/README.md)

Need help? Check out the [troubleshooting section](./CRAWLER_SETUP.md#troubleshooting) or open an issue on GitHub.