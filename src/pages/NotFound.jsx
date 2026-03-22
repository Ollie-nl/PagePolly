import React from 'react';
import { Link } from 'react-router-dom';

function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center text-center" style={{ padding: '4rem 1rem', minHeight: '60vh' }}>
      <div
        style={{
          fontSize: '5rem',
          fontWeight: 700,
          color: 'var(--color-gray-300)',
          lineHeight: 1,
          marginBottom: '1rem'
        }}
      >
        404
      </div>

      <h1 style={{ fontSize: 'var(--font-size-3xl)', marginBottom: '0.75rem' }}>
        Page Not Found
      </h1>

      <p className="text-muted" style={{ maxWidth: '400px', marginBottom: '2rem' }}>
        The page you're looking for doesn't exist or has been moved.
      </p>

      <div className="flex gap-sm">
        <button
          className="btn btn-secondary"
          onClick={() => window.history.back()}
        >
          ← Go Back
        </button>
        <Link to="/" className="btn btn-primary">
          Go to Dashboard
        </Link>
      </div>

      <div style={{ marginTop: '3rem', color: 'var(--color-gray-300)' }}>
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1"
          strokeLinecap="round"
          strokeLinejoin="round"
          style={{ width: '10rem', height: '10rem' }}
          aria-hidden="true"
        >
          <circle cx="12" cy="12" r="10" />
          <line x1="12" y1="8" x2="12" y2="12" />
          <line x1="12" y1="16" x2="12.01" y2="16" />
        </svg>
      </div>
    </div>
  );
}

export default NotFound;
