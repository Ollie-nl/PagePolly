/**
 * ScrapingBee API Proxy Middleware
 * 
 * This middleware acts as a proxy between the client and ScrapingBee API
 * to avoid CORS issues and protect the API key.
 */

const axios = require('axios');
const querystring = require('querystring');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../../.env') });

// Get API key from environment
let apiKey = process.env.SCRAPINGBEE_API_KEY;

if (apiKey) {
  console.log('Successfully loaded ScrapingBee API key from environment');
} else {
  console.error('WARNING: ScrapingBee API key not found!');
}

const SCRAPINGBEE_API_URL = 'https://app.scrapingbee.com/api/v1';

// Debug log for API key
console.log('ScrapingBee API Key loaded (first/last chars):', apiKey ? `${apiKey.substring(0, 3)}...${apiKey.substring(apiKey.length - 3)}` : 'NOT FOUND');

/**
 * Proxy middleware for ScrapingBee API
 */
const scrapingBeeProxy = async (req, res) => {
  const { url, ...otherParams } = req.body;
  
  if (!url) {
    return res.status(400).json({
      success: false,
      message: 'URL is required',
    });
  }
  
  // If no API key is found
  if (!apiKey) {
    return res.status(500).json({
      success: false,
      message: 'ScrapingBee API key is not configured',
    });
  }

  try {
    // Default parameters
    const params = {
      api_key: apiKey,
      url: url, // Don't pre-encode, querystring will handle this properly
      render_js: false,
      json_response: true,
      return_page_source: true,
      ...otherParams
    };

    console.log(`[ScrapingBeeProxy] Fetching URL: ${url}`);
    console.log(`[ScrapingBeeProxy] Parameters: ${JSON.stringify({...params, api_key: 'XXXXX'})}`);  // Log params without API key

    // Send request to ScrapingBee API
    const apiUrl = `${SCRAPINGBEE_API_URL}?${querystring.stringify(params)}`;
    console.log('[ScrapingBeeProxy] Making API request to URL (sanitized):', apiUrl.replace(apiKey, 'XXXXX'));
    
    // Try a local mock response for testing
    if (process.env.USE_MOCK_RESPONSES === 'true') {
      console.log('[ScrapingBeeProxy] Using mock response for development');
      return res.json({
        success: true,
        pageSource: '<html><body><h1>Mock Response</h1><p>This is a mock response for development.</p></body></html>',
        statusCode: 200,
        headers: { 'content-type': 'text/html' },
        credits: 1,
        cost: 1,
        message: 'Mock scraping completed successfully'
      });
    }
    
    // Implement retry logic with exponential backoff
    const maxRetries = 3;
    let retryCount = 0;
    let lastError = null;
    
    while (retryCount < maxRetries) {
      try {
        console.log(`[ScrapingBeeProxy] Request attempt ${retryCount + 1} of ${maxRetries}`);
        
        const response = await axios({
          method: 'GET',
          url: apiUrl,
          headers: {
            'Accept': 'application/json',
          },
          timeout: 60000, // 60 seconds timeout
        });
        
        console.log('[ScrapingBeeProxy] Request successful');
        return res.json({
          success: true,
          pageSource: response.data.body,
          statusCode: response.data.statusCode,
          headers: response.data.headers,
          credits: response.data.credits_used,
          cost: response.data.cost,
          message: 'Scraping completed successfully'
        });
      } catch (error) {
        lastError = error;
        retryCount++;
        
        if (retryCount < maxRetries) {
          const delay = Math.pow(2, retryCount) * 1000; // Exponential backoff: 2s, 4s, 8s...
          console.log(`[ScrapingBeeProxy] Request failed. Retrying in ${delay/1000} seconds...`);
          await new Promise(resolve => setTimeout(resolve, delay));
        } else {
          console.error('[ScrapingBeeProxy] Max retries exceeded. Giving up.');
          break;
        }
      }
    }
    
    // If we reach here, all retries failed
    throw lastError;

  } catch (error) {
    console.error('[ScrapingBeeProxy] Error:', error.message);
    
    let errorMessage = 'Failed to connect to ScrapingBee API';
    let statusCode = 503; // Default to service unavailable for API connection issues

    // Handle different error types
    if (error.response) {
      // The request was made and the server responded with an error status
      console.error(`[ScrapingBeeProxy] Response status: ${error.response.status}`);
      console.error('[ScrapingBeeProxy] Response headers:', error.response.headers);
      
      statusCode = error.response.status;
      errorMessage = `ScrapingBee API error: ${error.response.status}`;
      
      if (error.response.data) {
        console.error('[ScrapingBeeProxy] Response data:', 
          typeof error.response.data === 'object' ?
          JSON.stringify(error.response.data, null, 2) : error.response.data);
        
        if (typeof error.response.data === 'string') {
          errorMessage += ` - ${error.response.data}`;
        } else if (error.response.data.message) {
          errorMessage += ` - ${error.response.data.message}`;
        }
      }
    } else if (error.request) {
      // The request was made but no response was received
      console.error('[ScrapingBeeProxy] No response received');
      errorMessage = 'Failed to connect to ScrapingBee API: No response received';
    } else {
      // Something happened in setting up the request
      console.error('[ScrapingBeeProxy] Request setup error:', error.message);
      errorMessage = `Failed to connect to ScrapingBee API: ${error.message}`;
    }

    return res.status(statusCode).json({
      success: false,
      message: errorMessage,
      error: error.message
    });
  }
};

/**
 * Test connection to ScrapingBee API
 */
const testScrapingBeeConnection = async (req, res) => {
  if (!apiKey) {
    return res.status(500).json({
      success: false,
      message: 'ScrapingBee API key is not configured',
    });
  }

  // Try a local mock response for testing
  if (process.env.USE_MOCK_RESPONSES === 'true') {
    console.log('[ScrapingBeeProxy] Using mock response for connection test');
    return res.json({
      success: true,
      credits: 1,
      message: 'Mock ScrapingBee API connection successful',
    });
  }

  try {
    // Test endpoint with a simple request
    const testUrl = 'https://httpbin.org/ip';
    
    // The querystring module will handle the proper encoding
    const params = {
      api_key: apiKey,
      url: testUrl,
      json_response: true,
    };

    console.log('[ScrapingBeeProxy] Testing API connection...');
    console.log('[ScrapingBeeProxy] API Key (first 5 chars):', apiKey.substring(0, 5) + '...');
    
    // Log the full URL structure (without the actual API key)
    const debugUrl = `${SCRAPINGBEE_API_URL}?api_key=XXXXX&url=${testUrl}&json_response=true`;
    console.log('[ScrapingBeeProxy] Request URL structure:', debugUrl);
    
    const apiUrl = `${SCRAPINGBEE_API_URL}?${querystring.stringify(params)}`;
    console.log('[ScrapingBeeProxy] Actual request URL being used (sanitized):', apiUrl.replace(apiKey, 'XXXXX'));
    
    const response = await axios({
      method: 'GET',
      url: apiUrl,
      headers: {
        'Accept': 'application/json',
      },
      timeout: 30000, // 30 seconds timeout
    });

    return res.json({
      success: true,
      credits: response.data.credits_used,
      message: 'ScrapingBee API connection successful',
    });

  } catch (error) {
    console.error('[ScrapingBeeProxy] Connection test failed:', error.message);
    
    let errorMessage = 'Connection test failed';
    let statusCode = 503; // Default to service unavailable
    
    // Get more detailed error information
    if (error.response) {
      // Server responded with non-2xx status
      statusCode = error.response.status;
      console.error(`[ScrapingBeeProxy] Error status: ${error.response.status}`);
      console.error(`[ScrapingBeeProxy] Error headers:`, error.response.headers);
      
      errorMessage = `Connection test failed: ScrapingBee API returned ${error.response.status}`;
      
      if (error.response.data) {
        console.error('[ScrapingBeeProxy] Error data:', typeof error.response.data === 'object' ? 
          JSON.stringify(error.response.data, null, 2) : error.response.data);
        
        if (typeof error.response.data === 'string') {
          errorMessage += ` - ${error.response.data}`;
        } else if (error.response.data.message) {
          errorMessage += ` - ${error.response.data.message}`;
        }
      }
    } else if (error.request) {
      // Request was made but no response
      console.error('[ScrapingBeeProxy] No response received');
      errorMessage = 'Connection test failed: No response received';
    } else {
      // Something else went wrong
      console.error('[ScrapingBeeProxy] Request setup error:', error.message);
      errorMessage = `Connection test failed: ${error.message}`;
    }
    
    return res.status(statusCode).json({
      success: false,
      message: errorMessage,
      error: error.message
    });
  }
};

// Export proxy middleware with different endpoints and health check
module.exports = (req, res, next) => {
  const path = req.path;
  
  // Add health check endpoint
  if (path === '/health') {
    return res.json({
      success: true,
      status: 'healthy',
      apiKeyConfigured: !!apiKey,
      timestamp: new Date().toISOString()
    });
  }
  
  // Check if API key is configured
  if (!apiKey) {
    console.error('[ScrapingBeeProxy] API key not configured');
    return res.status(503).json({
      success: false,
      message: 'Service is not properly configured: Missing API key',
      code: 'API_KEY_MISSING'
    });
  }
  
  // Route requests to appropriate handlers
  if (path === '/scrape') {
    return scrapingBeeProxy(req, res);
  } else if (path === '/test') {
    return testScrapingBeeConnection(req, res);
  } else {
    return res.status(404).json({
      success: false,
      message: 'Invalid endpoint',
      availableEndpoints: ['/health', '/scrape', '/test']
    });
  }
};