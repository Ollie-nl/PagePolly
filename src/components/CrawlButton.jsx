// CrawlButton.jsx
import React, { useState } from 'react';
import {
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  FormControlLabel,
  RadioGroup,
  Radio,
  Typography,
  Box,
  CircularProgress,
  Alert
} from '@mui/material';
import { useSelector } from 'react-redux';
import PuppeteerCrawlOption from './PuppeteerCrawlOption';
import supabaseClient from '../lib/supabaseClient';

const CrawlButton = ({ vendorId, onCrawlComplete }) => {
  const [open, setOpen] = useState(false);
  const [crawlMethod, setCrawlMethod] = useState('puppeteer');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [puppeteerSettings, setPuppeteerSettings] = useState({
    simulateHumanBehavior: true,
    useProxy: false,
    takeScreenshots: true,
    maxRetries: 3,
    waitTime: 2000,
  });

  const settings = useSelector(state => state.settings.activeConfig);
  const apiKey = settings?.api_key?.trim() || '';

  const handleOpen = () => setOpen(true);
  const handleClose = () => {
    setOpen(false);
    setError(null);
  };

  const handleStartCrawl = async () => {
    if (crawlMethod === 'api' && !apiKey) {
      setError('API key is required for API crawling method');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const { data: { user } } = await supabaseClient.auth.getUser();
      
      const response = await fetch('/api/crawls', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          vendorId,
          method: crawlMethod,
          settings: crawlMethod === 'puppeteer' ? puppeteerSettings : { api_key: apiKey },
          user_email: user.email
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      onCrawlComplete?.(data);
      handleClose();
    } catch (err) {
      console.error('Crawl failed:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Button
        variant="contained"
        color="primary"
        onClick={handleOpen}
        size="small"
      >
        Crawl
      </Button>

      <Dialog
        open={open}
        onClose={handleClose}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Configure Crawl</DialogTitle>
        <DialogContent>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          <Box sx={{ mb: 3 }}>
            <Typography variant="subtitle2" gutterBottom>
              Crawling Method
            </Typography>
            <FormControl component="fieldset">
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
          </Box>

          {crawlMethod === 'puppeteer' && (
            <PuppeteerCrawlOption
              settings={puppeteerSettings}
              onSettingsChange={setPuppeteerSettings}
              disabled={loading}
            />
          )}
        </DialogContent>
        
        <DialogActions>
          <Button onClick={handleClose} disabled={loading}>
            Cancel
          </Button>
          <Button
            onClick={handleStartCrawl}
            variant="contained"
            disabled={loading}
            startIcon={loading ? <CircularProgress size={20} /> : null}
          >
            {loading ? 'Starting...' : 'Start Crawl'}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default CrawlButton;