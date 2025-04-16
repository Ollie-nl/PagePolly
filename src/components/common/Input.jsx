import React from 'react';

/**
 * Input component with different types and variations
 * 
 * @param {Object} props - Component props
 * @param {string} props.type - Input type (text, email, password, etc.)
 * @param {string} props.label - Input label
 * @param {string} props.error - Error message
 * @param {string} props.helperText - Helper text
 */
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
  
  const inputClasses = `shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md ${
    error ? 'border-red-300 text-red-900 placeholder-red-300 focus:outline-none focus:ring-red-500 focus:border-red-500' : ''
  } ${className}`;

  return (
    <div className={`${containerClassName}`}>
      {label && (
        <label htmlFor={uniqueId} className="block text-sm font-medium text-gray-700 mb-1">
          {label}
        </label>
      )}
      
      <div className="relative">
        {type === 'textarea' ? (
          <textarea
            id={uniqueId}
            className={inputClasses}
            {...rest}
          />
        ) : (
          <input
            type={type}
            id={uniqueId}
            className={inputClasses}
            {...rest}
          />
        )}
      </div>
      
      {error && (
        <p className="mt-1 text-sm text-red-600">{error}</p>
      )}
      
      {helperText && !error && (
        <p className="mt-1 text-sm text-gray-500">{helperText}</p>
      )}
    </div>
  );
}

export default Input;