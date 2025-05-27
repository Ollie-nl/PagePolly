import axios from 'axios';
import axiosRetry from 'axios-retry';

/**
 * API Client for Crawler Service
 * This module handles all the API calls to the crawler backend service
 */

// Install axios-retry first

// Create a separate axios instance for crawler service
const crawlerClient = axios.create({
  // Use environment variable if available, otherwise use relative paths
  // which will resolve against the current domain (important for deployment)
  baseURL: import.meta.env.VITE_CRAWLER_API_URL || '/api/crawls',  // Set the baseURL to /api/crawls
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Configure axios-retry
axiosRetry(crawlerClient, {
  retries: 3,
  retryDelay: (retryCount) => {
    return retryCount * 1000; // exponential delay: 1s, 2s, 3s
  },
  retryCondition: (error) => {
    // Retry on network errors or 503 Service Unavailable
    return axiosRetry.isNetworkOrIdempotentRequestError(error) || 
           error.response?.status === 503;
  },
  onRetry: (retryCount, error, requestConfig) => {
    console.log(
      `Retrying request (${retryCount}/3) due to ${error.response?.status || 'network'} error:`,
      requestConfig.url
    );
  }
});

// Add response interceptor for better error handling
crawlerClient.interceptors.response.use(
  response => response,
  error => {
    // Let axios-retry handle the retries
    if (!error.response) {
      console.error('Network error:', error.message);
      return Promise.reject(new Error('Could not connect to the crawler service'));
    }
    return Promise.reject(error);
  }
);

// Add request interceptor to inject the API key into the headers
crawlerClient.interceptors.request.use(config => {
  // If the request has an api_key in the data, add it to headers too
  if (config.data && config.data.api_key) {
    // Clean the API key before adding to headers
    const cleanApiKey = config.data.api_key.trim();
    config.headers['X-API-Key'] = cleanApiKey;
    config.data.api_key = cleanApiKey; // Also update in the request body
    console.log('Added API key to headers from request data (masked):', '****' + cleanApiKey.substring(cleanApiKey.length - 4));
  }
  return config;
}, error => {
  return Promise.reject(error);
});

// Voeg request interceptor toe voor debugging
crawlerClient.interceptors.request.use(
  config => {
    console.log(`[DEBUG] API aanroep naar: ${config.method.toUpperCase()} ${config.baseURL || ''}${config.url}`);
    return config;
  },
  error => Promise.reject(error)
);

// Add response interceptor for error handling
crawlerClient.interceptors.response.use(
  response => response,
  error => {
    if (!error.response) {
      console.error('Network error:', error.message);
      return Promise.reject(new Error('Could not connect to the crawler service'));
    }
    return Promise.reject(error);
  }
);

// Direct paden gebruiken zonder /api/crawls prefix (dat wordt al toegevoegd via baseURL)
export const CRAWLS_ENDPOINT = '';  // Leeg omdat baseURL al '/api/crawls' is
export const CRAWLS_STATUS_ENDPOINT = '/status';  // Alleen '/status' toevoegen aan baseURL

/**
 * Normalize API response
 */
const normalizeResponse = (response) => ({
  success: true,
  data: response.data,
  message: 'Operation successful'
});

/**
 * Health check functie die een aangepaste URL gebruikt om problemen met baseURL te voorkomen
 */
export const healthCheck = async () => {
  try {
    // Gebruik axios direct, niet de crawlerClient instantie met baseURL
    const response = await axios.get('/api/health');
    return normalizeResponse(response);
  } catch (error) {
    return handleError(error, 'checking service health');
  }
};

/**
 * Test crawl functie die een aangepaste URL gebruikt om problemen met baseURL te voorkomen
 * @param {Object} payload - De test crawl configuratie
 * @param {Object} options - Optionele configuratie voor de request
 * @returns {Promise<Object>} - Test crawl response
 */
export const testCrawl = async (payload, options = {}) => {
  try {
    // Gebruik axios direct, niet de crawlerClient instantie met baseURL
    const response = await axios.post('/api/crawls/test', payload, options);
    return normalizeResponse(response);
  } catch (error) {
    return handleError(error, 'performing test crawl');
  }
};

/**
 * Handle API errors
 */
const handleError = (error, operation) => {
  console.error(`Error ${operation}:`, error);
  
  const errorResponse = {
    success: false,
    data: null,
    message: error.message || `Failed to ${operation}`
  };

  if (error.response) {
    errorResponse.statusCode = error.response.status;
    errorResponse.message = error.response.data?.message || errorResponse.message;
  }

  return errorResponse;
};

/**
 * Start a new crawl job
 * 
 * @param {Object} data - The crawl job data
 * @param {string} data.projectId - The project ID
 * @param {Array<string>} data.urls - Array of URLs to crawl
 * @param {string} data.api_key - API key for the crawler service
 * @returns {Promise<Object>} - The created crawl job
 */
export const startCrawlJob = async (data) => {
  try {
    // Voor test-endpoints slaan we de API key validatie over
    if (CRAWLS_ENDPOINT === '/api/test-crawls') {
      console.log('Gebruik van test-endpoint, API key validatie overgeslagen');
      data.api_key = 'test-api-key'; // Dummy API key voor test-endpoints
    } else {
      // Normale API key validatie voor echte endpoints
      if (!data.api_key) {
        console.log('WARNING: No API key provided for crawl job!');
        throw new Error('API key is required to start a crawl job');
      }
      
      // Clean the API key by removing whitespace
      data.api_key = data.api_key.trim();
      
      if (!data.api_key) {
        throw new Error('API key cannot be empty');
      }
      
      console.log('Starting crawl job with API key present (masked):', '****' + data.api_key.substring(data.api_key.length - 4));
    }
    
    const response = await crawlerClient.post(CRAWLS_ENDPOINT, data);
    return normalizeResponse(response);
  } catch (error) {
    return handleError(error, 'starting crawl job');
  }
};

/**
 * Get details of a specific crawl job
 * 
 * @param {string} jobId - The ID of the crawl job
 * @returns {Promise<Object>} - The crawl job details
 */
export const getCrawlJobDetails = async (jobId) => {
  try {
    const response = await crawlerClient.get(`${CRAWLS_ENDPOINT}/${jobId}`);
    return normalizeResponse(response);
  } catch (error) {
    return handleError(error, `getting details for job ${jobId}`);
  }
};

/**
 * Get all active crawl jobs
 * 
 * @returns {Promise<Array<Object>>} - List of active crawl jobs
 */
export const getActiveCrawlJobs = async () => {
  try {
    const response = await crawlerClient.get(CRAWLS_STATUS_ENDPOINT);
    return normalizeResponse(response);
  } catch (error) {
    // Return empty array for 404 errors since it might mean no active jobs
    if (error.response?.status === 404) {
      return {
        success: true,
        data: [],
        message: 'No active crawl jobs found'
      };
    }
    return handleError(error, 'getting active crawl jobs');
  }
};

/**
 * Get crawl history with optional filtering
 * 
 * @param {Object} params - Query parameters
 * @param {string} [params.projectId] - Filter by project ID
 * @param {string} [params.status] - Filter by status
 * @param {number} [params.limit=10] - Number of results per page
 * @param {number} [params.page=0] - Page number
 * @returns {Promise<Array<Object>>} - List of crawl jobs
 */
export const getCrawlHistory = async (params = {}) => {
  try {
    const response = await crawlerClient.get(CRAWLS_ENDPOINT, { params });
    return normalizeResponse(response);
  } catch (error) {
    // Return empty array for 404 errors
    if (error.response?.status === 404) {
      return {
        success: true,
        data: [],
        message: 'No crawl history found'
      };
    }
    return handleError(error, 'getting crawl history');
  }
};

/**
 * Cancel an active crawl job
 * 
 * @param {string} jobId - The ID of the crawl job to cancel
 * @returns {Promise<Object>} - The cancelled job
 */
export const cancelCrawlJob = async (jobId) => {
  try {
    const response = await crawlerClient.post(`${CRAWLS_ENDPOINT}/${jobId}/cancel`);
    return normalizeResponse(response);
  } catch (error) {
    return handleError(error, `cancelling job ${jobId}`);
  }
};

// Export individual functions and client
export {
  crawlerClient,
};

export default {
  crawlerClient,
  startCrawlJob,
  getCrawlJobDetails,
  getActiveCrawlJobs,
  getCrawlHistory,
  cancelCrawlJob,
  healthCheck,
  testCrawl
};