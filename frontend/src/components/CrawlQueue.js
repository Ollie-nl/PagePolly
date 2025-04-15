// src/components/CrawlQueue.js
import React, { useState, useEffect } from 'react';
import { 
  Paper, 
  Table, 
  TableBody, 
  TableCell, 
  TableContainer, 
  TableHead, 
  TableRow,
  LinearProgress,
  Typography,
  Box
} from '@mui/material';
import { fetchActiveCrawls } from '../services/api';

function CrawlQueue() {
  const [crawls, setCrawls] = useState([]);

  useEffect(() => {
    const loadCrawls = async () => {
      const data = await fetchActiveCrawls();
      setCrawls(data);
    };

    loadCrawls();
    const interval = setInterval(loadCrawls, 5000); // Refresh every 5 seconds
    return () => clearInterval(interval);
  }, []);

  return (
    <TableContainer component={Paper}>
      <Table>
        <TableHead>
          <TableRow>
            <TableCell>Site</TableCell>
            <TableCell>Started</TableCell>
            <TableCell>Pages Crawled</TableCell>
            <TableCell>Progress</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {crawls.map((crawl) => (
            <TableRow key={crawl.id}>
              <TableCell>{crawl.siteUrl}</TableCell>
              <TableCell>{new Date(crawl.startTime).toLocaleString()}</TableCell>
              <TableCell>{crawl.pagesCrawled}</TableCell>
              <TableCell>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <Box sx={{ width: '100%', mr: 1 }}>
                    <LinearProgress variant="determinate" value={crawl.progress} />
                  </Box>
                  <Box sx={{ minWidth: 35 }}>
                    <Typography variant="body2" color="text.secondary">
                      {Math.round(crawl.progress)}%
                    </Typography>
                  </Box>
                </Box>
              </TableCell>
            </TableRow>
          ))}
          {crawls.length === 0 && (
            <TableRow>
              <TableCell colSpan={4} align="center">
                No active crawls
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </TableContainer>
  );
}

export default CrawlQueue;