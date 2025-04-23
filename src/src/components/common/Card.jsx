import React from 'react';

/**
 * Card component for displaying content in a boxed container
 * 
 * @param {Object} props - Component props
 * @param {string} props.title - Card title
 * @param {React.ReactNode} props.children - Card content
 * @param {string} props.footer - Card footer
 * @param {boolean} props.isLoading - Whether the card is in loading state
 */
function Card({ 
  title, 
  children, 
  footer, 
  className = '',
  isLoading = false,
  headerAction,
  ...rest 
}) {
  return (
    <div 
      className={`bg-white rounded-lg shadow overflow-hidden ${className}`}
      {...rest}
    >
      {title && (
        <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
          <h3 className="text-lg font-medium text-gray-900">{title}</h3>
          {headerAction && (
            <div>{headerAction}</div>
          )}
        </div>
      )}

      <div className="p-6 relative">
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <svg className="animate-spin h-8 w-8 text-blue-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          </div>
        ) : children}
      </div>
      
      {footer && (
        <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
          {footer}
        </div>
      )}
    </div>
  );
}

export default Card;