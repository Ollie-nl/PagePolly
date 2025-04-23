#!/usr/bin/env node
// setup-crawler.js - PagePolly Crawler Setup Script
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const readline = require('readline');

// Create readline interface for user input
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// ANSI color codes for terminal output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  dim: '\x1b[2m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  magenta: '\x1b[35m',
  bgBlue: '\x1b[44m',
  bgGreen: '\x1b[42m'
};

// Helper functions
const log = {
  info: (msg) => console.log(`${colors.blue}ℹ️  INFO${colors.reset} ${msg}`),
  success: (msg) => console.log(`${colors.green}✅ SUCCESS${colors.reset} ${msg}`),
  warning: (msg) => console.log(`${colors.yellow}⚠️  WARNING${colors.reset} ${msg}`),
  error: (msg) => console.log(`${colors.red}❌ ERROR${colors.reset} ${msg}`),
  header: (msg) => console.log(`\n${colors.bgBlue}${colors.bright} ${msg} ${colors.reset}\n`)
};

const prompt = (question) => {
  return new Promise((resolve) => {
    rl.question(`${colors.cyan}?${colors.reset} ${question} `, resolve);
  });
};

// Check if a file or directory exists
const exists = (path) => {
  try {
    fs.accessSync(path);
    return true;
  } catch (err) {
    return false;
  }
};

// Execute command with error handling
const execute = (command, silent = false) => {
  try {
    if (!silent) {
      log.info(`Running: ${command}`);
    }
    return execSync(command, { stdio: silent ? 'ignore' : 'inherit' });
  } catch (error) {
    log.error(`Command failed: ${command}`);
    log.error(error.message);
    return false;
  }
};

// Main setup function
async function setupCrawlerService() {
  try {
    log.header('PagePolly Crawler Setup');
    log.info('This script will set up the PagePolly crawler service');

    // Check Node.js version
    const nodeVersion = process.version;
    log.info(`Node.js version: ${nodeVersion}`);
    const versionMatch = nodeVersion.match(/^v(\d+)\./);
    const majorVersion = versionMatch ? parseInt(versionMatch[1]) : 0;
    
    if (majorVersion < 16) {
      log.error(`Node.js version ${nodeVersion} is not supported. Please use v16 or higher.`);
      process.exit(1);
    }

    // Check for required directory structure
    if (!exists('./server')) {
      log.info('Creating server directory...');
      fs.mkdirSync('./server', { recursive: true });
      fs.mkdirSync('./server/src', { recursive: true });
      fs.mkdirSync('./server/src/controllers', { recursive: true });
      fs.mkdirSync('./server/src/routes', { recursive: true });
      fs.mkdirSync('./server/src/middleware', { recursive: true });
    }

    // Check for .env file and ScrapingBee API key
    if (!exists('./.env')) {
      log.warning('.env file not found. Creating a template .env file...');
      fs.writeFileSync('./.env', 'VITE_SUPABASE_URL=\nVITE_SUPABASE_ANON_KEY=\nSCRAPING_BEE_API_KEY=\nSUPABASE_SERVICE_ROLE_KEY=\n');
    }

    // Prompt for ScrapingBee API key
    let apiKey = '';
    try {
      const envFile = fs.readFileSync('./.env', 'utf8');
      const match = envFile.match(/SCRAPING_BEE_API_KEY=([^\n]+)/);
      apiKey = match ? match[1].trim() : '';
    } catch (err) {
      log.warning('Could not read .env file');
    }

    if (!apiKey) {
      log.info('You need a ScrapingBee API key to use the crawler service.');
      log.info('Get a free key at https://www.scrapingbee.com/ (free trial available)');
      apiKey = await prompt('Enter your ScrapingBee API key (press Enter to skip for now): ');
      
      if (apiKey) {
        // Update the .env file with the API key
        try {
          let envContent = fs.readFileSync('./.env', 'utf8');
          if (envContent.includes('SCRAPING_BEE_API_KEY=')) {
            envContent = envContent.replace(/SCRAPING_BEE_API_KEY=([^\n]*)/, `SCRAPING_BEE_API_KEY=${apiKey}`);
          } else {
            envContent += `\nSCRAPING_BEE_API_KEY=${apiKey}\n`;
          }
          fs.writeFileSync('./.env', envContent);
          log.success('API key saved to .env file');
        } catch (err) {
          log.error('Failed to update .env file');
          log.error(err.message);
        }
      } else {
        log.warning('No API key provided. You will need to add it manually to the .env file later.');
      }
    } else {
      log.success('Found ScrapingBee API key in .env file');
    }

    // Install dependencies
    log.header('Installing dependencies');
    log.info('Installing server dependencies...');
    
    // Create a temporary package.json for the server if it doesn't exist
    if (!exists('./server/package.json')) {
      const serverPackageJson = {
        name: "pagepolly-crawler-server",
        version: "1.0.0",
        description: "PagePolly Web Crawler API Server",
        main: "start.js",
        scripts: {
          start: "node start.js",
          dev: "nodemon start.js"
        },
        dependencies: {
          "@supabase/supabase-js": "^2.21.0",
          "axios": "^1.4.0",
          "cors": "^2.8.5",
          "dotenv": "^16.0.3",
          "express": "^4.18.2",
          "jsonwebtoken": "^9.0.0",
          "uuid": "^9.0.0"
        },
        devDependencies: {
          "nodemon": "^2.0.22"
        }
      };
      
      fs.writeFileSync('./server/package.json', JSON.stringify(serverPackageJson, null, 2));
      log.success('Created server package.json');
    }

    // Let user choose the package manager
    const packageManager = await prompt('Which package manager do you want to use? (npm/pnpm/yarn) [npm]: ');
    const pm = packageManager.toLowerCase() || 'npm';
    
    if (!['npm', 'pnpm', 'yarn'].includes(pm)) {
      log.warning(`Unknown package manager: ${pm}. Defaulting to npm.`);
    }
    
    // Install server dependencies
    const installServer = execute(`cd server && ${pm} install`);
    if (!installServer) {
      log.error('Server dependency installation failed. Please try manually:');
      log.info('cd server && npm install');
      process.exit(1);
    }

    log.success('Server dependencies installed');
    
    // Check if Supabase is configured
    let supabaseConfigured = false;
    try {
      const envFile = fs.readFileSync('./.env', 'utf8');
      const urlMatch = envFile.match(/VITE_SUPABASE_URL=([^\n]+)/);
      const keyMatch = envFile.match(/VITE_SUPABASE_ANON_KEY=([^\n]+)/);
      
      supabaseConfigured = !!(
        urlMatch && urlMatch[1].trim() && 
        keyMatch && keyMatch[1].trim()
      );
    } catch (err) {
      log.warning('Could not check Supabase configuration');
    }

    if (!supabaseConfigured) {
      log.warning('Supabase does not appear to be configured.');
      log.info('You will need to add your Supabase URL and anon key to the .env file.');
      log.info('For a full setup guide, see the README.md or docs/hosting-wiki.md');
    }

    // Initialize SQL database
    log.header('Database Setup');
    log.info('The crawler service requires database tables in your Supabase project.');
    log.info('You\'ll need to run the SQL setup script in your Supabase SQL editor.');
    log.info(`The script is located at: ${path.resolve('./database/crawl_jobs.sql')}`);

    // Create a convenient quick start script
    const startScript = `#!/usr/bin/env node
// start-crawler.js
const { spawn } = require('child_process');
const path = require('path');

console.log('🕸️  Starting PagePolly Crawler service...');

// Start the crawler server
const server = spawn('node', ['server/start.js'], {
  stdio: 'inherit',
  env: { ...process.env }
});

server.on('close', (code) => {
  if (code !== 0) {
    console.error(`Crawler server process exited with code ${code}`);
  }
});

// Handle process termination
process.on('SIGINT', () => {
  console.log('\\n🛑 Stopping PagePolly Crawler service...');
  server.kill('SIGINT');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\\n🛑 Stopping PagePolly Crawler service...');
  server.kill('SIGTERM');
  process.exit(0);
});
`;
    
    fs.writeFileSync('./start-crawler.js', startScript);
    fs.chmodSync('./start-crawler.js', 0o755); // Make executable
    log.success('Created start-crawler.js script');

    // Setup complete
    log.header('Setup Complete');
    log.success('PagePolly Crawler service setup is complete!');
    log.info('\nTo start the crawler service:');
    log.info(`  ${colors.bright}node start-crawler.js${colors.reset}`);
    
    if (!apiKey) {
      log.warning('\nRemember to add your ScrapingBee API key to the .env file:');
      log.info('  SCRAPING_BEE_API_KEY=your_api_key_here');
    }
    
    if (!supabaseConfigured) {
      log.warning('\nRemember to configure your Supabase connection in the .env file:');
      log.info('  VITE_SUPABASE_URL=your_supabase_project_url');
      log.info('  VITE_SUPABASE_ANON_KEY=your_supabase_anon_key');
      log.info('  SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key');
    }
    
    log.info('\nFor more detailed setup instructions, refer to:');
    log.info('  docs/crawler-api-integration.md');

  } catch (error) {
    log.error('Setup failed with error:');
    log.error(error.message);
    process.exit(1);
  } finally {
    rl.close();
  }
}

// Run the setup
setupCrawlerService();