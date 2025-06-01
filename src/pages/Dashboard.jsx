import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchVendors } from '../store/reducers/vendorSlice';
import { getActiveCrawls, getCrawlHistory } from '../store/reducers/crawlSlice';
import { 
  Box, 
  Grid, 
  Card, 
  CardContent, 
  Typography, 
  LinearProgress, 
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Tooltip,
  Button
} from '@mui/material';
import { formatDistance } from 'date-fns';
import { nl } from 'date-fns/locale';

function Dashboard() {
  const dispatch = useDispatch();
  const { items: vendors = [] } = useSelector((state) => state.vendors || {});
  const { activeCrawls = [], history = [] } = useSelector((state) => state.crawls || {});
  console.log('Dashboard: activeCrawls uit Redux store:', activeCrawls);
  const [stats, setStats] = useState({
    totalVendors: 0,
    crawledVendors: 0,
    totalCrawls: 0,
    completedCrawls: 0,
    averageResponseTime: 0,
    totalPages: 0
  });

  useEffect(() => {
    // Fetch required data for the dashboard
    dispatch(fetchVendors());
    dispatch(getActiveCrawls());
    dispatch(getCrawlHistory());

    // Set up polling for active crawl jobs status
    const intervalId = setInterval(() => {
      dispatch(getActiveCrawls());
      dispatch(getCrawlHistory());
    }, 5000);

    return () => clearInterval(intervalId);
  }, [dispatch]);

  // Calculate statistics
  useEffect(() => {
    if (vendors.length > 0) {
      // Calculate basic stats based on vendors and crawl data
      const completedJobs = Array.isArray(history) 
        ? history.filter(job => job.status === 'completed') 
        : [];
      
      // Bereken gemiddelde responstijd (als beschikbaar)
      let avgResponseTime = 0;
      if (completedJobs.length > 0) {
        const totalTime = completedJobs.reduce((sum, job) => {
          const duration = job.endTime && job.startTime 
            ? new Date(job.endTime) - new Date(job.startTime) 
            : 0;
          return sum + duration;
        }, 0);
        avgResponseTime = totalTime / completedJobs.length;
      }
      
      // Bereken totaal aantal pagina's (als beschikbaar)
      const totalPages = completedJobs.reduce((sum, job) => {
        return sum + (job.stats?.pagesProcessed || 0);
      }, 0);
      
      setStats({
        totalVendors: vendors.length,
        crawledVendors: completedJobs.length > 0 ? Math.min(vendors.length, completedJobs.length) : 0,
        totalCrawls: Array.isArray(history) ? history.length : 0,
        completedCrawls: completedJobs.length,
        averageResponseTime: avgResponseTime || 0,
        totalPages: totalPages || 0
      });
    }
  }, [vendors, history]);
  
  // Hulpfuncties voor formatteren
  const formatRelativeDate = (dateString) => {
    if (!dateString) return 'Onbekend';
    const date = new Date(dateString);
    return formatDistance(date, new Date(), { addSuffix: true, locale: nl });
  };

  // Helper functie voor het formatteren van status chips met juiste kleuren
  const getStatusChip = (status) => {
    const statusConfig = {
      'pending': { label: 'In afwachting', color: 'default' },
      'running': { label: 'Actief', color: 'primary' },
      'completed': { label: 'Voltooid', color: 'success' },
      'failed': { label: 'Mislukt', color: 'error' },
      'stopped': { label: 'Gestopt', color: 'warning' }
    };
    
    const config = statusConfig[status] || { label: status, color: 'default' };
    
    return (
      <Chip 
        label={config.label} 
        color={config.color} 
        size="small" 
        variant="outlined"
        sx={{ fontWeight: 500 }}
      />
    );
  };

  // Helper function voor het formatteren van tijd in seconden naar leesbare notatie
  const formatDuration = (seconds) => {
    if (!seconds && seconds !== 0) return 'N/A';
    
    if (seconds < 60) return `${seconds} sec`;
    
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    
    if (minutes < 60) {
      return `${minutes}m ${remainingSeconds}s`;
    }
    
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    
    return `${hours}u ${remainingMinutes}m ${remainingSeconds}s`;
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>Dashboard</Typography>
      
      {/* Statistieken */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={4}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>Totaal aantal vendors</Typography>
              <Typography variant="h5">{stats.totalVendors}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={4}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>Totaal aantal crawls</Typography>
              <Typography variant="h5">{stats.totalCrawls}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={4}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>Voltooide crawls</Typography>
              <Typography variant="h5">{stats.completedCrawls}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={4}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>Pagina's verwerkt</Typography>
              <Typography variant="h5">{stats.totalPages}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={4}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>Gemiddelde verwerkingstijd</Typography>
              <Typography variant="h5">
                {stats.averageResponseTime ? (stats.averageResponseTime / 1000).toFixed(1) + ' sec' : 'N/A'}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={4}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>Vendors gecrawld</Typography>
              <Typography variant="h5">{stats.crawledVendors} / {stats.totalVendors}</Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Actieve Crawl Jobs */}
      <Typography variant="h5" gutterBottom sx={{ mt: 4 }}>Actieve Crawl Jobs</Typography>
      {Array.isArray(activeCrawls) && activeCrawls.length > 0 ? (
        activeCrawls.map((crawl) => (
          <Card sx={{ mb: 3 }} key={crawl.sessionId || `job-${Math.random()}`}>
            <CardContent>
              {/* Crawl info header */}
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6">
                  Vendor ID: {crawl.vendorId}
                </Typography>
                <Chip 
                  label={crawl.activityStatus || crawl.status} 
                  color={
                    crawl.activityStatus === 'Actief bezig' ? 'success' : 
                    crawl.activityStatus === 'Recent actief' ? 'info' :
                    crawl.activityStatus === 'Mogelijk vastgelopen' ? 'warning' :
                    crawl.activityStatus === 'Voltooid' ? 'secondary' : 
                    crawl.activityStatus === 'Mislukt' ? 'error' : 'default'
                  } 
                  size="medium"
                  sx={{ fontWeight: 'bold' }}
                />
              </Box>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Sessie ID: {crawl.sessionId}
              </Typography>

              {/* Crawl parameters section */}
              <Typography variant="subtitle2" sx={{ mt: 2, mb: 1, fontWeight: 'bold' }}>
                Crawl parameters
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6} md={3}>
                  <Typography variant="body2">
                    <span style={{ fontWeight: 'bold' }}>Start URLs:</span> {crawl.startUrls ? crawl.startUrls.join(', ') : 'Onbekend'}
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <Typography variant="body2">
                    <span style={{ fontWeight: 'bold' }}>Max diepte:</span> {crawl.maxDepth || 'Onbekend'}
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <Typography variant="body2">
                    <span style={{ fontWeight: 'bold' }}>Max pagina's:</span> {crawl.maxPages || 'Onbekend'}
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <Typography variant="body2">
                    <span style={{ fontWeight: 'bold' }}>Stealth modus:</span> {crawl.stealthMode ? 'Aan' : 'Uit'}
                  </Typography>
                </Grid>
              </Grid>

              {/* Voortgang section */}
              <Typography variant="subtitle2" sx={{ mt: 2, mb: 1, fontWeight: 'bold' }}>
                Voortgang
              </Typography>
              <LinearProgress 
                variant="determinate" 
                value={crawl.progress} 
                sx={{ height: 10, borderRadius: 5, mb: 1, 
                  '& .MuiLinearProgress-bar': {
                    animation: crawl.status === 'running' ? 'pulse 1.5s ease-in-out infinite' : 'none',
                    '@keyframes pulse': {
                      '0%': { opacity: 1 },
                      '50%': { opacity: 0.7 },
                      '100%': { opacity: 1 },
                    },
                  }
                }} 
              />
              <Box sx={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 1 }}>
                <Typography variant="body2">
                  <b>Voltooid:</b> {crawl.progress}%
                </Typography>
                <Typography variant="body2">
                  <b>Pagina's gecrawld:</b> {crawl.pagesCrawled} / {crawl.maxPages}
                </Typography>
                <Typography variant="body2">
                  <b>Huidige diepte:</b> {crawl.currentDepth} / {crawl.maxDepth}
                </Typography>
                <Tooltip title={crawl.currentUrl || 'Geen URL actief'}>
                  <Typography variant="body2" noWrap sx={{ maxWidth: '100%' }}>
                    <b>Huidige URL:</b> {crawl.currentUrl ? crawl.currentUrl : 'Geen'}
                  </Typography>
                </Tooltip>
              </Box>

              {/* Voeg activiteitsinformatie toe */}
              <Box sx={{ mt: 1, mb: 2 }}>
                <Typography variant="body2">
                  <b>Actief voor:</b> {formatDuration(crawl.duration)} 
                  {crawl.timeSinceLastActivity && (
                    <span> (laatste activiteit: {formatDuration(crawl.timeSinceLastActivity)} geleden)</span>
                  )}
                </Typography>
              </Box>

              {/* Errors */}
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="body2">
                  <span style={{ fontWeight: 'bold' }}>Fouten:</span> {crawl.errors || 0}
                </Typography>
                {crawl.status === 'running' && (
                  <Button 
                    variant="outlined" 
                    color="error" 
                    size="small"
                    onClick={() => dispatch(stopCrawl(crawl.sessionId))}
                  >
                    Stop Crawl
                  </Button>
                )}
              </Box>
            </CardContent>
          </Card>
        ))
      ) : (
        <Paper sx={{ p: 3, textAlign: 'center', bgcolor: 'grey.100' }}>
          <Typography variant="body1">Geen actieve crawl jobs</Typography>
          <Typography variant="body2" color="textSecondary" sx={{ mt: 1 }}>
            Start een nieuwe crawl om de voortgang hier te zien
          </Typography>
        </Paper>
      )}

      {/* Recente Crawl Geschiedenis */}
      <Typography variant="h5" gutterBottom sx={{ mt: 4 }}>Recente Crawl Geschiedenis</Typography>
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Vendor</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Gestart</TableCell>
              <TableCell>Voltooid</TableCell>
              <TableCell>Pagina's</TableCell>
              <TableCell>Duur</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {Array.isArray(history) && history.length > 0 ? (
              history.slice(0, 15).map((job) => (
                <TableRow key={job.id}>
                  <TableCell>{job.vendorName || job.vendorId || 'Onbekend'}</TableCell>
                  <TableCell>{getStatusChip(job.status)}</TableCell>
                  <TableCell>{formatRelativeDate(job.startTime)}</TableCell>
                  <TableCell>{job.endTime ? formatRelativeDate(job.endTime) : '-'}</TableCell>
                  <TableCell>{job.stats?.pagesProcessed || 0}</TableCell>
                  <TableCell>
                    {job.startTime && job.endTime ? (
                      `${((new Date(job.endTime) - new Date(job.startTime)) / 1000).toFixed(1)} sec`
                    ) : '-'}
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={6} align="center">
                  Geen crawl geschiedenis beschikbaar
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
}

export default Dashboard;