import axios from 'axios';

// Default base URL - use a relative URL for production builds
const baseURL = '/api';

// Create Axios instance
const apiClient = axios.create({
  baseURL,
  timeout: 30000, // 30 seconds timeout
  headers: {
    'Content-Type': 'application/json',
  }
});

// Request interceptor for adding auth token
apiClient.interceptors.request.use(
  config => {
    // When we implement authentication, we can add token here
    const token = localStorage.getItem('auth_token');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  error => {
    return Promise.reject(error);
  }
);

// Response interceptor for handling common errors
apiClient.interceptors.response.use(
  response => {
    return response;
  },
  error => {
    const { response } = error;
    
    // Handle specific error codes
    if (response) {
      switch (response.status) {
        case 401:
          // Unauthorized - clear token and redirect to login (when implemented)
          localStorage.removeItem('auth_token');
          console.error('Session expired. Please log in again.');
          break;
          
        case 403:
          // Forbidden
          console.error('You do not have permission to perform this action');
          break;
          
        case 404:
          // Not found
          console.error('The requested resource was not found');
          break;
          
        case 500:
          // Server error
          console.error('Internal server error');
          break;
          
        default:
          // Other errors
          console.error('An error occurred', response.data);
      }
    } else {
      // Network error
      console.error('Network error. Please check your connection');
    }
    
    return Promise.reject(error);
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
  },
  
  // Configure API base URL (e.g., for different environments)
  setBaseURL: (url) => {
    baseURL = url;
    apiClient.defaults.baseURL = url;
  }
};

export default api;