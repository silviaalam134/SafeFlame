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

  const token = localStorage.getItem('token');

  useEffect(() => {
    const fetchStats = async () => {
      if (!token) return;
      try {
        const res = await fetch('http://localhost:5000/api/alerts/stats', {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) throw new Error('Failed to fetch stats');
        const data = await res.json();
        setStats({
          totalAlerts: data.totalAlerts || 0,
          unreadAlerts: data.unreadAlerts || 0,
          resolvedAlerts: data.resolvedAlerts || 0,
        });
      } catch (err) {
        console.error(err);
      }
    };
    fetchStats();
  }, [token]);

  return (
    <div className="homepage">
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

      {/* Alerts Section */}
      <section className="homepage__alerts" id="alerts">
        <h2>Fire Alerts</h2>
        {token ? <Dashboard /> : <p>Please login to see your previous fire alerts history.</p>}
      </section>

      {/* Statistics Section */}
      <section className="homepage__stats" id="stats">
        <h2>Alert Statistics</h2>
        {token ? (
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
        ) : (
          <p>Please login to view your alert statistics.</p>
        )}
      </section>

      {/* About Section */}
      <section className="homepage__about" id="about">
        <h2>About SafeFlame</h2>
        <p>
          SafeFlame helps you monitor fire hazards instantly with live alerts and updates.
          Stay safe, stay informed!
        </p>
      </section>

      {/* Contact Section */}
      <section className="homepage__contact" id="contact">
        <h2>Contact Us</h2>
        <p>Email: support@safeflame.com | Phone: +880 123 456 789</p>
        <div className="homepage__social">
          <a href="#!" onClick={(e) => e.preventDefault()}>Facebook</a>
          <a href="#!" onClick={(e) => e.preventDefault()}>Twitter</a>
          <a href="#!" onClick={(e) => e.preventDefault()}>LinkedIn</a>
        </div>
      </section>
    </div>
  );
};

export default Homepage;
