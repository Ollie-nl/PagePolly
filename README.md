# PagePolly

PagePolly is an open-source web crawler tool designed to monitor vendor websites, ensuring products are displayed as agreed upon. It crawls vendor pages from provided URLs and stores relevant data in a PostgreSQL database. The results are presented through an intuitive React dashboard, enabling users to track crawl progress and identify discrepancies in product placement.

## Project Structure

```
├── src/
│   ├── App.jsx                 # Main application component
│   ├── api/apiClient.js        # API client for backend communication
│   ├── components/             # Reusable UI components
│   ├── dashboard/              # Dashboard-related components
│   ├── layouts/                # Layout components
│   ├── pages/                  # Different application pages
│   ├── store/                  # Redux store and reducers
│   ├── main.jsx                # Application entry point
│   └── index.css               # Global styles (Tailwind)
├── public/
│   └── data/                   # Static data assets
├── index.html                  # HTML template
├── vite.config.js              # Vite configuration
├── tailwind.config.js          # Tailwind configuration
├── postcss.config.js           # PostCSS configuration
└── eslint.config.js            # ESLint configuration
```

## Installation and Deployment Guide

### 1. Local Installation

#### Prerequisites
- [Node.js](https://nodejs.org/) (version 16 or higher)
- [npm](https://www.npmjs.com/), [yarn](https://yarnpkg.com/), or [pnpm](https://pnpm.io/) as package manager
- [Git](https://git-scm.com/) to clone the repository

#### Step-by-Step Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/Ollie-nl/PagePolly.git
   cd PagePolly
   ```

2. **Install dependencies**
   Choose one of the following commands depending on your package manager:

   With npm:
   ```bash
   npm install
   ```

   With yarn:
   ```bash
   yarn install
   ```

   With pnpm:
   ```bash
   pnpm install
   ```

3. **Configure environment variables**
   Copy the `.env.example` file to a new `.env` file:

   ```bash
   cp .env.example .env
   ```

   Open the `.env` file in an editor and fill in the required information:

   ```
   # API configuration
   API_URL=http://localhost:3000

   # Database configuration (if applicable)
   DB_HOST=localhost
   DB_PORT=5432
   DB_NAME=pagepolly
   DB_USER=username
   DB_PASSWORD=password

   # Other configuration options
   ...
   ```

4. **Start the development server**
   To start the application locally, run:

   ```bash
   npm run dev
   # or
   yarn dev
   # or
   pnpm run dev
   ```

   The application will be available at `http://localhost:5173` (or another port indicated in the terminal).

### 2. Building for Production

When you're ready to deploy the application, create a production build:

```bash
node run build
# or
 yarn build
# or
pnpm run build
```

This will generate an optimized version of your application in the `dist` directory.

### 3. Deployment to Hosting Providers

Here are instructions for deploying PagePolly to various hosting providers. Choose the one that best fits your situation.

#### 3.1 Vercel

Vercel is a popular platform for hosting React applications.

1. Create an account on [Vercel](https://vercel.com/)
2. Install the Vercel CLI:
   ```bash
   npm install -g vercel
   ```
3. Log in to Vercel via terminal:
   ```bash
   vercel login
   ```
4. Deploy the application:
   ```bash
   vercel
   ```
5. Follow the prompts in the terminal to complete the deployment.

#### 3.2 Netlify

1. Create an account on [Netlify](https://www.netlify.com/)
2. You can deploy in two ways:

   **Option 1: Via the Netlify interface**
   - Go to your Netlify dashboard
   - Drag the `dist` directory to the upload area on the Netlify site

   **Option 2: Via the Netlify CLI**
   - Install the Netlify CLI:
     ```bash
     npm install -g netlify-cli
     ```
   - Log in to Netlify:
     ```bash
     netlify login
     ```
   - Initialize your project:
     ```bash
     netlify init
     ```
   - Deploy the application:
     ```bash
     netlify deploy --prod
     ```

#### 3.3 Own Server (VPS)

If you're using your own server or VPS (e.g., DigitalOcean, Linode, or OVH):

1. Ensure Node.js is installed on your server
2. Copy your project files to the server:
   ```bash
   scp -r ./dist/* user@your-server:/path/to/webroot
   ```
   
   Or use SFTP software like FileZilla to upload files

3. For dynamic backend functionality, install a web server like Nginx:
   ```bash
   sudo apt update
   sudo apt install nginx
   ```

4. Configure Nginx to serve your application:
   ```
   server {
       listen 80;
       server_name yourdomain.com www.yourdomain.com;
       
       root /path/to/webroot;
       index index.html;
       
       location / {
           try_files $uri $uri/ /index.html;
       }
   }
   ```

5. Restart Nginx:
   ```bash
   sudo service nginx restart
   ```

#### 3.4 Shared Hosting (cPanel, Plesk, etc.)

For traditional shared hosting platforms:

1. Open the cPanel or similar interface of your hosting provider
2. Go to the File Manager section
3. Navigate to the directory where you want to place the application (usually `public_html`)
4. Upload the contents of the `dist` directory to this location
5. Ensure the index.html file is at the correct level

### 4. Backend Setup

PagePolly uses a Node.js backend for API functionality and database connections. If you need full functionality:

1. Configure a PostgreSQL database:
   - Create a new database
   - Configure the appropriate access rights
   - Update the .env file with the correct database credentials

2. Deploy the backend:
   - For Vercel/Netlify: Use serverless functions
   - For a VPS: Install PM2 to manage Node.js applications:
     ```bash
     npm install -g pm2
     pm2 start server.js --name pagepolly-backend
     pm2 startup
     pm2 save
     ```

### 5. Troubleshooting

#### Common Issues

1. **White page after deployment**
   - Check if the correct build command was executed
   - Ensure the index.html is at the correct level
   - Look for JavaScript errors in the browser console

2. **API connection problems**
   - Check if the API_URL is correctly configured in your .env file
   - Check CORS settings on your API server
   - Verify that the API endpoints are correct

3. **Database connection problems**
   - Verify the database credentials
   - Check if the database is accessible from your server
   - Ensure that the correct PostgreSQL drivers are installed

### 6. Updates and Maintenance

To keep your PagePolly installation up to date:

1. Pull the latest changes regularly:
   ```bash
   git pull origin main
   ```

2. Install new dependencies:
   ```bash
   npm install
   # or
   yarn install
   # or
   pnpm install
   ```

3. Rebuild the application and deploy:
   ```bash
   npm run build
   # deploy as described above
   ```

## Development Guidelines

- Modify `index.html` and `src/App.jsx` as needed
- Create new folders or files in `src/` directory as needed
- Style components using TailwindCSS utility classes
- Avoid modifying `src/main.jsx` and `src/index.css`
- Only modify `vite.config.js` if absolutely necessary

## Available Scripts
- `pnpm install` - Install dependencies
- `pnpm run dev` - Start development server
- `pnpm run lint` - Lint source files
- `pnpm run build` - Build for production

## Tech Stack

- React
- Redux Toolkit
- Vite
- TailwindCSS
- Chart.js
- Axios
- PostgreSQL (backend)
- Node.js (backend)
- ESLint

