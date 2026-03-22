import React from 'react';
import { NavLink } from 'react-router-dom';

const navItems = [
  { to: '/',            label: 'Dashboard',   icon: '🏠', end: true },
  { to: '/vendors',     label: 'Vendors',      icon: '🏪' },
  { to: '/reports',     label: 'Reports',      icon: '📊' },
  { to: '/test',        label: 'API Test',     icon: '🔬' },
];

function Sidebar() {
  return (
    <aside className="sidebar">
      <div className="sidebar-logo">PagePolly</div>

      <nav className="sidebar-nav">
        {navItems.map(({ to, label, icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              `sidebar-nav-link${isActive ? ' active' : ''}`
            }
          >
            <span className="sidebar-nav-icon" aria-hidden="true">{icon}</span>
            {label}
          </NavLink>
        ))}
      </nav>

      <hr className="sidebar-divider" />

      <div className="sidebar-footer">
        <p style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-gray-500)' }}>
          PagePolly v1.0.0
        </p>
      </div>
    </aside>
  );
}

export default Sidebar;
