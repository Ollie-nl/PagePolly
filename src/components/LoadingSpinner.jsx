// src/components/LoadingSpinner.jsx
import React from 'react';

const sizeClass = {
  sm: 'spinner-sm',
  md: 'spinner-md',
  lg: 'spinner-lg',
};

const LoadingSpinner = ({ size = 'md', className = '' }) => {
  return (
    <span
      className={`spinner ${sizeClass[size] || 'spinner-md'} ${className}`}
      role="status"
      aria-label="Loading"
    />
  );
};

export const FullPageSpinner = () => (
  <div className="spinner-page">
    <LoadingSpinner size="lg" />
  </div>
);

export const ButtonSpinner = () => (
  <LoadingSpinner size="sm" className="spinner-inline" />
);

export default LoadingSpinner;
