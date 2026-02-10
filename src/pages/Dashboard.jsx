import React, { useEffect, useState } from 'react';
import AlertCard from '../components/AlertCard';
import './Dashboard.css';

const API_URL = 'http://localhost:5000/api/alerts';

const Dashboard = () => {
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [stats, setStats] = useState({ totalAlerts: 0, unreadAlerts: 0, resolvedAlerts: 0 });

  const token = localStorage.getItem('token');

  // -------------------------
  // FETCH ALERTS
  // -------------------------
  const fetchAlerts = async (signal) => {
    if (!token) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const res = await fetch(API_URL, {
        signal,
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) {
        throw new Error(`Server responded with ${res.status}`);
      }

      const data = await res.json();

      if (!Array.isArray(data)) {
        throw new Error('Invalid response format.');
      }

      setAlerts(data);
    } catch (err) {
      if (err.name === 'AbortError') return;
      console.error('Fetch error:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // -------------------------
  // FETCH STATS
  // -------------------------
  const fetchStats = async () => {
    if (!token) return;
    try {
      const res = await fetch(`${API_URL}/stats`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setStats(data);
    } catch (err) {
      console.error('Failed to fetch stats:', err);
    }
  };

  // -------------------------
  // MARK AS READ FUNCTION
  // -------------------------
  const markAsRead = async (id) => {
    try {
      const res = await fetch(`${API_URL}/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status: 'read' }),
      });

      if (!res.ok) throw new Error('Failed to update alert');

      const updatedAlert = await res.json();

      setAlerts(prev => prev.map(alert =>
        alert._id === updatedAlert._id ? updatedAlert : alert
      ));

      fetchStats(); // update stats after marking read
    } catch (err) {
      console.error('Error marking read:', err);
    }
  };

  // -------------------------
  // AUTO FETCH
  // -------------------------
  useEffect(() => {
    const controller = new AbortController();
    fetchAlerts(controller.signal);
    fetchStats();

    const intervalId = setInterval(() => {
      fetchAlerts(controller.signal);
      fetchStats();
    }, 15000); // refresh every 15s

    return () => {
      controller.abort();
      clearInterval(intervalId);
    };
  }, [token]);

  // -------------------------
  // NOT LOGGED IN
  // -------------------------
  if (!token) {
    return (
      <div className="dashboard__login-warning">
        <p>Login to see your previous fire alerts history.</p>
      </div>
    );
  }

  return (
    <main className="dashboard">
      <header className="dashboard__header">
        <h1 className="dashboard__title">Fire Alert Dashboard</h1>
        <p className="dashboard__subtitle">Live list of fire alerts (auto-refreshes)</p>
      </header>

      <div className="dashboard__stats">
        <p>Total Alerts: {stats.totalAlerts}</p>
        <p>Unread Alerts: {stats.unreadAlerts}</p>
        <p>Resolved Alerts: {stats.resolvedAlerts}</p>
      </div>

      <section className="dashboard__content">
        {loading && <div className="dashboard__status">Loading alerts…</div>}
        {error && <div className="dashboard__status dashboard__status--error">Error: {error}</div>}

        {!loading && !error && (
          <>
            {alerts.length === 0 ? (
              <div className="dashboard__empty">No alerts found.</div>
            ) : (
              <div className="dashboard__list">
                {alerts.map((a) => (
                  <AlertCard
                    key={a._id}
                    alert={a}
                    onToggleRead={() => markAsRead(a._id)}
                  />
                ))}
              </div>
            )}
          </>
        )}
      </section>
    </main>
  );
};

export default Dashboard;
