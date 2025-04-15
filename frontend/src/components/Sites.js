// src/components/Sites.js
import React, { useState } from 'react';
import { Box, Button, Typography, Dialog, DialogTitle, DialogContent, DialogActions, TextField } from '@mui/material';
import SiteList from './SiteList';
import { addSite } from '../services/api';

function Sites() {
  const [open, setOpen] = useState(false);
  const [newSite, setNewSite] = useState({ url: '', crawlFrequency: '24' });
  const [error, setError] = useState('');

  const handleClickOpen = () => setOpen(true);
  const handleClose = () => {
    setOpen(false);
    setError('');
    setNewSite({ url: '', crawlFrequency: '24' });
  };

  const handleSubmit = async () => {
    try {
      await addSite(newSite);
      handleClose();
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <Box sx={{ py: 4 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
        <Typography variant="h4">Sites Management</Typography>
        <Button variant="contained" color="primary" onClick={handleClickOpen}>
          Add New Site
        </Button>
      </Box>

      <SiteList />

      <Dialog open={open} onClose={handleClose}>
        <DialogTitle>Add New Site</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Site URL"
            type="url"
            fullWidth
            value={newSite.url}
            onChange={(e) => setNewSite({ ...newSite, url: e.target.value })}
            error={!!error}
            helperText={error}
          />
          <TextField
            margin="dense"
            label="Crawl Frequency (hours)"
            type="number"
            fullWidth
            value={newSite.crawlFrequency}
            onChange={(e) => setNewSite({ ...newSite, crawlFrequency: e.target.value })}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose}>Cancel</Button>
          <Button onClick={handleSubmit} variant="contained">Add</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

export default Sites;