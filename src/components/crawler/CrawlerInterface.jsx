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

const CrawlerInterface = ({ projectId }) => {
  const dispatch = useDispatch();
  const [urls, setUrls] = useState(['']);
  const [error, setError] = useState('');
  
  const crawlState = useSelector((state) => state.crawl);
  const { activeJob, history, selectedJob, loading } = crawlState;

  // Load crawl history when component mounts
  useEffect(() => {
    dispatch(getCrawlHistory({ projectId }));
    
    // Cleanup when the component unmounts
    return () => {
      dispatch(clearCrawlState());
    };
  }, [dispatch, projectId]);

  // Poll for updates if there's an active job
  useEffect(() => {
    let interval;
    
    if (activeJob && (activeJob.status === 'pending' || activeJob.status === 'running')) {
      interval = setInterval(() => {
        dispatch(getCrawlDetails(activeJob.id));
      }, 5000); // Poll every 5 seconds
    }
    
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [dispatch, activeJob]);

  // Handle URL input changes
  const handleUrlChange = (index, value) => {
    const newUrls = [...urls];
    newUrls[index] = value;
    setUrls(newUrls);
  };

  // Add a new URL input field
  const addUrlField = () => {
    setUrls([...urls, '']);
  };

  // Remove a URL input field
  const removeUrlField = (index) => {
    const newUrls = [...urls];
    newUrls.splice(index, 1);
    setUrls(newUrls);
  };

  // Start crawling
  const handleStartCrawl = () => {
    // Validate URLs
    const validUrls = urls.filter(url => url.trim() !== '');
    
    if (validUrls.length === 0) {
      setError('Please enter at least one valid URL');
      return;
    }
    
    // Clear any previous errors
    setError('');
    
    // Dispatch the start crawl action
    dispatch(startCrawl({
      projectId,
      urls: validUrls
    }));
  };

  // Cancel crawling
  const handleCancelCrawl = () => {
    if (activeJob) {
      dispatch(cancelCrawl(activeJob.id));
    }
  };

  // View details of a job
  const handleViewJobDetails = (jobId) => {
    dispatch(getCrawlDetails(jobId));
  };

  // Refresh crawl history
  const handleRefreshHistory = () => {
    dispatch(getCrawlHistory({ projectId }));
  };

  // Render job status chip
  const renderStatusChip = (status) => {
    let color;
    switch(status) {
      case 'pending':
        color = 'warning';
        break;
      case 'running':
        color = 'info';
        break;
      case 'completed':
        color = 'success';
        break;
      case 'failed':
        color = 'error';
        break;
      case 'cancelled':
        color = 'default';
        break;
      default:
        color = 'default';
    }
    
    return <Chip label={status} color={color} size="small" />;
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
      
      {activeJob && (
        <Card sx={{ mb: 4 }}>
          <CardContent>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6">
                Active Crawl Job
              </Typography>
              {(activeJob.status === 'pending' || activeJob.status === 'running') && (
                <Button
                  startIcon={<CancelIcon />}
                  color="warning"
                  onClick={handleCancelCrawl}
                >
                  Cancel
                </Button>
              )}
            </Box>
            
            <Grid container spacing={2} sx={{ mb: 2 }}>
              <Grid item xs={12} sm={6}>
                <Typography variant="body2" color="text.secondary">
                  Status: {renderStatusChip(activeJob.status)}
                </Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="body2" color="text.secondary">
                  Started: {new Date(activeJob.startTime).toLocaleString()}
                </Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="body2" color="text.secondary">
                  Job ID: {activeJob.id}
                </Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="body2" color="text.secondary">
                  URLs: {activeJob.urls?.length || 'Unknown'}
                </Typography>
              </Grid>
            </Grid>
            
            {(activeJob.status === 'pending' || activeJob.status === 'running') && (
              <Box sx={{ width: '100%', mb: 2 }}>
                <Typography variant="body2" color="text.secondary">
                  Progress: {activeJob.progress || 0}%
                </Typography>
                <LinearProgress 
                  variant="determinate" 
                  value={activeJob.progress || 0} 
                  sx={{ mt: 1 }}
                />
              </Box>
            )}
          </CardContent>
        </Card>
      )}
      
      {selectedJob && selectedJob.id !== activeJob?.id && (
        <Card sx={{ mb: 4 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Job Details
            </Typography>
            
            <Grid container spacing={2} sx={{ mb: 2 }}>
              <Grid item xs={12} sm={6}>
                <Typography variant="body2" color="text.secondary">
                  Status: {renderStatusChip(selectedJob.status)}
                </Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="body2" color="text.secondary">
                  Started: {new Date(selectedJob.startTime).toLocaleString()}
                </Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="body2" color="text.secondary">
                  Job ID: {selectedJob.id}
                </Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="body2" color="text.secondary">
                  Completed: {selectedJob.completionTime ? new Date(selectedJob.completionTime).toLocaleString() : 'Not completed'}
                </Typography>
              </Grid>
            </Grid>
            
            {selectedJob.results && selectedJob.results.length > 0 && (
              <>
                <Typography variant="subtitle1" gutterBottom>
                  Results
                </Typography>
                <Box sx={{ maxHeight: 400, overflow: 'auto' }}>
                  <Accordion>
                    <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                      <Typography>Crawled URLs ({selectedJob.results.length})</Typography>
                    </AccordionSummary>
                    <AccordionDetails>
                      <List dense>
                        {selectedJob.results.map((result, index) => (
                          <ListItem key={index}>
                            <ListItemText
                              primary={result.url}
                              secondary={`Crawled at: ${new Date(result.timestamp).toLocaleString()}`}
                            />
                          </ListItem>
                        ))}
                      </List>
                    </AccordionDetails>
                  </Accordion>
                  
                  {selectedJob.results.map((result, index) => (
                    <Accordion key={index}>
                      <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                        <Typography>{result.url}</Typography>
                      </AccordionSummary>
                      <AccordionDetails>
                        <Paper variant="outlined" sx={{ p: 2, mb: 2 }}>
                          <Typography variant="subtitle2" gutterBottom>
                            Page Information:
                          </Typography>
                          <Typography variant="body2">
                            Title: {result.metadata?.title || 'N/A'}
                          </Typography>
                          <Typography variant="body2">
                            Description: {result.metadata?.description || 'N/A'}
                          </Typography>
                        </Paper>
                        
                        {result.screenshot && (
                          <Paper variant="outlined" sx={{ p: 2, mb: 2 }}>
                            <Typography variant="subtitle2" gutterBottom>
                              Screenshot:
                            </Typography>
                            <Box sx={{ overflow: 'hidden', maxHeight: 300 }}>
                              <img 
                                src={result.screenshot} 
                                alt={`Screenshot of ${result.url}`}
                                style={{ maxWidth: '100%', objectFit: 'contain' }}
                              />
                            </Box>
                          </Paper>
                        )}
                        
                        {result.structure && result.structure.length > 0 && (
                          <Paper variant="outlined" sx={{ p: 2 }}>
                            <Typography variant="subtitle2" gutterBottom>
                              Page Structure Elements:
                            </Typography>
                            <List dense sx={{ maxHeight: 200, overflow: 'auto' }}>
                              {result.structure.map((element, elemIndex) => (
                                <ListItem key={elemIndex}>
                                  <ListItemText
                                    primary={`<${element.tag}${element.id ? ` id="${element.id}"` : ''}${element.className ? ` class="${element.className}"` : ''}>`}
                                    secondary={element.text}
                                  />
                                </ListItem>
                              ))}
                            </List>
                          </Paper>
                        )}
                      </AccordionDetails>
                    </Accordion>
                  ))}
                </Box>
              </>
            )}
            
            {selectedJob.errors && selectedJob.errors.length > 0 && (
              <>
                <Typography variant="subtitle1" gutterBottom sx={{ mt: 2 }}>
                  Errors
                </Typography>
                <List dense>
                  {selectedJob.errors.map((error, index) => (
                    <ListItem key={index}>
                      <ListItemText
                        primary={error.url}
                        secondary={`Error: ${error.error} (${new Date(error.timestamp).toLocaleString()})`}
                      />
                    </ListItem>
                  ))}
                </List>
              </>
            )}
          </CardContent>
        </Card>
      )}
      
      <Card>
        <CardContent>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h6">
              Crawl History
            </Typography>
            <IconButton onClick={handleRefreshHistory} disabled={loading}>
              <RefreshIcon />
            </IconButton>
          </Box>
          
          {history && history.length > 0 ? (
            <List>
              {history.map((job) => (
                <React.Fragment key={job.id}>
                  <ListItem
                    button
                    onClick={() => handleViewJobDetails(job.id)}
                    selected={selectedJob?.id === job.id}
                  >
                    <ListItemText
                      primary={
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          {renderStatusChip(job.status)}
                          <Typography variant="body2" sx={{ ml: 1 }}>
                            {new Date(job.startTime).toLocaleString()}
                          </Typography>
                        </Box>
                      }
                      secondary={`URLs: ${job.urlCount}, Results: ${job.resultsCount}, Errors: ${job.errorsCount}`}
                    />
                  </ListItem>
                  <Divider />
                </React.Fragment>
              ))}
            </List>
          ) : (
            <Typography variant="body2" color="text.secondary">
              No crawl history found
            </Typography>
          )}
        </CardContent>
      </Card>
    </Box>
  );
};

export default CrawlerInterface;