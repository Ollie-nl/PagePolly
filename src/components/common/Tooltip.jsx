// src/components/common/Tooltip.jsx
import React, { useState } from 'react';

const Tooltip = ({ content }) => {
  const [visible, setVisible] = useState(false);

  return (
    <div
      style={{ position: 'relative', display: 'inline-flex', marginLeft: 'var(--spacing-xs)' }}
      onMouseEnter={() => setVisible(true)}
      onMouseLeave={() => setVisible(false)}
      onFocus={() => setVisible(true)}
      onBlur={() => setVisible(false)}
    >
      <button
        type="button"
        aria-label="More information"
        style={{
          background: 'none',
          border: 'none',
          padding: '0 2px',
          cursor: 'help',
          color: 'var(--color-gray-400)',
          fontSize: 'var(--font-size-sm)',
          lineHeight: 1,
          display: 'inline-flex',
          alignItems: 'center',
        }}
      >
        ⓘ
      </button>

      {visible && content && (
        <div
          role="tooltip"
          style={{
            position: 'absolute',
            bottom: '125%',
            left: '50%',
            transform: 'translateX(-50%)',
            backgroundColor: 'var(--color-gray-900)',
            color: 'var(--color-white)',
            fontSize: 'var(--font-size-xs)',
            padding: '0.375rem 0.625rem',
            borderRadius: 'var(--radius-md)',
            whiteSpace: 'normal',
            width: '200px',
            zIndex: 50,
            lineHeight: '1.4',
            boxShadow: 'var(--shadow-lg)',
          }}
        >
          {content}
        </div>
      )}
    </div>
  );
};

export default Tooltip;
