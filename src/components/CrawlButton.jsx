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
import puppeteerCrawlerApi from '../api/puppeteerCrawlerApi';

const CrawlButton = ({ vendorId, vendorUrl, onCrawlComplete }) => {
  const [open, setOpen] = useState(false);
  const [crawlMethod, setCrawlMethod] = useState('puppeteer');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [puppeteerSettings, setPuppeteerSettings] = useState({
    simulateHumanBehavior: true,
    useProxy: false,
    maxRetries: 3,
    waitTime: 2000,
    maxDepth: 2
  });

  const settings = useSelector(state => state.settings.activeConfig);
  const apiKey = settings?.api_key?.trim() || '';

  const handleOpen = () => setOpen(true);
  const handleClose = () => {
    setOpen(false);
    setError(null);
    setSuccess(null);
  };

  const handleStartCrawl = async () => {
    try {
      console.log('Start crawl aangevraagd met settings:', puppeteerSettings);
      console.log('Vendor URL die wordt gebruikt:', vendorUrl);
      
      setLoading(true);
      setError(null);
      setSuccess(null);

      // Controleer of er een vendor URL is
      if (!vendorUrl) {
        throw new Error('Geen vendor URL beschikbaar voor crawl');
      }

      // API crawling methode vereist een API key
      if (crawlMethod === 'api' && !apiKey) {
        throw new Error('API key is vereist voor de API crawling methode');
      }

      // Verschillende crawl methodes
      if (crawlMethod === 'puppeteer') {
        console.log('Start Puppeteer crawl met opties:', {
          vendorId,
          startUrls: [vendorUrl],
          maxDepth: puppeteerSettings.maxDepth,
          stealthMode: puppeteerSettings.simulateHumanBehavior
        });

        // Gebruik de puppeteerCrawlerApi voor consistentie
        const result = await puppeteerCrawlerApi.startCrawl(vendorId, {
          startUrls: [vendorUrl], // Belangrijke toevoeging: geef de vendorUrl mee
          maxDepth: puppeteerSettings.maxDepth || 2,
          maxPages: 50,
          stealthMode: puppeteerSettings.simulateHumanBehavior,
          useProxy: puppeteerSettings.useProxy,
          waitTime: puppeteerSettings.waitTime,
          maxRetries: puppeteerSettings.maxRetries
        });

        console.log('Crawl gestart met resultaat:', result);
        setSuccess('Puppeteer crawl gestart!');
        onCrawlComplete?.({
          status: 'running',
          message: 'Puppeteer crawl is gestart'
        });
      } else {
        // API crawl methode - behouden zoals het was
        const { data: { user } } = await supabaseClient.auth.getUser();

        const response = await fetch('/api/crawls', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            vendorId,
            crawlerType: 'api',
            startUrls: [vendorUrl], 
            settings: {
              apiKey
            },
            userId: user?.email || 'anonymous'
          })
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || 'Kon de crawl niet starten');
        }

        const data = await response.json();
        console.log('Crawl gestart:', data);
        setSuccess('API crawl gestart!');
        onCrawlComplete?.(data);
      }

      handleClose();
    } catch (err) {
      console.error('Fout bij starten crawl:', err);
      setError(`Fout bij starten crawl: ${err.message || 'Onbekende fout'}`);
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
        <DialogTitle>Crawl Configureren</DialogTitle>
        <DialogContent>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}
          {success && (
            <Alert severity="success" sx={{ mb: 2 }}>
              {success}
            </Alert>
          )}

          <Box sx={{ mb: 3 }}>
            <Typography variant="subtitle2" gutterBottom>
              Crawling Methode
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
            Annuleren
          </Button>
          <Button
            onClick={handleStartCrawl}
            variant="contained"
            disabled={loading}
            startIcon={loading ? <CircularProgress size={20} /> : null}
          >
            {loading ? 'Bezig met starten...' : 'Start Crawl'}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default CrawlButton;