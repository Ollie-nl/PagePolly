// src/services/scrapingBeeService.js
import axios from 'axios';
import { SCRAPINGBEE_CONFIG } from '../config/config';

class ScrapingBeeService {
  constructor() {
    this.baseUrl = 'https://app.scrapingbee.com/api/v1';
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
      
      const accountUrl = `${this.baseUrl}/account?api_key=${cleanApiKey}`;
      console.log('Account URL:', accountUrl);
      
      const response = await this.axiosInstance({
        method: 'GET',
        url: accountUrl,
        signal: this.abortController.signal,
        validateStatus: status => true,
        responseType: 'text'
      });
      
      console.log('Account API response status:', response.status);
      
      if (response.status !== 200) {
        console.error('Error response from account API:', response.data);
        throw new Error(`Account API returned status: ${response.status}`);
      }
      
      const responseData = typeof response.data === 'string' ? JSON.parse(response.data) : response.data;
      
      return {
        success: true,
        credits: responseData.remaining_credits,
        message: `Remaining credits: ${responseData.remaining_credits}`
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
      
      // Clean the API key - remove any whitespace
      const cleanApiKey = apiKey.trim();
      
      // Directly create the URL exactly like the working example with ALL parameters
      const encodedUrl = encodeURIComponent(url);
      const apiUrl = `${this.baseUrl}?api_key=${cleanApiKey}&url=${encodedUrl}&render_js=false&json_response=true&return_page_source=true`;
      
      console.log('----------------------------------');
      console.log('EXACT API CALL:');
      console.log(`Scraping URL: ${url}`);
      console.log(`API Key: ${apiKey}`);
      console.log(`Full API URL: ${apiUrl}`);
      console.log('Full working example: https://app.scrapingbee.com/api/v1?api_key=YOUR_KEY&url=https%3A%2F%2Fferrum.audio&render_js=false&json_response=true&return_page_source=true');
      console.log('----------------------------------');

      const response = await this.axiosInstance({
        method: 'GET',
        url: apiUrl,
        signal: this.abortController.signal,
        validateStatus: status => true, // Accept any status to get error details
        responseType: 'text' // Use text instead of arraybuffer
      });

      console.log('Response status:', response.status);
      console.log('Response headers:', response.headers);
      
      // Handle non-200 responses
      if (response.status !== 200) {
        console.error('Error response body:', response.data);
        throw new Error(`ScrapingBee API returned status: ${response.status}, Body: ${response.data}`);
      }

      // Try to parse as JSON if possible
      let parsedData;
      try {
        parsedData = JSON.parse(response.data);
      } catch (e) {
        // Not JSON, use as HTML/text
        parsedData = null;
      }
      
      const finalData = parsedData || response.data;
      
      return {
        success: true,
        data: finalData,
        pageSource: response.data,
        credits: response.headers['x-credit-used'] || 1,
        message: 'Successfully scraped URL'
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
        errorMessage = `Server returned ${error.response.status}: ${error.response.data}`;
      } else if (error.request) {
        errorMessage = 'No response received from ScrapingBee API';
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
      
      console.log('Starting API connection test with key (masked):', '****' + cleanApiKey.substring(cleanApiKey.length - 4));
      
      // Test with the same URL that works in the curl command
      const testUrl = 'https://ferrum.audio';
      console.log(`Testing with URL: ${testUrl}`);
      
      // Skip the credit balance check to simplify troubleshooting
      const testResult = await this.scrape(testUrl, cleanApiKey);
      
      if (!testResult.success) {
        console.error('Test failed with error:', testResult.message);
        throw new Error(testResult.message);
      }
      
      console.log('Test successful! Response received:', testResult.data ? 'Data received' : 'No data');
      
      return {
        success: true,
        message: 'Connection successful.',
        pageSource: testResult.pageSource,
        data: testResult.data
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