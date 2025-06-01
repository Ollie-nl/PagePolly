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
  const { activeJob = null, history = [] } = useSelector((state) => state.crawls || {});
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
  
  // Helper functie om status label te genereren
  const getStatusChip = (status) => {
    switch(status) {
      case 'completed':
        return <Chip label="Voltooid" color="success" size="small" />;
      case 'failed':
        return <Chip label="Mislukt" color="error" size="small" />;
      case 'running':
        return <Chip label="Actief" color="primary" size="small" />;
      case 'queued':
        return <Chip label="Wachtrij" color="warning" size="small" />;
      case 'cancelled':
        return <Chip label="Geannuleerd" color="default" size="small" />;
      default:
        return <Chip label={status} size="small" />;
    }
  };

  // Helper functie om datum relatief weer te geven
  const formatRelativeDate = (dateString) => {
    if (!dateString) return 'Onbekend';
    try {
      return formatDistance(new Date(dateString), new Date(), { 
        addSuffix: true,
        locale: nl
      });
    } catch (error) {
      return dateString;
    }
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
      {activeJob ? (
        <Card sx={{ mb: 4 }}>
          <CardContent>
            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle1">Vendor: {activeJob.vendorName || 'Onbekend'}</Typography>
                <Typography variant="body2" color="textSecondary">
                  Gestart: {formatRelativeDate(activeJob.startTime)}
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  Pagina's verwerkt: {activeJob.stats?.pagesProcessed || 0}
                </Typography>
              </Grid>
              <Grid item xs={12} md={6}>
                <Typography variant="body2" color="textSecondary" gutterBottom>
                  Voortgang: {activeJob.progress ? `${Math.round(activeJob.progress * 100)}%` : 'Bezig...'}
                </Typography>
                <LinearProgress 
                  variant={activeJob.progress ? "determinate" : "indeterminate"} 
                  value={activeJob.progress ? activeJob.progress * 100 : 0} 
                  sx={{ mt: 1 }}
                />
                {activeJob.status && (
                  <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 1 }}>
                    {getStatusChip(activeJob.status)}
                  </Box>
                )}
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      ) : (
        <Card sx={{ mb: 4 }}>
          <CardContent>
            <Typography variant="body1">Geen actieve crawl jobs</Typography>
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