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
}

if (!apiKey) {
  console.error('WARNING: ScrapingBee API key not found!');
}

const SCRAPINGBEE_API_URL = 'https://app.scrapingbee.com/api/v1';

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

    // Send request to ScrapingBee API
    const apiUrl = `${SCRAPINGBEE_API_URL}?${querystring.stringify(params)}`;
    const response = await axios({
      method: 'GET',
      url: apiUrl,
      headers: {
        'Accept': 'application/json',
      },
      timeout: 60000, // 60 seconds timeout
    });

    // Extract relevant data from response
    const {
      body, // HTML content
      statusCode,
      headers,
      credits_used,
      cost,
    } = response.data;

    return res.json({
      success: true,
      pageSource: body,
      statusCode,
      headers,
      credits: credits_used,
      cost,
      message: 'Scraping completed successfully'
    });

  } catch (error) {
    console.error('[ScrapingBeeProxy] Error:', error.message);
    
    let errorMessage = 'Failed to fetch data from ScrapingBee API';
    let statusCode = 500;

    // Handle different error types
    if (error.response) {
      // The request was made and the server responded with a status code
      // that falls out of the range of 2xx
      errorMessage = `ScrapingBee returned error: ${error.response.status} ${error.response.statusText}`;
      statusCode = error.response.status;
      
      if (error.response.data) {
        if (typeof error.response.data === 'string') {
          errorMessage += ` - ${error.response.data}`;
        } else if (error.response.data.message) {
          errorMessage += ` - ${error.response.data.message}`;
        }
      }
      
    } else if (error.request) {
      // The request was made but no response was received
      errorMessage = 'No response received from ScrapingBee API. The service might be down.';
    }

    return res.status(statusCode).json({
      success: false,
      message: errorMessage,
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
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

  try {
    // Test endpoint with a simple request
    const testUrl = 'https://httpbin.org/ip';
    
    // Important: Don't encode the URL as a parameter, ScrapingBee expects the URL parameter unencoded
    // The querystring module will handle the proper encoding
    const params = {
      api_key: apiKey,
      url: testUrl,  // Don't pre-encode this
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
    
    let errorDetails = 'Unknown error';
    let statusCode = 500;
    
    // Get more detailed error information
    if (error.response) {
      // Server responded with non-2xx status
      statusCode = error.response.status;
      console.error(`[ScrapingBeeProxy] Error status: ${error.response.status}`);
      console.error(`[ScrapingBeeProxy] Error headers:`, error.response.headers);
      
      if (error.response.data) {
        console.error('[ScrapingBeeProxy] Error data:', typeof error.response.data === 'object' ? 
          JSON.stringify(error.response.data, null, 2) : error.response.data);
        
        if (typeof error.response.data === 'string') {
          errorDetails = error.response.data;
        } else if (error.response.data.message) {
          errorDetails = error.response.data.message;
        }
      }
    } else if (error.request) {
      // Request was made but no response
      errorDetails = 'No response received from ScrapingBee API';
      console.error('[ScrapingBeeProxy] No response received');
    } else {
      // Something else went wrong
      errorDetails = error.message;
      console.error('[ScrapingBeeProxy] Request setup error:', error.message);
    }
    
    return res.status(statusCode).json({
      success: false,
      message: 'ScrapingBee API connection test failed: ' + errorDetails,
      error: error.message,
      details: errorDetails
    });
  }
};

// Export proxy middleware with different endpoints
module.exports = (req, res, next) => {
  const path = req.path;
  
  if (path === '/scrape') {
    // Handle scraping requests
    return scrapingBeeProxy(req, res);
  } else if (path === '/test') {
    // Handle connection test requests
    return testScrapingBeeConnection(req, res);
  } else {
    // Invalid endpoint
    return res.status(404).json({
      success: false,
      message: 'Invalid endpoint',
    });
  }
};