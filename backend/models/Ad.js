const mongoose = require('mongoose');

const adSchema = new mongoose.Schema({
  adId: {
    type: String,
    required: true,
    unique: true,
    enum: ['ad1', 'ad2', 'ad3', 'ad4', 'ad5']
  },
  enabled: {
    type: Boolean,
    default: false
  },
  mediaType: {
    type: String,
    enum: ['image', 'video', null],
    default: null
  },
  mediaUrl: {
    type: String,
    default: null
  },
  linkUrl: {
    type: String,
    default: null
  },
  altText: {
    type: String,
    default: ''
  }
}, {
  collection: 'ads',
  timestamps: true
});

adSchema.index({ adId: 1 });

// Static method to get all ads
adSchema.statics.getAllAds = async function () {
  return await this.find({}).sort({ adId: 1 });
};

// Static method to get a single ad
adSchema.statics.getAdById = async function (adId) {
  return await this.findOne({ adId });
};

// Static method to update an ad
adSchema.statics.updateAd = async function (adId, updateData) {
  return await this.findOneAndUpdate(
    { adId },
    { $set: updateData },
    { new: true, upsert: true }
  );
};

// Static method to toggle all ads
adSchema.statics.toggleAllAds = async function (enabled) {
  return await this.updateMany({}, { $set: { enabled } });
};

module.exports = mongoose.model('Ad', adSchema);
