// CrawlerInterface.jsx
import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import {
  Box,
  Button,
  Card,
  CardContent,
  TextField,
  Typography,
  LinearProgress,
  Alert,
  Stack,
  List,
  ListItem,
  ListItemText,
  Chip,
  Divider,
  IconButton,
  Grid,
  Paper,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  FormControlLabel,
  Switch
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  ExpandMore as ExpandMoreIcon,
  Refresh as RefreshIcon,
  CancelOutlined as CancelIcon
} from '@mui/icons-material';
import { useDispatch, useSelector } from 'react-redux';
import { 
  startCrawl,
  getCrawlHistory,
  getCrawlDetails,
  cancelCrawl,
  clearCrawlState
} from '../../store/reducers/crawlSlice';
import PuppeteerCrawlOption from '../PuppeteerCrawlOption';

const CrawlerInterface = ({ projectId }) => {
  const dispatch = useDispatch();
  const [urls, setUrls] = useState(['']);
  const [error, setError] = useState('');
  const [usePuppeteer, setUsePuppeteer] = useState(false);
  const [puppeteerSettings, setPuppeteerSettings] = useState({
    simulateHumanBehavior: true,
    useProxy: false,
    takeScreenshots: true,
    maxRetries: 3,
    waitTime: 2000,
  });
  
  const crawlState = useSelector((state) => state.crawl);
  const { activeJob, history, selectedJob, loading } = crawlState;
  
  const settings = useSelector(state => state.settings);
  const activeConfig = settings?.activeConfig;
  const apiKey = activeConfig?.api_key?.trim() || '';

  useEffect(() => {
    dispatch(getCrawlHistory({ projectId }));
    
    return () => {
      dispatch(clearCrawlState());
    };
  }, [dispatch, projectId]);

  useEffect(() => {
    let interval;
    
    if (activeJob && activeJob.id && (activeJob.status === 'pending' || activeJob.status === 'running')) {
      interval = setInterval(() => {
        dispatch(getCrawlDetails(activeJob.id));
      }, 5000);
    }
    
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [dispatch, activeJob]);

  const handleUrlChange = (index, value) => {
    const newUrls = [...urls];
    newUrls[index] = value;
    setUrls(newUrls);
  };

  const addUrlField = () => {
    setUrls([...urls, '']);
  };

  const removeUrlField = (index) => {
    const newUrls = [...urls];
    newUrls.splice(index, 1);
    setUrls(newUrls);
  };

  const handleStartCrawl = () => {
    const validUrls = urls.filter(url => url.trim() !== '');
    
    if (validUrls.length === 0) {
      setError('Please enter at least one valid URL');
      return;
    }
    
    if (!apiKey && !usePuppeteer) {
      setError('Missing API key. Please configure API settings first.');
      return;
    }
    
    setError('');
    
    const payload = {
      projectId,
      urls: validUrls,
      crawlerType: usePuppeteer ? 'puppeteer' : 'api',
      settings: usePuppeteer ? puppeteerSettings : { api_key: apiKey }
    };
    
    dispatch(startCrawl(payload));
  };

  const handleCancelCrawl = () => {
    if (activeJob) {
      dispatch(cancelCrawl(activeJob.id));
    }
  };

  const handleViewJobDetails = (jobId) => {
    dispatch(getCrawlDetails(jobId));
  };

  const handleRefreshHistory = () => {
    dispatch(getCrawlHistory({ projectId }));
  };

  const handlePuppeteerSettingsChange = (newSettings) => {
    setPuppeteerSettings(newSettings);
  };

  const renderStatusChip = (status) => {
    const colors = {
      pending: 'warning',
      running: 'info',
      completed: 'success',
      failed: 'error',
      cancelled: 'default'
    };
    return <Chip label={status} color={colors[status] || 'default'} size="small" />;
  };

  return (
    <Box>
      <Card sx={{ mb: 4 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Start New Crawl
          </Typography>
          
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}
          
          <Stack spacing={2}>
            <FormControlLabel
              control={
                <Switch
                  checked={usePuppeteer}
                  onChange={(e) => setUsePuppeteer(e.target.checked)}
                  disabled={loading}
                />
              }
              label="Use Puppeteer Crawler"
            />

            {usePuppeteer && (
              <PuppeteerCrawlOption
                settings={puppeteerSettings}
                onSettingsChange={handlePuppeteerSettingsChange}
                disabled={loading}
              />
            )}

            {urls.map((url, index) => (
              <Box key={index} sx={{ display: 'flex', alignItems: 'center' }}>
                <TextField
                  fullWidth
                  label={`URL ${index + 1}`}
                  value={url}
                  onChange={(e) => handleUrlChange(index, e.target.value)}
                  placeholder="https://example.com"
                  disabled={loading}
                  variant="outlined"
                  size="small"
                />
                <IconButton 
                  onClick={() => removeUrlField(index)} 
                  disabled={urls.length === 1 || loading}
                  sx={{ ml: 1 }}
                >
                  <DeleteIcon />
                </IconButton>
              </Box>
            ))}
            
            <Box>
              <Button 
                startIcon={<AddIcon />} 
                onClick={addUrlField}
                disabled={loading}
                size="small"
              >
                Add URL
              </Button>
            </Box>
            
            <Box>
              <Button 
                variant="contained" 
                onClick={handleStartCrawl}
                disabled={loading || (activeJob && (activeJob.status === 'pending' || activeJob.status === 'running'))}
              >
                Start Crawling
              </Button>
            </Box>
          </Stack>
        </CardContent>
      </Card>

      {/* Rest of the component remains the same */}
      {/* ... Active Job Card ... */}
      {/* ... Selected Job Card ... */}
      {/* ... History Card ... */}
    </Box>
  );
};

export default CrawlerInterface;