// PuppeteerCrawlOption.jsx
import React from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  FormGroup,
  FormControlLabel,
  Switch,
  Slider,
  TextField,
  Tooltip,
  IconButton,
} from '@mui/material';
import { InfoOutlined } from '@mui/icons-material';

const PuppeteerCrawlOption = ({ settings, onSettingsChange, disabled }) => {
  const handleChange = (setting, value) => {
    onSettingsChange({
      ...settings,
      [setting]: value
    });
  };

  const tooltips = {
    simulateHumanBehavior: 'Simulates human-like behavior by adding random delays and mouse movements',
    useProxy: 'Routes requests through a proxy server to avoid IP blocks',
    takeScreenshots: 'Captures screenshots of crawled pages',
    maxRetries: 'Number of retry attempts for failed requests',
    waitTime: 'Time to wait for dynamic content to load (in milliseconds)'
  };

  return (
    <Card variant="outlined">
      <CardContent>
        <Typography variant="subtitle1" gutterBottom>
          Puppeteer Crawler Settings
        </Typography>

        <FormGroup>
          <Box sx={{ mb: 2 }}>
            <FormControlLabel
              control={
                <Switch
                  checked={settings.simulateHumanBehavior}
                  onChange={(e) => handleChange('simulateHumanBehavior', e.target.checked)}
                  disabled={disabled}
                />
              }
              label="Simulate Human Behavior"
            />
            <Tooltip title={tooltips.simulateHumanBehavior}>
              <IconButton size="small">
                <InfoOutlined fontSize="small" />
              </IconButton>
            </Tooltip>
          </Box>

          <Box sx={{ mb: 2 }}>
            <FormControlLabel
              control={
                <Switch
                  checked={settings.useProxy}
                  onChange={(e) => handleChange('useProxy', e.target.checked)}
                  disabled={disabled}
                />
              }
              label="Use Proxy"
            />
            <Tooltip title={tooltips.useProxy}>
              <IconButton size="small">
                <InfoOutlined fontSize="small" />
              </IconButton>
            </Tooltip>
          </Box>

          <Box sx={{ mb: 2 }}>
            <FormControlLabel
              control={
                <Switch
                  checked={settings.takeScreenshots}
                  onChange={(e) => handleChange('takeScreenshots', e.target.checked)}
                  disabled={disabled}
                />
              }
              label="Take Screenshots"
            />
            <Tooltip title={tooltips.takeScreenshots}>
              <IconButton size="small">
                <InfoOutlined fontSize="small" />
              </IconButton>
            </Tooltip>
          </Box>

          <Box sx={{ mb: 3 }}>
            <Typography variant="body2" gutterBottom>
              Max Retries
              <Tooltip title={tooltips.maxRetries}>
                <IconButton size="small">
                  <InfoOutlined fontSize="small" />
                </IconButton>
              </Tooltip>
            </Typography>
            <Slider
              value={settings.maxRetries}
              onChange={(_, value) => handleChange('maxRetries', value)}
              min={0}
              max={5}
              marks
              step={1}
              valueLabelDisplay="auto"
              disabled={disabled}
              sx={{ width: '200px' }}
            />
          </Box>

          <Box sx={{ mb: 2 }}>
            <Typography variant="body2" gutterBottom>
              Wait Time (ms)
              <Tooltip title={tooltips.waitTime}>
                <IconButton size="small">
                  <InfoOutlined fontSize="small" />
                </IconButton>
              </Tooltip>
            </Typography>
            <TextField
              type="number"
              value={settings.waitTime}
              onChange={(e) => handleChange('waitTime', parseInt(e.target.value) || 0)}
              disabled={disabled}
              size="small"
              inputProps={{
                min: 0,
                max: 10000,
                step: 500
              }}
              sx={{ width: '150px' }}
            />
          </Box>
        </FormGroup>
      </CardContent>
    </Card>
  );
};

export default PuppeteerCrawlOption;