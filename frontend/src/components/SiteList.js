// src/components/SiteList.js
import React, { useState, useEffect } from 'react';
import { 
  Paper, 
  Table, 
  TableBody, 
  TableCell, 
  TableContainer, 
  TableHead, 
  TableRow,
  IconButton,
  Chip
} from '@mui/material';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import DeleteIcon from '@mui/icons-material/Delete';
import { fetchSites, deleteSite, startCrawl } from '../services/api';

function SiteList() {
  const [sites, setSites] = useState([]);

  useEffect(() => {
    loadSites();
  }, []);

  const loadSites = async () => {
    const data = await fetchSites();
    setSites(data);
  };

  const handleStartCrawl = async (siteId) => {
    try {
      await startCrawl(siteId);
      loadSites(); // Refresh the list
    } catch (error) {
      console.error('Failed to start crawl:', error);
    }
  };

  const handleDelete = async (siteId) => {
    if (window.confirm('Are you sure you want to delete this site?')) {
      try {
        await deleteSite(siteId);
        loadSites(); // Refresh the list
      } catch (error) {
        console.error('Failed to delete site:', error);
      }
    }
  };

  return (
    <TableContainer component={Paper}>
      <Table>
        <TableHead>
          <TableRow>
            <TableCell>URL</TableCell>
            <TableCell>Status</TableCell>
            <TableCell>Last Crawl</TableCell>
            <TableCell>Crawl Frequency</TableCell>
            <TableCell>Actions</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {sites.map((site) => (
            <TableRow key={site.id}>
              <TableCell>{site.url}</TableCell>
              <TableCell>
                <Chip 
                  label={site.status} 
                  color={site.status === 'active' ? 'success' : 'default'} 
                  size="small" 
                />
              </TableCell>
              <TableCell>
                {site.lastCrawl ? new Date(site.lastCrawl).toLocaleString() : 'Never'}
              </TableCell>
              <TableCell>{site.crawlFrequency} hours</TableCell>
              <TableCell>
                <IconButton onClick={() => handleStartCrawl(site.id)} color="primary">
                  <PlayArrowIcon />
                </IconButton>
                <IconButton onClick={() => handleDelete(site.id)} color="error">
                  <DeleteIcon />
                </IconButton>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
}

export default SiteList;