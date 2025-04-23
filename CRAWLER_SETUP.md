# PagePolly Web Crawler Setup Guide

This guide provides step-by-step instructions to set up and configure both the frontend and backend components of the PagePolly web crawler system. The crawler allows you to monitor vendor websites by crawling web pages and storing structured information.

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Supabase Setup](#supabase-setup)
3. [Frontend Setup](#frontend-setup)
4. [Backend Setup](#backend-setup)
5. [Running the Application](#running-the-application)
6. [Using the Web Crawler](#using-the-web-crawler)
7. [Troubleshooting](#troubleshooting)

## Prerequisites

Before you begin, ensure you have the following installed:

- [Node.js](https://nodejs.org/) (v16 or higher)
- [npm](https://www.npmjs.com/), [yarn](https://yarnpkg.com/), or [pnpm](https://pnpm.io/)
- [Git](https://git-scm.com/)
- A [Supabase](https://supabase.com/) account

## Supabase Setup

1. **Create a new Supabase project**:
   - Sign up or log in to [Supabase](https://supabase.com/)
   - Create a new project with a name of your choice
   - Note down the project URL and API keys (found in Project Settings > API)

2. **Set up database tables**:
   - Navigate to the SQL Editor in your Supabase dashboard
   - Run the SQL from `database/init.sql` first to create the core tables
   - Then run the SQL from `database/crawl_jobs.sql` to create the crawl jobs table

3. **Enable authentication**:
   - Go to Authentication > Settings
   - Enable Email auth provider (or other providers as needed)
   - Configure site URL to match your frontend URL (e.g., http://localhost:5173 for development)

## Frontend Setup

1. **Clone the repository and install dependencies**:
   

2. **Set up environment variables**:
   - Create a `.env` file in the root directory:
   ```
   VITE_SUPABASE_URL=your_supabase_url_here
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key_here
   ```
   - Replace placeholders with your actual Supabase URL and anon key

3. **Verify the Supabase client configuration**:
   - Check `src/lib/supabaseClient.js` to ensure it's correctly importing environment variables

## Backend Setup

1. **Install backend dependencies**:
   

2. **Set up backend environment variables**:
   - Create a `.env` file in the root directory (if not already created):
   ```
   # Supabase Configuration
   VITE_SUPABASE_URL=your_supabase_url_here
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key_here
   SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key_here
   
   # Server Configuration
   PORT=4000
   NODE_ENV=development
   
   # Deployment Configuration
   BASE_URL=http://localhost:5173
   
   # Crawler Configuration
   MAX_CONCURRENT_CRAWLS=5
   CRAWL_TIMEOUT=60000
   ```
   - Replace placeholders with your actual Supabase credentials
   - The `SUPABASE_SERVICE_ROLE_KEY` is critical - get it from Supabase dashboard > Settings > API

3. **Install Puppeteer dependencies** (Linux only):
   - If you're running on Linux, you may need additional dependencies for Puppeteer:
   

## Running the Application

1. **Start the frontend development server**:
   
   - This will start the React application at http://localhost:5173

2. **Start the backend server**:
   
   - This will start the Express server at http://localhost:4000

3. **Verify the connection**:
   - Open your browser and navigate to http://localhost:5173
   - You should be able to log in and access the dashboard

## Using the Web Crawler

1. **Register and log in to the application**:
   - Create a new account via the registration page
   - Log in with your credentials

2. **Create a project**:
   - Navigate to the Projects section
   - Click "New Project" and provide a name and description

3. **Create pages in your project**:
   - Open your new project
   - Add pages by providing titles and URLs to monitor

4. **Start a crawl**:
   - From the project view, select the pages you want to crawl
   - Click "Start Crawl" to begin the process
   - The system will queue your crawl job and begin processing

5. **Monitor crawl progress**:
   - View active crawl jobs in the "Active Crawls" section
   - See detailed progress information and cancel jobs if needed

6. **Analyze results**:
   - Once a crawl is complete, view the results in the project dashboard
   - Examine screenshots, extracted elements, and page structure

## Troubleshooting

### Frontend Issues

1. **Authentication problems**:
   - Check browser console for errors
   - Verify Supabase URL and anon key in `.env`
   - Ensure Supabase Site URL is configured correctly

2. **API connection issues**:
   - Confirm backend server is running
   - Check browser console for CORS errors
   - Verify `apiClient.js` is correctly configured

### Backend Issues

1. **Server fails to start**:
   - Check all required environment variables are set
   - Verify Supabase service role key is correct
   - Ensure port 4000 is available

2. **Puppeteer errors**:
   - On Linux, verify all dependencies are installed
   - Increase memory limit if needed: `NODE_OPTIONS=--max_old_space_size=4096`

3. **Crawl jobs fail**:
   - Check server logs for detailed error messages
   - Verify target URLs are accessible
   - Increase crawler timeout for slow websites

### Database Issues

1. **Missing tables**:
   - Verify SQL scripts were executed successfully
   - Check Supabase console for error messages

2. **Permission errors**:
   - Verify Row Level Security (RLS) policies are correctly set up
   - Check if service role key has necessary permissions

## Advanced Configuration

### Customizing Crawler Behavior

You can customize how the crawler behaves by editing `server/services/crawlService.js`:

- **Element extraction**: Modify the page evaluator function to target specific elements
- **Crawl depth**: Change the crawler to follow links for deeper crawling
- **Screenshot settings**: Adjust quality and dimensions of captured screenshots

### Scaling Considerations

For production use with many users or large crawl jobs:

- **Database**: Consider enabling Supabase realtime for live updates
- **Memory**: Monitor server memory usage and adjust MAX_CONCURRENT_CRAWLS
- **Hosting**: Deploy the backend to a service with sufficient resources

### Security Notes

- Keep your Supabase service role key secure, never expose it publicly
- Use environment variables for all sensitive credentials
- Regularly update dependencies to patch security vulnerabilities