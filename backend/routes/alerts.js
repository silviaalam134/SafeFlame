const express = require('express');
const router = express.Router();
const Alert = require('../models/Alert');

// Get all alerts
router.get('/', async (req, res) => {
  try {
    const alerts = await Alert.find().sort({ createdAt: -1 });
    res.json(alerts);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Create new alert
router.post('/', async (req, res) => {
  try {
    const alert = new Alert({
      type: req.body.type || 'Fire Detected',
      status: req.body.status || 'unread',
      location: req.body.location || 'Camera Feed',
      severity: req.body.severity || 'high'
    });
    
    await alert.save();
    res.status(201).json(alert);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Get alert statistics
router.get('/stats', async (req, res) => {
  try {
    const total = await Alert.countDocuments();
    const unread = await Alert.countDocuments({ status: 'unread' });
    
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