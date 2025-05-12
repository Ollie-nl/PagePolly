/**
 * Test script for ScrapingBee proxy implementation
 * This script demonstrates how to use the server-side ScrapingBee proxy
 */

// Import the ScrapingBee proxy service
import scrapingBeeProxyService from './scrapingBeeProxyService';

// Get API key from config (for demonstration purposes)
import { SCRAPINGBEE_CONFIG } from '../config/config';

/**
 * Test function to verify the ScrapingBee proxy solution
 */
async function testScrapingBeeProxy() {
  console.log('Starting ScrapingBee proxy test...');
  console.log('-----------------------------------------');

  try {
    // Step 1: Test API connection
    console.log('Step 1: Testing API connection...');
    const connectionTest = await scrapingBeeProxyService.testConnection();
    console.log('Connection test result:', connectionTest);
    
    if (!connectionTest.success) {
      console.error('Connection test failed. Please check your API key and server setup.');
      return false;
    }
    
    console.log('✓ Connection test successful!');
    console.log('-----------------------------------------');

    // Step 2: Test scraping a specific URL
    const testUrl = 'https://ferrum.audio';
    console.log(`Step 2: Testing scraping ${testUrl}...`);
    
    const scrapeResult = await scrapingBeeProxyService.scrape(testUrl);
    
    if (!scrapeResult.success) {
      console.error('Scraping test failed:', scrapeResult.message);
      return false;
    }
    
    // Log some information about the scraped data
    const dataLength = scrapeResult.pageSource ? scrapeResult.pageSource.length : 0;
    console.log(`✓ Successfully scraped ${testUrl}`);
    console.log(`  Response size: ${dataLength} characters`);
    console.log(`  Credits used: ${scrapeResult.credits}`);
    console.log('-----------------------------------------');
    
    // All tests passed
    console.log('All tests passed! The ScrapingBee proxy is working correctly.');
    return true;
    
  } catch (error) {
    console.error('Error during testing:', error);
    return false;
  }
}

// Execute the test
testScrapingBeeProxy()
  .then(success => {
    console.log(`Test completed with ${success ? 'SUCCESS' : 'FAILURE'}`);
  })
  .catch(err => {
    console.error('Unexpected error during test execution:', err);
  });

/**
 * How to use this test script:
 * 
 * 1. Make sure your server is running with the ScrapingBee proxy middleware installed
 * 2. Run this script using: 
 *    - In development: npm run dev -- --runTest=testScrapingBeeProxy
 *    - In Node.js environment: node testScrapingBeeProxy.js
 * 3. Check the console output for test results
 */

// Export for module usage
export { testScrapingBeeProxy };