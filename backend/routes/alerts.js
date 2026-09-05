const express = require('express');
const router = express.Router();
const Alert = require('../models/Alert');
const authMiddleware = require('../middleware/auth');
const isUser = require('../middleware/isUser');

// Admin accounts use the separate admin APIs instead of personal alert APIs.
router.use(authMiddleware, isUser);

// GET all alerts
router.get('/', async (req, res) => {
  try {
    const alerts = await Alert.find({ userId: req.userId }).sort({ createdAt: -1 });
    res.json(alerts);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// POST create new alert
router.post('/', async (req, res) => {
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
router.patch('/:id', async (req, res) => {
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
router.get('/stats', async (req, res) => {
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
