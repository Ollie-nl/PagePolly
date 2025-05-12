// src/components/common/Tooltip.jsx
import React from 'react';
import { InformationCircleIcon } from '@heroicons/react/24/outline';

const Tooltip = ({ content }) => {
  return (
    <div className="relative ml-2 group">
      <InformationCircleIcon className="h-4 w-4 text-gray-400 cursor-help" />
      <div className="absolute z-10 invisible group-hover:visible bg-gray-900 text-white text-sm rounded p-2 -left-1/2 -translate-x-1/2 mt-1 w-48">
        <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-gray-900 transform rotate-45" />
        {content}
      </div>
    </div>
  );
};

export default Tooltip;