// src/services/scrapingBeeService.js
import axios from 'axios';
import { SCRAPINGBEE_CONFIG } from '../config/config';
import proxyApi from '../api/proxyApiClient';

class ScrapingBeeService {
  constructor() {
    // Use local proxy instead of direct ScrapingBee API access
    this.baseUrl = 'https://app.scrapingbee.com/api/v1';
    this.proxyUrl = '/api/scrapingbee'; // Local Express server proxy route
    this.axiosInstance = axios.create({
      timeout: 30000, // 30 second timeout
    });
    this.abortController = null;
  }

  /**
   * Get both encoded and decoded test URLs
   */
  getTestUrls(targetUrl, apiKey) {
    // Create parameters exactly matching the working URL
    const params = new URLSearchParams();
    
    // Ensure API key is actually defined
    if (!apiKey) {
      console.error('API key is undefined in getTestUrls');
      throw new Error('API key is missing. Please configure it in Settings.');
    }
    
    params.append('api_key', apiKey);
    params.append('url', targetUrl);
    params.append('render_js', 'false');
    params.append('json_response', 'true');
    params.append('return_page_source', 'true');
    
    const encodedFullUrl = `${this.baseUrl}?${params.toString()}`;
    const decodedFullUrl = decodeURIComponent(encodedFullUrl);
    
    // Log both URLs for debugging
    console.log('Generated URL (encoded):', encodedFullUrl);
    console.log('Generated URL (decoded):', decodedFullUrl);
    console.log('Working example:', `${this.baseUrl}?api_key=YOUR_KEY&url=https%3A%2F%2Fferrum.audio&render_js=false&json_response=true&return_page_source=true`);
    
    return {
      encodedUrl: encodedFullUrl,
      decodedUrl: decodedFullUrl
    };
  }

  /**
   * Cancel any ongoing requests
   */
  cancelRequests() {
    if (this.abortController) {
      this.abortController.abort();
      this.abortController = null;
    }
  }

  /**
   * Get the remaining credit balance
   */
  async getCreditBalance(apiKey) {
    this.cancelRequests();
    this.abortController = new AbortController();

    try {
      // Ensure API key is actually defined
      if (!apiKey) {
        console.error('API key is undefined in getCreditBalance');
        throw new Error('API key is missing. Please configure it in Settings.');
      }
      
      // Clean the API key - remove any whitespace
      const cleanApiKey = apiKey.trim();
      
      console.log('Checking credit balance with API key:', cleanApiKey ? '****' + cleanApiKey.substring(cleanApiKey.length - 4) : 'MISSING');
      
      // Use the API proxy instead of direct access
      // Important: The server expects a GET request for the test endpoint, not POST
      const response = await proxyApi.get(
        `${this.proxyUrl}/test`, // Use the test endpoint of our proxy
        {
          signal: this.abortController.signal
        }
      );
      
      if (!response.data || !response.data.success) {
        throw new Error(response.data?.message || 'Failed to connect to ScrapingBee API');
      }
      
      return {
        success: true,
        credits: response.data.credits || 1, // Credits used for this test request
        message: 'API connection successful'
      };
    } catch (error) {
      if (axios.isCancel(error)) {
        return {
          success: false,
          credits: 0,
          message: 'Request cancelled'
        };
      }
      
      console.error('Error fetching credit balance:', error);
      return {
        success: false,
        credits: 0,
        message: error.message || 'Failed to fetch credit balance'
      };
    } finally {
      this.abortController = null;
    }
  }

  /**
   * Safely decode text from response
   */
  safeDecodeText(data) {
    if (typeof data === 'string') {
      return data;
    }
    
    try {
      // For browsers, use TextDecoder
      if (typeof TextDecoder !== 'undefined') {
        return new TextDecoder('utf-8').decode(new Uint8Array(data));
      }
      return String(data);
    } catch (error) {
      console.error('Error decoding text:', error);
      return '';
    }
  }

  /**
   * Scrape a target URL
   */
  async scrape(url, apiKey) {
    this.cancelRequests();
    this.abortController = new AbortController();

    try {
      // Ensure API key is actually defined
      if (!apiKey) {
        console.error('API key is undefined in scrape method');
        throw new Error('API key is missing. Please configure it in Settings.');
      }
      
      // We don't need to clean the API key here as it's passed to crawlerService
      // and not used directly for API calls (the server handles this)
      console.log('----------------------------------');
      console.log(`Scraping URL through local proxy: ${url}`);
      console.log('API Key will be handled by server-side proxy');
      console.log('----------------------------------');

      // Use our local proxy API endpoint instead of direct ScrapingBee access
      const response = await proxyApi.post(
        `${this.proxyUrl}/scrape`,
        {
          url: url,
          // Additional options can be passed here
          render_js: false,
          // No need to include API key as the server handles it
        },
        {
          signal: this.abortController.signal,
          validateStatus: status => true // Accept any status to get error details
        }
      );

      console.log('Response status:', response.status);
      
      // Handle non-200 responses
      if (response.status !== 200 || !response.data.success) {
        console.error('Error response:', response.data);
        throw new Error(response.data.message || `Failed with status: ${response.status}`);
      }

      return {
        success: true,
        data: response.data,
        pageSource: response.data.pageSource,
        credits: response.data.credits || 1,
        message: response.data.message || 'Successfully scraped URL'
      };

    } catch (error) {
      if (axios.isCancel(error)) {
        return {
          success: false,
          data: null,
          pageSource: null,
          credits: 0,
          message: 'Request cancelled'
        };
      }

      console.error('Scraping error details:', error);
      let errorMessage = 'Failed to scrape URL';
      if (error.response) {
        errorMessage = `Server returned ${error.response.status}: ${error.response.data?.message || error.response.data}`;
      } else if (error.request) {
        errorMessage = 'No response received from ScrapingBee proxy';
      }

      return {
        success: false,
        data: null,
        pageSource: null,
        credits: 0,
        message: errorMessage,
        error: error.message
      };
    } finally {
      this.abortController = null;
    }
  }

  /**
   * Test the API connection
   */
  async testConnection(apiKey) {
    try {
      // Ensure API key is actually defined
      if (!apiKey) {
        console.error('API key is undefined in testConnection method');
        throw new Error('API key is missing. Please configure it in Settings.');
      }
      
      // Clean the API key - remove any whitespace
      const cleanApiKey = apiKey.trim();
      
      if (!cleanApiKey) {
        throw new Error('API key cannot be empty');
      }
      
      console.log('Starting API connection test through local proxy...');
      
      // Test with the same URL that works in the curl command
      const testUrl = 'https://ferrum.audio';
      console.log(`Testing with URL: ${testUrl}`);
      
      // Use the local proxy to test connection
      // Important: The server expects a GET request for the test endpoint, not POST
      const response = await proxyApi.get(
        `${this.proxyUrl}/test`
      );
      
      if (!response.data || !response.data.success) {
        throw new Error(response.data?.message || 'Connection test failed');
      }
      
      console.log('Test successful! Connection to API verified');
      
      return {
        success: true,
        message: 'Connection successful.',
        credits: response.data.credits
      };
      
    } catch (error) {
      console.error('API test failed with error:', error);
      return {
        success: false,
        message: `Connection test failed: ${error.message}`,
        error: error
      };
    }
  }
}

export default new ScrapingBeeService();