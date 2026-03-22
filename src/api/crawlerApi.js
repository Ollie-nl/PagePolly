import axios from 'axios';
import axiosRetry from 'axios-retry';
import supabaseClient from '../lib/supabaseClient';

const crawlerClient = axios.create({
  baseURL: import.meta.env.VITE_CRAWLER_API_URL || '',
  timeout: 30000,
  headers: { 'Content-Type': 'application/json' }
});

axiosRetry(crawlerClient, {
  retries: 3,
  retryDelay: (retryCount) => retryCount * 1000,
  retryCondition: (error) =>
    axiosRetry.isNetworkOrIdempotentRequestError(error) ||
    error.response?.status === 503
});

crawlerClient.interceptors.request.use(
  async (config) => {
    const { data: { session } } = await supabaseClient.auth.getSession();
    if (session?.access_token) {
      config.headers['Authorization'] = `Bearer ${session.access_token}`;
    }
    return config;
  },
  error => Promise.reject(error)
);

crawlerClient.interceptors.response.use(
  response => response,
  error => {
    if (!error.response) {
      return Promise.reject(new Error('Could not connect to the crawler service'));
    }
    return Promise.reject(error);
  }
);

const BASE_ENDPOINT = '/api/crawls';

const normalizeResponse = (response) => ({
  success: true,
  data: response.data,
  message: 'Operation successful'
});

const handleError = (error, operation) => {
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

export const startCrawlJob = async (data) => {
  try {
    const response = await crawlerClient.post(BASE_ENDPOINT, data);
    return normalizeResponse(response);
  } catch (error) {
    return handleError(error, 'starting crawl job');
  }
};

export const getCrawlJobDetails = async (jobId) => {
  try {
    const response = await crawlerClient.get(`${BASE_ENDPOINT}/${jobId}`);
    return normalizeResponse(response);
  } catch (error) {
    return handleError(error, `getting details for job ${jobId}`);
  }
};

export const getActiveCrawlJobs = async () => {
  try {
    const response = await crawlerClient.get(`${BASE_ENDPOINT}/status`);
    return normalizeResponse(response);
  } catch (error) {
    if (error.response?.status === 404) {
      return { success: true, data: [], message: 'No active crawl jobs found' };
    }
    return handleError(error, 'getting active crawl jobs');
  }
};

export const getCrawlHistory = async (params = {}) => {
  try {
    const response = await crawlerClient.get(BASE_ENDPOINT, { params });
    return normalizeResponse(response);
  } catch (error) {
    if (error.response?.status === 404) {
      return { success: true, data: [], message: 'No crawl history found' };
    }
    return handleError(error, 'getting crawl history');
  }
};

export const cancelCrawlJob = async (jobId) => {
  try {
    const response = await crawlerClient.post(`${BASE_ENDPOINT}/${jobId}/cancel`);
    return normalizeResponse(response);
  } catch (error) {
    return handleError(error, `cancelling job ${jobId}`);
  }
};

export { crawlerClient };

export default {
  crawlerClient,
  startCrawlJob,
  getCrawlJobDetails,
  getActiveCrawlJobs,
  getCrawlHistory,
  cancelCrawlJob
};
