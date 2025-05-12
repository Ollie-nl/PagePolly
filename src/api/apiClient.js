import axios from 'axios';
import supabaseClient from '../lib/supabaseClient';

// Create Axios instance with default config
const apiClient = axios.create({
  baseURL: import.meta.env.VITE_SUPABASE_URL,
  timeout: 30000, // 30 seconds timeout
  headers: {
    'Content-Type': 'application/json',
    'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY
  }
});

// Request interceptor for adding auth token
apiClient.interceptors.request.use(
  config => {
    const session = supabaseClient.auth.getSession();
    if (session?.access_token) {
      config.headers['Authorization'] = `Bearer ${session.access_token}`;
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
    
    if (response) {
      // Extract error message from Supabase response
      const errorMessage = response.data?.error?.message || response.data?.message || 'An error occurred';
      
      switch (response.status) {
        case 401:
          console.error('Authentication error:', errorMessage);
          break;
          
        case 403:
          console.error('Permission denied:', errorMessage);
          break;
          
        case 404:
          console.error('Resource not found:', errorMessage);
          break;
          
        case 500:
          console.error('Server error:', errorMessage);
          break;
          
        default:
          console.error('API error:', errorMessage);
      }
    } else {
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
  }
};

export default api;