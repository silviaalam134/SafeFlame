const express = require('express');
const mongoose = require('mongoose');
const User = require('../models/User');
const Alert = require('../models/Alert');
const authMiddleware = require('../middleware/auth');
const isAdmin = require('../middleware/isAdmin');

const router = express.Router();

// All admin endpoints require a valid JWT and an admin role.
router.use(authMiddleware, isAdmin);

// GET /api/admin/stats
router.get('/stats', async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [totalUsers, totalAlerts, todaysIncidents, unresolvedAlerts] = await Promise.all([
      User.countDocuments(),
      Alert.countDocuments(),
      Alert.countDocuments({ createdAt: { $gte: today } }),
      Alert.countDocuments({ status: { $ne: 'resolved' } })
    ]);

    res.json({ totalUsers, totalAlerts, todaysIncidents, unresolvedAlerts });
  } catch (error) {
    console.error('Failed to load admin stats:', error.message);
    res.status(500).json({ message: 'Failed to load admin stats' });
  }
});

// GET /api/admin/alerts?severity=high&status=resolved|unresolved
router.get('/alerts', async (req, res) => {
  try {
    const { severity, status } = req.query;
    const filter = {};

    if (['low', 'medium', 'high', 'critical'].includes(severity)) {
      filter.severity = severity;
    }
    if (status === 'resolved') filter.status = 'resolved';
    if (status === 'unresolved') filter.status = { $ne: 'resolved' };

    const alerts = await Alert.find(filter)
      .populate('userId', 'name email')
      .sort({ createdAt: -1 });

    res.json(alerts);
  } catch (error) {
    console.error('Failed to load admin alerts:', error.message);
    res.status(500).json({ message: 'Failed to load admin alerts' });
  }
});

// PATCH /api/admin/alerts/:id/resolve
router.patch('/alerts/:id/resolve', async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ message: 'Invalid alert id' });
    }

    const alert = await Alert.findByIdAndUpdate(
      req.params.id,
      { status: 'resolved' },
      { new: true }
    ).populate('userId', 'name email');

    if (!alert) return res.status(404).json({ message: 'Alert not found' });
    res.json(alert);
  } catch (error) {
    console.error('Failed to resolve admin alert:', error.message);
    res.status(500).json({ message: 'Failed to resolve alert' });
  }
});

// GET /api/admin/users
router.get('/users', async (req, res) => {
  try {
    const users = await User.find()
      .select('-password')
      .sort({ createdAt: -1 });

    res.json(users);
  } catch (error) {
    console.error('Failed to load admin users:', error.message);
    res.status(500).json({ message: 'Failed to load admin users' });
  }
});

// PATCH /api/admin/users/:id/deactivate
router.patch('/users/:id/deactivate', async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ message: 'Invalid user id' });
    }

    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    user.isActive = !user.isActive;
    await user.save();

    const userResponse = user.toObject();
    delete userResponse.password;
    res.json(userResponse);
  } catch (error) {
    console.error('Failed to toggle user status:', error.message);
    res.status(500).json({ message: 'Failed to toggle user status' });
  }
});

// GET /api/admin/alerts/trend
router.get('/alerts/trend', async (req, res) => {
  try {
    const startDate = new Date();
    startDate.setHours(0, 0, 0, 0);
    startDate.setDate(startDate.getDate() - 6);

    const groupedAlerts = await Alert.aggregate([
      { $match: { createdAt: { $gte: startDate } } },
      {
        $group: {
          _id: {
            $dateToString: { format: '%Y-%m-%d', date: '$createdAt' }
          },
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    const countsByDay = new Map(groupedAlerts.map((item) => [item._id, item.count]));
    const trend = [];
    for (let offset = 0; offset < 7; offset += 1) {
      const day = new Date(startDate);
      day.setDate(startDate.getDate() + offset);
      const date = day.toISOString().slice(0, 10);
      trend.push({ date, count: countsByDay.get(date) || 0 });
    }

    res.json(trend);
  } catch (error) {
    console.error('Failed to load alert trend:', error.message);
    res.status(500).json({ message: 'Failed to load alert trend' });
  }
});

module.exports = router;