const express = require('express');
const router = express.Router();
const Alert = require('../models/Alert');
const jwt = require('jsonwebtoken');
require('dotenv').config();

// Middleware to verify token and get user
const authMiddleware = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1]; // Expect: "Bearer TOKEN"
  if (!token) return res.status(401).json({ message: 'No token provided' });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.userId = decoded.id;
    next();
  } catch (err) {
    res.status(401).json({ message: 'Invalid token' });
  }
};

// Get all alerts for logged-in user
router.get('/', authMiddleware, async (req, res) => {
  try {
    const alerts = await Alert.find({ userId: req.userId }).sort({ createdAt: -1 });
    res.json(alerts);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Create new alert for logged-in user
router.post('/', authMiddleware, async (req, res) => {
  try {
    const alert = new Alert({
      userId: req.userId,
      type: req.body.type || 'Fire Detected',
      status: req.body.status || 'unread',
      location: req.body.location || 'Camera Feed',
      severity: req.body.severity || 'high',
      detectedBy: req.body.detectedBy || 'Unknown User'
    });
    
    await alert.save();
    res.status(201).json(alert);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Get alert statistics for logged-in user
router.get('/stats', authMiddleware, async (req, res) => {
  try {
    const total = await Alert.countDocuments({ userId: req.userId });
    const unread = await Alert.countDocuments({ userId: req.userId, status: 'unread' });
    
    res.json({
      totalAlerts: total,
      unreadAlerts: unread,
      resolvedAlerts: total - unread
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
