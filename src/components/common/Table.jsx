import React from 'react';

function Table({
  columns = [],
  data = [],
  isLoading = false,
  pagination = null,
  onRowClick = null,
  className = '',
  emptyMessage = 'No data available',
}) {
  return (
    <div className={`table-wrapper ${className}`.trim()}>
      <table className="table">
        <thead>
          <tr>
            {columns.map((column, idx) => (
              <th
                key={column.key || idx}
                style={column.width ? { width: column.width } : {}}
              >
                {column.title}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {isLoading ? (
            <tr>
              <td colSpan={columns.length} style={{ textAlign: 'center', padding: '2rem' }}>
                <span className="spinner spinner-md" role="status" aria-label="Loading" />
              </td>
            </tr>
          ) : !Array.isArray(data) || data.length === 0 ? (
            <tr>
              <td
                colSpan={columns.length}
                style={{ textAlign: 'center', padding: '2rem', color: 'var(--color-gray-500)' }}
              >
                {emptyMessage}
              </td>
            </tr>
          ) : (
            data.map((row, rowIdx) => {
              if (!row || typeof row !== 'object') return null;
              return (
                <tr
                  key={row.id || rowIdx}
                  onClick={onRowClick ? () => onRowClick(row) : undefined}
                  style={onRowClick ? { cursor: 'pointer' } : {}}
                >
                  {columns.map((column, colIdx) => {
                    let cellContent;
                    try {
                      if (column.render) {
                        cellContent = column.render(row);
                      } else if (column.key && row[column.key] !== undefined) {
                        cellContent = row[column.key];
                      } else {
                        cellContent = '';
                      }
                    } catch (error) {
                      console.error('Error rendering table cell:', error);
                      cellContent = 'Error';
                    }

                    return (
                      <td key={`${rowIdx}-${colIdx}`}>{cellContent}</td>
                    );
                  })}
                </tr>
              );
            })
          )}
        </tbody>
      </table>

      {pagination && typeof pagination === 'object' && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: 'var(--spacing-md) var(--spacing-lg)',
            borderTop: '1px solid var(--color-gray-200)',
            fontSize: 'var(--font-size-sm)',
          }}
        >
          <p style={{ color: 'var(--color-gray-600)' }}>
            Showing <strong>{pagination.startItem || 0}</strong> to{' '}
            <strong>{pagination.endItem || 0}</strong> of{' '}
            <strong>{pagination.totalItems || 0}</strong> results
          </p>

          <nav style={{ display: 'flex', gap: 'var(--spacing-xs)' }} aria-label="Pagination">
            <button
              className="btn btn-secondary btn-sm"
              onClick={() =>
                typeof pagination.onPageChange === 'function' &&
                pagination.onPageChange(Math.max(1, (pagination.currentPage || 1) - 1))
              }
              disabled={!pagination.currentPage || pagination.currentPage <= 1}
            >
              ← Prev
            </button>

            {[...Array(Math.max(0, pagination.totalPages || 0)).keys()].map((page) => (
              <button
                key={page + 1}
                className={`btn btn-sm ${page + 1 === (pagination.currentPage || 1) ? 'btn-primary' : 'btn-secondary'}`}
                onClick={() =>
                  typeof pagination.onPageChange === 'function' &&
                  pagination.onPageChange(page + 1)
                }
              >
                {page + 1}
              </button>
            ))}

            <button
              className="btn btn-secondary btn-sm"
              onClick={() =>
                typeof pagination.onPageChange === 'function' &&
                pagination.onPageChange(
                  Math.min(pagination.totalPages || 1, (pagination.currentPage || 1) + 1)
                )
              }
              disabled={
                !pagination.currentPage ||
                !pagination.totalPages ||
                pagination.currentPage >= pagination.totalPages
              }
            >
              Next →
            </button>
          </nav>
        </div>
      )}
    </div>
  );
}

export default Table;
