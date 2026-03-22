// src/pages/Vendors.jsx
import React from 'react';
import VendorManagement from '../components/VendorManagement';

const Vendors = () => {
  return (
    <div>
      <div className="page-header">
        <div className="page-header-text">
          <h1>Vendor Management</h1>
          <p>Manage your vendors and initiate crawl jobs</p>
        </div>
      </div>
      <VendorManagement />
    </div>
  );
};

export default Vendors;
