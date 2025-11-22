const mongoose = require('mongoose');

const AlertSchema = new mongoose.Schema({
  type: {
    type: String,
    required: true,
    default: 'Fire Detected'
  },
  status: {
    type: String,
    enum: ['unread', 'read'],
    default: 'unread'
  },
  location: {
    type: String,
    default: 'Camera Feed'
  },
  severity: {
    type: String,
    enum: ['low', 'medium', 'high', 'critical'],
    default: 'high'
  },
  detectedBy: {  // ✅ এই field টা যোগ করো
    type: String,
    default: 'Unknown User'
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Alert', AlertSchema);