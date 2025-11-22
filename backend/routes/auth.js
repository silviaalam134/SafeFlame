const express = require('express');
const router = express.Router();
const User = require('../models/User');
const jwt = require('jsonwebtoken');
require('dotenv').config();

// Token generate function
const generateToken = (user) => {
  return jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '7d' });
};

// ✅ TEST ROUTE - Add this at the top
router.get('/test', (req, res) => {
  console.log('✅ Auth test route hit');
  res.json({ 
    message: 'Auth routes are working!',
    timestamp: new Date().toISOString()
  });
});

// @route   POST /api/auth/register
// @desc    Register a new user
// @access  Public
router.post('/register', async (req, res) => {
  console.log('📨 REGISTER REQUEST RECEIVED:', req.body);
  
  const { name, email, password } = req.body;

  // Validate input
  if (!name || !email || !password) {
    console.log('❌ Missing fields');
    return res.status(400).json({ message: 'Please fill all fields' });
  }

  try {
    console.log('🔍 Checking if user exists...');
    const userExists = await User.findOne({ email });
    if (userExists) {
      console.log('❌ User already exists:', email);
      return res.status(400).json({ message: 'User already exists' });
    }

    console.log('👤 Creating new user...');
    const user = await User.create({ 
      name: name.trim(),
      email: email.toLowerCase().trim(),
      password: password
    });
    
    console.log('✅ User created successfully:', user.email);

    // Remove password from response
    const userResponse = {
      id: user._id,
      name: user.name,
      email: user.email,
      createdAt: user.createdAt
    };

    res.status(201).json({
      message: 'User registered successfully',
      token: generateToken(user),
      user: userResponse,
    });
    
  } catch (err) {
    console.error('❌ REGISTER ERROR:');
    console.error('Error Name:', err.name);
    console.error('Error Message:', err.message);
    console.error('Error Code:', err.code);
    console.error('Error Stack:', err.stack);
    
    // Handle specific MongoDB errors
    if (err.name === 'ValidationError') {
      return res.status(400).json({ message: 'Validation error: ' + err.message });
    }
    
    if (err.code === 11000) {
      return res.status(400).json({ message: 'Email already exists' });
    }
    
    res.status(500).json({ 
      message: 'Registration failed: ' + err.message 
    });
  }
});

// @route   POST /api/auth/login
// @desc    Authenticate user & get token
// @access  Public
router.post('/login', async (req, res) => {
  console.log('📨 LOGIN REQUEST RECEIVED:', req.body);
  
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: 'Please enter email and password' });
  }

  try {
    console.log('🔍 Finding user...');
    const user = await User.findOne({ email: email.toLowerCase().trim() });
    
    if (!user) {
      console.log('❌ User not found:', email);
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    console.log('🔐 Checking password...');
    const isMatch = await user.matchPassword(password);
    
    if (!isMatch) {
      console.log('❌ Password mismatch for:', email);
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    console.log('✅ Login successful for:', email);
    
    // Remove password from response
    const userResponse = {
      id: user._id,
      name: user.name,
      email: user.email,
      createdAt: user.createdAt
    };

    res.json({
      message: 'Login successful',
      token: generateToken(user),
      user: userResponse,
    });
  } catch (err) {
    console.error('❌ LOGIN ERROR:');
    console.error('Error Message:', err.message);
    console.error('Error Stack:', err.stack);
    
    res.status(500).json({ 
      message: 'Login failed: ' + err.message 
    });
  }
});

// ✅ Additional test route for checking database connection
router.get('/db-status', async (req, res) => {
  try {
    const userCount = await User.countDocuments();
    res.json({ 
      database: 'connected',
      userCount: userCount,
      status: 'healthy'
    });
  } catch (error) {
    res.status(500).json({ 
      database: 'disconnected',
      error: error.message 
    });
  }
});

module.exports = router;