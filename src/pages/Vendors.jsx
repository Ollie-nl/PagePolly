// src/pages/Vendors.jsx
import React from 'react';
import VendorManagement from '../components/VendorManagement';

const Vendors = () => {
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Vendor Management</h1>
        <VendorManagement />
      </div>
    </div>
  );
};

export default Vendors;