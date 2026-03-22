import React from 'react';
import Card from '../common/Card';

function ProgressOverview({ vendors = [], progress = {} }) {
  const safeVendors = Array.isArray(vendors) ? vendors : [];
  const safeProgress = progress && typeof progress === 'object' ? progress : {};

  const totalVendors = safeVendors.length;
  const crawledVendors = safeVendors.filter(vendor => {
    if (!vendor || typeof vendor !== 'object') return false;
    return safeProgress[vendor.id]?.percentage === 100 || safeProgress[vendor.id]?.status === 'completed';
  }).length;

  const overallPercentage = totalVendors === 0 ? 0 : Math.round((crawledVendors / totalVendors) * 100);

  const vendorsByStatus = {
    completed:  safeVendors.filter(v => v && safeProgress[v.id]?.status === 'completed'),
    running:    safeVendors.filter(v => v && safeProgress[v.id]?.status === 'running' && safeProgress[v.id]?.percentage < 100),
    failed:     safeVendors.filter(v => v && safeProgress[v.id]?.status === 'failed'),
    notStarted: safeVendors.filter(v => v && !safeProgress[v.id]),
  };

  const miniStatStyle = (bg, borderColor, textColor) => ({
    backgroundColor: bg,
    border: `1px solid ${borderColor}`,
    borderRadius: 'var(--radius-md)',
    padding: 'var(--spacing-md)',
  });

  return (
    <Card title="Crawl Progress Overview">
      {/* Overall progress */}
      <div className="mb-lg">
        <div className="flex justify-between items-center mb-xs">
          <span className="text-sm font-medium">Overall Progress</span>
          <span className="text-sm font-medium">{overallPercentage}%</span>
        </div>
        <div className="progress">
          <div className="progress-bar" style={{ width: `${overallPercentage}%` }} />
        </div>
        <p className="text-muted text-sm mt-xs">
          {crawledVendors} out of {totalVendors} vendors completed
        </p>
      </div>

      {/* Status summary */}
      <div className="grid grid-4 gap-sm mb-lg">
        <div style={miniStatStyle('var(--color-success-bg)', 'var(--color-success)', 'var(--color-success)')}>
          <div className="text-xs font-medium" style={{ color: 'var(--color-success)', textTransform: 'uppercase' }}>Completed</div>
          <div className="text-2xl font-bold mt-xs" style={{ color: 'var(--color-success)' }}>
            {vendorsByStatus.completed.length}
          </div>
        </div>
        <div style={miniStatStyle('var(--color-info-bg)', 'var(--color-info)', 'var(--color-info)')}>
          <div className="text-xs font-medium" style={{ color: 'var(--color-info)', textTransform: 'uppercase' }}>In Progress</div>
          <div className="text-2xl font-bold mt-xs" style={{ color: 'var(--color-info)' }}>
            {vendorsByStatus.running.length}
          </div>
        </div>
        <div style={miniStatStyle('var(--color-error-bg)', 'var(--color-error)', 'var(--color-error)')}>
          <div className="text-xs font-medium" style={{ color: 'var(--color-error)', textTransform: 'uppercase' }}>Failed</div>
          <div className="text-2xl font-bold mt-xs" style={{ color: 'var(--color-error)' }}>
            {vendorsByStatus.failed.length}
          </div>
        </div>
        <div style={miniStatStyle('var(--color-gray-100)', 'var(--color-gray-300)', 'var(--color-gray-600)')}>
          <div className="text-xs font-medium" style={{ color: 'var(--color-gray-600)', textTransform: 'uppercase' }}>Not Started</div>
          <div className="text-2xl font-bold mt-xs" style={{ color: 'var(--color-gray-700)' }}>
            {vendorsByStatus.notStarted.length}
          </div>
        </div>
      </div>

      {/* Currently running */}
      {vendorsByStatus.running.length > 0 && (
        <div>
          <h4 className="h5 mb-sm">Currently Running</h4>
          <div>
            {vendorsByStatus.running.map(vendor => {
              if (!vendor?.id) return null;
              const vendorProgress = safeProgress[vendor.id] || {};
              const percentage = typeof vendorProgress.percentage === 'number' ? vendorProgress.percentage : 0;

              return (
                <div key={vendor.id} className="flex items-center gap-md mb-sm">
                  <div style={{ flex: 1 }}>
                    <div className="text-sm font-medium">{vendor.name || 'Unknown Vendor'}</div>
                    <div className="text-xs text-muted truncate">{vendor.url || 'No URL'}</div>
                  </div>
                  <div style={{ width: '6rem' }}>
                    <div className="progress mb-xs" style={{ height: '6px' }}>
                      <div className="progress-bar" style={{ width: `${percentage}%` }} />
                    </div>
                    <div className="text-xs text-muted text-right">{percentage}%</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </Card>
  );
}

export default ProgressOverview;
