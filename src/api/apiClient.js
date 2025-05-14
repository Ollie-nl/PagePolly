import axios from 'axios';
import supabaseClient from '../lib/supabaseClient';

// Utility functions for retry logic
const wait = (ms) => new Promise(resolve => setTimeout(resolve, ms));
const getRetryDelay = (retryCount) => Math.min(1000 * Math.pow(2, retryCount), 10000);

// Create Axios instance with default config
const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '',
  timeout: 60000, // Increased timeout to 60 seconds
  headers: {
    'Content-Type': 'application/json',
    'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY
  },
  validateStatus: function (status) {
    return (status >= 200 && status < 300) || status === 503; // Allow 503 for retry logic
  }
});

// Request interceptor for adding auth token
apiClient.interceptors.request.use(
  async (config) => {
    const { data: { session } } = await supabaseClient.auth.getSession();
    if (session?.access_token) {
      config.headers['Authorization'] = `Bearer ${session.access_token}`;
    }
    return config;
  },
  error => {
    return Promise.reject(error);
  }
);

// Response interceptor with retry logic
apiClient.interceptors.response.use(
  response => response,
  async error => {
    const { config, response } = error;
    
    // Initialize retry count
    config.retryCount = config.retryCount || 0;
    
    // Log the error details
    console.error(`API Error [${config.url}] [Attempt ${config.retryCount + 1}]:`, {
      status: response?.status,
      data: response?.data,
      error: error.message
    });
    
    // Determine if we should retry
    const shouldRetry = (
      // Only retry on specific status codes
      (response?.status === 503 || !response) &&
      // Maximum 3 retries
      config.retryCount < 3
    );
    
    if (shouldRetry) {
      config.retryCount += 1;
      const delay = getRetryDelay(config.retryCount);
      
      console.log(`Retrying request [${config.url}] in ${delay}ms...`);
      await wait(delay);
      
      // Make a new request with the same config
      return apiClient(config);
    }
    
    // Extract error message
    const errorMessage = 
      response?.data?.error?.message ||
      response?.data?.message ||
      error.message ||
      'An unexpected error occurred';
    
    // Enhance error object
    const enhancedError = new Error(errorMessage);
    enhancedError.status = response?.status;
    enhancedError.data = response?.data;
    enhancedError.config = config;
    
    return Promise.reject(enhancedError);
  }
);

// API method wrappers for consistent error handling
const api = {
  // Generic request method
  request: (method, url, data = null, config = {}) => {
    return apiClient({
      method,
      url,
      data,
      ...config
    });
  },
  
  // Specific HTTP methods
  get: (url, config = {}) => {
    return apiClient.get(url, config);
  },
  
  post: (url, data = null, config = {}) => {
    return apiClient.post(url, data, config);
  },
  
  put: (url, data = null, config = {}) => {
    return apiClient.put(url, data, config);
  },
  
  patch: (url, data = null, config = {}) => {
    return apiClient.patch(url, data, config);
  },
  
  delete: (url, config = {}) => {
    return apiClient.delete(url, config);
  }
};

export default api;