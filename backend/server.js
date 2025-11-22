// CLEAR MODULE CACHE - ADD THESE 3 LINES AT TOP
delete require.cache[require.resolve('./models/User')];
delete require.cache[require.resolve('./routes/auth')];
console.log('🔄 MODULE CACHE CLEARED');

const express = require('express');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const cors = require('cors');

dotenv.config();

const app = express();

// Enhanced CORS
app.use(cors({
  origin: 'http://localhost:3000',
  credentials: true
}));

app.use(express.json());

console.log('🔍 Starting server...');

// ✅ FIXED: MongoDB Connection (remove deprecated options)
mongoose.connect(process.env.MONGO_URI)
.then(() => console.log("✅ MongoDB connected successfully"))
.catch(err => {
  console.log("❌ MongoDB connection failed:");
  console.log("Error:", err.message);
  process.exit(1);
});

// Test route
app.get('/api/test', (req, res) => {
  console.log('🎯 /api/test route hit');
  res.json({ 
    message: 'Server is working!',
    timestamp: new Date().toISOString()
  });
});

// Load auth routes
try {
  const authRoutes = require('./routes/auth');
  app.use('/api/auth', authRoutes);
  console.log('✅ Auth routes loaded successfully');
} catch (error) {
  console.log('❌ Failed to load auth routes:', error.message);
}

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🔥 Server running on port ${PORT}`);
  console.log(`📍 Test URLs:`);
  console.log(`   http://localhost:${PORT}/api/test`);
  console.log(`   http://localhost:${PORT}/api/auth/test`);
  console.log(`   http://localhost:${PORT}/api/auth/db-status`);
});