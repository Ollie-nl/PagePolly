import React, { useState, useEffect } from 'react';
import { 
  Container, 
  Typography, 
  Paper, 
  Box, 
  Table, 
  TableBody, 
  TableCell, 
  TableContainer, 
  TableHead, 
  TableRow,
  CircularProgress,
  Alert,
  Pagination,
  FormControl,
  InputLabel,
  Select,
  MenuItem
} from '@mui/material';
import supabaseClient from '../lib/supabaseClient';

const ErrorLogs = () => {
  const [loading, setLoading] = useState(true);
  const [errorLogs, setErrorLogs] = useState([]);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [logType, setLogType] = useState('all');
  const logsPerPage = 10;

  // Mock data for initial display
  const mockErrorLogs = [
    { id: 1, timestamp: new Date().toISOString(), service: 'Puppeteer Crawler', message: 'Connection error: 503 Service Unavailable', details: 'Failed to connect to example.com after 3 retries' },
    { id: 2, timestamp: new Date().toISOString(), service: 'API Crawler', message: 'Authentication failed', details: 'Invalid API key provided for service' },
  ];

  useEffect(() => {
    // In a real implementation, we would fetch actual logs from the server
    // For now, we'll use mock data to demonstrate the UI
    const fetchLogs = async () => {
      try {
        setLoading(true);
        // This is where we would normally call an API endpoint to get logs
        // For example:
        // const { data, error } = await supabaseClient
        //   .from('error_logs')
        //   .select('*')
        //   .order('timestamp', { ascending: false })
        //   .range((page - 1) * logsPerPage, page * logsPerPage - 1);
        
        // if (error) throw error;
        
        // For now, we'll just use our mock data
        setTimeout(() => {
          setErrorLogs(mockErrorLogs);
          setLoading(false);
        }, 500);
      } catch (err) {
        console.error('Error fetching error logs:', err);
        setError(err.message);
        setLoading(false);
      }
    };

    fetchLogs();
  }, [page, logType]);

  const handlePageChange = (event, value) => {
    setPage(value);
  };

  const handleLogTypeChange = (event) => {
    setLogType(event.target.value);
    setPage(1);
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Typography variant="h4" gutterBottom component="h1">
        Error Logs
      </Typography>
      
      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'flex-end' }}>
        <FormControl sx={{ minWidth: 200 }}>
          <InputLabel id="log-type-select-label">Log Type</InputLabel>
          <Select
            labelId="log-type-select-label"
            id="log-type-select"
            value={logType}
            label="Log Type"
            onChange={handleLogTypeChange}
          >
            <MenuItem value="all">All Logs</MenuItem>
            <MenuItem value="puppeteer">Puppeteer Crawler</MenuItem>
            <MenuItem value="api">API Crawler</MenuItem>
            <MenuItem value="server">Server</MenuItem>
          </Select>
        </FormControl>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          Error fetching logs: {error}
        </Alert>
      )}

      <Paper sx={{ width: '100%', mb: 2, overflow: 'hidden' }}>
        <TableContainer sx={{ maxHeight: 440 }}>
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
              <CircularProgress />
            </Box>
          ) : (
            <Table stickyHeader aria-label="error logs table">
              <TableHead>
                <TableRow>
                  <TableCell>Timestamp</TableCell>
                  <TableCell>Service</TableCell>
                  <TableCell>Message</TableCell>
                  <TableCell>Details</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {errorLogs.length > 0 ? (
                  errorLogs.map((log) => (
                    <TableRow key={log.id} hover>
                      <TableCell>{new Date(log.timestamp).toLocaleString()}</TableCell>
                      <TableCell>{log.service}</TableCell>
                      <TableCell>{log.message}</TableCell>
                      <TableCell sx={{ maxWidth: 300, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {log.details}
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={4} align="center">
                      No error logs found
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </TableContainer>
        
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 2 }}>
          <Pagination 
            count={Math.ceil(30 / logsPerPage)} // In reality, this would be calculated from the total count of logs
            page={page}
            onChange={handlePageChange}
            color="primary" 
          />
        </Box>
      </Paper>
      
      <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
        This page displays error logs from various services in the system. In a production environment, these logs would be fetched from the database or a log aggregation service.
      </Typography>
    </Container>
  );
};

export default ErrorLogs;