import React from 'react';

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
    <div className={`card ${className}`.trim()} {...rest}>
      {title && (
        <div className="card-header">
          <h3 className="h4">{title}</h3>
          {headerAction && <div>{headerAction}</div>}
        </div>
      )}

      <div className="card-body">
        {isLoading ? (
          <div className="flex items-center justify-center" style={{ padding: '2rem 0' }}>
            <span className="spinner spinner-md" role="status" aria-label="Loading" />
          </div>
        ) : children}
      </div>

      {footer && (
        <div className="card-footer">
          {footer}
        </div>
      )}
    </div>
  );
}

export default Card;
