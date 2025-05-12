/**
 * proxyApiClient.js
 * A dedicated API client for the ScrapingBee proxy service
 * 
 * This client ensures all API calls go to the correct server endpoint and avoids
 * conflicts with the main API client that's used for Supabase.
 */

import axios from 'axios';

// Create a dedicated Axios instance for proxy requests
const proxyApiClient = axios.create({
  // Empty baseURL - we'll use relative URLs that will be resolved against the current page origin
  baseURL: '',
  timeout: 60000, // 60 seconds timeout for scraping operations which may take longer
  headers: {
    'Content-Type': 'application/json',
  }
});

// Response interceptor for handling common errors
proxyApiClient.interceptors.response.use(
  response => {
    return response;
  },
  error => {
    const { response } = error;
    
    if (response) {
      // Extract error message from response
      const errorMessage = response.data?.message || 'An error occurred';
      
      switch (response.status) {
        case 400:
          console.error('Bad request:', errorMessage);
          break;
          
        case 401:
          console.error('Authentication error:', errorMessage);
          break;
          
        case 403:
          console.error('Permission denied:', errorMessage);
          break;
          
        case 404:
          console.error('Resource not found:', errorMessage);
          break;
          
        case 429:
          console.error('Rate limit exceeded:', errorMessage);
          break;
          
        case 500:
          console.error('Server error:', errorMessage);
          break;
          
        default:
          console.error('API error:', errorMessage);
      }
    } else if (error.request) {
      // The request was made but no response was received
      console.error('No response received. The server might be down or unreachable.');
    } else {
      // Something happened in setting up the request that triggered an error
      console.error('Request configuration error:', error.message);
    }
    
    return Promise.reject(error);
  }
);

// API method wrappers for consistent error handling
const proxyApi = {
  /**
   * Make a generic request
   * @param {string} method - HTTP method
   * @param {string} url - API endpoint
   * @param {Object} data - Request payload
   * @param {Object} config - Additional axios config
   * @returns {Promise} - Axios response promise
   */
  request: (method, url, data = null, config = {}) => {
    return proxyApiClient({
      method,
      url,
      data,
      ...config
    });
  },
  
  /**
   * GET request
   * @param {string} url - API endpoint
   * @param {Object} config - Additional axios config
   * @returns {Promise} - Axios response promise
   */
  get: (url, config = {}) => {
    return proxyApiClient.get(url, config);
  },
  
  /**
   * POST request
   * @param {string} url - API endpoint
   * @param {Object} data - Request payload
   * @param {Object} config - Additional axios config
   * @returns {Promise} - Axios response promise
   */
  post: (url, data = null, config = {}) => {
    return proxyApiClient.post(url, data, config);
  },
  
  /**
   * PUT request
   * @param {string} url - API endpoint
   * @param {Object} data - Request payload
   * @param {Object} config - Additional axios config
   * @returns {Promise} - Axios response promise
   */
  put: (url, data = null, config = {}) => {
    return proxyApiClient.put(url, data, config);
  },
  
  /**
   * PATCH request
   * @param {string} url - API endpoint
   * @param {Object} data - Request payload
   * @param {Object} config - Additional axios config
   * @returns {Promise} - Axios response promise
   */
  patch: (url, data = null, config = {}) => {
    return proxyApiClient.patch(url, data, config);
  },
  
  /**
   * DELETE request
   * @param {string} url - API endpoint
   * @param {Object} config - Additional axios config
   * @returns {Promise} - Axios response promise
   */
  delete: (url, config = {}) => {
    return proxyApiClient.delete(url, config);
  }
};

export default proxyApi;