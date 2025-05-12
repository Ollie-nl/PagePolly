#!/usr/bin/env node
// start-crawler.js

const path = require('path');
const { spawn } = require('child_process');
const fs = require('fs');

// Check if we have the server directory
if (!fs.existsSync(path.join(__dirname, 'server'))) {
  console.error('Error: server directory not found.');
  console.error('Please ensure you have the crawler server installed.');
  process.exit(1);
}

// Check if we have an .env file
if (!fs.existsSync(path.join(__dirname, '.env'))) {
  console.log('No .env file found. Creating from template...');
  try {
    fs.copyFileSync(
      path.join(__dirname, '.env.template'),
      path.join(__dirname, '.env')
    );
    console.log(
      '\x1b[33m%s\x1b[0m',
      'Please configure your .env file with your Supabase credentials before running the crawler.'
    );
  } catch (err) {
    console.error('Failed to create .env file:', err.message);
    process.exit(1);
  }
}

console.log('Starting PagePolly crawler service...');

// Install server dependencies if needed
if (!fs.existsSync(path.join(__dirname, 'server/node_modules'))) {
  console.log('Installing server dependencies...');

  let npmCommand = 'npm';
  if (process.platform === 'win32') npmCommand = 'npm.cmd';

  const install = spawn(npmCommand, ['install'], {
    cwd: path.join(__dirname, 'server'),
    stdio: 'inherit'
  });

  install.on('close', code => {
    if (code !== 0) {
      console.error(`npm install failed with code ${code}`);
      process.exit(1);
    }
    startServer();
  });
} else {
  startServer();
}

function startServer() {
  // Start the server
  const server = spawn('node', ['index.js'], {
    cwd: path.join(__dirname, 'server'),
    stdio: 'inherit',
    env: { ...process.env }
  });

  server.on('close', code => {
    if (code !== 0) {
      console.error(`Server process exited with code ${code}`);
      process.exit(code);
    }
  });

  // Handle SIGINT and SIGTERM signals to gracefully shut down
  process.on('SIGINT', () => {
    console.log('Shutting down crawler service...');
    server.kill('SIGINT');
  });

  process.on('SIGTERM', () => {
    console.log('Shutting down crawler service...');
    server.kill('SIGTERM');
  });
  
  console.log('\x1b[32m%s\x1b[0m', 'PagePolly crawler service is running!');
  console.log(`API available at http://localhost:${process.env.PORT || 4000}/api`);
}