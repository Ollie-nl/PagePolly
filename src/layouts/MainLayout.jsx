// MainLayout.jsx
import React, { useState } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import supabaseClient from '../lib/supabaseClient';

const menuItems = [
  { text: 'Dashboard',    icon: '🏠', path: '/' },
  { text: 'Vendors',      icon: '🏪', path: '/vendors' },
  { text: 'Reports',      icon: '📊', path: '/reports' },
  { text: 'Test Crawler', icon: '🐛', path: '/test-crawler' },
];

const MainLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const navigate = useNavigate();
  const { user } = useAuth();

  const handleLogout = async () => {
    try {
      await supabaseClient.auth.signOut();
      navigate('/login');
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  const closeSidebar = () => setSidebarOpen(false);

  return (
    <div className="app-shell">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="sidebar-overlay open"
          onClick={closeSidebar}
          aria-hidden="true"
        />
      )}

      {/* Sidebar */}
      <aside className={`sidebar${sidebarOpen ? ' open' : ''}`}>
        <div className="sidebar-logo">
          PagePolly
        </div>

        <nav className="sidebar-nav">
          {menuItems.map((item) => (
            <NavLink
              key={item.text}
              to={item.path}
              end={item.path === '/'}
              className={({ isActive }) =>
                `sidebar-nav-link${isActive ? ' active' : ''}`
              }
              onClick={closeSidebar}
            >
              <span className="sidebar-nav-icon" aria-hidden="true">{item.icon}</span>
              {item.text}
            </NavLink>
          ))}
        </nav>

        <hr className="sidebar-divider" />

        <div className="sidebar-footer">
          <button
            className="sidebar-nav-link btn-ghost"
            style={{ width: '100%', color: 'var(--color-gray-300)' }}
            onClick={handleLogout}
          >
            <span className="sidebar-nav-icon" aria-hidden="true">↩</span>
            Logout
          </button>
        </div>
      </aside>

      {/* Top bar */}
      <header className="topbar">
        <div className="topbar-left">
          <button
            className="mobile-menu-btn"
            onClick={() => setSidebarOpen(!sidebarOpen)}
            aria-label="Toggle sidebar"
          >
            ☰
          </button>
        </div>
        <div className="topbar-right">
          {user?.email && (
            <span className="topbar-user">{user.email}</span>
          )}
          <button className="btn btn-secondary btn-sm" onClick={handleLogout}>
            Logout
          </button>
        </div>
      </header>

      {/* Page content */}
      <main className="main-content">
        <Outlet />
      </main>
    </div>
  );
};

export default MainLayout;
