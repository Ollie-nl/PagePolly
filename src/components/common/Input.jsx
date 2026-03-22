import React from 'react';

function Input({
  type = 'text',
  label,
  error,
  helperText,
  id,
  className = '',
  containerClassName = '',
  ...rest
}) {
  const uniqueId = id || `input-${Math.random().toString(36).substring(2, 9)}`;

  return (
    <div className={`form-group ${containerClassName}`.trim()}>
      {label && (
        <label htmlFor={uniqueId} className="form-label">
          {label}
        </label>
      )}

      {type === 'textarea' ? (
        <textarea
          id={uniqueId}
          className={`textarea${error ? ' error' : ''} ${className}`.trim()}
          {...rest}
        />
      ) : (
        <input
          type={type}
          id={uniqueId}
          className={`input${error ? ' error' : ''} ${className}`.trim()}
          {...rest}
        />
      )}

      {error && <p className="form-error">{error}</p>}
      {helperText && !error && <p className="form-hint">{helperText}</p>}
    </div>
  );
}

export default Input;
