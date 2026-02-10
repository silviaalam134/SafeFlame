const express = require('express');
const router = express.Router();
const Alert = require('../models/Alert');
const jwt = require('jsonwebtoken');
require('dotenv').config();

// Middleware to verify JWT token
const authMiddleware = (req, res, next) => {
  const authHeader = req.headers.authorization; // "Bearer TOKEN"
  if (!authHeader) return res.status(401).json({ message: 'No token provided' });

  const token = authHeader.split(' ')[1];
  if (!token) return res.status(401).json({ message: 'Malformed token' });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.userId = decoded.id;
    next();
  } catch (err) {
    return res.status(401).json({ message: 'Invalid or expired token' });
  }
};

// GET all alerts
router.get('/', authMiddleware, async (req, res) => {
  try {
    const alerts = await Alert.find({ userId: req.userId }).sort({ createdAt: -1 });
    res.json(alerts);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// POST create new alert
router.post('/', authMiddleware, async (req, res) => {
  const { type, status = 'unread', location = 'Camera Feed', severity = 'high', detectedBy = '' } = req.body;
  try {
    const newAlert = await Alert.create({
      userId: req.userId,
      type,
      status,
      location,
      severity,
      detectedBy
    });
    res.status(201).json(newAlert);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// PATCH alert status (mark as read/unread)
router.patch('/:id', authMiddleware, async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  if (!['unread', 'read'].includes(status)) return res.status(400).json({ message: 'Invalid status' });

  try {
    const alert = await Alert.findOneAndUpdate(
      { _id: id, userId: req.userId },
      { status },
      { new: true }
    );
    if (!alert) return res.status(404).json({ message: 'Alert not found' });
    res.json(alert);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// GET alert statistics
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
