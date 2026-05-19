const mongoose = require('mongoose');

const AD_SITES = ['newsadda', 'socialscreen'];

const adSchema = new mongoose.Schema({
  adId: {
    type: String,
    required: true,
    enum: ['ad1', 'ad2', 'ad3', 'ad4', 'ad5']
  },
  site: {
    type: String,
    required: true,
    enum: AD_SITES,
    default: 'newsadda'
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

adSchema.index({ adId: 1, site: 1 }, { unique: true });

function normalizeSite(site) {
  return AD_SITES.includes(site) ? site : 'newsadda';
}

// Static method to get all ads for a site
adSchema.statics.getAllAds = async function (site = 'newsadda') {
  const s = normalizeSite(site);
  return await this.find({ site: s }).sort({ adId: 1 });
};

// Static method to get a single ad
adSchema.statics.getAdById = async function (adId, site = 'newsadda') {
  const s = normalizeSite(site);
  return await this.findOne({ adId, site: s });
};

// Static method to update an ad
adSchema.statics.updateAd = async function (adId, site, updateData) {
  const s = normalizeSite(site);
  return await this.findOneAndUpdate(
    { adId, site: s },
    { $set: { ...updateData, site: s, adId } },
    { new: true, upsert: true }
  );
};

// Static method to toggle all ads for a site
adSchema.statics.toggleAllAds = async function (enabled, site = 'newsadda') {
  const s = normalizeSite(site);
  return await this.updateMany({ site: s }, { $set: { enabled } });
};

// Migrate legacy documents (no site field) to newsadda
adSchema.statics.migrateLegacySiteField = async function () {
  return await this.updateMany(
    { $or: [{ site: { $exists: false } }, { site: null }, { site: '' }] },
    { $set: { site: 'newsadda' } }
  );
};

adSchema.statics.ensureAdsForSite = async function (site) {
  const s = normalizeSite(site);
  const adIds = ['ad1', 'ad2', 'ad3', 'ad4', 'ad5'];
  for (const adId of adIds) {
    await this.updateAd(adId, s, {
      enabled: false,
      mediaType: null,
      mediaUrl: null,
      linkUrl: null,
      altText: ''
    });
  }
};

module.exports = mongoose.model('Ad', adSchema);
module.exports.AD_SITES = AD_SITES;
