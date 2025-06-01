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
  Paper
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
        activeCrawls.map((job) => (
          <Card sx={{ mb: 3 }} key={job.sessionId || `job-${Math.random()}`}>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                <Box>
                  <Typography variant="h6">
                    {job.vendorId ? `Vendor ID: ${job.vendorId}` : 'Onbekende vendor'}
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    Sessie ID: {job.sessionId}
                  </Typography>
                </Box>
                <Box>
                  {getStatusChip(job.status)}
                </Box>
              </Box>
              
              <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle2">Crawl parameters:</Typography>
                  <Box sx={{ ml: 2, mt: 1 }}>
                    <Typography variant="body2" color="textSecondary">
                      Start URL(s): {job.startUrls ? job.startUrls.join(', ') : 'Onbekend'}
                    </Typography>
                    <Typography variant="body2" color="textSecondary">
                      Max diepte: {job.maxDepth || 'Onbekend'}
                    </Typography>
                    <Typography variant="body2" color="textSecondary">
                      Max pagina's: {job.maxPages || 'Onbekend'}
                    </Typography>
                    <Typography variant="body2" color="textSecondary">
                      Stealth modus: {job.stealthMode ? 'Ja' : 'Nee'}
                    </Typography>
                    <Typography variant="body2" color="textSecondary">
                      Gestart: {formatRelativeDate(job.startTime)}
                    </Typography>
                    <Typography variant="body2" color="textSecondary">
                      Looptijd: {job.duration ? `${job.duration} seconden` : 'Bezig...'}
                    </Typography>
                  </Box>
                </Grid>
                
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle2">Voortgang:</Typography>
                  <Box sx={{ mt: 1 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <Typography variant="body2" color="textSecondary">
                        {job.progress ? `${Math.round(job.progress)}%` : 'Bezig...'}
                      </Typography>
                      <Typography variant="body2" color="textSecondary">
                        Pagina's: {job.pagesCrawled || 0} / {job.maxPages || 'onbeperkt'}
                      </Typography>
                    </Box>
                    <LinearProgress 
                      variant={job.progress ? "determinate" : "indeterminate"} 
                      value={job.progress ? job.progress : 0} 
                      sx={{ mt: 1, mb: 2, height: 10, borderRadius: 1 }}
                    />
                    
                    <Typography variant="body2" color="textSecondary">
                      Huidige diepte: {job.currentDepth !== undefined ? job.currentDepth : 0} / {job.maxDepth || 'onbeperkt'}
                    </Typography>
                    
                    <Typography variant="body2" color="textSecondary" sx={{ mt: 1 }}>
                      <strong>Huidige URL:</strong> {job.currentUrl || 'Wachten...'}
                    </Typography>
                  </Box>
                  
                  {job.statistics && (
                    <Box sx={{ mt: 2 }}>
                      <Typography variant="subtitle2">Statistieken:</Typography>
                      <Grid container spacing={1} sx={{ mt: 0.5 }}>
                        <Grid item xs={6}>
                          <Typography variant="body2" color="textSecondary">
                            Unieke links: {job.statistics.uniqueLinks || 0}
                          </Typography>
                        </Grid>
                        <Grid item xs={6}>
                          <Typography variant="body2" color="textSecondary">
                            Interne links: {job.statistics.internalLinks || 0}
                          </Typography>
                        </Grid>
                        <Grid item xs={6}>
                          <Typography variant="body2" color="textSecondary">
                            Externe links: {job.statistics.externalLinks || 0}
                          </Typography>
                        </Grid>
                        <Grid item xs={6}>
                          <Typography variant="body2" color="textSecondary">
                            Gem. verwerking: {job.avgProcessingTime ? `${job.avgProcessingTime} sec` : 'N/A'}
                          </Typography>
                        </Grid>
                      </Grid>
                    </Box>
                  )}
                </Grid>
                
                {job.recentUrls && job.recentUrls.length > 0 && (
                  <Grid item xs={12}>
                    <Typography variant="subtitle2">Recent bezochte URLs:</Typography>
                    <Box sx={{ mt: 1, bgcolor: '#f5f5f5', p: 1.5, borderRadius: 1, maxHeight: 100, overflowY: 'auto' }}>
                      {job.recentUrls.map((url, index) => (
                        <Typography key={index} variant="body2" sx={{ wordBreak: 'break-all', fontSize: '0.8rem', mb: 0.5 }}>
                          • {url}
                        </Typography>
                      ))}
                    </Box>
                  </Grid>
                )}
                
                {job.errors > 0 && (
                  <Grid item xs={12}>
                    <Typography variant="subtitle2" color="error">
                      Fouten: {job.errors}
                    </Typography>
                  </Grid>
                )}
              </Grid>
            </CardContent>
          </Card>
        ))
      ) : (
        <Card sx={{ mb: 4 }}>
          <CardContent>
            <Typography>Geen actieve crawl jobs</Typography>
          </CardContent>
        </Card>
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