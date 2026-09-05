import React, { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import './AdminDashboard.css';

const API_URL = 'http://localhost:5000/api/admin';

const severityColors = {
  low: '#388e3c',
  medium: '#f9a825',
  high: '#ef6c00',
  critical: '#d32f2f'
};

const getStoredUser = () => {
  try {
    return JSON.parse(localStorage.getItem('user') || 'null');
  } catch (error) {
    return null;
  }
};

const AdminDashboard = () => {
  const user = getStoredUser();
  const token = localStorage.getItem('token');
  const [stats, setStats] = useState({ totalUsers: 0, totalAlerts: 0, todaysIncidents: 0, unresolvedAlerts: 0 });
  const [alerts, setAlerts] = useState([]);
  const [users, setUsers] = useState([]);
  const [trend, setTrend] = useState([]);
  const [severity, setSeverity] = useState('');
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const request = async (path, options = {}) => {
    const response = await fetch(`${API_URL}${path}`, {
      ...options,
      headers: { Authorization: `Bearer ${token}`, ...options.headers }
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.message || 'Admin request failed');
    return data;
  };

  const loadDashboard = async () => {
    setLoading(true);
    setError('');
    try {
      const query = new URLSearchParams();
      if (severity) query.set('severity', severity);
      if (status) query.set('status', status);
      const [nextStats, nextAlerts, nextUsers, nextTrend] = await Promise.all([
        request('/stats'),
        request(`/alerts${query.toString() ? `?${query.toString()}` : ''}`),
        request('/users'),
        request('/alerts/trend')
      ]);
      setStats(nextStats);
      setAlerts(nextAlerts);
      setUsers(nextUsers);
      setTrend(nextTrend);
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?.role === 'admin' && token) loadDashboard();
  }, [severity, status]);

  const resolveAlert = async (alertId) => {
    try {
      await request(`/alerts/${alertId}/resolve`, { method: 'PATCH' });
      await loadDashboard();
    } catch (requestError) {
      setError(requestError.message);
    }
  };

  const toggleUser = async (userId) => {
    try {
      await request(`/users/${userId}/deactivate`, { method: 'PATCH' });
      await loadDashboard();
    } catch (requestError) {
      setError(requestError.message);
    }
  };

  if (!user || !token || user.role !== 'admin') return <Navigate to="/dashboard" replace />;

  return (
    <main className="admin-dashboard">
      <header className="admin-dashboard__header">
        <div>
          <p className="admin-dashboard__eyebrow">SafeFlame control center</p>
          <h1>Admin Dashboard</h1>
          <p>Monitor incidents, users, and response activity from one place.</p>
        </div>
        <button className="admin-dashboard__refresh" onClick={loadDashboard}>Refresh data</button>
      </header>

      {error && <div className="admin-dashboard__error">{error}</div>}

      <section id="statistics" className="admin-dashboard__summary" aria-label="Summary statistics">
        <article><span>Total users</span><strong>{stats.totalUsers}</strong></article>
        <article><span>Total alerts</span><strong>{stats.totalAlerts}</strong></article>
        <article><span>Today's incidents</span><strong>{stats.todaysIncidents}</strong></article>
        <article><span>Unresolved alerts</span><strong>{stats.unresolvedAlerts}</strong></article>
      </section>

      <section className="admin-dashboard__panel admin-dashboard__chart-panel">
        <div className="admin-dashboard__section-heading">
          <div><h2>Incident trend</h2><p>Alert volume over the last seven days</p></div>
        </div>
        <div className="admin-dashboard__chart">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={trend}>
              <CartesianGrid strokeDasharray="3 3" stroke="#eadfce" />
              <XAxis dataKey="date" tick={{ fontSize: 12 }} />
              <YAxis allowDecimals={false} />
              <Tooltip />
              <Bar dataKey="count" fill="#d32f2f" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </section>

      <section id="alerts" className="admin-dashboard__panel">
        <div className="admin-dashboard__section-heading admin-dashboard__filters-heading">
          <div><h2>All alerts</h2><p>Review every fire and smoke incident</p></div>
          <div className="admin-dashboard__filters">
            <select value={severity} onChange={(event) => setSeverity(event.target.value)} aria-label="Filter by severity">
              <option value="">All severities</option><option value="low">Low</option><option value="medium">Medium</option><option value="high">High</option><option value="critical">Critical</option>
            </select>
            <select value={status} onChange={(event) => setStatus(event.target.value)} aria-label="Filter by status">
              <option value="">All statuses</option><option value="unresolved">Unresolved</option><option value="resolved">Resolved</option>
            </select>
          </div>
        </div>
        {loading ? <p className="admin-dashboard__empty">Loading dashboard...</p> : (
          <div className="admin-dashboard__table-wrap"><table><thead><tr><th>User</th><th>Date/time</th><th>Severity</th><th>Status</th><th>Action</th></tr></thead><tbody>
            {alerts.map((alert) => <tr key={alert._id}><td>{alert.userId?.name || 'Unknown'}<small>{alert.userId?.email || ''}</small></td><td>{new Date(alert.createdAt).toLocaleString()}</td><td><span className="admin-dashboard__badge" style={{ backgroundColor: severityColors[alert.severity] || '#777' }}>{alert.severity}</span></td><td>{alert.status}</td><td>{alert.status !== 'resolved' && <button className="admin-dashboard__action admin-dashboard__action--resolve" onClick={() => resolveAlert(alert._id)}>Mark as Resolved</button>}</td></tr>)}
            {!alerts.length && <tr><td colSpan="5" className="admin-dashboard__empty">No alerts match these filters.</td></tr>}
          </tbody></table></div>
        )}
      </section>

      <section id="users" className="admin-dashboard__panel">
        <div className="admin-dashboard__section-heading"><div><h2>Users</h2><p>Account access and Telegram connection status</p></div></div>
        <div className="admin-dashboard__table-wrap"><table><thead><tr><th>Name</th><th>Email</th><th>Registered</th><th>Telegram</th><th>Role</th><th>Account</th></tr></thead><tbody>
          {users.map((listedUser) => <tr key={listedUser._id}><td>{listedUser.name}</td><td>{listedUser.email}</td><td>{new Date(listedUser.createdAt).toLocaleDateString()}</td><td><span className={`admin-dashboard__status-badge ${listedUser.telegramChatId ? 'is-positive' : ''}`}>{listedUser.telegramChatId ? 'Yes' : 'No'}</span></td><td>{listedUser.role}</td><td><button className="admin-dashboard__action" onClick={() => toggleUser(listedUser._id)}>{listedUser.isActive ? 'Deactivate' : 'Activate'}</button></td></tr>)}
          {!users.length && <tr><td colSpan="6" className="admin-dashboard__empty">No users found.</td></tr>}
        </tbody></table></div>
      </section>
    </main>
  );
};

export default AdminDashboard;