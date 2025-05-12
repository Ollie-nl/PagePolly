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
  getTestUrls(targetUrl, apiKey = SCRAPINGBEE_CONFIG.API_KEY) {
    // Create parameters exactly matching the working URL
    const params = new URLSearchParams();
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
  async getCreditBalance(apiKey = SCRAPINGBEE_CONFIG.API_KEY) {
    this.cancelRequests();
    this.abortController = new AbortController();

    try {
      console.log('Checking credit balance with API key:', apiKey);
      
      const accountUrl = `${this.baseUrl}/account?api_key=${apiKey}`;
      console.log('Account URL:', accountUrl);
      
      const response = await this.axiosInstance({
        method: 'GET',
        url: accountUrl,
        signal: this.abortController.signal,
        validateStatus: status => true,
        responseType: 'arraybuffer'
      });
      
      console.log('Account API response status:', response.status);
      
      if (response.status !== 200) {
        const responseText = Buffer.from(response.data).toString('utf8');
        console.error('Error response from account API:', responseText);
        throw new Error(`Account API returned status: ${response.status}`);
      }
      
      const responseText = Buffer.from(response.data).toString('utf8');
      const responseData = JSON.parse(responseText);
      
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
   * Scrape a target URL
   */
  async scrape(url, apiKey = SCRAPINGBEE_CONFIG.API_KEY) {
    this.cancelRequests();
    this.abortController = new AbortController();

    try {
      // Directly create the URL exactly like the working example with ALL parameters
      const encodedUrl = encodeURIComponent(url);
      const apiUrl = `${this.baseUrl}?api_key=${apiKey}&url=${encodedUrl}&render_js=false&json_response=true&return_page_source=true`;
      
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
        responseType: 'arraybuffer' // Handle binary responses
      });

      console.log('Response status:', response.status);
      console.log('Response headers:', response.headers);
      
      // Handle non-200 responses
      if (response.status !== 200) {
        const responseText = response.data ? Buffer.from(response.data).toString('utf8') : '';
        console.error('Error response body:', responseText);
        throw new Error(`ScrapingBee API returned status: ${response.status}, Body: ${responseText}`);
      }

      // Convert binary response to text
      const responseText = Buffer.from(response.data).toString('utf8');
      
      // Try to parse as JSON if possible
      let parsedData;
      try {
        parsedData = JSON.parse(responseText);
      } catch (e) {
        // Not JSON, use as HTML/text
        parsedData = null;
      }
      
      const finalData = parsedData || responseText;
      
      return {
        success: true,
        data: finalData,
        pageSource: responseText,
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
        const responseText = error.response.data ? Buffer.from(error.response.data).toString('utf8') : '';
        console.error('Error response body:', responseText);
        errorMessage = `Server returned ${error.response.status}: ${responseText}`;
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
  async testConnection(apiKey = SCRAPINGBEE_CONFIG.API_KEY) {
    try {
      console.log('Starting API connection test...');
      
      // Test with the same URL that works in the curl command
      const testUrl = 'https://ferrum.audio';
      console.log(`Testing with URL: ${testUrl}`);
      
      // Skip the credit balance check to simplify troubleshooting
      const testResult = await this.scrape(testUrl, apiKey);
      
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