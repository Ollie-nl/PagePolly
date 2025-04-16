import React from 'react';
import { Link } from 'react-router-dom';

function Navbar() {
  return (
    <nav className="bg-gray-800 text-white shadow-lg">
      <div className="mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center">
            <Link to="/" className="flex-shrink-0 flex items-center">
              <span className="font-bold text-xl tracking-tight">PagePolly</span>
            </Link>
          </div>
          <div className="flex items-center">
            <div className="ml-4 px-3 py-2 rounded-md text-sm font-medium">
              <span className="text-gray-200">Monitoring Vendor Compliance</span>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}

export default Navbar;