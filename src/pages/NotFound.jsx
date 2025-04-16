import React from 'react';
import { Link } from 'react-router-dom';

function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center h-full py-16 px-4 sm:px-6 lg:px-8">
      <div className="flex flex-col items-center max-w-md">
        <div className="text-6xl text-gray-400 font-bold mb-4">404</div>
        
        <h1 className="text-3xl font-bold text-gray-900">Page Not Found</h1>
        
        <p className="mt-3 text-lg text-gray-600 text-center">
          The page you're looking for doesn't exist or has been moved.
        </p>
        
        <div className="mt-8 flex items-center justify-center space-x-3">
          <button 
            onClick={() => window.history.back()} 
            className="bg-white py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Go Back
          </button>
          <Link 
            to="/" 
            className="bg-blue-600 py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white hover:bg-blue-700"
          >
            Go to Dashboard
          </Link>
        </div>
        
        <div className="mt-12">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="w-48 h-48 text-gray-300"
          >
            <circle cx="12" cy="12" r="10"></circle>
            <line x1="12" y1="8" x2="12" y2="12"></line>
            <line x1="12" y1="16" x2="12.01" y2="16"></line>
          </svg>
        </div>
      </div>
    </div>
  );
}

export default NotFound;