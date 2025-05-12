/**
 * ScrapingBee Proxy Service
 * Client-side service to interact with the server-side ScrapingBee proxy
 */

import apiClient from '../apiClient';

/**
 * Base API endpoint for the ScrapingBee proxy
 */
const PROXY_ENDPOINT = '/api/scrapingbee';

/**
 * ScrapingBee Proxy Service
 */
const scrapingBeeProxyService = {
  /**
   * Test the connection to the ScrapingBee API
   * @returns {Promise<Object>} Response with success status
   */
  testConnection: async () => {
    try {
      const response = await apiClient.get(`${PROXY_ENDPOINT}/test`);
      return response.data;
    } catch (error) {
      console.error('ScrapingBee connection test failed:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'ScrapingBee connection test failed',
        error: error.message
      };
    }
  },

  /**
   * Scrape a website using the ScrapingBee proxy
   * @param {string} url - URL to scrape
   * @param {Object} options - Additional options for ScrapingBee API
   * @returns {Promise<Object>} Response with scraped data
   */
  scrape: async (url, options = {}) => {
    if (!url) {
      return {
        success: false,
        message: 'URL is required',
      };
    }

    try {
      // Default options
      const defaultOptions = {
        render_js: false,
        json_response: true,
        return_page_source: true
      };

      const response = await apiClient.post(`${PROXY_ENDPOINT}/scrape`, {
        url,
        ...defaultOptions,
        ...options
      });

      return response.data;
    } catch (error) {
      console.error('ScrapingBee scraping failed:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'ScrapingBee scraping failed',
        error: error.message
      };
    }
  },

  /**
   * Get rendered JavaScript content from a website
   * @param {string} url - URL to scrape
   * @param {Object} options - Additional options
   * @returns {Promise<Object>} Response with scraped data
   */
  getRenderedContent: async (url, options = {}) => {
    if (!url) {
      return {
        success: false,
        message: 'URL is required',
      };
    }

    try {
      // Override options to ensure JavaScript rendering
      const renderOptions = {
        ...options,
        render_js: true,
        return_page_source: true
      };

      const response = await scrapingBeeProxyService.scrape(url, renderOptions);
      return response;
    } catch (error) {
      console.error('ScrapingBee rendered content fetch failed:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'ScrapingBee rendered content fetch failed',
        error: error.message
      };
    }
  },

  /**
   * Extract data from a website using CSS selectors
   * @param {string} url - URL to scrape
   * @param {Object} extractRules - CSS selectors to extract data
   * @returns {Promise<Object>} Response with extracted data
   */
  extractData: async (url, extractRules) => {
    if (!url) {
      return {
        success: false,
        message: 'URL is required',
      };
    }

    if (!extractRules || Object.keys(extractRules).length === 0) {
      return {
        success: false,
        message: 'Extract rules are required',
      };
    }

    try {
      const options = {
        extract_rules: extractRules,
        json_response: true
      };

      const response = await scrapingBeeProxyService.scrape(url, options);
      return response;
    } catch (error) {
      console.error('ScrapingBee data extraction failed:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'ScrapingBee data extraction failed',
        error: error.message
      };
    }
  }
};

export default scrapingBeeProxyService;