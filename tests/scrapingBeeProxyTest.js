/**
 * ScrapingBee Proxy Integration Test
 * 
 * This script tests the integration between the client-side service and server-side proxy
 * by making real requests to verify the ScrapingBee API functionality.
 */

const axios = require('axios');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../.env') });

// Configuration
const SERVER_URL = process.env.TEST_SERVER_URL || 'http://localhost:4000';
const TEST_URL = 'https://ferrum.audio';
const PROXY_ENDPOINT = '/api/scrapingbee';

/**
 * Main test function
 */
async function runTests() {
  console.log('==================================================');
  console.log('ScrapingBee Proxy Integration Test');
  console.log('==================================================');

  try {
    // Test 1: Connection Test
    console.log('\n📋 Test 1: Testing API connection...');
    const connectionTest = await testConnection();
    printResult(connectionTest, 'Connection test');

    // Test 2: Basic Scraping
    console.log('\n📋 Test 2: Testing basic scraping functionality...');
    const scrapeTest = await testScraping(TEST_URL);
    printResult(scrapeTest, 'Basic scraping test');

    // Test 3: JavaScript Rendering
    console.log('\n📋 Test 3: Testing JavaScript rendering...');
    const renderTest = await testJSRendering(TEST_URL);
    printResult(renderTest, 'JavaScript rendering test');

    console.log('\n==================================================');
    console.log('All tests completed!');
    console.log('==================================================');

    // Return overall success status
    return connectionTest.success && scrapeTest.success && renderTest.success;
  } catch (error) {
    console.error('\n❌ Test execution failed:', error.message);
    return false;
  }
}

/**
 * Test the connection to the ScrapingBee API
 */
async function testConnection() {
  try {
    const response = await axios.get(`${SERVER_URL}${PROXY_ENDPOINT}/test`);
    return response.data;
  } catch (error) {
    return handleError(error, 'Connection test failed');
  }
}

/**
 * Test basic scraping functionality
 */
async function testScraping(url) {
  try {
    const response = await axios.post(`${SERVER_URL}${PROXY_ENDPOINT}/scrape`, {
      url,
      render_js: false,
      return_page_source: true,
      json_response: true
    });

    const result = response.data;
    if (result.pageSource && result.pageSource.length > 0) {
      console.log(`  Page source length: ${result.pageSource.length} characters`);
      console.log(`  Credits used: ${result.credits || 'Unknown'}`);
      return result;
    } else {
      console.error('  ❌ Received empty page source');
      return {
        success: false,
        message: 'Received empty page source'
      };
    }
  } catch (error) {
    return handleError(error, 'Scraping test failed');
  }
}

/**
 * Test JavaScript rendering functionality
 */
async function testJSRendering(url) {
  try {
    const response = await axios.post(`${SERVER_URL}${PROXY_ENDPOINT}/scrape`, {
      url,
      render_js: true, // Enable JavaScript rendering
      return_page_source: true,
      json_response: true
    });

    const result = response.data;
    if (result.pageSource && result.pageSource.length > 0) {
      console.log(`  Rendered page source length: ${result.pageSource.length} characters`);
      console.log(`  Credits used: ${result.credits || 'Unknown'}`);
      return result;
    } else {
      console.error('  ❌ Received empty page source');
      return {
        success: false,
        message: 'Received empty rendered page source'
      };
    }
  } catch (error) {
    return handleError(error, 'JavaScript rendering test failed');
  }
}

/**
 * Handle errors and format error response
 */
function handleError(error, defaultMessage) {
  console.error(`  ❌ ${defaultMessage}:`, error.message);
  
  if (error.response) {
    console.error(`  Status: ${error.response.status}`);
    console.error(`  Data:`, error.response.data);
    
    return {
      success: false,
      message: error.response.data?.message || defaultMessage,
      error: error.message
    };
  } else {
    return {
      success: false,
      message: defaultMessage,
      error: error.message
    };
  }
}

/**
 * Print test result
 */
function printResult(result, testName) {
  if (result.success) {
    console.log(`  ✅ ${testName} passed!`);
  } else {
    console.error(`  ❌ ${testName} failed: ${result.message}`);
  }
}

/**
 * Run the tests if executed directly
 */
if (require.main === module) {
  runTests()
    .then(success => {
      console.log(`\nTest summary: ${success ? '✅ ALL PASSED' : '❌ SOME TESTS FAILED'}`);
      process.exit(success ? 0 : 1);
    })
    .catch(err => {
      console.error('Unexpected error during test execution:', err);
      process.exit(1);
    });
}

// Export for use in other modules
module.exports = {
  runTests,
  testConnection,
  testScraping,
  testJSRendering
};