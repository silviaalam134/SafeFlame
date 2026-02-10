import React, { useEffect, useState } from 'react';
import AlertCard from '../components/AlertCard';
import { useNavigate } from 'react-router-dom';
import './AlertPage.css';

const API_URL = 'http://localhost:5000/api/alerts';

const AlertPage = () => {
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [stats, setStats] = useState({ totalAlerts: 0, unreadAlerts: 0, resolvedAlerts: 0 });
  const navigate = useNavigate();

  const token = localStorage.getItem('token');

  // Fetch alerts
  const fetchAlerts = async () => {
    if (!token) {
      setError('Login to see your previous fire alerts history.');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const res = await fetch(`${API_URL}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (!res.ok && data.message) throw new Error(data.message);
      setAlerts(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Fetch alert statistics
  const fetchStats = async () => {
    try {
      const res = await fetch(`${API_URL}/stats`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      setStats(data);
    } catch (err) {
      console.error('Failed to fetch stats:', err);
    }
  };

  // Toggle alert read/unread
  const toggleRead = async (alertId, currentStatus) => {
    try {
      const res = await fetch(`${API_URL}/${alertId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ status: currentStatus === 'unread' ? 'read' : 'unread' })
      });
      const updatedAlert = await res.json();
      setAlerts(prev => prev.map(a => (a._id === updatedAlert._id ? updatedAlert : a)));
      fetchStats(); // update stats
    } catch (err) {
      console.error('Failed to update alert status:', err);
    }
  };

  useEffect(() => {
    fetchAlerts();
    fetchStats();
  }, []);

  if (!token) {
    return (
      <div className="alert-page__login-warning">
        <p>Login to see your previous fire alerts history.</p>
      </div>
    );
  }

  return (
    <div className="alert-page">
      <h1>Fire Alerts</h1>

      <div className="alert-page__stats">
        <p>Total Alerts: {stats.totalAlerts}</p>
        <p>Unread Alerts: {stats.unreadAlerts}</p>
        <p>Resolved Alerts: {stats.resolvedAlerts}</p>
      </div>

      {loading && <p>Loading alerts...</p>}
      {error && <p className="alert-page__error">{error}</p>}
      {!loading && !error && alerts.length === 0 && <p>No fire alerts found.</p>}

      <div className="alert-page__list">
        {alerts.map(a => (
          <AlertCard
            key={a._id}
            alert={a}
            onToggleRead={() => toggleRead(a._id, a.status)}
          />
        ))}
      </div>

      <button onClick={() => navigate('/')} className="alert-page__back">
        Back to Home
      </button>
    </div>
  );
};

export default AlertPage;
