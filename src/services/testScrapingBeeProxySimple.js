/**
 * Simple test script for ScrapingBee proxy implementation
 * This script demonstrates how to use the server-side ScrapingBee proxy
 */

import axios from 'axios';

/**
 * Test function to verify the ScrapingBee proxy solution
 */
async function testScrapingBeeProxy() {
  console.log('Starting ScrapingBee proxy test...');
  console.log('-----------------------------------------');

  try {
    // Step 1: Test API connection
    console.log('Step 1: Testing API connection...');
    
    const connectionTest = await axios.get('http://localhost:5176/api/scrapingbee/test');
    console.log('Connection test result:', connectionTest.data);
    
    if (!connectionTest.data.success) {
      console.error('Connection test failed. Please check your API key and server setup.');
      return false;
    }
    
    console.log('✓ Connection test successful!');
    console.log('-----------------------------------------');

    // Step 2: Test scraping a specific URL
    const testUrl = 'https://ferrum.audio';
    console.log(`Step 2: Testing scraping ${testUrl}...`);
    
    const scrapeResult = await axios.post('http://localhost:5176/api/scrapingbee/scrape', { url: testUrl });
    
    if (!scrapeResult.data.success) {
      console.error('Scraping test failed:', scrapeResult.data.message);
      return false;
    }
    
    // Log some information about the scraped data
    const dataLength = scrapeResult.data.pageSource ? scrapeResult.data.pageSource.length : 0;
    console.log(`✓ Successfully scraped ${testUrl}`);
    console.log(`  Response size: ${dataLength} characters`);
    console.log(`  Credits used: ${scrapeResult.data.credits}`);
    console.log('-----------------------------------------');
    
    // All tests passed
    console.log('All tests passed! The ScrapingBee proxy is working correctly.');
    return true;
    
  } catch (error) {
    console.error('Error during testing:', error.message);
    if (error.response) {
      console.error('Response data:', error.response.data);
      console.error('Response status:', error.response.status);
    }
    return false;
  }
}

// Execute the test
testScrapingBeeProxy()
  .then(success => {
    console.log(`Test completed with ${success ? 'SUCCESS' : 'FAILURE'}`);
    process.exit(success ? 0 : 1);
  })
  .catch(err => {
    console.error('Unexpected error during test execution:', err);
    process.exit(1);
  });