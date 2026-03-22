// TestCrawler.jsx
import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  Alert,
  LinearProgress,
  Paper
} from '@mui/material';
import PuppeteerCrawlOption from './PuppeteerCrawlOption';
import supabaseClient from '../lib/supabaseClient';
import { crawlerClient } from '../api/crawlerApi';

const TestCrawler = () => {
  const [url, setUrl] = useState('');
  const [status, setStatus] = useState('idle');
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const [puppeteerSettings, setPuppeteerSettings] = useState({
    simulateHumanBehavior: true,
    takeScreenshots: true,
    maxRetries: 3,
    waitTime: 2000,
  });

  const handleStartTest = async () => {
    if (!url.trim()) {
      setError('Please enter a valid URL');
      return;
    }

    setError(null);
    setStatus('running');
    setResult(null);

    try {
      const { data: { session } } = await supabaseClient.auth.getSession();
      if (!session?.access_token) {
        throw new Error('Authentication required');
      }

      const response = await crawlerClient.post('/api/crawls/test', {
        url: url.trim(),
        settings: puppeteerSettings,
        user_email: session.user.email
      }, {
        headers: { 'Authorization': `Bearer ${session.access_token}` }
      });

      setResult(response.data);
      setStatus('completed');
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Test crawl failed');
      setStatus('failed');
    }
  };

  return (
    <Box sx={{ maxWidth: 800, mx: 'auto', p: 3 }}>
      <Card>
        <CardContent>
          <Typography variant="h5" gutterBottom>
            Test Crawler
          </Typography>

          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          <Box sx={{ mb: 3 }}>
            <PuppeteerCrawlOption
              settings={puppeteerSettings}
              onSettingsChange={setPuppeteerSettings}
              disabled={status === 'running'}
            />
          </Box>

          <TextField
            fullWidth
            label="URL to Test"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://example.com"
            disabled={status === 'running'}
            sx={{ mb: 3 }}
          />

          <Button
            variant="contained"
            onClick={handleStartTest}
            disabled={status === 'running'}
            sx={{ mb: 2 }}
          >
            {status === 'running' ? 'Testing...' : 'Start Test'}
          </Button>

          {status === 'running' && (
            <Box sx={{ width: '100%', mb: 2 }}>
              <LinearProgress />
            </Box>
          )}

          {result && (
            <Paper sx={{ p: 2, mt: 2 }}>
              <Typography variant="h6" gutterBottom>
                Test Results
              </Typography>

              {result.screenshot && (
                <Box sx={{ mb: 2 }}>
                  <Typography variant="subtitle2" gutterBottom>Screenshot:</Typography>
                  <img
                    src={result.screenshot}
                    alt="Page Screenshot"
                    style={{ maxWidth: '100%', height: 'auto' }}
                  />
                </Box>
              )}

              <Typography variant="subtitle2" gutterBottom>Page Data:</Typography>
              <pre style={{
                overflow: 'auto',
                padding: '1rem',
                background: '#f5f5f5',
                borderRadius: '4px'
              }}>
                {JSON.stringify(result.data, null, 2)}
              </pre>
            </Paper>
          )}
        </CardContent>
      </Card>
    </Box>
  );
};

export default TestCrawler;
