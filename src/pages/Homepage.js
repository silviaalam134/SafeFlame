import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Dashboard from './Dashboard';
import './Homepage.css';

const Homepage = () => {
  const [stats, setStats] = useState({
    totalAlerts: 0,
    unreadAlerts: 0,
    resolvedAlerts: 0,
  });

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await fetch('http://localhost:5000/alerts');
        const data = await res.json();
        if (Array.isArray(data)) {
          const total = data.length;
          const unread = data.filter(a => a.status?.toLowerCase() === 'unread').length;
          const resolved = total - unread;
          setStats({ totalAlerts: total, unreadAlerts: unread, resolvedAlerts: resolved });
        }
      } catch (err) {
        console.error('Failed to fetch stats:', err);
      }
    };
    fetchStats();
  }, []);

  return (
    <div className="homepage">
      <header className="homepage__header">
        <div className="homepage__logo">SafeFlame</div>
        <nav className="homepage__nav">
          <a href="#home">Home</a>
          <a href="#alerts">Alerts</a>
          <a href="#stats">Statistics</a>
          <a href="#about">About</a>
          <a href="#contact">Contact</a>
        </nav>
      </header>

      {/* Hero Section */}
      <section className="homepage__hero" id="home">
        <h1>Welcome to SafeFlame Dashboard</h1>
        <p>Monitor fire alerts in real-time and stay safe!</p>
        <Link
          to="/fire-detection"
          style={{
            display: 'inline-block',
            marginTop: '20px',
            padding: '12px 24px',
            backgroundColor: '#d32f2f',
            color: 'white',
            borderRadius: '8px',
            textDecoration: 'none',
            fontWeight: '600',
          }}
        >
          Go to Fire Detection
        </Link>
      </section>

      <section className="homepage__alerts" id="alerts">
        <h2>Live Fire Alerts</h2>
        <Dashboard />
      </section>

      <section className="homepage__stats" id="stats">
        <h2>Alert Statistics</h2>
        <div className="homepage__stats-grid">
          <div className="homepage__stat-card">
            <h3>Total Alerts</h3>
            <p>{stats.totalAlerts}</p>
          </div>
          <div className="homepage__stat-card">
            <h3>Unread Alerts</h3>
            <p>{stats.unreadAlerts}</p>
          </div>
          <div className="homepage__stat-card">
            <h3>Resolved Alerts</h3>
            <p>{stats.resolvedAlerts}</p>
          </div>
        </div>
      </section>

      <section className="homepage__about" id="about">
        <h2>About SafeFlame</h2>
        <p>SafeFlame helps you monitor fire hazards instantly with live alerts and updates. Stay safe, stay informed!</p>
      </section>

      <section className="homepage__contact" id="contact">
        <h2>Contact Us</h2>
        <p>Email: support@safeflame.com | Phone: +880 123 456 789</p>
        <div className="homepage__social">
          <a href="!#" onClick={(e) => e.preventDefault()}>Facebook</a>
          <a href="!#" onClick={(e) => e.preventDefault()}>Twitter</a>
          <a href="!#" onClick={(e) => e.preventDefault()}>LinkedIn</a>
        </div>
      </section>

      <footer className="homepage__footer">
        &copy; {new Date().getFullYear()} SafeFlame. All rights reserved.
      </footer>
    </div>
  );
};

export default Homepage;
