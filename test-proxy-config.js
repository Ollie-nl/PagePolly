/**
 * test-proxy-config.js
 * A script to test the ScrapingBee proxy configuration
 * 
 * This script tests both the connection test endpoint and the actual scraping endpoint
 * to verify that the ScrapingBee proxy is working correctly with the updated baseURL
 * configuration.
 * 
 * Run with: node test-proxy-config.js
 */

import axios from 'axios';
import dotenv from 'dotenv';
import { dirname } from 'path';
import { fileURLToPath } from 'url';

// Get current file directory (ESM equivalent of __dirname)
const __dirname = dirname(fileURLToPath(import.meta.url));

// Load environment variables
dotenv.config();

// API base URL - use the same one that's configured in the frontend
const API_BASE_URL = process.env.VITE_API_BASE_URL || 'http://localhost:4000';
const TEST_URL = 'https://ferrum.audio'; // Simple test URL that should work

console.log('='.repeat(60));
console.log('ScrapingBee Proxy Configuration Test');
console.log('='.repeat(60));
console.log(`Using API base URL: ${API_BASE_URL}`);
console.log(`Testing URL: ${TEST_URL}`);
console.log('-'.repeat(60));

// Create axios instance with the same config as the frontend
const proxyApiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000, // 30 seconds timeout
  headers: {
    'Content-Type': 'application/json',
  }
});

// Test connection endpoint
async function testConnection() {
  console.log('1. Testing API connection...');
  try {
    const response = await proxyApiClient.get('/api/scrapingbee/test');
    
    console.log('Connection test response status:', response.status);
    console.log('Connection test response data:', JSON.stringify(response.data, null, 2));
    
    if (response.data.success) {
      console.log('✅ Connection test successful!');
      return true;
    } else {
      console.error('❌ Connection test failed:', response.data.message);
      return false;
    }
  } catch (error) {
    console.error('❌ Connection test error:', error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    }
    return false;
  }
}

// Test scraping endpoint
async function testScraping() {
  console.log('\n2. Testing scraping endpoint...');
  try {
    const response = await proxyApiClient.post('/api/scrapingbee/scrape', {
      url: TEST_URL,
      render_js: false,
    });
    
    console.log('Scraping test response status:', response.status);
    
    // Print a preview of the HTML response (first 300 characters)
    const htmlPreview = response.data.pageSource 
      ? response.data.pageSource.substring(0, 300) + '...' 
      : 'No HTML content';
    
    console.log('HTML content preview:', htmlPreview);
    
    if (response.data.success) {
      console.log('✅ Scraping test successful!');
      return true;
    } else {
      console.error('❌ Scraping test failed:', response.data.message);
      return false;
    }
  } catch (error) {
    console.error('❌ Scraping test error:', error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    }
    return false;
  }
}

// Run both tests sequentially
async function runTests() {
  console.log('Starting tests...\n');
  
  const connectionSuccess = await testConnection();
  
  if (connectionSuccess) {
    await testScraping();
  } else {
    console.log('\nSkipping scraping test since connection test failed.');
  }
  
  console.log('\n' + '='.repeat(60));
  console.log('Test completed.');
}

// Execute the tests
runTests().catch(error => {
  console.error('Unhandled error during tests:', error);
  process.exit(1);
});