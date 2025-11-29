import React from "react";
import './Header.css';
import { Link, useNavigate } from "react-router-dom";

const Header = () => {
  const navigate = useNavigate();
  const userName = localStorage.getItem("userName") || "";

  return (
    <header className="homepage__header">
      <div className="homepage__logo">SafeFlame</div>
      <nav className="homepage__nav">

        {/* Home button should route to '/' */}
        <Link to="/">Home</Link>

        {/* Anchor links for sections (only work on homepage) */}
        <a href="#alerts">Alerts</a>
        <a href="#stats">Statistics</a>
        <a href="#about">About</a>
        <a href="#contact">Contact</a>

        {/* Route links */}
        <Link to="/fire-detection">Fire Detection</Link>

        {/* Conditional buttons */}
        {userName ? (
          <button
            onClick={() => navigate('/profile')}
            style={{
              padding: '8px 16px',
              backgroundColor: 'green',
              color: 'white',
              borderRadius: '6px',
              fontWeight: '600',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}
          >
            {userName}
          </button>
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
