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
    <nav className="topbar" style={{ left: 0 }}>
      <div className="topbar-left">
        <Link to="/" style={{ fontWeight: 700, fontSize: 'var(--font-size-xl)', color: 'var(--color-gray-900)', textDecoration: 'none' }}>
          PagePolly
        </Link>
        <span className="text-muted text-sm">Monitoring Vendor Compliance</span>
      </div>

      {user && (
        <div className="topbar-right">
          <span className="topbar-user">{user.email}</span>
          <button className="btn btn-danger btn-sm" onClick={handleLogout}>
            Sign Out
          </button>
        </div>
      )}
    </nav>
  );
}

export default Navbar;
