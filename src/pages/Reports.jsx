import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchReports, exportReport, setReportFilters } from '../store/reducers/reportSlice';

const productMetrics = [
  { id: 1, name: 'Product A', expected: 12, found: 10, complianceRate: 83 },
  { id: 2, name: 'Product B', expected: 8,  found: 8,  complianceRate: 100 },
  { id: 3, name: 'Product C', expected: 15, found: 9,  complianceRate: 60 },
  { id: 4, name: 'Product D', expected: 5,  found: 4,  complianceRate: 80 },
  { id: 5, name: 'Product E', expected: 10, found: 7,  complianceRate: 70 },
];

const mockReports = [
  { id: 1, vendor: 'Vendor A', date: '2023-05-12', pages: 15, products: '12/15', status: 'success' },
  { id: 2, vendor: 'Vendor B', date: '2023-05-10', pages: 8,  products: '8/8',   status: 'success' },
  { id: 3, vendor: 'Vendor C', date: '2023-05-09', pages: 12, products: '7/10',  status: 'warning' },
  { id: 4, vendor: 'Vendor D', date: '2023-05-08', pages: 5,  products: '3/5',   status: 'warning' },
  { id: 5, vendor: 'Vendor E', date: '2023-05-07', pages: 7,  products: '1/6',   status: 'error' },
];

function Reports() {
  const dispatch = useDispatch();
  const { items: reports, status, error, filters } = useSelector((state) => state.reports);
  const [dateRange, setDateRange] = useState({ start: '', end: '' });
  const [selectedFormat, setSelectedFormat] = useState('pdf');
  const [selectedVendor, setSelectedVendor] = useState('all');
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    dispatch(fetchReports(filters));
  }, [dispatch, filters]);

  const handleApplyFilters = () => {
    dispatch(setReportFilters({
      ...filters,
      startDate: dateRange.start || undefined,
      endDate: dateRange.end || undefined,
      vendorId: selectedVendor !== 'all' ? selectedVendor : undefined,
    }));
    setShowFilters(false);
  };

  const handleResetFilters = () => {
    setDateRange({ start: '', end: '' });
    setSelectedVendor('all');
    dispatch(setReportFilters({}));
    setShowFilters(false);
  };

  const handleExportReport = () => {
    dispatch(exportReport({ format: selectedFormat, filters }));
  };

  const complianceBadgeClass = (rate) => {
    if (rate >= 90) return 'badge-success';
    if (rate >= 70) return 'badge-warning';
    return 'badge-error';
  };

  const statusBadgeClass = (s) => {
    if (s === 'success') return 'badge-success';
    if (s === 'warning') return 'badge-warning';
    return 'badge-error';
  };

  const statusLabel = (s) => {
    if (s === 'success') return 'Compliant';
    if (s === 'warning') return 'Partially Compliant';
    return 'Non-Compliant';
  };

  return (
    <div>
      {/* Page header */}
      <div className="page-header">
        <div className="page-header-text">
          <h1>Reports</h1>
          <p>Analyze crawl results and monitor vendor compliance</p>
        </div>
        <div className="page-header-actions">
          <button
            className="btn btn-secondary"
            onClick={() => setShowFilters(!showFilters)}
          >
            ⚡ Filter
          </button>

          <select
            className="select"
            style={{ width: 'auto' }}
            value={selectedFormat}
            onChange={(e) => setSelectedFormat(e.target.value)}
          >
            <option value="pdf">PDF</option>
            <option value="csv">CSV</option>
            <option value="excel">Excel</option>
          </select>

          <button className="btn btn-primary" onClick={handleExportReport}>
            ↓ Export
          </button>
        </div>
      </div>

      {/* Filters Panel */}
      {showFilters && (
        <div className="card mb-lg">
          <div className="card-body">
            <div className="grid-3 grid gap-md">
              <div className="form-group">
                <label className="form-label">Start Date</label>
                <input
                  type="date"
                  className="input"
                  value={dateRange.start}
                  onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label className="form-label">End Date</label>
                <input
                  type="date"
                  className="input"
                  value={dateRange.end}
                  onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Vendor</label>
                <select
                  className="select"
                  value={selectedVendor}
                  onChange={(e) => setSelectedVendor(e.target.value)}
                >
                  <option value="all">All Vendors</option>
                  <option value="1">Vendor A</option>
                  <option value="2">Vendor B</option>
                  <option value="3">Vendor C</option>
                </select>
              </div>
            </div>
            <div className="flex justify-end gap-sm mt-md">
              <button className="btn btn-secondary" onClick={handleResetFilters}>Reset</button>
              <button className="btn btn-primary" onClick={handleApplyFilters}>Apply Filters</button>
            </div>
          </div>
        </div>
      )}

      {/* Summary Cards */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-label">Total Crawls</div>
          <div className="stat-value">256</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Pages Crawled</div>
          <div className="stat-value">1,432</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Products Found</div>
          <div className="stat-value">87%</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Avg. Response Time</div>
          <div className="stat-value">245 <span style={{ fontSize: '1rem', fontWeight: 400 }}>ms</span></div>
        </div>
      </div>

      {/* Product Compliance Report */}
      <div className="card mb-lg">
        <div className="card-header">
          <h2 className="h3">Product Compliance Report</h2>
        </div>
        <div className="table-wrapper">
          <table className="table">
            <thead>
              <tr>
                <th>Product</th>
                <th>Expected Occurrences</th>
                <th>Found Occurrences</th>
                <th>Compliance Rate</th>
              </tr>
            </thead>
            <tbody>
              {productMetrics.map(product => (
                <tr key={product.id}>
                  <td className="font-medium">{product.name}</td>
                  <td className="text-muted">{product.expected}</td>
                  <td className="text-muted">{product.found}</td>
                  <td>
                    <div className="flex items-center gap-sm">
                      <div className="progress" style={{ width: '6rem' }}>
                        <div
                          className={`progress-bar ${
                            product.complianceRate >= 90 ? 'progress-bar-success' :
                            product.complianceRate >= 70 ? 'progress-bar-warning' :
                            'progress-bar-error'
                          }`}
                          style={{ width: `${product.complianceRate}%` }}
                        />
                      </div>
                      <span className={`badge ${complianceBadgeClass(product.complianceRate)}`}>
                        {product.complianceRate}%
                      </span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Recent Crawl Results */}
      <div className="card">
        <div className="card-header">
          <h2 className="h3">Recent Crawl Results</h2>
        </div>

        {status === 'loading' && (
          <div className="card-body text-center">
            <span className="spinner spinner-md" />
            <p className="text-muted mt-sm">Loading reports...</p>
          </div>
        )}

        {status === 'failed' && (
          <div className="card-body">
            <div className="alert alert-error">
              {error || 'Failed to load reports'}
            </div>
            <button
              className="link-btn"
              onClick={() => dispatch(fetchReports(filters))}
            >
              Try again
            </button>
          </div>
        )}

        {status === 'succeeded' && (!Array.isArray(reports) || reports.length === 0) && (
          <div className="empty-state">
            <div className="empty-state-icon">📄</div>
            <h3>No reports available</h3>
            <p>Reports will appear here after crawling vendor sites.</p>
          </div>
        )}

        {status === 'succeeded' && Array.isArray(reports) && reports.length > 0 && (
          <div className="table-wrapper">
            <table className="table">
              <thead>
                <tr>
                  <th>Vendor</th>
                  <th>Date</th>
                  <th>Pages</th>
                  <th>Products Found</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {mockReports.map(report => (
                  <tr key={report.id}>
                    <td className="font-medium">{report.vendor}</td>
                    <td className="text-muted">{report.date}</td>
                    <td className="text-muted">{report.pages}</td>
                    <td className="text-muted">{report.products}</td>
                    <td>
                      <span className={`badge ${statusBadgeClass(report.status)}`}>
                        {statusLabel(report.status)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

export default Reports;
