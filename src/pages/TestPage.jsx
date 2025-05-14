import React from 'react';
import { Container, Typography, Box, Paper } from '@mui/material';
import TestScrapingBeePanel from '../components/TestScrapingBeePanel';
import { useSelector } from 'react-redux';

/**
 * Test Page
 * 
 * A simple test page that uses the TestScrapingBeePanel component to verify
 * that the ScrapingBee proxy is working correctly.
 */
const TestPage = () => {
  const isAuthenticated = useSelector((state) => state.auth.isAuthenticated);
  
  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 6 }}>
      <Paper 
        elevation={3}
        sx={{ 
          p: 3, 
          borderRadius: 2,
          background: 'linear-gradient(to right, #f5f7fa, #e9ecef)'
        }}
      >
        <Box sx={{ mb: 3 }}>
          <Typography variant="h4" component="h1" gutterBottom>
            ScrapingBee Proxy Test
          </Typography>
          <Typography variant="body1" color="text.secondary">
            This page allows you to test the ScrapingBee API proxy configuration to ensure it's working correctly.
            Use the panel below to test both the API connection and URL scraping functionality.
          </Typography>
        </Box>
        
        {isAuthenticated ? (
          <TestScrapingBeePanel />
        ) : (
          <Box sx={{ p: 3, bgcolor: 'warning.light', borderRadius: 1 }}>
            <Typography variant="body1">
              You need to be logged in to access the ScrapingBee test panel.
            </Typography>
          </Box>
        )}
        
        <Box sx={{ mt: 4 }}>
          <Typography variant="h6">How to use this test page:</Typography>
          <Box component="ol" sx={{ pl: 3 }}>
            <Box component="li" sx={{ mb: 1 }}>
              First, ensure you have configured your ScrapingBee API key in the Settings page
            </Box>
            <Box component="li" sx={{ mb: 1 }}>
              Click "Test Connection" to verify the API proxy is working correctly
            </Box>
            <Box component="li" sx={{ mb: 1 }}>
              Enter a URL and click "Test Scraping" to test the full scraping functionality
            </Box>
            <Box component="li" sx={{ mb: 1 }}>
              If successful, you should see a success message and the scraped HTML content
            </Box>
          </Box>
        </Box>
      </Paper>
    </Container>
  );
};

export default TestPage;