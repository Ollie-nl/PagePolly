// src/pages/TestCrawlerPage.jsx
import React from 'react';
import { Box, Typography } from '@mui/material';
import TestCrawler from '../components/TestCrawler';

const TestCrawlerPage = () => {
  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Test Crawler
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Test crawling capabilities with both Puppeteer and API methods on any URL.
      </Typography>
      <TestCrawler />
    </Box>
  );
};

export default TestCrawlerPage;