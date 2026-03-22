// CrawlerInterface.jsx
import React, { useState, useEffect } from 'react';
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
  Paper,
  Accordion,
  AccordionSummary,
  AccordionDetails
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
  const [puppeteerSettings, setPuppeteerSettings] = useState({
    simulateHumanBehavior: true,
    takeScreenshots: true,
    maxRetries: 3,
    waitTime: 2000,
  });

  const crawlState = useSelector((state) => state.crawl);
  const { activeJob, history, selectedJob, loading } = crawlState;

  useEffect(() => {
    dispatch(getCrawlHistory({ projectId }));
    return () => {
      dispatch(clearCrawlState());
    };
  }, [dispatch, projectId]);

  useEffect(() => {
    let interval;
    if (activeJob?.id && ['pending', 'running'].includes(activeJob.status)) {
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

  const addUrlField = () => setUrls([...urls, '']);

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
    setError('');
    dispatch(startCrawl({
      projectId,
      urls: validUrls,
      crawlerType: 'puppeteer',
      settings: puppeteerSettings
    }));
  };

  const handleCancelCrawl = () => {
    if (activeJob) dispatch(cancelCrawl(activeJob.id));
  };

  const handleViewJobDetails = (jobId) => {
    dispatch(getCrawlDetails(jobId));
  };

  const handleRefreshHistory = () => {
    dispatch(getCrawlHistory({ projectId }));
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
            <PuppeteerCrawlOption
              settings={puppeteerSettings}
              onSettingsChange={setPuppeteerSettings}
              disabled={loading}
            />

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
                disabled={loading || (activeJob && ['pending', 'running'].includes(activeJob.status))}
              >
                Start Crawling
              </Button>
            </Box>
          </Stack>
        </CardContent>
      </Card>

      {activeJob && (
        <Card sx={{ mb: 4 }}>
          <CardContent>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6">Active Job</Typography>
              {renderStatusChip(activeJob.status)}
            </Box>
            <LinearProgress
              variant="determinate"
              value={activeJob.progress || 0}
              sx={{ mb: 1 }}
            />
            <Typography variant="body2" color="text.secondary">
              {activeJob.progress || 0}% complete
            </Typography>
            {['pending', 'running'].includes(activeJob.status) && (
              <Button
                startIcon={<CancelIcon />}
                onClick={handleCancelCrawl}
                color="error"
                size="small"
                sx={{ mt: 2 }}
              >
                Cancel
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      {history && history.length > 0 && (
        <Card>
          <CardContent>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6">Crawl History</Typography>
              <Button startIcon={<RefreshIcon />} onClick={handleRefreshHistory} size="small">
                Refresh
              </Button>
            </Box>
            <List>
              {history.map((job, index) => (
                <React.Fragment key={job.id}>
                  {index > 0 && <Divider />}
                  <ListItem
                    secondaryAction={
                      <Button size="small" onClick={() => handleViewJobDetails(job.id)}>
                        Details
                      </Button>
                    }
                  >
                    <ListItemText
                      primary={<Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>{renderStatusChip(job.status)}</Box>}
                      secondary={new Date(job.startTime).toLocaleString()}
                    />
                  </ListItem>
                </React.Fragment>
              ))}
            </List>
          </CardContent>
        </Card>
      )}
    </Box>
  );
};

export default CrawlerInterface;
