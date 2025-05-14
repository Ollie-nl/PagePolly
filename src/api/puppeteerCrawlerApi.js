// src/api/puppeteerCrawlerApi.js
import { supabase } from '../lib/supabaseClient';

/**
 * API wrapper for the Puppeteer enhanced crawler endpoints
 */
class PuppeteerCrawlerAPI {
  
  /**
   * Get the authorization header with JWT token
   * @returns {Promise<Object>} - Headers object with authorization
   */
  async getAuthHeaders() {
    const { data } = await supabase.auth.getSession();
    const session = data.session;
    
    if (!session) {
      throw new Error('User not authenticated');
    }
    
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${session.access_token}`
    };
  }

  /**
   * Create a new crawl job using the enhanced Puppeteer crawler
   * @param {string} vendorId - Vendor ID
   * @param {Array<string>} urls - URLs to crawl
   * @param {Object} settings - Optional crawler settings
   * @returns {Promise<Object>} - Job creation response
   */
  async createCrawlJob(vendorId, urls, settings = {}) {
    const headers = await this.getAuthHeaders();
    
    const response = await fetch('/api/puppeteer-crawls', {
      method: 'POST',
      headers,
      body: JSON.stringify({
        vendorId,
        urls,
        settings
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || errorData.message || 'Failed to create crawl job');
    }

    return response.json();
  }

  /**
   * Get details about a specific crawl job
   * @param {string} jobId - ID of the job to retrieve
   * @returns {Promise<Object>} - Job details
   */
  async getCrawlJob(jobId) {
    const headers = await this.getAuthHeaders();
    
    const response = await fetch(`/api/puppeteer-crawls/${jobId}`, {
      method: 'GET',
      headers
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || errorData.message || 'Failed to retrieve crawl job');
    }

    return response.json();
  }

  /**
   * Get the detailed results of a completed crawl job
   * @param {string} jobId - ID of the completed job
   * @returns {Promise<Object>} - Job results
   */
  async getCrawlResults(jobId) {
    const headers = await this.getAuthHeaders();
    
    const response = await fetch(`/api/puppeteer-crawls/${jobId}/results`, {
      method: 'GET',
      headers
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || errorData.message || 'Failed to retrieve crawl results');
    }

    return response.json();
  }

  /**
   * Cancel an active crawl job
   * @param {string} jobId - ID of the job to cancel
   * @returns {Promise<Object>} - Cancellation response
   */
  async cancelCrawlJob(jobId) {
    const headers = await this.getAuthHeaders();
    
    const response = await fetch(`/api/puppeteer-crawls/${jobId}/cancel`, {
      method: 'POST',
      headers
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || errorData.message || 'Failed to cancel crawl job');
    }

    return response.json();
  }

  /**
   * Get all active crawl jobs for the current user
   * @returns {Promise<Array>} - List of active jobs
   */
  async getActiveCrawlJobs() {
    const headers = await this.getAuthHeaders();
    
    const response = await fetch('/api/puppeteer-crawls/status', {
      method: 'GET',
      headers
    });

    if (!response.ok) {
      if (response.status === 404) {
        return []; // No active jobs is not an error
      }
      const errorData = await response.json();
      throw new Error(errorData.error || errorData.message || 'Failed to retrieve active crawl jobs');
    }

    return response.json();
  }

  /**
   * Get crawl history for the current user with pagination
   * @param {Object} filters - Optional filters and pagination
   * @param {string} filters.vendorId - Filter by vendor ID
   * @param {string} filters.status - Filter by status
   * @param {number} filters.page - Page number (0-indexed)
   * @param {number} filters.limit - Number of items per page
   * @returns {Promise<Array>} - Crawl history
   */
  async getCrawlHistory(filters = {}) {
    const headers = await this.getAuthHeaders();
    
    // Build query string from filters
    const queryParams = new URLSearchParams();
    if (filters.vendorId) queryParams.append('vendorId', filters.vendorId);
    if (filters.status) queryParams.append('status', filters.status);
    if (filters.page !== undefined) queryParams.append('page', filters.page.toString());
    if (filters.limit !== undefined) queryParams.append('limit', filters.limit.toString());
    
    const queryString = queryParams.toString() ? `?${queryParams.toString()}` : '';
    
    const response = await fetch(`/api/puppeteer-crawls${queryString}`, {
      method: 'GET',
      headers
    });

    if (!response.ok) {
      if (response.status === 404) {
        return []; // No history is not an error
      }
      const errorData = await response.json();
      throw new Error(errorData.error || errorData.message || 'Failed to retrieve crawl history');
    }

    return response.json();
  }

  /**
   * Get vendor-specific configuration
   * @param {string} vendorId - Vendor ID
   * @returns {Promise<Object>} - Vendor configuration
   */
  async getVendorConfig(vendorId) {
    const headers = await this.getAuthHeaders();
    
    const response = await fetch(`/api/puppeteer-crawls/vendors/${vendorId}/config`, {
      method: 'GET',
      headers
    });

    if (!response.ok) {
      if (response.status === 404) {
        return null; // No config is not an error
      }
      const errorData = await response.json();
      throw new Error(errorData.error || errorData.message || 'Failed to retrieve vendor configuration');
    }

    return response.json();
  }

  /**
   * Update vendor-specific configuration
   * @param {string} vendorId - Vendor ID
   * @param {Object} config - Configuration object
   * @returns {Promise<Object>} - Updated vendor configuration
   */
  async updateVendorConfig(vendorId, config) {
    const headers = await this.getAuthHeaders();
    
    const response = await fetch(`/api/puppeteer-crawls/vendors/${vendorId}/config`, {
      method: 'PUT',
      headers,
      body: JSON.stringify({ config })
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || errorData.message || 'Failed to update vendor configuration');
    }

    return response.json();
  }
}

// Export a singleton instance
export default new PuppeteerCrawlerAPI();