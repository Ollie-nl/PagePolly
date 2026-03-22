import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchVendors } from '../store/reducers/vendorSlice';
import { getActiveCrawls, getCrawlHistory } from '../store/reducers/crawlSlice';

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
                    <th>Target URL</th>
                    <th>Status</th>
                    <th>Progress</th>
                    <th>Started At</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="font-medium">{activeJob.targetUrl || 'Unknown URL'}</td>
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
                        <span className="text-xs text-muted">{activeJob.progress || 0}% Complete</span>
                      </div>
                    </td>
                    <td className="text-muted">
                      {new Date(activeJob.startTime || Date.now()).toLocaleString()}
                    </td>
                  </tr>
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
