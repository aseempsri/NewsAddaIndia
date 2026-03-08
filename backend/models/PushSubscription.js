const mongoose = require('mongoose');

const pushSubscriptionSchema = new mongoose.Schema({
  endpoint: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  keys: {
    p256dh: { type: String, required: true },
    auth: { type: String, required: true }
  },
  userAgent: { type: String, default: '' },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

pushSubscriptionSchema.index({ endpoint: 1 });

module.exports = mongoose.model('PushSubscription', pushSubscriptionSchema);
