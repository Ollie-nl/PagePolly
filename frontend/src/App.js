// src/App.js
import React from 'react';
import { Routes, Route, Link } from 'react-router-dom';
import { AppBar, Toolbar, Typography, Container, Box, Button } from '@mui/material';
import Dashboard from './components/Dashboard';
import Sites from './components/Sites';

function App() {
  return (
    <div className="app">
      <AppBar position="static">
        <Toolbar>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            PagePolly
          </Typography>
          <Button color="inherit" component={Link} to="/">
            Dashboard
          </Button>
          <Button color="inherit" component={Link} to="/sites">
            Sites
          </Button>
        </Toolbar>
      </AppBar>

      <Container className="app-main">
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/sites" element={<Sites />} />
        </Routes>
      </Container>
    </div>
  );
}

export default App;