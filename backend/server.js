// 🔄 CLEAR MODULE CACHE - DEVELOPMENT ONLY
try {
  delete require.cache[require.resolve('./models/User')];
  delete require.cache[require.resolve('./routes/auth')];
  delete require.cache[require.resolve('./routes/alerts')];
  delete require.cache[require.resolve('./routes/detectFire')];
  delete require.cache[require.resolve('./routes/alarmTimer')];
  console.log('🔄 MODULE CACHE CLEARED');
} catch (err) {
  console.log('⚠️ Module cache clear warning:', err.message);
}

const express = require('express');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const cors = require('cors');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '.env') });

const app = express();

// Middleware
app.use(express.json());
app.use(cors({
  origin: ['http://localhost:3000', 'http://localhost:3001'], // React app origins
  credentials: true
}));

console.log('🔍 Starting server...');

// ✅ MONGO DB CONNECTION
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("✅ MongoDB connected successfully"))
  .catch(err => {
    console.log("❌ MongoDB connection failed:");
    console.log("Error:", err.message);
    process.exit(1);
  });

// 🔹 TEST ROUTE
app.get('/api/test', (req, res) => {
  console.log('🎯 /api/test route hit');
  res.json({ 
    message: 'Server is working!',
    timestamp: new Date().toISOString()
  });
});

// 🔹 LOAD AUTH ROUTES
try {
  const authRoutes = require('./routes/auth');
  app.use('/api/auth', authRoutes);
  console.log('✅ Auth routes loaded successfully');
} catch (error) {
  console.log('❌ Failed to load auth routes:', error.message);
}

// 🔹 LOAD ALERT ROUTES
try {
  const alertRoutes = require('./routes/alerts');
  app.use('/api/alerts', alertRoutes);
  console.log('✅ Alert routes loaded successfully');
} catch (error) {
  console.log('❌ Failed to load alert routes:', error.message);
}

// 🔹 LOAD ROBOFLOW FIRE DETECTION ROUTE
try {
  const detectFireRoutes = require('./routes/detectFire');
  app.use('/api', detectFireRoutes);
  console.log('✅ Roboflow detection route loaded successfully');
} catch (error) {
  console.log('❌ Failed to load Roboflow detection route:', error.message);
}

// 🔹 LOAD TELEGRAM ALARM ESCALATION ROUTE
try {
  const alarmTimerRoutes = require('./routes/alarmTimer');
  app.use('/api/alarm', alarmTimerRoutes);
  console.log('✅ Alarm timer route loaded successfully');
} catch (error) {
  console.log('❌ Failed to load alarm timer route:', error.message);
}

// 🔹 START SERVER
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🔥 Server running on port ${PORT}`);
  console.log('📍 Test URLs:');
  console.log(`   http://localhost:${PORT}/api/test`);
  console.log(`   http://localhost:${PORT}/api/auth/test`);
  console.log(`   http://localhost:${PORT}/api/alerts`);
  console.log(`   http://localhost:${PORT}/api/alerts/stats`);
});
