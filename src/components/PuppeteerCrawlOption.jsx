// PuppeteerCrawlOption.jsx
import React from 'react';

const tooltips = {
  simulateHumanBehavior: 'Simulates human-like behavior by adding random delays and mouse movements',
  useProxy:              'Routes requests through a proxy server to avoid IP blocks',
  takeScreenshots:       'Captures screenshots of crawled pages',
  maxRetries:            'Number of retry attempts for failed requests (0–5)',
  waitTime:              'Time to wait for dynamic content to load (in milliseconds)',
};

const PuppeteerCrawlOption = ({ settings, onSettingsChange, disabled }) => {
  const handleChange = (setting, value) => {
    onSettingsChange({ ...settings, [setting]: value });
  };

  return (
    <div className="card" style={{ border: '1px solid var(--color-gray-200)' }}>
      <div className="card-body">
        <h3 className="h5 mb-md">Puppeteer Crawler Settings</h3>

        {/* Simulate Human Behavior */}
        <div className="flex items-center justify-between mb-md">
          <div>
            <span className="text-sm font-medium">Simulate Human Behavior</span>
            <p className="text-xs text-muted">{tooltips.simulateHumanBehavior}</p>
          </div>
          <label className="toggle" title={tooltips.simulateHumanBehavior}>
            <input
              type="checkbox"
              checked={!!settings.simulateHumanBehavior}
              onChange={(e) => handleChange('simulateHumanBehavior', e.target.checked)}
              disabled={disabled}
            />
            <span className="toggle-track" />
          </label>
        </div>

        {/* Use Proxy */}
        <div className="flex items-center justify-between mb-md">
          <div>
            <span className="text-sm font-medium">Use Proxy</span>
            <p className="text-xs text-muted">{tooltips.useProxy}</p>
          </div>
          <label className="toggle" title={tooltips.useProxy}>
            <input
              type="checkbox"
              checked={!!settings.useProxy}
              onChange={(e) => handleChange('useProxy', e.target.checked)}
              disabled={disabled}
            />
            <span className="toggle-track" />
          </label>
        </div>

        {/* Take Screenshots */}
        <div className="flex items-center justify-between mb-md">
          <div>
            <span className="text-sm font-medium">Take Screenshots</span>
            <p className="text-xs text-muted">{tooltips.takeScreenshots}</p>
          </div>
          <label className="toggle" title={tooltips.takeScreenshots}>
            <input
              type="checkbox"
              checked={!!settings.takeScreenshots}
              onChange={(e) => handleChange('takeScreenshots', e.target.checked)}
              disabled={disabled}
            />
            <span className="toggle-track" />
          </label>
        </div>

        {/* Max Retries */}
        <div className="mb-md">
          <div className="flex items-center gap-sm mb-xs">
            <label className="form-label" htmlFor="maxRetries" style={{ marginBottom: 0 }}>
              Max Retries
            </label>
            <span
              className="badge badge-default"
              title={tooltips.maxRetries}
              style={{ cursor: 'default' }}
            >
              {settings.maxRetries}
            </span>
          </div>
          <input
            id="maxRetries"
            type="range"
            className="range-input w-full"
            min={0}
            max={5}
            step={1}
            value={settings.maxRetries}
            onChange={(e) => handleChange('maxRetries', parseInt(e.target.value))}
            disabled={disabled}
          />
          <div className="flex justify-between text-xs text-muted" style={{ marginTop: '0.25rem' }}>
            <span>0</span><span>1</span><span>2</span><span>3</span><span>4</span><span>5</span>
          </div>
        </div>

        {/* Wait Time */}
        <div>
          <label className="form-label" htmlFor="waitTime">
            Wait Time (ms)
            <span className="text-xs text-muted ml-auto" style={{ fontWeight: 400 }}>
              {' '}— {tooltips.waitTime}
            </span>
          </label>
          <input
            id="waitTime"
            type="number"
            className="input"
            style={{ width: '160px' }}
            value={settings.waitTime}
            onChange={(e) => handleChange('waitTime', parseInt(e.target.value) || 0)}
            disabled={disabled}
            min={0}
            max={10000}
            step={500}
          />
        </div>
      </div>
    </div>
  );
};

export default PuppeteerCrawlOption;
