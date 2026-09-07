import React from "react";
import './Header.css';
import { Link, useNavigate } from "react-router-dom";

const Header = () => {
  const navigate = useNavigate();
  const userName = localStorage.getItem("userName") || "";
  const isAdmin = (() => {
    try {
      return JSON.parse(localStorage.getItem('user') || 'null')?.role === 'admin';
    } catch (error) {
      return false;
    }
  })();

  const handleLogout = () => {
    // Clear the session data so protected routes cannot be opened after logout.
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('userName');
    navigate('/login');
  };

  return (
    <header className="homepage__header">
      <div className="homepage__logo">SafeFlame</div>
      <nav className="homepage__nav">
        {isAdmin ? (
          // Admins see only links to their own management features.
          <>
            <Link to="/admin">Admin Dashboard</Link>
            <a href="/admin#alerts">Alerts</a>
            <a href="/admin#users">Users</a>
            <a href="/admin#statistics">Statistics</a>
          </>
        ) : (
          <>
            <Link to="/">Home</Link>
            <Link to="/#alerts">Alerts</Link>
            <Link to="/#stats">Statistics</Link>
            <Link to="/#about">About</Link>
            <Link to="/#contact">Contact</Link>
            <Link to="/fire-detection">Fire Detection</Link>
            <Link to="/dashboard">Dashboard</Link>
            <Link to="/first-aid">First Aid</Link>
          </>
        )}

        {/* Conditional buttons */}
        {userName ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button
              onClick={() => navigate(isAdmin ? '/admin' : '/dashboard')}
              style={{
                padding: '8px 16px',
                backgroundColor: 'green',
                color: 'white',
                borderRadius: '6px',
                border: 'none',
                fontWeight: '600',
                cursor: 'pointer',
              }}
            >
              {userName}
            </button>
            <button
              onClick={handleLogout}
              style={{
                padding: '8px 12px',
                backgroundColor: '#8b1e1e',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                fontWeight: '600',
                cursor: 'pointer',
              }}
            >
              Logout
            </button>
          </div>
        ) : (
          <Link
            to="/login"
            style={{
              padding: '8px 16px',
              backgroundColor: '#d32f2f',
              color: 'white',
              borderRadius: '6px',
              fontWeight: '600',
              textDecoration: 'none',
            }}
          >
            Login
          </Link>
        )}

      </nav>
    </header>
  );
};

export default Header;
