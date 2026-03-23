import React, { useEffect, useState, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchReports } from '../store/reducers/reportSlice';
import apiClient from '../api/apiClient';

const formatDate = (value) => {
  if (!value) return '—';
  const d = new Date(value);
  const day   = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year  = d.getFullYear();
  const hours = String(d.getHours()).padStart(2, '0');
  const mins  = String(d.getMinutes()).padStart(2, '0');
  return `${day}-${month}-${year} ${hours}:${mins}`;
};

const statusBadge = (s) => {
  if (s === 'success') return 'badge-success';
  if (s === 'warning') return 'badge-warning';
  return 'badge-error';
};

const statusLabel = (s) => {
  if (s === 'success') return 'Completed';
  if (s === 'warning') return 'Partial';
  return 'Failed';
};

function toMarkdown(results) {
  return results.map(r => {
    const d = r.data || {};
    const lines = [`# ${d.title || r.url}`, `URL: ${r.url}`, ''];
    if (d.meta?.description) lines.push(`> ${d.meta.description}`, '');
    ['h1', 'h2', 'h3'].forEach(level => {
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

// ── Compare logic ────────────────────────────────────────────────────────────

function diffReports(oldResults, newResults) {
  const oldMap = Object.fromEntries(oldResults.map(r => [r.url, r]));
  const newMap = Object.fromEntries(newResults.map(r => [r.url, r]));

  const added   = newResults.filter(r => !oldMap[r.url]);
  const removed = oldResults.filter(r => !newMap[r.url]);
  const changed = newResults.filter(r => {
    if (!oldMap[r.url]) return false;
    const o = oldMap[r.url].data || {};
    const n = r.data || {};
    return (
      o.title !== n.title ||
      (o.paragraphs?.length || 0) !== (n.paragraphs?.length || 0) ||
      JSON.stringify(o.headings) !== JSON.stringify(n.headings)
    );
  }).map(r => ({ url: r.url, old: oldMap[r.url].data || {}, new: r.data || {} }));

  return { added, removed, changed };
}

function CompareModal({ baseReport, compareReport, onClose }) {
  const [loading, setLoading] = useState(true);
  const [diff, setDiff]       = useState(null);
  const [error, setError]     = useState(null);

  useEffect(() => {
    Promise.all([
      apiClient.get(`/api/reports/${baseReport.id}`),
      apiClient.get(`/api/reports/${compareReport.id}`),
    ])
      .then(([a, b]) => {
        setDiff(diffReports(a.data.crawl_results || [], b.data.crawl_results || []));
      })
      .catch(() => setError('Failed to load comparison data'))
      .finally(() => setLoading(false));
  }, [baseReport.id, compareReport.id]);

  return (
    <div className="modal-overlay" role="dialog" aria-modal="true">
      <div className="modal" style={{ maxWidth: '860px', width: '95vw', maxHeight: '85vh', display: 'flex', flexDirection: 'column' }}>
        <div className="modal-header">
          <div>
            <h3>Change Detection — {baseReport.vendor}</h3>
            <p className="text-sm text-muted">
              {formatDate(baseReport.date)} → {formatDate(compareReport.date)}
            </p>
          </div>
          <button className="modal-close-btn" onClick={onClose}>&times;</button>
        </div>

        <div className="modal-body" style={{ overflowY: 'auto', flex: 1 }}>
          {loading && (
            <div className="text-center" style={{ padding: '2rem' }}>
              <span className="spinner spinner-md" />
              <p className="text-muted mt-sm">Comparing crawls…</p>
            </div>
          )}

          {error && <div className="alert alert-error">{error}</div>}

          {diff && (
            <>
              {/* Summary */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem', marginBottom: '1.5rem' }}>
                {[
                  { label: 'New pages', count: diff.added.length, color: 'var(--color-success, #16a34a)' },
                  { label: 'Removed pages', count: diff.removed.length, color: 'var(--color-danger, #dc2626)' },
                  { label: 'Changed pages', count: diff.changed.length, color: 'var(--color-warning, #d97706)' },
                ].map(({ label, count, color }) => (
                  <div key={label} className="card" style={{ boxShadow: 'none', border: `1px solid var(--color-gray-200)`, textAlign: 'center', padding: '1rem' }}>
                    <div style={{ fontSize: '2rem', fontWeight: 700, color }}>{count}</div>
                    <div className="text-sm text-muted">{label}</div>
                  </div>
                ))}
              </div>

              {diff.added.length === 0 && diff.removed.length === 0 && diff.changed.length === 0 && (
                <div className="empty-state">
                  <div className="empty-state-icon">✓</div>
                  <h3>No changes detected</h3>
                  <p>Both crawls returned identical content.</p>
                </div>
              )}

              {/* Added */}
              {diff.added.length > 0 && (
                <div className="mb-lg">
                  <p className="text-xs text-muted mb-xs" style={{ textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--color-success, #16a34a)' }}>
                    + New pages ({diff.added.length})
                  </p>
                  {diff.added.map((r, i) => (
                    <div key={i} className="card mb-xs" style={{ boxShadow: 'none', border: '1px solid #bbf7d0', background: '#f0fdf4' }}>
                      <div className="card-header" style={{ padding: '0.6rem 1rem' }}>
                        <p className="text-sm font-medium">{r.data?.title || r.url}</p>
                        <a href={r.url} target="_blank" rel="noopener noreferrer" className="text-xs text-muted">{r.url}</a>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Removed */}
              {diff.removed.length > 0 && (
                <div className="mb-lg">
                  <p className="text-xs text-muted mb-xs" style={{ textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--color-danger, #dc2626)' }}>
                    − Removed pages ({diff.removed.length})
                  </p>
                  {diff.removed.map((r, i) => (
                    <div key={i} className="card mb-xs" style={{ boxShadow: 'none', border: '1px solid #fecaca', background: '#fef2f2' }}>
                      <div className="card-header" style={{ padding: '0.6rem 1rem' }}>
                        <p className="text-sm font-medium">{r.data?.title || r.url}</p>
                        <a href={r.url} target="_blank" rel="noopener noreferrer" className="text-xs text-muted">{r.url}</a>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Changed */}
              {diff.changed.length > 0 && (
                <div>
                  <p className="text-xs text-muted mb-xs" style={{ textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--color-warning, #d97706)' }}>
                    ~ Changed pages ({diff.changed.length})
                  </p>
                  {diff.changed.map((c, i) => (
                    <div key={i} className="card mb-xs" style={{ boxShadow: 'none', border: '1px solid #fde68a', background: '#fffbeb' }}>
                      <div className="card-header" style={{ padding: '0.6rem 1rem' }}>
                        <p className="text-sm font-medium">{c.url}</p>
                      </div>
                      <div className="card-body" style={{ padding: '0.6rem 1rem', borderTop: '1px solid #fde68a' }}>
                        {c.old.title !== c.new.title && (
                          <div className="mb-xs">
                            <span className="text-xs text-muted">Title</span>
                            <p className="text-sm" style={{ color: '#dc2626', textDecoration: 'line-through' }}>{c.old.title || '—'}</p>
                            <p className="text-sm" style={{ color: '#16a34a' }}>{c.new.title || '—'}</p>
                          </div>
                        )}
                        {(c.old.paragraphs?.length || 0) !== (c.new.paragraphs?.length || 0) && (
                          <div className="mb-xs">
                            <span className="text-xs text-muted">Paragraphs</span>
                            <p className="text-sm">{c.old.paragraphs?.length || 0} → {c.new.paragraphs?.length || 0}</p>
                          </div>
                        )}
                        {JSON.stringify(c.old.headings) !== JSON.stringify(c.new.headings) && (
                          <div>
                            <span className="text-xs text-muted">Headings changed</span>
                            <p className="text-sm">
                              {Object.entries(c.old.headings || {}).map(([l, v]) => `${l}: ${v?.length || 0}`).join(', ')}
                              {' → '}
                              {Object.entries(c.new.headings || {}).map(([l, v]) => `${l}: ${v?.length || 0}`).join(', ')}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Report detail modal ──────────────────────────────────────────────────────

function ReportDetail({ reportId, onClose }) {
  const [job, setJob]           = useState(null);
  const [loading, setLoading]   = useState(true);
  const [expanded, setExpanded] = useState({});
  const [copied, setCopied]     = useState(false);

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
            <p className="text-sm text-muted">{results.length} pages · {formatDate(job.created_at)}</p>
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
              onClick={() => exportJSON(results.map(r => r.data), `${job.vendors?.name || 'report'}-${job.id.slice(0, 8)}.json`)}
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
          ) : results.map((result) => {
            const data   = result.data || {};
            const isOpen = expanded[result.id];

            return (
              <div key={result.id} className="card mb-sm" style={{ boxShadow: 'none', border: '1px solid var(--color-gray-200)' }}>
                <div className="card-header" style={{ cursor: 'pointer' }} onClick={() => toggle(result.id)}>
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
                    <span style={{
                      fontSize: '0.7rem',
                      display: 'inline-block',
                      transition: 'transform 0.2s',
                      transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                    }}>▼</span>
                  </div>
                </div>

                {isOpen && (
                  <div className="card-body" style={{ borderTop: '1px solid var(--color-gray-100)' }}>
                    {data.meta?.description && (
                      <p className="text-sm text-muted mb-sm"><strong>Description:</strong> {data.meta.description}</p>
                    )}

                    {data.headers?.length > 0 && (
                      <div className="mb-sm">
                        <p className="text-xs text-muted mb-xs" style={{ textTransform: 'uppercase', letterSpacing: '0.05em' }}>Headings</p>
                        <ul style={{ paddingLeft: '1rem', margin: 0 }}>
                          {data.headers.map((h, j) => (
                            <li key={j} className="text-sm" style={{ color: h.type === 'h1' ? 'inherit' : 'var(--color-gray-500)' }}>
                              <span className="text-xs text-muted" style={{ marginRight: '0.4rem' }}>{h.type.toUpperCase()}</span>{h.text}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {data.text && (
                      <div className="mb-sm">
                        <p className="text-xs text-muted mb-xs" style={{ textTransform: 'uppercase', letterSpacing: '0.05em' }}>Content preview</p>
                        <p className="text-sm" style={{ whiteSpace: 'pre-wrap', maxHeight: '120px', overflowY: 'auto', color: 'var(--color-gray-600)' }}>
                          {data.text.slice(0, 500)}{data.text.length > 500 ? '…' : ''}
                        </p>
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

// ── Reports page ─────────────────────────────────────────────────────────────

function Reports() {
  const dispatch = useDispatch();
  const { items: reports, status, error } = useSelector((state) => state.reports);
  const [selectedId, setSelectedId]       = useState(null);
  const [vendorFilter, setVendorFilter]   = useState('');
  const [compareBase, setCompareBase]     = useState(null); // report object
  const [compareTarget, setCompareTarget] = useState(null); // report object

  useEffect(() => {
    dispatch(fetchReports());
  }, [dispatch]);

  const vendors = useMemo(() => {
    const names = [...new Set(reports.map(r => r.vendor).filter(Boolean))];
    return names.sort();
  }, [reports]);

  const filtered = useMemo(() => {
    if (!vendorFilter) return reports;
    return reports.filter(r => r.vendor === vendorFilter);
  }, [reports, vendorFilter]);

  const handleCompareClick = (report) => {
    if (!compareBase) {
      setCompareBase(report);
      return;
    }
    if (compareBase.id === report.id) {
      setCompareBase(null);
      return;
    }
    if (compareBase.vendor !== report.vendor) {
      alert(`Compare both reports must be from the same vendor.\nBase: ${compareBase.vendor} — Selected: ${report.vendor}`);
      return;
    }
    // Sort so oldest is always "base" and newest is "target"
    const [older, newer] = new Date(compareBase.date) < new Date(report.date)
      ? [compareBase, report]
      : [report, compareBase];
    setCompareBase(null);
    setCompareTarget({ base: older, compare: newer });
  };

  return (
    <div>
      <div className="page-header">
        <div className="page-header-text">
          <h1>Crawl History</h1>
          <p>All crawl results per vendor</p>
        </div>
        <button className="btn btn-secondary" onClick={() => dispatch(fetchReports())}>
          ↻ Refresh
        </button>
      </div>

      {compareBase && (
        <div className="alert alert-warning mb-lg" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span>
            <strong>Compare mode:</strong> base selected — <em>{compareBase.vendor}</em> ({formatDate(compareBase.date)}).
            Now click "Compare" on another crawl of the same vendor.
          </span>
          <button className="btn btn-ghost btn-sm" onClick={() => setCompareBase(null)}>✕ Cancel</button>
        </div>
      )}

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
            <h3>No crawls yet</h3>
            <p>Start a crawl from the Vendors page to see results here.</p>
          </div>
        )}

        {status === 'succeeded' && reports.length > 0 && (
          <>
            <div className="card-header" style={{ borderBottom: '1px solid var(--color-gray-200)' }}>
              <div className="flex items-center gap-sm">
                <select
                  className="input"
                  style={{ width: 'auto', minWidth: '180px' }}
                  value={vendorFilter}
                  onChange={e => setVendorFilter(e.target.value)}
                >
                  <option value="">All vendors ({reports.length})</option>
                  {vendors.map(v => (
                    <option key={v} value={v}>{v} ({reports.filter(r => r.vendor === v).length})</option>
                  ))}
                </select>
                {vendorFilter && (
                  <button className="btn btn-ghost btn-sm" onClick={() => setVendorFilter('')}>✕ Clear</button>
                )}
              </div>
            </div>

            <div className="table-wrapper">
              <table className="table">
                <thead>
                  <tr>
                    <th>Vendor</th>
                    <th>Date</th>
                    <th>Pages</th>
                    <th>Errors</th>
                    <th>Status</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(report => {
                    const isBase = compareBase?.id === report.id;
                    return (
                      <tr key={report.id} style={isBase ? { background: 'var(--color-warning-light, #fffbeb)' } : {}}>
                        <td className="font-medium">{report.vendor}</td>
                        <td className="text-muted">{formatDate(report.date)}</td>
                        <td className="text-muted">{report.pages}</td>
                        <td className="text-muted">
                          {report.errors > 0 ? <span className="badge badge-error">{report.errors}</span> : '—'}
                        </td>
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
                          <button
                            className={`btn btn-sm ${isBase ? 'btn-warning' : 'btn-secondary'}`}
                            onClick={() => handleCompareClick(report)}
                            title="Select two crawls from the same vendor to compare"
                          >
                            {isBase ? '✓ Base' : '⇄ Compare'}
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>

      {selectedId && (
        <ReportDetail reportId={selectedId} onClose={() => setSelectedId(null)} />
      )}

      {compareTarget && (
        <CompareModal
          baseReport={compareTarget.base}
          compareReport={compareTarget.compare}
          onClose={() => setCompareTarget(null)}
        />
      )}
    </div>
  );
}

export default Reports;
