# PagePolly Hosting Guide

## Table of Contents

- [Introduction](#introduction)
- [Pre-deployment Checklist](#pre-deployment-checklist)
- [Hosting Options](#hosting-options)
  - [Vercel](#vercel)
  - [Netlify](#netlify)
  - [VPS/Cloud Server](#vpscloud-server)
    - [DigitalOcean](#digitalocean)
    - [AWS](#aws)
    - [Google Cloud Platform](#google-cloud-platform)
    - [Microsoft Azure](#microsoft-azure)
  - [Shared Hosting](#shared-hosting)
- [Database Hosting](#database-hosting)
- [Domain and SSL Configuration](#domain-and-ssl-configuration)
- [Performance Optimization](#performance-optimization)
- [Monitoring and Maintenance](#monitoring-and-maintenance)
- [Scaling Considerations](#scaling-considerations)
- [Security Best Practices](#security-best-practices)
- [Troubleshooting Common Issues](#troubleshooting-common-issues)

## Introduction

This guide provides detailed instructions for hosting the PagePolly application across various platforms. PagePolly consists of a React frontend and a Node.js backend with PostgreSQL database integration. The hosting setup needs to accommodate these components appropriately.

## Pre-deployment Checklist

Before deploying PagePolly to any hosting platform, ensure you have completed the following steps:

1. **Build the production version**:
   ```bash
   npm run build
   # or
   yarn build
   # or
   pnpm run build
   ```
   This creates an optimized production build in the `dist` directory.

2. **Environment variables**:
   - Create a proper `.env` file for production
   - Ensure all sensitive information is properly secured
   - Verify API endpoints are correctly configured

3. **Testing**:
   - Test the production build locally: `npx serve -s dist`
   - Verify all features work correctly
   - Check for any console errors

4. **Performance check**:
   - Run Lighthouse or similar tool to check performance
   - Verify bundle size is optimized
   - Ensure images are compressed

## Hosting Options

### Vercel

Vercel is an optimal platform for hosting React applications with serverless backend functions.

#### Setup

1. **Create an account**:
   - Sign up at [vercel.com](https://vercel.com)
   - Connect your GitHub account if your code is stored there

2. **Install Vercel CLI** (optional but recommended):
   ```bash
   npm install -g vercel
   ```

3. **Configure project**:
   - Create a `vercel.json` file in your project root:
     ```json
     {
       "version": 2,
       "builds": [
         { "src": "package.json", "use": "@vercel/static-build", "config": { "distDir": "dist" } }
       ],
       "routes": [
         { "handle": "filesystem" },
         { "src": "/.*", "dest": "/index.html" }
       ],
       "env": {
         "API_URL": "your-api-url"
       }
     }
     ```

4. **Deploy using CLI**:
   ```bash
   vercel login
   vercel
   ```
   Or deploy from the Vercel dashboard by importing your repository.

5. **Set environment variables**:
   - In the Vercel dashboard, go to your project settings
   - Navigate to the "Environment Variables" tab
   - Add all required environment variables

6. **Configure custom domain** (optional):
   - In project settings, go to "Domains"
   - Add your custom domain and follow the verification steps

#### Backend Integration

For PagePolly's backend functionality on Vercel:

1. **Create API routes**:
   - Create a `/api` directory in your project
   - Implement serverless functions for your API endpoints
   - Example API route (`/api/vendors.js`):
     ```javascript
     export default async function handler(req, res) {
       // Connect to database and handle vendor operations
       // ...
       res.status(200).json({ vendors: [] });
     }
     ```

2. **Database connection**:
   - Use connection pooling for database access
   - Implement proper error handling
   - Utilize Vercel's environment variables for sensitive credentials

#### Advantages of Vercel

- Seamless GitHub integration
- Automatic HTTPS
- Global CDN
- Preview deployments for each pull request
- Serverless functions for API endpoints
- Real-time logs and performance monitoring

#### Limitations

- Limited execution time for serverless functions (may require optimization for long-running tasks)
- Potential additional costs for high-traffic applications

### Netlify

Netlify is another excellent option for hosting static sites with serverless backend capabilities.

#### Setup

1. **Create an account**:
   - Sign up at [netlify.com](https://netlify.com)
   - Connect your GitHub, GitLab, or Bitbucket account

2. **Configure project**:
   - Create a `netlify.toml` file in your project root:
     ```toml
     [build]
       publish = "dist"
       command = "npm run build"
     
     [[redirects]]
       from = "/*"
       to = "/index.html"
       status = 200
     ```

3. **Deploy options**:

   **A. Deploy via Netlify UI**:
   - Go to the Netlify dashboard and click "New site from Git"
   - Select your repository and configure build settings
   - Click "Deploy site"

   **B. Deploy via Netlify CLI**:
   ```bash
   npm install -g netlify-cli
   netlify login
   netlify init
   netlify deploy --prod
   ```

4. **Environment variables**:
   - In the Netlify dashboard, go to Site settings > Build & deploy > Environment
   - Add all required environment variables

5. **Custom domain configuration**:
   - In the Netlify dashboard, go to Site settings > Domain management
   - Add your custom domain and configure DNS settings

#### Netlify Functions for Backend

1. **Create Netlify Functions**:
   - Create a `/netlify/functions` directory in your project
   - Create JavaScript files for each function
   - Example function (`/netlify/functions/get-vendors.js`):
     ```javascript
     exports.handler = async function(event, context) {
       // Connect to database and handle vendor data
       // ...
       return {
         statusCode: 200,
         body: JSON.stringify({ vendors: [] })
       };
     };
     ```

2. **Access functions**:
   - Functions are accessible at `/.netlify/functions/[function-name]`
   - Configure proxy paths in `netlify.toml` if needed

#### Advantages of Netlify

- Continuous deployment
- Built-in form handling
- Asset optimization
- Split testing functionality
- Edge functions for improved performance
- Large free tier

#### Limitations

- Function execution limits (similar to Vercel)
- Potential costs for high-traffic applications

### Running the Complete PagePolly Stack with Docker

You can run the entire PagePolly application stack (frontend, backend, and database) using Docker Compose for both development and production environments.

#### Complete Docker Compose Setup

Create a comprehensive `docker-compose.yml` file in your project root:

```yaml
version: '3.8'

services:
  # Frontend - React application
  frontend:
    build:
      context: ./
      dockerfile: Dockerfile.frontend
    container_name: pagepolly-frontend
    restart: unless-stopped
    ports:
      - "80:80"  # For production with Nginx
      - "5173:5173"  # For development with Vite
    volumes:
      - ./:/app
      - /app/node_modules
    environment:
      - VITE_API_URL=http://localhost:3000/api
    networks:
      - pagepolly-network
    depends_on:
      - backend
  
  # Backend - Node.js API
  backend:
    build:
      context: ./
      dockerfile: Dockerfile.backend
    container_name: pagepolly-backend
    restart: unless-stopped
    ports:
      - "3000:3000"
    volumes:
      - ./:/app
      - /app/node_modules
    environment:
      - NODE_ENV=development
      - PORT=3000
      - DATABASE_URL=postgresql://pagepolly:your_secure_password@postgres:5432/pagepolly_db
    networks:
      - pagepolly-network
    depends_on:
      - postgres
  
  # Database - PostgreSQL
  postgres:
    image: postgres:14
    container_name: pagepolly-postgres
    restart: unless-stopped
    environment:
      POSTGRES_USER: pagepolly
      POSTGRES_PASSWORD: your_secure_password
      POSTGRES_DB: pagepolly_db
    ports:
      - "5432:5432"
    volumes:
      - postgres-data:/var/lib/postgresql/data
    networks:
      - pagepolly-network

  # Optional: Database Management - pgAdmin
  pgadmin:
    image: dpage/pgadmin4
    container_name: pagepolly-pgadmin
    restart: unless-stopped
    environment:
      PGADMIN_DEFAULT_EMAIL: admin@example.com
      PGADMIN_DEFAULT_PASSWORD: pgadmin_password
    ports:
      - "5050:80"
    networks:
      - pagepolly-network
    depends_on:
      - postgres

networks:
  pagepolly-network:
    driver: bridge

volumes:
  postgres-data:
```

#### Docker Configuration Files

1. **Frontend Dockerfile** (`Dockerfile.frontend`):
   ```dockerfile
   # Development stage
   FROM node:18-alpine as development
   WORKDIR /app
   COPY package*.json ./
   RUN npm install
   COPY . .
   EXPOSE 5173
   CMD ["npm", "run", "dev", "--", "--host"]
   
   # Build stage
   FROM development as build
   RUN npm run build
   
   # Production stage with Nginx
   FROM nginx:alpine as production
   COPY --from=build /app/dist /usr/share/nginx/html
   COPY nginx.conf /etc/nginx/conf.d/default.conf
   EXPOSE 80
   CMD ["nginx", "-g", "daemon off;"]
   ```

2. **Backend Dockerfile** (`Dockerfile.backend`):
   ```dockerfile
   FROM node:18-alpine
   WORKDIR /app
   COPY package*.json ./
   RUN npm install
   COPY . .
   EXPOSE 3000
   CMD ["npm", "run", "dev"]
   ```

3. **Nginx Configuration** (`nginx.conf`):
   ```nginx
   server {
     listen 80;
     root /usr/share/nginx/html;
     index index.html index.htm;
     
     location / {
       try_files $uri $uri/ /index.html;
     }
     
     location /api/ {
       proxy_pass http://backend:3000;
       proxy_http_version 1.1;
       proxy_set_header Upgrade $http_upgrade;
       proxy_set_header Connection 'upgrade';
       proxy_set_header Host $host;
       proxy_cache_bypass $http_upgrade;
     }
   }
   ```

#### Development Mode

Use this command for local development (with hot reloading):

```bash
# Start all services in development mode
docker-compose up

# Or run in detached mode
docker-compose up -d
```

Access the different services:
- Frontend: http://localhost:5173
- Backend API: http://localhost:3000
- pgAdmin: http://localhost:5050

#### Production Mode

For production deployment:

```bash
# Build and start all services in production mode
docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d --build
```

Create a `docker-compose.prod.yml` file for production overrides:

```yaml
version: '3.8'

services:
  frontend:
    build:
      target: production
    environment:
      - NODE_ENV=production
      - VITE_API_URL=/api

  backend:
    environment:
      - NODE_ENV=production
      - DATABASE_URL=postgresql://pagepolly:your_secure_password@postgres:5432/pagepolly_db

  # Remove exposed ports for better security
  postgres:
    ports: []
```

#### Database Management

**Initialization Scripts**:

Create a `./docker-init/init.sql` file for database initialization and link it in docker-compose.yml:

```yaml
postgres:
  # ...other settings...
  volumes:
    - postgres-data:/var/lib/postgresql/data
    - ./docker-init:/docker-entrypoint-initdb.d
```

Example `init.sql`:
```sql
-- Create tables
CREATE TABLE IF NOT EXISTS vendors (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    url TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS crawl_results (
    id SERIAL PRIMARY KEY,
    vendor_id INTEGER REFERENCES vendors(id),
    status VARCHAR(50) NOT NULL,
    crawled_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    page_content TEXT,
    error_message TEXT
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_crawl_results_vendor_id ON crawl_results(vendor_id);
CREATE INDEX IF NOT EXISTS idx_crawl_results_status ON crawl_results(status);

-- Insert sample data
INSERT INTO vendors (name, url) VALUES
('Example Vendor 1', 'https://example1.com'),
('Example Vendor 2', 'https://example2.com')
ON CONFLICT DO NOTHING;
```

#### Useful Docker Commands

```bash
# View logs
docker-compose logs -f

# View logs for specific service
docker-compose logs -f backend

# Access PostgreSQL CLI
docker-compose exec postgres psql -U pagepolly -d pagepolly_db

# Execute commands in containers
docker-compose exec backend npm run migrations

# Stop all services
docker-compose down

# Remove volumes (CAUTION: destroys data)
docker-compose down -v

# Rebuild specific services
docker-compose up -d --build backend
```

#### Environment Variables

For better security and configuration, create a `.env` file:

```env
# Database
DB_USER=pagepolly
DB_PASSWORD=your_secure_password
DB_NAME=pagepolly_db
DB_HOST=postgres
DB_PORT=5432

# API
API_PORT=3000
NODE_ENV=development

# Frontend
VITE_API_URL=http://localhost:3000/api
```

Then reference it in docker-compose.yml:

```yaml
services:
  backend:
    environment:
      - NODE_ENV=${NODE_ENV}
      - PORT=${API_PORT}
      - DATABASE_URL=postgresql://${DB_USER}:${DB_PASSWORD}@${DB_HOST}:${DB_PORT}/${DB_NAME}
```

### VPS/Cloud Server

For more control and customization, hosting PagePolly on a VPS or cloud server is a viable option.

#### General Setup Process

1. **Choose a VPS provider**
2. **SSH into your server**
3. **Install required software**:
   - Node.js and npm
   - PostgreSQL
   - Nginx or Apache
   - PM2 or similar process manager

4. **Transfer application files**:
   ```bash
   scp -r ./dist/* user@your-server:/var/www/pagepolly
   ```

5. **Set up the web server**:
   - Configure Nginx or Apache to serve the static files
   - Set up reverse proxy for API requests

6. **Configure environment variables**:
   - Create a `.env` file for your server
   - Secure sensitive information

7. **Start backend services**:
   - Use PM2 to manage Node.js processes
   - Configure automatic restarts

#### DigitalOcean

DigitalOcean offers straightforward VPS hosting with a user-friendly interface.

1. **Create a Droplet**:
   - Sign up at [digitalocean.com](https://digitalocean.com)
   - Create a new Droplet (recommended: Ubuntu 20.04, at least 2GB RAM)
   - Choose a datacenter region close to your target audience
   - Add SSH keys for secure access

2. **Initial server setup**:
   ```bash
   ssh root@your-server-ip
   adduser pagepolly
   usermod -aG sudo pagepolly
   su - pagepolly
   ```

3. **Install Node.js**:
   ```bash
   curl -fsSL https://deb.nodesource.com/setup_16.x | sudo -E bash -
   sudo apt-get install -y nodejs
   ```

4. **Install PostgreSQL**:
   ```bash
   sudo apt update
   sudo apt install postgresql postgresql-contrib
   sudo systemctl start postgresql.service
   ```

5. **Configure Nginx**:
   ```bash
   sudo apt install nginx
   sudo nano /etc/nginx/sites-available/pagepolly
   ```
   
   Add the following configuration:
   ```nginx
   server {
       listen 80;
       server_name your-domain.com www.your-domain.com;
       
       root /var/www/pagepolly;
       index index.html;
       
       location / {
           try_files $uri $uri/ /index.html;
       }
       
       location /api/ {
           proxy_pass http://localhost:3000;
           proxy_http_version 1.1;
           proxy_set_header Upgrade $http_upgrade;
           proxy_set_header Connection 'upgrade';
           proxy_set_header Host $host;
           proxy_cache_bypass $http_upgrade;
       }
   }
   ```

6. **Enable the site and restart Nginx**:
   ```bash
   sudo ln -s /etc/nginx/sites-available/pagepolly /etc/nginx/sites-enabled/
   sudo nginx -t
   sudo systemctl restart nginx
   ```

7. **Set up PM2 for the backend**:
   ```bash
   sudo npm install -g pm2
   cd /var/www/pagepolly-backend
   pm2 start server.js --name pagepolly
   pm2 startup
   pm2 save
   ```

8. **Set up SSL with Let's Encrypt**:
   ```bash
   sudo apt install certbot python3-certbot-nginx
   sudo certbot --nginx -d your-domain.com -d www.your-domain.com
   ```

#### AWS

Amazon Web Services offers multiple hosting options for PagePolly.

##### EC2 Instance

1. **Launch an EC2 instance**:
   - Sign in to AWS console
   - Navigate to EC2 dashboard
   - Launch a new instance (recommend Amazon Linux 2 or Ubuntu)
   - Choose an instance type (t3.small or higher recommended)
   - Configure security groups to allow HTTP (80), HTTPS (443), and SSH (22)
   - Create or select a key pair for SSH access

2. **Follow general VPS setup** as described above

##### AWS Elastic Beanstalk

For a managed solution:

1. **Create an Elastic Beanstalk application**:
   - Go to Elastic Beanstalk console
   - Create a new application
   - Choose the Node.js platform
   - Upload your application as a zip file

2. **Configure environment variables**:
   - Go to Configuration > Software
   - Add environment properties

3. **Set up database**:
   - Use RDS to create a PostgreSQL database
   - Configure security groups to allow access from your Elastic Beanstalk environment

#### Google Cloud Platform

##### Google Compute Engine

1. **Create a VM instance**:
   - Go to Compute Engine > VM instances
   - Create a new instance (recommend e2-medium or higher)
   - Choose Ubuntu or Debian as OS
   - Configure firewall to allow HTTP, HTTPS, and SSH

2. **Follow general VPS setup** as described above

##### Google App Engine

For a managed solution:

1. **Create an app.yaml file**:
   ```yaml
   runtime: nodejs16
   env: standard
   
   handlers:
     - url: /.*
       script: auto
   ```

2. **Deploy to App Engine**:
   ```bash
   gcloud app deploy
   ```

#### Microsoft Azure

##### Azure Virtual Machines

1. **Create a VM**:
   - Go to Azure Portal
   - Create a new Virtual Machine
   - Choose Ubuntu Server as OS
   - Choose a VM size (B2s or higher recommended)
   - Configure networking to allow HTTP, HTTPS, and SSH

2. **Follow general VPS setup** as described above

##### Azure App Service

For a managed solution:

1. **Create a web.config file**:
   ```xml
   <?xml version="1.0" encoding="utf-8"?>
   <configuration>
     <system.webServer>
       <handlers>
         <add name="iisnode" path="server.js" verb="*" modules="iisnode" />
       </handlers>
       <rewrite>
         <rules>
           <rule name="StaticContent">
             <action type="Rewrite" url="dist{REQUEST_URI}" />
           </rule>
           <rule name="DynamicContent">
             <conditions>
               <add input="{REQUEST_FILENAME}" matchType="IsFile" negate="True" />
             </conditions>
             <action type="Rewrite" url="server.js" />
           </rule>
         </rules>
       </rewrite>
     </system.webServer>
   </configuration>
   ```

2. **Deploy to Azure App Service**:
   - Go to App Services in Azure Portal
   - Create a new Web App
   - Set up deployment from GitHub or local Git

### Shared Hosting

Shared hosting is suitable for low to medium traffic PagePolly instances.

#### cPanel Hosting

1. **Access your cPanel account**
2. **Navigate to File Manager**
3. **Upload application files**:
   - Upload the contents of the `dist` directory to `public_html` or a subdirectory

4. **Set up .htaccess for SPA routing**:
   Create or edit the .htaccess file in your web root:
   ```apache
   <IfModule mod_rewrite.c>
     RewriteEngine On
     RewriteBase /
     RewriteRule ^index\.html$ - [L]
     RewriteCond %{REQUEST_FILENAME} !-f
     RewriteCond %{REQUEST_FILENAME} !-d
     RewriteRule . /index.html [L]
   </IfModule>
   ```

5. **Backend considerations**:
   - Check if your hosting provider supports Node.js
   - If not, consider using external API services or serverless functions
   - Some providers offer Node.js through cPanel plugins

#### Plesk Hosting

1. **Access your Plesk control panel**
2. **Navigate to File Manager**
3. **Upload application files**:
   - Upload the contents of the `dist` directory to `httpdocs` or a subdirectory

4. **Configure Node.js** (if supported):
   - In Plesk, go to Websites & Domains > your domain
   - Click on Node.js
   - Enable Node.js and set up your application

5. **Set up web.config for SPA routing** (on Windows servers):
   ```xml
   <?xml version="1.0" encoding="UTF-8"?>
   <configuration>
     <system.webServer>
       <rewrite>
         <rules>
           <rule name="Handle SPA History API">
             <match url=".*" />
             <conditions>
               <add input="{REQUEST_FILENAME}" matchType="IsFile" negate="true" />
               <add input="{REQUEST_FILENAME}" matchType="IsDirectory" negate="true" />
             </conditions>
             <action type="Rewrite" url="/" />
           </rule>
         </rules>
       </rewrite>
     </system.webServer>
   </configuration>
   ```

## Database Hosting

PagePolly requires PostgreSQL. Here are options for database hosting:

### Using Docker Desktop

Docker provides an easy way to run PostgreSQL and other databases locally during development or in production without installing database software directly on your host system.

#### Setting Up PostgreSQL with Docker Desktop

1. **Install Docker Desktop**:
   - Download and install [Docker Desktop](https://www.docker.com/products/docker-desktop/) for your operating system
   - Start Docker Desktop and ensure it's running properly

2. **Create a Docker Compose file**:
   Create a file named `docker-compose.yml` in your project root with the following content:

   ```yaml
   version: '3.8'
   
   services:
     postgres:
       image: postgres:14
       container_name: pagepolly-postgres
       restart: unless-stopped
       environment:
         POSTGRES_USER: pagepolly
         POSTGRES_PASSWORD: your_secure_password
         POSTGRES_DB: pagepolly_db
       ports:
         - "5432:5432"
       volumes:
         - postgres-data:/var/lib/postgresql/data
       networks:
         - pagepolly-network
   
     # Optional: Add pgAdmin for database management
     pgadmin:
       image: dpage/pgadmin4
       container_name: pagepolly-pgadmin
       restart: unless-stopped
       environment:
         PGADMIN_DEFAULT_EMAIL: admin@example.com
         PGADMIN_DEFAULT_PASSWORD: pgadmin_password
       ports:
         - "5050:80"
       networks:
         - pagepolly-network
       depends_on:
         - postgres
   
     # Optional: Add Redis for caching
     redis:
       image: redis:alpine
       container_name: pagepolly-redis
       restart: unless-stopped
       ports:
         - "6379:6379"
       volumes:
         - redis-data:/data
       networks:
         - pagepolly-network
   
   networks:
     pagepolly-network:
       driver: bridge
   
   volumes:
     postgres-data:
     redis-data:
   ```

3. **Start the database services**:
   ```bash
   docker-compose up -d
   ```
   This will start PostgreSQL (and optionally pgAdmin and Redis) in the background.

4. **Verify the containers are running**:
   ```bash
   docker ps
   ```
   You should see containers for postgres, pgadmin, and redis (if included).

5. **Connect to the database**:
   - From your application:
     ```
     DATABASE_URL=postgresql://pagepolly:your_secure_password@localhost:5432/pagepolly_db
     ```
   - Using pgAdmin: Access http://localhost:5050 in your browser, login with the credentials set in the docker-compose file, and add a new server with the following details:
     - Host: `postgres` (the service name in docker-compose)
     - Port: `5432`
     - Username: `pagepolly`
     - Password: `your_secure_password`

6. **Initialize your database**:
   ```bash
   # Connect to the PostgreSQL container
   docker exec -it pagepolly-postgres bash
   
   # Connect to the database
   psql -U pagepolly -d pagepolly_db
   
   # Run your database initialization scripts
   CREATE TABLE vendors (id SERIAL PRIMARY KEY, name VARCHAR(100), url VARCHAR(255));
   # Add more tables as needed
   ```

7. **Using with the PagePolly application**:
   - Update your environment variables to connect to the Docker-hosted database:
     ```
     # .env file
     DB_HOST=localhost
     DB_PORT=5432
     DB_USER=pagepolly
     DB_PASSWORD=your_secure_password
     DB_NAME=pagepolly_db
     ```

#### Advanced Docker Database Configuration

1. **Database persistence**:
   The configuration above uses Docker volumes for data persistence. Your data will persist even if containers are stopped or removed. To view the volumes:
   ```bash
   docker volume ls
   ```

2. **Database backup and restore**:
   ```bash
   # Backup
   docker exec -t pagepolly-postgres pg_dump -U pagepolly -d pagepolly_db > backup_$(date +%Y%m%d).sql
   
   # Restore
   cat backup.sql | docker exec -i pagepolly-postgres psql -U pagepolly -d pagepolly_db
   ```

3. **Custom PostgreSQL configuration**:
   You can customize the PostgreSQL configuration by adding a custom `postgresql.conf` file:
   
   ```yaml
   # In docker-compose.yml, under postgres > volumes:
   volumes:
     - postgres-data:/var/lib/postgresql/data
     - ./postgresql.conf:/etc/postgresql/postgresql.conf
   command: postgres -c config_file=/etc/postgresql/postgresql.conf
   ```

4. **Running in production**:
   For production, consider additional configurations:
   - Remove port mappings for better security (use internal Docker networking)
   - Use Docker Swarm or Kubernetes for container orchestration
   - Set up automated backups
   - Use secrets management instead of environment variables for credentials

#### Troubleshooting Docker Database Issues

1. **Port conflicts**:
   If port 5432 is already in use, change the port mapping in docker-compose.yml:
   ```yaml
   ports:
     - "5433:5432"
   ```
   Then update your connection string to use port 5433.

2. **Connection refused errors**:
   Ensure Docker is running and verify the container status:
   ```bash
   docker ps
   ```
   
   If the container isn't running:
   ```bash
   docker-compose up -d
   ```

3. **View container logs**:
   ```bash
   docker logs pagepolly-postgres
   ```

4. **Reset database (clear all data)**:
   ```bash
   docker-compose down -v  # removes containers and volumes
   docker-compose up -d    # recreates containers and volumes
   ```

5. **Docker Desktop resource issues**:
   - Open Docker Desktop settings
   - Increase memory allocation (at least 2GB recommended)
   - Increase CPU allocation (at least 2 CPUs recommended)
   


### Self-hosted PostgreSQL

1. **Install PostgreSQL** on your server:
   ```bash
   sudo apt update
   sudo apt install postgresql postgresql-contrib
   ```

2. **Create a database and user**:
   ```bash
   sudo -u postgres psql
   CREATE DATABASE pagepolly;
   CREATE USER pagepollyuser WITH PASSWORD 'your_password';
   GRANT ALL PRIVILEGES ON DATABASE pagepolly TO pagepollyuser;
   ```

3. **Configure PostgreSQL** for remote access (if needed):
   - Edit `postgresql.conf`:
     ```bash
     sudo nano /etc/postgresql/[version]/main/postgresql.conf
     ```
     Uncomment/modify: `listen_addresses = '*'`
   
   - Edit `pg_hba.conf`:
     ```bash
     sudo nano /etc/postgresql/[version]/main/pg_hba.conf
     ```
     Add: `host all all 0.0.0.0/0 md5`
   
   - Restart PostgreSQL:
     ```bash
     sudo systemctl restart postgresql
     ```

### Managed PostgreSQL Services

#### Amazon RDS

1. **Create a PostgreSQL instance**:
   - Go to RDS console
   - Click "Create database"
   - Select PostgreSQL
   - Choose appropriate settings (db.t3.micro for testing)
   - Configure security settings

2. **Configure security groups**:
   - Allow access from your application server

3. **Connect to the database**:
   - Use the endpoint provided in the RDS console
   - Update your environment variables with the connection details

#### Google Cloud SQL

1. **Create a PostgreSQL instance**:
   - Go to SQL in Google Cloud Console
   - Create a new PostgreSQL instance
   - Configure machine type and storage
   - Set up networking and access control

2. **Configure connectivity**:
   - Set up authorized networks or use Cloud SQL Proxy

3. **Connect to the database**:
   - Use the connection information from the console
   - Update your environment variables

#### Azure Database for PostgreSQL

1. **Create a PostgreSQL server**:
   - Go to Azure Portal
   - Create a new Azure Database for PostgreSQL
   - Choose appropriate pricing tier
   - Configure server settings

2. **Configure firewall rules**:
   - Allow access from your application server

3. **Connect to the database**:
   - Use the connection string from the Azure Portal
   - Update your environment variables

#### Heroku Postgres

1. **Create a Heroku account** (if you don't have one)
2. **Create a new Postgres database**:
   ```bash
   heroku addons:create heroku-postgresql:hobby-dev -a your-app-name
   ```

3. **Get connection details**:
   ```bash
   heroku pg:credentials:url -a your-app-name
   ```

4. **Use the connection URL** in your environment variables

## Domain and SSL Configuration

### Domain Registration and Management

1. **Register a domain** with a domain registrar (Namecheap, GoDaddy, Google Domains, etc.)
2. **Configure DNS settings**:
   - Point A records to your server's IP address
   - Or use CNAME records for managed services

### SSL Certificate Setup

#### Let's Encrypt (Free SSL)

1. **Install Certbot**:
   ```bash
   sudo apt update
   sudo apt install certbot
   ```

2. **For Nginx**:
   ```bash
   sudo apt install python3-certbot-nginx
   sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com
   ```

3. **For Apache**:
   ```bash
   sudo apt install python3-certbot-apache
   sudo certbot --apache -d yourdomain.com -d www.yourdomain.com
   ```

4. **Auto-renewal**:
   ```bash
   sudo certbot renew --dry-run
   ```
   Certbot creates a cronjob for automatic renewal

#### Managed SSL (Vercel, Netlify, etc.)

- Most managed platforms provide automatic SSL certificate generation and renewal
- Simply add your custom domain in the platform settings

#### Paid SSL Certificates

1. **Purchase an SSL certificate** from providers like DigiCert, Comodo, etc.
2. **Generate a CSR** (Certificate Signing Request)
3. **Install the certificate** according to your web server's documentation

## Performance Optimization

### Frontend Optimization

1. **Code splitting**:
   - Use dynamic imports for route-based code splitting:
     ```javascript
     const Dashboard = React.lazy(() => import('./pages/Dashboard'));
     ```

2. **Asset optimization**:
   - Compress images using WebP format
   - Lazy load images and components
   - Use appropriate bundle analyzer to identify large packages

3. **CDN integration**:
   - Use a CDN to serve static assets
   - Popular options: Cloudflare, AWS CloudFront, Fastly

### Backend Optimization

1. **Database indexing**:
   - Analyze query performance
   - Add indexes to frequently queried columns
   ```sql
   CREATE INDEX idx_vendor_name ON vendors(name);
   ```

2. **Caching strategies**:
   - Implement Redis for caching frequently accessed data
   - Use response caching for API endpoints

3. **Connection pooling**:
   - Implement connection pooling for database connections
   ```javascript
   const { Pool } = require('pg');
   const pool = new Pool({
     connectionString: process.env.DATABASE_URL
   });
   ```

## Monitoring and Maintenance

### Application Monitoring

1. **Error tracking**:
   - Implement Sentry or similar tool for error tracking
   ```javascript
   import * as Sentry from '@sentry/react';
   Sentry.init({
     dsn: "your-sentry-dsn",
     environment: process.env.NODE_ENV
   });
   ```

2. **Performance monitoring**:
   - Use New Relic, DataDog, or similar services
   - Monitor response times, error rates, etc.

3. **Log management**:
   - Implement centralized logging with ELK Stack or similar
   - Configure log rotation on self-hosted solutions

### Database Maintenance

1. **Regular backups**:
   ```bash
   # For self-hosted PostgreSQL
   pg_dump -U username -d pagepolly > backup_$(date +%Y%m%d).sql
   ```

2. **Scheduled maintenance**:
   - Set up VACUUM operations for PostgreSQL
   ```sql
   VACUUM ANALYZE;
   ```

3. **Performance monitoring**:
   - Monitor slow queries
   - Use pgBadger or similar tools for analysis

## Scaling Considerations

### Horizontal Scaling

1. **Load balancing**:
   - Use Nginx or HAProxy as a load balancer
   - For cloud services, use managed load balancers (AWS ELB, Google Cloud Load Balancing)

2. **Multiple application servers**:
   - Deploy the application to multiple servers
   - Ensure session handling works across servers

### Vertical Scaling

1. **Upgrade server resources**:
   - Increase CPU, RAM, and disk space
   - Optimize server configurations based on load

### Database Scaling

1. **Read replicas**:
   - Set up PostgreSQL read replicas for distributing read queries

2. **Sharding**:
   - Consider database sharding for very large datasets
   - Implement appropriate sharding strategies based on data access patterns

## Security Best Practices

### Application Security

1. **Input validation**:
   - Validate all user inputs server-side
   - Implement proper sanitization for SQL queries

2. **Authentication**:
   - Use secure authentication methods (JWT, OAuth2)
   - Implement proper password hashing (bcrypt, Argon2)

3. **Authorization**:
   - Implement role-based access control
   - Secure API endpoints with proper middleware

### Infrastructure Security

1. **Firewall configuration**:
   ```bash
   # Allow only necessary ports
   sudo ufw allow 22
   sudo ufw allow 80
   sudo ufw allow 443
   sudo ufw enable
   ```

2. **Regular updates**:
   ```bash
   sudo apt update
   sudo apt upgrade
   ```

3. **SSH hardening**:
   - Disable password authentication
   - Use SSH keys only
   - Change default SSH port (optional)

### Data Security

1. **Encryption at rest**:
   - Enable disk encryption on servers
   - Use encrypted database options when available

2. **Environment variables**:
   - Never commit sensitive information to git repositories
   - Use environment variables or secure secret management

## Troubleshooting Common Issues

### Deployment Issues

1. **White screen after deployment**:
   - Check browser console for errors
   - Verify that the build was successful
   - Ensure correct base path in vite.config.js

2. **404 errors for routes**:
   - Verify server configuration for SPA routing
   - Check that your .htaccess or equivalent is correctly set up

3. **Missing assets**:
   - Verify file paths in the build
   - Check if assets were properly uploaded

### API Connection Issues

1. **CORS errors**:
   - Ensure CORS is properly configured on your API server
   ```javascript
   app.use(cors({
     origin: process.env.FRONTEND_URL,
     credentials: true
   }));
   ```

2. **API endpoints not found**:
   - Check API URL configuration
   - Verify proxy settings in development environment
   - Test API endpoints directly to isolate the issue

### Database Connection Issues

1. **Connection refused**:
   - Check database credentials
   - Verify firewall settings
   - Ensure database service is running

2. **Connection timeout**:
   - Check network latency between application and database
   - Consider connection pooling to manage connections

---

This wiki provides comprehensive guidance for hosting PagePolly in various environments. If you encounter specific issues not covered here, please refer to the platform-specific documentation or create an issue in the project repository for assistance.