import React from 'react';
import { Routes, Route, Link } from 'react-router-dom';
import { AppBar, Toolbar, Typography, Container, Box, Button } from '@mui/material';

function Dashboard() {
  return (
    <Box>
      <Typography variant="h4">Dashboard</Typography>
      <Typography>Welcome to PagePolly Dashboard</Typography>
    </Box>
  );
}

function Sites() {
  return (
    <Box>
      <Typography variant="h4">Sites Management</Typography>
      <Typography>Manage your crawling sites here</Typography>
    </Box>
  );
}

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