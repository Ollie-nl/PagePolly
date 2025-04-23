// src/api/crawlerApi.js
import apiClient from './apiClient';

/**
 * API Client for Crawler Service
 * This module handles all the API calls to the crawler backend service
 */

const BASE_ENDPOINT = '/api/crawls';

/**
 * Start a new crawl job
 * 
 * @param {Object} data - The crawl job data
 * @param {string} data.projectId - The project ID
 * @param {Array<string>} data.urls - Array of URLs to crawl
 * @returns {Promise<Object>} - The created crawl job
 */
export const startCrawlJob = async (data) => {
  try {
    const response = await apiClient.post(BASE_ENDPOINT, data);
    return response.data;
  } catch (error) {
    console.error('Error starting crawl job:', error);
    throw error;
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
    const response = await apiClient.get(`${BASE_ENDPOINT}/${jobId}`);
    return response.data;
  } catch (error) {
    console.error(`Error getting details for job ${jobId}:`, error);
    throw error;
  }
};

/**
 * Get all active crawl jobs
 * 
 * @returns {Promise<Array<Object>>} - List of active crawl jobs
 */
export const getActiveCrawlJobs = async () => {
  try {
    const response = await apiClient.get(`${BASE_ENDPOINT}/status`);
    return response.data;
  } catch (error) {
    console.error('Error getting active crawl jobs:', error);
    throw error;
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
    const response = await apiClient.get(BASE_ENDPOINT, { params });
    return response.data;
  } catch (error) {
    console.error('Error getting crawl history:', error);
    throw error;
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
    const response = await apiClient.post(`${BASE_ENDPOINT}/${jobId}/cancel`);
    return response.data;
  } catch (error) {
    console.error(`Error cancelling job ${jobId}:`, error);
    throw error;
  }
};

export default {
  startCrawlJob,
  getCrawlJobDetails,
  getActiveCrawlJobs,
  getCrawlHistory,
  cancelCrawlJob
};