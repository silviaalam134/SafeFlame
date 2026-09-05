const path = require('path');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('../backend/models/User');

// Load the same backend environment file used by server.js.
dotenv.config({ path: path.join(__dirname, '../backend/.env') });

const ADMIN_EMAIL = 'yamevalo@gmail.com';

const makeAdmin = async () => {
  try {
    if (!process.env.MONGO_URI) {
      throw new Error('MONGO_URI is missing from backend/.env');
    }

    // Connect using the existing MONGO_URI environment variable.
    await mongoose.connect(process.env.MONGO_URI);
    console.log('MongoDB connected. Searching for the target user...');

    // Use the active connection directly to avoid model-operation buffering in this
    // short-lived script while still reusing the User model's collection name.
    const usersCollection = mongoose.connection.db.collection(User.collection.name);
    await usersCollection.updateOne(
      { email: ADMIN_EMAIL.toLowerCase() },
      { $set: { role: 'admin' } }
    );
    const user = await usersCollection.findOne(
      { email: ADMIN_EMAIL.toLowerCase() },
      { projection: { email: 1, role: 1 } }
    );

    if (!user) {
      console.error(`User not found: ${ADMIN_EMAIL}`);
      process.exitCode = 1;
      return;
    }

    console.log(`Admin promotion successful: ${user.email} now has role "${user.role}".`);
  } catch (error) {
    console.error('Failed to promote user to admin:', error.message);
    process.exitCode = 1;
  } finally {
    // Always close MongoDB so the one-time script exits cleanly.
    await mongoose.disconnect();
  }
};

makeAdmin();
