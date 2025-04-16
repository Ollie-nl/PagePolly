import React from 'react';
import { Outlet } from 'react-router-dom';
import Navbar from '../components/common/Navbar';
import Sidebar from '../components/common/Sidebar';

function MainLayout() {
  return (
    <div className="flex flex-col h-screen bg-gray-100">
      {/* Top navigation */}
      <Navbar />
      
      {/* Content area with sidebar */}
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar navigation */}
        <Sidebar />
        
        {/* Main content */}
        <main className="flex-1 overflow-x-hidden overflow-y-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

export default MainLayout;