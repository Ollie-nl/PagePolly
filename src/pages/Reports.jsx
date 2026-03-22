import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchReports, fetchReport } from '../store/reducers/reportSlice';
import apiClient from '../api/apiClient';

const statusBadge = (s) => {
  if (s === 'success')  return 'badge-success';
  if (s === 'warning')  return 'badge-warning';
  return 'badge-error';
};

const statusLabel = (s) => {
  if (s === 'success')  return 'Completed';
  if (s === 'warning')  return 'Partial';
  return 'Failed';
};

function toMarkdown(results) {
  return results.map(r => {
    const d = r.data || {};
    const lines = [`# ${d.title || r.url}`, `URL: ${r.url}`, ''];
    if (d.meta?.description) lines.push(`> ${d.meta.description}`, '');
    ['h1','h2','h3'].forEach(level => {
      (d.headings?.[level] || []).forEach(h => {
        lines.push(`${'#'.repeat(parseInt(level[1]) + 1)} ${h}`);
      });
    });
    if (lines[lines.length - 1] !== '') lines.push('');
    (d.paragraphs || []).forEach(p => lines.push(p, ''));
    return lines.join('\n');
  }).join('\n\n---\n\n');
}

function exportJSON(data, filename) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href     = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function ReportDetail({ reportId, onClose }) {
  const [job, setJob]         = useState(null);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState({});
  const [copied, setCopied]   = useState(false);

  useEffect(() => {
    apiClient.get(`/api/reports/${reportId}`)
      .then(r => setJob(r.data))
      .catch(() => setJob(null))
      .finally(() => setLoading(false));
  }, [reportId]);

  const toggle = (id) => setExpanded(e => ({ ...e, [id]: !e[id] }));

  if (loading) return (
    <div className="modal-overlay">
      <div className="modal">
        <div className="modal-body text-center">
          <span className="spinner spinner-md" />
        </div>
      </div>
    </div>
  );

  if (!job) return null;

  const results = job.crawl_results || [];

  return (
    <div className="modal-overlay" role="dialog" aria-modal="true">
      <div className="modal" style={{ maxWidth: '800px', width: '95vw', maxHeight: '85vh', display: 'flex', flexDirection: 'column' }}>
        <div className="modal-header">
          <div>
            <h3>{job.vendors?.name || 'Report'}</h3>
            <p className="text-sm text-muted">{results.length} pages · {new Date(job.created_at).toLocaleString()}</p>
          </div>
          <div className="flex gap-sm items-center">
            <button
              className="btn btn-secondary btn-sm"
              onClick={() => {
                navigator.clipboard.writeText(toMarkdown(results));
                setCopied(true);
                setTimeout(() => setCopied(false), 2000);
              }}
            >
              {copied ? '✓ Copied!' : '⎘ Copy Markdown'}
            </button>
            <button
              className="btn btn-secondary btn-sm"
              onClick={() => exportJSON(results.map(r => r.data), `${job.vendors?.name || 'report'}-${job.id.slice(0,8)}.json`)}
            >
              ↓ JSON
            </button>
            <button className="modal-close-btn" onClick={onClose}>&times;</button>
          </div>
        </div>

        <div className="modal-body" style={{ overflowY: 'auto', flex: 1 }}>
          {results.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon">📄</div>
              <p>No crawl results stored for this job.</p>
            </div>
          ) : results.map((result, i) => {
            const data = result.data || {};
            const isOpen = expanded[result.id];
            return (
              <div key={result.id} className="card mb-sm" style={{ boxShadow: 'none', border: '1px solid var(--color-gray-200)' }}>
                <div
                  className="card-header"
                  style={{ cursor: 'pointer' }}
                  onClick={() => toggle(result.id)}
                >
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p className="font-medium text-sm" style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {data.title || result.url}
                    </p>
                    <a href={result.url} target="_blank" rel="noopener noreferrer" className="text-xs text-muted"
                       onClick={e => e.stopPropagation()}>
                      {result.url}
                    </a>
                  </div>
                  <div className="flex gap-sm items-center" style={{ flexShrink: 0 }}>
                    <span className="text-xs text-muted">{result.crawl_duration ? `${result.crawl_duration}ms` : ''}</span>
                    <span style={{ fontSize: '0.75rem' }}>{isOpen ? '▲' : '▼'}</span>
                  </div>
                </div>

                {isOpen && (
                  <div className="card-body" style={{ borderTop: '1px solid var(--color-gray-100)' }}>
                    {data.meta?.description && (
                      <p className="text-sm text-muted mb-sm"><strong>Description:</strong> {data.meta.description}</p>
                    )}

                    {Object.entries(data.headings || {}).map(([level, items]) =>
                      items?.length > 0 && (
                        <div key={level} className="mb-sm">
                          <p className="text-xs text-muted mb-xs" style={{ textTransform: 'uppercase', letterSpacing: '0.05em' }}>{level}</p>
                          <ul style={{ paddingLeft: '1rem', margin: 0 }}>
                            {items.map((h, j) => <li key={j} className="text-sm">{h}</li>)}
                          </ul>
                        </div>
                      )
                    )}

                    {data.paragraphs?.length > 0 && (
                      <div className="mb-sm">
                        <p className="text-xs text-muted mb-xs" style={{ textTransform: 'uppercase', letterSpacing: '0.05em' }}>Content</p>
                        {data.paragraphs.slice(0, 5).map((p, j) => (
                          <p key={j} className="text-sm mb-xs">{p}</p>
                        ))}
                        {data.paragraphs.length > 5 && (
                          <p className="text-xs text-muted">+{data.paragraphs.length - 5} more paragraphs</p>
                        )}
                      </div>
                    )}

                    {data.links?.length > 0 && (
                      <div>
                        <p className="text-xs text-muted mb-xs" style={{ textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                          Links ({data.links.length})
                        </p>
                        <div style={{ maxHeight: '150px', overflowY: 'auto' }}>
                          {data.links.map((link, j) => (
                            <div key={j} className="text-xs" style={{ padding: '2px 0' }}>
                              <a href={link.href} target="_blank" rel="noopener noreferrer" className="text-muted">
                                {link.text || link.href}
                              </a>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function Reports() {
  const dispatch = useDispatch();
  const { items: reports, status, error } = useSelector((state) => state.reports);
  const [selectedId, setSelectedId] = useState(null);

  useEffect(() => {
    dispatch(fetchReports());
  }, [dispatch]);

  return (
    <div>
      <div className="page-header">
        <div className="page-header-text">
          <h1>Reports</h1>
          <p>Crawl results per vendor</p>
        </div>
        <button className="btn btn-secondary" onClick={() => dispatch(fetchReports())}>
          ↻ Refresh
        </button>
      </div>

      <div className="card">
        {status === 'loading' && (
          <div className="card-body text-center">
            <span className="spinner spinner-md" />
            <p className="text-muted mt-sm">Loading reports...</p>
          </div>
        )}

        {status === 'failed' && (
          <div className="card-body">
            <div className="alert alert-error">{error || 'Failed to load reports'}</div>
          </div>
        )}

        {status === 'succeeded' && reports.length === 0 && (
          <div className="empty-state">
            <div className="empty-state-icon">📄</div>
            <h3>No reports yet</h3>
            <p>Start a crawl from the Vendors page to see results here.</p>
          </div>
        )}

        {status === 'succeeded' && reports.length > 0 && (
          <div className="table-wrapper">
            <table className="table">
              <thead>
                <tr>
                  <th>Vendor</th>
                  <th>Date</th>
                  <th>Pages crawled</th>
                  <th>Errors</th>
                  <th>Status</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {reports.map(report => (
                  <tr key={report.id}>
                    <td className="font-medium">{report.vendor}</td>
                    <td className="text-muted">{new Date(report.date).toLocaleString()}</td>
                    <td className="text-muted">{report.pages}</td>
                    <td className="text-muted">{report.errors > 0 ? <span className="badge badge-error">{report.errors}</span> : '—'}</td>
                    <td>
                      <span className={`badge ${statusBadge(report.status)}`}>
                        {statusLabel(report.status)}
                      </span>
                    </td>
                    <td className="table-cell-actions">
                      <button
                        className="btn btn-ghost btn-sm"
                        onClick={() => setSelectedId(report.id)}
                      >
                        View
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {selectedId && (
        <ReportDetail reportId={selectedId} onClose={() => setSelectedId(null)} />
      )}
    </div>
  );
}

export default Reports;
