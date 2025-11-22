import React, { useEffect, useState } from 'react';
import AlertCard from '../components/AlertCard';
import './Dashboard.css';

const API_URL = 'http://localhost:5000/api/alerts';

const Dashboard = () => {
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch alerts from backend
  const fetchAlerts = async (signal) => {
    try {
      setLoading(true);
      setError(null);

      const res = await fetch(API_URL, { signal });

      if (!res.ok) {
        throw new Error(`Server responded with ${res.status}`);
      }

      const data = await res.json();

      // Expecting array of alerts; defensive check
      if (!Array.isArray(data)) {
        throw new Error('Invalid response format: expected an array of alerts');
      }

      setAlerts(data);
    } catch (err) {
      if (err.name === 'AbortError') return; // fetch was aborted due to unmount
      console.error('Failed to fetch alerts:', err);
      setError(err.message || 'Failed to fetch alerts');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const controller = new AbortController();
    fetchAlerts(controller.signal);

    // Poll every 15 seconds to keep dashboard fresh (adjust as needed)
    const id = setInterval(() => fetchAlerts(controller.signal), 15000);

    return () => {
      controller.abort();
      clearInterval(id);
    };
  }, []);

  return (
    <main className="dashboard">
      <header className="dashboard__header">
        <h1 className="dashboard__title">Fire Alert Dashboard</h1>
        <p className="dashboard__subtitle">Live list of fire alerts (auto-refreshes)</p>
      </header>

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
                  // Use a stable key if available (id or _id), otherwise fallback to timestamp+type
                  <AlertCard
                    key={a.id ?? a._id ?? `${a.type}-${a.timestamp}`}
                    alert={a}
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