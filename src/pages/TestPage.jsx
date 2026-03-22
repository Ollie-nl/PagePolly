import React from 'react';
import { Container, Typography, Box, Paper } from '@mui/material';
import TestCrawler from '../components/TestCrawler';

const TestPage = () => {
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
            Crawler Test
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Test the Puppeteer crawler with any URL to verify it is working correctly.
          </Typography>
        </Box>

        <TestCrawler />
      </Paper>
    </Container>
  );
};

export default TestPage;
