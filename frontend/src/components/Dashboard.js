// src/components/Dashboard.js
import React, { useState, useEffect } from 'react';
import { Grid, Paper, Typography, Box } from '@mui/material';
import CrawlQueue from './CrawlQueue';
import { fetchDashboardStats } from '../services/api';

function Dashboard() {
  const [stats, setStats] = useState({
    totalSites: 0,
    activeCrawls: 0,
    totalPages: 0,
    lastCrawl: null,
  });

  useEffect(() => {
    const loadStats = async () => {
      const data = await fetchDashboardStats();
      setStats(data);
    };
    loadStats();
  }, []);

  return (
    <Box sx={{ py: 4 }}>
      <Typography variant="h4" gutterBottom>
        Dashboard
      </Typography>
      
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Paper sx={{ p: 2, textAlign: 'center' }}>
            <Typography variant="h6">Total Sites</Typography>
            <Typography variant="h4">{stats.totalSites}</Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Paper sx={{ p: 2, textAlign: 'center' }}>
            <Typography variant="h6">Active Crawls</Typography>
            <Typography variant="h4">{stats.activeCrawls}</Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Paper sx={{ p: 2, textAlign: 'center' }}>
            <Typography variant="h6">Total Pages</Typography>
            <Typography variant="h4">{stats.totalPages}</Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Paper sx={{ p: 2, textAlign: 'center' }}>
            <Typography variant="h6">Last Crawl</Typography>
            <Typography variant="body1">
              {stats.lastCrawl ? new Date(stats.lastCrawl).toLocaleString() : 'N/A'}
            </Typography>
          </Paper>
        </Grid>
      </Grid>

      <Typography variant="h5" gutterBottom>
        Active Crawls
      </Typography>
      <CrawlQueue />
    </Box>
  );
}

export default Dashboard;