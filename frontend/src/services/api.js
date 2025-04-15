// src/services/api.js
import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001/api/v1';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const fetchDashboardStats = async () => {
  try {
    const response = await api.get('/stats');
    return response.data;
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    return {
      totalSites: 0,
      activeCrawls: 0,
      totalPages: 0,
      lastCrawl: null,
    };
  }
};

export const fetchSites = async () => {
  try {
    const response = await api.get('/sites');
    return response.data;
  } catch (error) {
    console.error('Error fetching sites:', error);
    return [];
  }
};

export const addSite = async (siteData) => {
  const response = await api.post('/sites', siteData);
  return response.data;
};

export const deleteSite = async (siteId) => {
  const response = await api.delete(`/sites/${siteId}`);
  return response.data;
};

export const startCrawl = async (siteId) => {
  const response = await api.post(`/crawl/${siteId}`);
  return response.data;
};

export const fetchActiveCrawls = async () => {
  try {
    const response = await api.get('/crawl/active');
    return response.data;
  } catch (error) {
    console.error('Error fetching active crawls:', error);
    return [];
  }
};