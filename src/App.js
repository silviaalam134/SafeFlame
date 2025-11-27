import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';

// Pages
import Homepage from './pages/Homepage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import FireDetection from './pages/FireDetection';
import AlertPage from './pages/AlertPage'; // ✅ New

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Homepage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/fire-detection" element={<FireDetection />} />
        <Route path="/alerts" element={<AlertPage />} /> {/* ✅ New */}
      </Routes>
    </Router>
  );
}

export default App;
