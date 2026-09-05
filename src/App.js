import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';

import Layout from './pages/Layout';
import Homepage from './pages/Homepage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import FireDetection from './pages/FireDetection';
import ProfilePage from './pages/ProfilePage';
import AdminDashboard from './pages/AdminDashboard';
import Dashboard from './pages/Dashboard';
import FirstAidChatbot from './pages/FirstAidChatbot';

const getStoredRole = () => {
  try {
    return JSON.parse(localStorage.getItem('user') || 'null')?.role;
  } catch (error) {
    return null;
  }
};

const UserOnlyRoute = ({ children }) => (
  getStoredRole() === 'admin' ? <Navigate to="/admin" replace /> : children
);

const AdminOnlyRoute = ({ children }) => (
  getStoredRole() === 'admin' ? children : <Navigate to="/dashboard" replace />
);

function App() {
  return (
    <Router>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<Homepage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/fire-detection" element={<UserOnlyRoute><FireDetection /></UserOnlyRoute>} />
          <Route path="/profile" element={<UserOnlyRoute><ProfilePage /></UserOnlyRoute>} />
          <Route path="/dashboard" element={<UserOnlyRoute><Dashboard /></UserOnlyRoute>} />
          <Route path="/first-aid" element={<UserOnlyRoute><FirstAidChatbot /></UserOnlyRoute>} />
          <Route path="/admin" element={<AdminOnlyRoute><AdminDashboard /></AdminOnlyRoute>} />
        </Route>
      </Routes>
    </Router>
  );
}

export default App;
