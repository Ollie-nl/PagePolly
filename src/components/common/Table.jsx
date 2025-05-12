import React from 'react';

/**
 * Reusable table component with sorting and pagination capabilities
 * 
 * @param {Object} props - Component props
 * @param {Array} props.columns - Array of column definitions
 * @param {Array} props.data - Array of data objects
 * @param {boolean} props.isLoading - Whether the table is loading
 * @param {Object} props.pagination - Pagination settings
 * @param {Function} props.onRowClick - Row click handler
 */
function Table({ 
  columns = [], 
  data = [], 
  isLoading = false,
  pagination = null,
  onRowClick = null,
  className = '',
  emptyMessage = 'No data available',
}) {
  // Add hover class if onRowClick is provided
  const rowClass = onRowClick ? 'hover:bg-gray-50 cursor-pointer' : '';

  return (
    <div className={`overflow-x-auto ${className}`}>
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            {columns.map((column, idx) => (
              <th 
                key={column.key || idx}
                scope="col" 
                className={`px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider ${column.className || ''}`}
                style={column.width ? { width: column.width } : {}}
              >
                {column.title}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {isLoading ? (
            <tr>
              <td colSpan={columns.length} className="px-6 py-4 text-center">
                <div className="flex justify-center py-4">
                  <svg className="animate-spin h-6 w-6 text-blue-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                </div>
              </td>
            </tr>
          ) : !Array.isArray(data) || data.length === 0 ? (
            <tr>
              <td colSpan={columns.length} className="px-6 py-8 text-center text-gray-500">
                {emptyMessage}
              </td>
            </tr>
          ) : (
            data.map((row, rowIdx) => {
              if (!row || typeof row !== 'object') return null;
              return (
                <tr 
                  key={row.id || rowIdx} 
                  className={rowClass}
                  onClick={onRowClick ? () => onRowClick(row) : undefined}
                >
                  {columns.map((column, colIdx) => {
                    // Safe rendering of cell content
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
                      <td key={`${rowIdx}-${colIdx}`} className="px-6 py-4 whitespace-nowrap text-sm">
                        {cellContent}
                      </td>
                    );
                  })}
                </tr>
              );
            })
          )}
        </tbody>
      </table>

      {pagination && typeof pagination === 'object' && (
        <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
          <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
            <div>
              <p className="text-sm text-gray-700">
                Showing <span className="font-medium">{pagination.startItem || 0}</span> to{' '}
                <span className="font-medium">{pagination.endItem || 0}</span> of{' '}
                <span className="font-medium">{pagination.totalItems || 0}</span> results
              </p>
            </div>
            <div>
              <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                <button
                  onClick={() => {
                    if (typeof pagination.onPageChange === 'function') {
                      pagination.onPageChange(Math.max(1, (pagination.currentPage || 1) - 1));
                    }
                  }}
                  disabled={!pagination.currentPage || pagination.currentPage <= 1}
                  className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50"
                >
                  <span className="sr-only">Previous</span>
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
                
                {Array.isArray(Array(pagination.totalPages || 0).fill()) && 
                  [...Array(Math.max(0, pagination.totalPages || 0)).keys()].map((page) => (
                    <button
                      key={page + 1}
                      onClick={() => {
                        if (typeof pagination.onPageChange === 'function') {
                          pagination.onPageChange(page + 1);
                        }
                      }}
                      className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                        page + 1 === (pagination.currentPage || 1)
                          ? 'z-10 bg-blue-50 border-blue-500 text-blue-600'
                          : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                      }`}
                    >
                      {page + 1}
                    </button>
                  ))
                }
                
                <button
                  onClick={() => {
                    if (typeof pagination.onPageChange === 'function') {
                      pagination.onPageChange(Math.min((pagination.totalPages || 1), (pagination.currentPage || 1) + 1));
                    }
                  }}
                  disabled={!pagination.currentPage || !pagination.totalPages || pagination.currentPage >= pagination.totalPages}
                  className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50"
                >
                  <span className="sr-only">Next</span>
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </nav>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Table;