import React, { useEffect, useState } from 'react';
import AlertCard from '../components/AlertCard';
import { useNavigate } from 'react-router-dom';
import './AlertPage.css';

const AlertPage = () => {
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const fetchAlerts = async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      setError('Login to see your previous fire alerts history.');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const res = await fetch('http://localhost:5000/api/alerts', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to fetch alerts');
      setAlerts(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAlerts();
  }, []);

  return (
    <div className="alert-page">
      <h1>Fire Alerts</h1>

      {loading && <p>Loading alerts...</p>}
      {error && <p className="alert-page__error">{error}</p>}

      {!loading && !error && alerts.length === 0 && (
        <p>No fire alerts found.</p>
      )}

      <div className="alert-page__list">
        {alerts.map(a => (
          <AlertCard
            key={a._id}
            alert={a}
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
