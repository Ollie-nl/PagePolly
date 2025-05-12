// src/services/apiTestService.js

// Helper function to check content type
const getContentType = (headers) => {
  const contentType = headers.get('content-type') || '';
  return contentType.toLowerCase();
};

// Helper function to safely parse response
const parseResponse = async (response) => {
  const contentType = getContentType(response.headers);
  
  if (!response.ok) {
    if (contentType.includes('application/json')) {
      const error = await response.json();
      throw new Error(error.message || 'API request failed');
    } else {
      const text = await response.text();
      throw new Error(`API request failed: ${response.status} ${response.statusText}`);
    }
  }

  // Handle successful response
  if (contentType.includes('application/json')) {
    return await response.json();
  } else {
    const text = await response.text();
    // If text looks like HTML, it's probably an error page
    if (text.trim().startsWith('<!DOCTYPE') || text.trim().startsWith('<html')) {
      throw new Error('Received HTML response instead of expected JSON. Please verify API endpoint and key.');
    }
    // Return text content as data
    return { success: true, data: text };
  }
};

const testScrapingBeeConnection = async (apiKey) => {
  try {
    // Test URL that's known to work
    const testUrl = 'https://ferrum.audio';
    
    // Properly encode parameters
    const params = new URLSearchParams({
      api_key: apiKey,
      url: testUrl,
      render_js: 'false',
      return_page_source: 'true'
    });

    const endpoint = `https://app.scrapingbee.com/api/v1?${params.toString()}`;

    console.log('Testing ScrapingBee connection...', { endpoint });

    const response = await fetch(endpoint, {
      method: 'GET',
      headers: {
        'Accept': 'application/json'
      }
    });

    // Get credits information from headers
    const remainingRequests = response.headers.get('x-credit') || 'Unknown';
    const usedRequests = response.headers.get('x-requests-made') || 'Unknown';

    // Parse and validate response
    const data = await parseResponse(response);

    return {
      success: true,
      message: 'ScrapingBee API connection successful',
      credits: {
        remaining: remainingRequests,
        used: usedRequests
      },
      data: data
    };
  } catch (error) {
    console.error('ScrapingBee API test failed:', error);
    throw new Error(`ScrapingBee API test failed: ${error.message}`);
  }
};

const testCustomApiConnection = async (apiEndpoint, apiKey) => {
  try {
    const response = await fetch(apiEndpoint, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
    });

    // Parse and validate response
    const data = await parseResponse(response);

    return {
      success: true,
      message: 'Custom API connection successful',
      data: data
    };
  } catch (error) {
    console.error('Custom API test failed:', error);
    throw new Error(`Custom API test failed: ${error.message}`);
  }
};

export default {
  testScrapingBeeConnection,
  testCustomApiConnection
};