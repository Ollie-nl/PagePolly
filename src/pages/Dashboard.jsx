import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchVendors } from '../store/reducers/vendorSlice';
import { getActiveCrawls, getCrawlHistory, cancelCrawl } from '../store/reducers/crawlSlice';

const formatDate = (value) => {
  if (!value) return '—';
  const d = new Date(value);
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  const hours = String(d.getHours()).padStart(2, '0');
  const minutes = String(d.getMinutes()).padStart(2, '0');
  return `${day}-${month}-${year} ${hours}:${minutes}`;
};

function Dashboard() {
  const dispatch = useDispatch();
  const { items: vendors = [] } = useSelector((state) => state.vendors || {});
  const { activeJob = null, history = [] } = useSelector((state) => state.crawls || {});
  const [expandedJob, setExpandedJob] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [stats, setStats] = useState({
    totalVendors: 0,
    crawledVendors: 0,
    totalCrawls: 0,
    completedCrawls: 0,
    averageResponseTime: 0,
    totalPages: 0
  });

  useEffect(() => {
    dispatch(fetchVendors());
    dispatch(getActiveCrawls());
    dispatch(getCrawlHistory());

    const intervalId = setInterval(() => {
      dispatch(getActiveCrawls());
    }, 5000);

    return () => clearInterval(intervalId);
  }, [dispatch]);

  useEffect(() => {
    if (vendors.length > 0) {
      const completedJobs = history.filter(job => job.status === 'completed');
      setStats({
        totalVendors: vendors.length,
        crawledVendors: completedJobs.length > 0 ? Math.min(vendors.length, completedJobs.length) : 0,
        totalCrawls: history.length,
        completedCrawls: completedJobs.length,
        averageResponseTime: 245,
        totalPages: completedJobs.length * 5
      });
    }
  }, [vendors, history]);

  const handleCancel = async (jobId) => {
    if (!window.confirm('Are you sure you want to cancel this crawl job?')) return;
    setCancelling(true);
    await dispatch(cancelCrawl(jobId));
    setCancelling(false);
    setExpandedJob(false);
  };

  const vendorPct = stats.totalVendors
    ? Math.round((stats.crawledVendors / stats.totalVendors) * 100)
    : 0;

  const crawlPct = stats.totalCrawls
    ? Math.round((stats.completedCrawls / stats.totalCrawls) * 100)
    : 0;

  return (
    <div>
      {/* Page header */}
      <div className="page-header">
        <div className="page-header-text">
          <h1>Dashboard</h1>
          <p>Overview of your crawling activities</p>
        </div>
      </div>

      {/* Stats cards */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-label">Vendors Crawled</div>
          <div className="stat-value">{stats.crawledVendors}</div>
          <div className="stat-secondary">of {stats.totalVendors} total</div>
          <div className="progress mt-sm">
            <div className="progress-bar" style={{ width: `${vendorPct}%` }} />
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-label">Crawl Jobs</div>
          <div className="stat-value">{stats.completedCrawls}</div>
          <div className="stat-secondary">of {stats.totalCrawls} completed</div>
          <div className="progress mt-sm">
            <div className="progress-bar progress-bar-success" style={{ width: `${crawlPct}%` }} />
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-label">Avg. Response Time</div>
          <div className="stat-value">{stats.averageResponseTime} <span style={{ fontSize: '1rem', fontWeight: 400 }}>ms</span></div>
          <div className="stat-secondary">{stats.totalPages} total pages crawled</div>
        </div>
      </div>

      {/* Active crawl jobs */}
      <div className="card">
        <div className="card-header">
          <h2 className="h3">Active Crawl Jobs</h2>
        </div>
        <div className="card-body" style={{ padding: 0 }}>
          {!activeJob ? (
            <div className="empty-state">
              <div className="empty-state-icon">🔍</div>
              <h3>No active crawl jobs</h3>
              <p>Start a crawl from the Vendors page to see activity here.</p>
            </div>
          ) : (
            <div className="table-wrapper">
              <table className="table">
                <thead>
                  <tr>
                    <th>Vendor</th>
                    <th>Status</th>
                    <th>Progress</th>
                    <th>Started At</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  <tr
                    style={{ cursor: 'pointer' }}
                    onClick={() => setExpandedJob(v => !v)}
                  >
                    <td className="font-medium">
                      <div className="flex items-center gap-xs">
                        <span style={{
                          display: 'inline-block',
                          transition: 'transform 0.2s',
                          transform: expandedJob ? 'rotate(180deg)' : 'rotate(0deg)',
                          fontSize: '0.7rem',
                          color: 'var(--color-text-muted)',
                        }}>▼</span>
                        {vendors.find(v => v.id === activeJob.vendorId)?.name || activeJob.targetUrl || 'Unknown vendor'}
                      </div>
                    </td>
                    <td>
                      <span className="badge badge-success">{activeJob.status}</span>
                    </td>
                    <td>
                      <div className="flex flex-col gap-xs">
                        <div className="progress">
                          <div
                            className="progress-bar"
                            style={{ width: `${activeJob.progress || 0}%` }}
                          />
                        </div>
                        <span className="text-xs text-muted">{activeJob.progress || 0}% complete</span>
                      </div>
                    </td>
                    <td className="text-muted">{formatDate(activeJob.startTime)}</td>
                    <td onClick={e => e.stopPropagation()}>
                      <button
                        className="btn btn-danger btn-sm"
                        disabled={cancelling}
                        onClick={() => handleCancel(activeJob.id)}
                      >
                        {cancelling ? 'Cancelling...' : 'Cancel'}
                      </button>
                    </td>
                  </tr>
                  {expandedJob && (
                    <tr>
                      <td colSpan={5} style={{ background: 'var(--color-surface)', padding: '1rem 1.25rem' }}>
                        <div className="flex flex-col gap-sm">
                          <div>
                            <span className="text-xs text-muted">Job ID</span>
                            <p className="text-sm font-medium" style={{ fontFamily: 'monospace' }}>{activeJob.id}</p>
                          </div>
                          <div>
                            <span className="text-xs text-muted">URLs in this job</span>
                            {(activeJob.urls || []).length > 0 ? (
                              <ul style={{ margin: '0.25rem 0 0', paddingLeft: '1.25rem' }}>
                                {activeJob.urls.map((url, i) => (
                                  <li key={i} className="text-sm">{url}</li>
                                ))}
                              </ul>
                            ) : (
                              <p className="text-sm text-muted">No URL info available</p>
                            )}
                          </div>
                          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.75rem' }}>
                            <div>
                              <span className="text-xs text-muted">Max retries</span>
                              <p className="text-sm">{activeJob.settings?.maxRetries ?? '—'}</p>
                            </div>
                            <div>
                              <span className="text-xs text-muted">Nav. timeout</span>
                              <p className="text-sm">{activeJob.settings?.navigationTimeout ? `${activeJob.settings.navigationTimeout / 1000}s` : '—'}</p>
                            </div>
                            <div>
                              <span className="text-xs text-muted">Human behavior</span>
                              <p className="text-sm">{activeJob.settings?.simulateHumanBehavior ? 'Enabled' : 'Disabled'}</p>
                            </div>
                          </div>
                          {activeJob.error && (
                            <div style={{ background: 'var(--color-danger-light, #fee2e2)', borderRadius: '6px', padding: '0.5rem 0.75rem' }}>
                              <span className="text-xs text-muted">Last error</span>
                              <p className="text-sm" style={{ color: 'var(--color-danger)' }}>{activeJob.error}</p>
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
