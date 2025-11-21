import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Homepage from './pages/Homepage';
import FireDetection from './pages/FireDetection'; // Make sure this exists
import './App.css';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Homepage />} />
        <Route path="/fire-detection" element={<FireDetection />} />
      </Routes>
    </Router>
  );
}

export default App;
