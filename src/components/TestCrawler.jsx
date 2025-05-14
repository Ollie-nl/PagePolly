// TestCrawler.jsx
import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  FormControl,
  FormControlLabel,
  RadioGroup,
  Radio,
  Alert,
  LinearProgress,
  Paper
} from '@mui/material';
import { useSelector } from 'react-redux';
import PuppeteerCrawlOption from './PuppeteerCrawlOption';
import supabaseClient from '../lib/supabaseClient';
import { crawlerClient } from '../api/crawlerApi';

const TestCrawler = () => {
  const [url, setUrl] = useState('');
  const [crawlMethod, setCrawlMethod] = useState('puppeteer');
  const [status, setStatus] = useState('idle');
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [progress, setProgress] = useState(0);
  
  const [puppeteerSettings, setPuppeteerSettings] = useState({
    simulateHumanBehavior: true,
    useProxy: false,
    takeScreenshots: true,
    maxRetries: 3,
    waitTime: 2000,
  });
  
  const settings = useSelector(state => state.settings.activeConfig);
  const apiKey = settings?.api_key?.trim() || '';

  const handleStartTest = async () => {
    if (!url.trim()) {
      setError('Please enter a valid URL');
      return;
    }

    if (crawlMethod === 'api' && !apiKey) {
      setError('API key is required for API crawling method');
      return;
    }

    setError(null);
    setStatus('running');
    setProgress(0);
    setResult(null);

    try {
      // First check if services are healthy
      const healthCheck = await crawlerClient.get('/api/health');
      
      if (!healthCheck.data.success) {
        if (healthCheck.data.services?.puppeteer?.status === 'degraded') {
          throw new Error('Crawler service is temporarily degraded. Please try again in a few moments.');
        }
        throw new Error(healthCheck.data.message || 'Service health check failed');
      }
      
      if (healthCheck.data.services?.puppeteer?.metrics?.responseTime > 5000) {
        console.warn('Crawler service response time is high:', healthCheck.data.services.puppeteer.metrics.responseTime);
      }

      const { data: { user } } = await supabaseClient.auth.getUser();
      if (!user?.email) {
        throw new Error('Authentication required');
      }
      
      // Get auth token for request
      const { data: { session } } = await supabaseClient.auth.getSession();
      if (!session?.access_token) {
        throw new Error('Authentication token required');
      }

      const payload = {
        url: url.trim(),
        method: crawlMethod,
        settings: crawlMethod === 'puppeteer' ? puppeteerSettings : { api_key: apiKey },
        user_email: user.email
      };

      try {
        // Use crawlerClient with retry logic
        const response = await crawlerClient.post('/api/crawls/test', payload, {
          headers: {
            'Authorization': `Bearer ${session.access_token}`
          },
          // Add retry configuration
          retry: 3,
          retryDelay: 1000,
          retryCondition: (error) => {
            return error.response?.status === 503 || !error.response;
          }
        });

        setResult(response.data);
        setStatus('completed');
        setProgress(100);
      } catch (error) {
        console.error('Test crawl failed:', error);
        setError(error.message || 'Test crawl failed');
        setStatus('failed');
      }
    } catch (err) {
      console.error('Test crawl failed:', err);
      setError(err.message);
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

          <FormControl component="fieldset" sx={{ mb: 3 }}>
            <Typography variant="subtitle2" gutterBottom>
              Crawling Method
            </Typography>
            <RadioGroup
              row
              value={crawlMethod}
              onChange={(e) => setCrawlMethod(e.target.value)}
            >
              <FormControlLabel 
                value="puppeteer" 
                control={<Radio />} 
                label="Puppeteer" 
              />
              <FormControlLabel 
                value="api" 
                control={<Radio />} 
                label="API" 
              />
            </RadioGroup>
          </FormControl>

          {crawlMethod === 'puppeteer' && (
            <Box sx={{ mb: 3 }}>
              <PuppeteerCrawlOption
                settings={puppeteerSettings}
                onSettingsChange={setPuppeteerSettings}
                disabled={status === 'running'}
              />
            </Box>
          )}

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
              <LinearProgress variant="determinate" value={progress} />
            </Box>
          )}

          {result && (
            <Paper sx={{ p: 2, mt: 2 }}>
              <Typography variant="h6" gutterBottom>
                Test Results
              </Typography>
              
              {result.screenshot && (
                <Box sx={{ mb: 2 }}>
                  <Typography variant="subtitle2" gutterBottom>
                    Screenshot:
                  </Typography>
                  <img 
                    src={result.screenshot} 
                    alt="Page Screenshot" 
                    style={{ maxWidth: '100%', height: 'auto' }}
                  />
                </Box>
              )}

              <Typography variant="subtitle2" gutterBottom>
                Page Data:
              </Typography>
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