import axios from 'axios';

// Test URLs
const BASE_URL = 'http://localhost:4000';
const TEST_ENDPOINT = `${BASE_URL}/api/scrapingbee/test`;
const SCRAPE_ENDPOINT = `${BASE_URL}/api/scrapingbee/scrape`;

// Test function
async function testApi() {
  console.log('===============================================');
  console.log('TESTING SCRAPINGBEE PROXY API');
  console.log('===============================================');

  try {
    console.log('\n1. TESTING CONNECTION');
    console.log('Endpoint:', TEST_ENDPOINT);
    
    try {
      const testResponse = await axios.get(TEST_ENDPOINT);
      const testResult = testResponse.data;
      
      console.log('Status:', testResponse.status);
      console.log('Response:', JSON.stringify(testResult, null, 2));
      
      if (testResult.success) {
        console.log('✅ TEST CONNECTION SUCCESS!');
      } else {
        console.log('❌ TEST CONNECTION FAILED!');
      }
    } catch (error) {
      console.error('Connection test error:', error.message);
      if (error.response) {
        console.error('Error status:', error.response.status);
        console.error('Error data:', error.response.data);
      }
    }

    console.log('\n2. TESTING SCRAPING');
    console.log('Endpoint:', SCRAPE_ENDPOINT);
    
    try {
      const scrapeResponse = await axios.post(SCRAPE_ENDPOINT, {
        url: 'https://httpbin.org/html'
      });
      
      const scrapeResult = scrapeResponse.data;
      
      console.log('Status:', scrapeResponse.status);
      console.log('Success:', scrapeResult.success);
      console.log('Message:', scrapeResult.message);
      
      if (scrapeResult.pageSource) {
        // Show just first 100 chars of page source
        console.log('Page Source (preview):', scrapeResult.pageSource.substring(0, 100) + '...');
      }
      
      if (scrapeResult.success) {
        console.log('✅ SCRAPE TEST SUCCESS!');
      } else {
        console.log('❌ SCRAPE TEST FAILED!');
        console.log('Error:', scrapeResult.error);
      }
    } catch (error) {
      console.error('Scrape test error:', error.message);
      if (error.response) {
        console.error('Error status:', error.response.status);
        console.error('Error data:', error.response.data);
      }
    }

  } catch (error) {
    console.error('ERROR DURING TESTING:', error.message);
  }
  
  console.log('\n===============================================');
}

// Run tests
testApi();