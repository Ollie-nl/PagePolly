import React from 'react';
import { useParams } from 'react-router-dom';
import { 
  Container, 
  Typography, 
  Box, 
  Paper,
  Breadcrumbs,
  Link
} from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';
import CrawlerInterface from '../../components/crawler/CrawlerInterface';

const CrawlerPage = () => {
  const { projectId } = useParams();

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 8 }}>
      <Box sx={{ mb: 4 }}>
        <Breadcrumbs aria-label="breadcrumb">
          <Link component={RouterLink} to="/" underline="hover" color="inherit">
            Dashboard
          </Link>
          <Typography color="text.primary">Web Crawler</Typography>
        </Breadcrumbs>
      </Box>

      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Web Crawler
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Scan websites to extract content, structure, and screenshots using the ScrapingBee API.
        </Typography>
      </Box>

      <Paper elevation={0} sx={{ p: 3, bgcolor: 'background.paper' }}>
        <CrawlerInterface projectId={projectId} />
      </Paper>
    </Container>
  );
};

export default CrawlerPage;