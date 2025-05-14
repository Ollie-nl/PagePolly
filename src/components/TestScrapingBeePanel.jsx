import React, { useState, useEffect } from 'react';
import scrapingBeeService from '../services/scrapingBeeService';
import { Card, CardHeader, CardContent, CardActions, Button, TextField, Typography, Box, Alert, CircularProgress, Divider, Chip } from '@mui/material';
import { Check as CheckIcon, Error as ErrorIcon, PlayArrow as PlayArrowIcon } from '@mui/icons-material';
import { useSelector } from 'react-redux';

/**
 * TestScrapingBeePanel Component
 * 
 * A comprehensive testing panel for verifying ScrapingBeeService functionality
 * Allows testing API connection and URL scraping to ensure the proxy is working
 */
const TestScrapingBeePanel = () => {
  // Get the API key from activeConfig in Redux state
  const activeConfig = useSelector((state) => state.settings.activeConfig);
  const apiKey = activeConfig?.api_key || '';
  
  useEffect(() => {
    console.log('Active config loaded:', activeConfig ? 'Yes' : 'No');
    console.log('API Key available:', apiKey ? 'Yes (masked: ****' + (apiKey.length > 4 ? apiKey.substring(apiKey.length - 4) : '') + ')' : 'No');
  }, [activeConfig, apiKey]);
  
  // Component state
  const [testUrl, setTestUrl] = useState('https://ferrum.audio');
  const [connectionStatus, setConnectionStatus] = useState({
    loading: false,
    success: null,
    message: '',
    credits: null,
    error: null
  });
  const [scrapeStatus, setScrapeStatus] = useState({
    loading: false,
    success: null,
    message: '',
    credits: null,
    error: null,
    html: null
  });
  const [showHtml, setShowHtml] = useState(false);

  // Reset the connection test results when API key changes
  useEffect(() => {
    setConnectionStatus({
      loading: false,
      success: null,
      message: '',
      credits: null,
      error: null
    });
  }, [apiKey]);

  /**
   * Test the connection to ScrapingBee API
   */
  const testConnection = async () => {
    if (!apiKey) {
      setConnectionStatus({
        loading: false,
        success: false,
        message: 'API key is not configured',
        credits: null,
        error: 'Please add your ScrapingBee API key in Settings'
      });
      return;
    }

    setConnectionStatus({
      loading: true,
      success: null,
      message: 'Testing connection...',
      credits: null,
      error: null
    });

    try {
      const result = await scrapingBeeService.testConnection(apiKey);
      
      setConnectionStatus({
        loading: false,
        success: result.success,
        message: result.message,
        credits: result.credits,
        error: result.error
      });
    } catch (error) {
      setConnectionStatus({
        loading: false,
        success: false,
        message: 'Test failed with exception',
        credits: null,
        error: error.message
      });
    }
  };

  /**
   * Test scraping a URL with ScrapingBee API
   */
  const testScraping = async () => {
    if (!apiKey) {
      setScrapeStatus({
        loading: false,
        success: false,
        message: 'API key is not configured',
        credits: null,
        error: 'Please add your ScrapingBee API key in Settings',
        html: null
      });
      return;
    }

    if (!testUrl) {
      setScrapeStatus({
        loading: false,
        success: false,
        message: 'URL is required',
        credits: null,
        error: 'Please enter a URL to scrape',
        html: null
      });
      return;
    }

    setScrapeStatus({
      loading: true,
      success: null,
      message: 'Scraping URL...',
      credits: null,
      error: null,
      html: null
    });

    try {
      const result = await scrapingBeeService.scrape(testUrl, apiKey);
      
      setScrapeStatus({
        loading: false,
        success: result.success,
        message: result.message,
        credits: result.credits,
        error: result.error,
        html: result.success ? result.pageSource : null
      });
    } catch (error) {
      setScrapeStatus({
        loading: false,
        success: false,
        message: 'Scraping failed with exception',
        credits: null,
        error: error.message,
        html: null
      });
    }
  };

  return (
    <Card variant="outlined" sx={{ mb: 4 }}>
      <CardHeader 
        title="ScrapingBee API Test Panel" 
        subheader="Test connectivity and scraping functionality"
        sx={{ backgroundColor: 'primary.main', color: 'primary.contrastText' }}
      />
      <CardContent>
        <Box sx={{ mb: 3 }}>
          <Typography variant="h6" gutterBottom>
            API Connection Test
          </Typography>
          <Typography variant="body2" color="text.secondary" gutterBottom>
            Test if the ScrapingBee API is accessible through the proxy
          </Typography>
          
          {/* Connection test results */}
          {connectionStatus.message && (
            <Alert 
              severity={connectionStatus.loading ? 'info' : connectionStatus.success ? 'success' : 'error'}
              sx={{ mb: 2 }}
              icon={connectionStatus.loading ? <CircularProgress size={20} /> : null}
            >
              {connectionStatus.message}
              {connectionStatus.credits !== null && (
                <Box component="span" sx={{ ml: 1 }}>
                  <Chip 
                    label={`Credits: ${connectionStatus.credits}`} 
                    size="small" 
                    color="primary" 
                    variant="outlined" 
                  />
                </Box>
              )}
              {connectionStatus.error && (
                <Typography color="error" variant="body2">
                  {connectionStatus.error}
                </Typography>
              )}
            </Alert>
          )}
          
          <Button 
            variant="contained" 
            onClick={testConnection}
            disabled={connectionStatus.loading || !apiKey}
            startIcon={connectionStatus.loading ? <CircularProgress size={20} /> : <PlayArrowIcon />}
          >
            Test Connection
          </Button>
        </Box>
        
        <Divider sx={{ my: 3 }} />
        
        <Box>
          <Typography variant="h6" gutterBottom>
            URL Scraping Test
          </Typography>
          <Typography variant="body2" color="text.secondary" gutterBottom>
            Test scraping a URL through the ScrapingBee API proxy
          </Typography>
          
          <TextField
            label="URL to scrape"
            variant="outlined"
            fullWidth
            margin="normal"
            value={testUrl}
            onChange={(e) => setTestUrl(e.target.value)}
            placeholder="Enter URL (e.g., https://example.com)"
            disabled={scrapeStatus.loading}
          />
          
          {/* Scraping test results */}
          {scrapeStatus.message && (
            <Alert 
              severity={scrapeStatus.loading ? 'info' : scrapeStatus.success ? 'success' : 'error'}
              sx={{ my: 2 }}
              icon={scrapeStatus.loading ? <CircularProgress size={20} /> : null}
            >
              {scrapeStatus.message}
              {scrapeStatus.credits !== null && (
                <Box component="span" sx={{ ml: 1 }}>
                  <Chip 
                    label={`Credits: ${scrapeStatus.credits}`} 
                    size="small" 
                    color="primary" 
                    variant="outlined" 
                  />
                </Box>
              )}
              {scrapeStatus.error && (
                <Typography color="error" variant="body2">
                  {scrapeStatus.error}
                </Typography>
              )}
            </Alert>
          )}
          
          {scrapeStatus.html && (
            <Box sx={{ mt: 2, mb: 2 }}>
              <Button 
                variant="outlined" 
                size="small"
                onClick={() => setShowHtml(!showHtml)}
              >
                {showHtml ? 'Hide HTML' : 'Show HTML'}
              </Button>
              
              {showHtml && (
                <Box 
                  sx={{ 
                    mt: 2,
                    p: 2, 
                    maxHeight: '300px', 
                    overflow: 'auto',
                    backgroundColor: 'grey.100',
                    borderRadius: 1,
                    fontFamily: 'monospace',
                    fontSize: '0.8rem'
                  }}
                >
                  <pre style={{ margin: 0, whiteSpace: 'pre-wrap', wordWrap: 'break-word' }}>
                    {scrapeStatus.html}
                  </pre>
                </Box>
              )}
            </Box>
          )}
        </Box>
      </CardContent>
      
      <CardActions>
        <Button 
          variant="contained" 
          color="secondary"
          onClick={testScraping}
          disabled={scrapeStatus.loading || !apiKey || !testUrl}
          startIcon={scrapeStatus.loading ? <CircularProgress size={20} /> : <PlayArrowIcon />}
        >
          Test Scraping
        </Button>
        
        {/* Status indicators */}
        <Box sx={{ display: 'flex', alignItems: 'center', ml: 'auto' }}>
          <Typography variant="body2" color="text.secondary" sx={{ mr: 1 }}>
            Proxy status:
          </Typography>
          {connectionStatus.success === true ? (
            <Chip 
              icon={<CheckIcon />} 
              label="Connected" 
              color="success" 
              size="small"
              variant="outlined" 
            />
          ) : connectionStatus.success === false ? (
            <Chip 
              icon={<ErrorIcon />} 
              label="Failed" 
              color="error" 
              size="small"
              variant="outlined" 
            />
          ) : (
            <Chip 
              label="Not tested" 
              size="small"
              variant="outlined" 
            />
          )}
        </Box>
      </CardActions>
    </Card>
  );
};

export default TestScrapingBeePanel;