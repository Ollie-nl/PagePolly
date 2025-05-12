import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';

function Navbar() {
  const { user, logout } = useAuth();

  const handleLogout = async () => {
    const { error } = await logout();
    if (error) {
      console.error('Error logging out:', error);
    }
  };

  return (
    <nav className="bg-gray-800 text-white shadow-lg">
      <div className="mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center">
            <Link to="/" className="flex-shrink-0 flex items-center">
              <span className="font-bold text-xl tracking-tight">PagePolly</span>
            </Link>
          </div>
          
          <div className="flex items-center space-x-4">
            <div className="px-3 py-2 rounded-md text-sm font-medium">
              <span className="text-gray-200">Monitoring Vendor Compliance</span>
            </div>

            {user && (
              <div className="flex items-center space-x-4">
                <div className="text-sm">
                  <span className="text-gray-300">Signed in as </span>
                  <span className="text-gray-100 font-medium">{user.email}</span>
                </div>
                
                <button
                  onClick={handleLogout}
                  className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                >
                  Sign Out
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}

export default Navbar;