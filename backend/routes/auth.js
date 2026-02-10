const express = require('express');
const router = express.Router();
const User = require('../models/User');
const jwt = require('jsonwebtoken');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

// Token generate function
const generateToken = (user) => {
  return jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '7d' });
};

// ✅ TEST ROUTE
router.get('/test', (req, res) => {
  res.json({ message: 'Auth routes are working!', timestamp: new Date().toISOString() });
});

// @route   POST /api/auth/register
router.post('/register', async (req, res) => {
  const { name, email, password, address, phone } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({ message: 'Please fill all fields' });
  }

  try {
    const userExists = await User.findOne({ email });
    if (userExists) return res.status(400).json({ message: 'User already exists' });

    const user = await User.create({ name, email, password, address, phone });

    const userResponse = {
      id: user._id,
      name: user.name,
      email: user.email,
      address: user.address,
      phone: user.phone,
      createdAt: user.createdAt
    };

    res.status(201).json({ message: 'User registered successfully', token: generateToken(user), user: userResponse });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Registration failed: ' + err.message });
  }
});

// @route   POST /api/auth/login
router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ message: 'Please enter email and password' });

  try {
    const user = await User.findOne({ email: email.toLowerCase().trim() });
    if (!user) return res.status(400).json({ message: 'Invalid credentials' });

    const isMatch = await user.matchPassword(password);
    if (!isMatch) return res.status(400).json({ message: 'Invalid credentials' });

    const userResponse = {
      id: user._id,
      name: user.name,
      email: user.email,
      address: user.address,
      phone: user.phone,
      createdAt: user.createdAt
    };

    res.json({ message: 'Login successful', token: generateToken(user), user: userResponse });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Login failed: ' + err.message });
  }
});

// @route   GET /api/auth/profile
// @desc    Get logged in user's profile
// @access  Private (requires token)
router.get('/profile', async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ message: 'No token provided' });

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id).select('-password');
    if (!user) return res.status(404).json({ message: 'User not found' });

    res.json(user);
  } catch (err) {
    console.error(err);
    res.status(401).json({ message: 'Unauthorized: ' + err.message });
  }
});

module.exports = router;
