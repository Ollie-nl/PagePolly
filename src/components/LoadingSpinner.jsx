// src/components/LoadingSpinner.jsx
import React from 'react';

const LoadingSpinner = ({ size = 'md', className = '' }) => {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-8 w-8',
    lg: 'h-12 w-12'
  };

  return (
    <div className={`relative ${className}`}>
      <div
        className={`animate-spin rounded-full border-2 border-gray-200 border-t-blue-600 ${sizeClasses[size]}`}
      />
      <span className="sr-only">Loading...</span>
    </div>
  );
};

export const FullPageSpinner = () => (
  <div className="fixed inset-0 flex items-center justify-center bg-gray-100 bg-opacity-75 z-50">
    <LoadingSpinner size="lg" />
  </div>
);

export const ButtonSpinner = () => (
  <LoadingSpinner size="sm" className="mr-2" />
);

export default LoadingSpinner;