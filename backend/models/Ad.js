const mongoose = require('mongoose');

const AD_SITES = ['newsadda', 'socialscreen'];
const NEWSADDA_AD_IDS = ['ad1', 'ad2', 'ad3', 'ad4', 'ad5'];

const SOCIAL_SCREEN_SECTIONS = [
  { id: 'home', slots: 4 },
  { id: 'national', slots: 3 },
  { id: 'international', slots: 3 },
  { id: 'religious', slots: 3 },
  { id: 'politics', slots: 3 },
  { id: 'health', slots: 3 },
  { id: 'entertainment', slots: 3 },
  { id: 'sports', slots: 3 },
  { id: 'business', slots: 3 }
];

function getSocialScreenAdIds() {
  const ids = [];
  for (const section of SOCIAL_SCREEN_SECTIONS) {
    for (let i = 1; i <= section.slots; i++) {
      ids.push(`${section.id}-ad${i}`);
    }
  }
  return ids;
}

function isValidAdId(adId, site) {
  if (site === 'socialscreen') {
    return getSocialScreenAdIds().includes(adId);
  }
  return NEWSADDA_AD_IDS.includes(adId);
}

const adSchema = new mongoose.Schema({
  adId: {
    type: String,
    required: true,
    trim: true
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
  /** Multiple creatives per slot; legacy mediaUrl mirrors first item for older clients */
  mediaItems: {
    type: [
      {
        mediaType: { type: String, enum: ['image', 'video'], required: true },
        mediaUrl: { type: String, required: true }
      }
    ],
    default: []
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

function syncLegacyMediaFields(doc) {
  const plain = doc && typeof doc.toObject === 'function' ? doc.toObject() : { ...doc };
  let items = Array.isArray(plain.mediaItems) ? plain.mediaItems.filter((i) => i && i.mediaUrl) : [];
  if (items.length === 0 && plain.mediaUrl) {
    items = [{ mediaType: plain.mediaType || 'image', mediaUrl: plain.mediaUrl }];
  }
  plain.mediaItems = items;
  if (items.length > 0) {
    plain.mediaUrl = items[0].mediaUrl;
    plain.mediaType = items[0].mediaType;
  } else {
    plain.mediaUrl = null;
    plain.mediaType = null;
  }
  return plain;
}

function normalizeSite(site) {
  return AD_SITES.includes(site) ? site : 'newsadda';
}

// Static method to get all ads for a site
adSchema.statics.getAllAds = async function (site = 'newsadda') {
  const s = normalizeSite(site);
  const ads = await this.find({ site: s }).sort({ adId: 1 });
  return ads.map((ad) => syncLegacyMediaFields(ad));
};

// Static method to get a single ad
adSchema.statics.getAdById = async function (adId, site = 'newsadda') {
  const s = normalizeSite(site);
  const ad = await this.findOne({ adId, site: s });
  return ad ? syncLegacyMediaFields(ad) : null;
};

// Static method to update an ad
adSchema.statics.updateAd = async function (adId, site, updateData) {
  const s = normalizeSite(site);
  const updated = await this.findOneAndUpdate(
    { adId, site: s },
    { $set: { ...updateData, site: s, adId } },
    { new: true, upsert: true }
  );
  return updated ? syncLegacyMediaFields(updated) : null;
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
  const adIds = s === 'socialscreen' ? getSocialScreenAdIds() : NEWSADDA_AD_IDS;
  for (const adId of adIds) {
    await this.updateAd(adId, s, {
      enabled: false,
      mediaType: null,
      mediaUrl: null,
      mediaItems: [],
      linkUrl: null,
      altText: ''
    });
  }
};

module.exports = mongoose.model('Ad', adSchema);
module.exports.AD_SITES = AD_SITES;
module.exports.NEWSADDA_AD_IDS = NEWSADDA_AD_IDS;
module.exports.getSocialScreenAdIds = getSocialScreenAdIds;
module.exports.isValidAdId = isValidAdId;
module.exports.syncLegacyMediaFields = syncLegacyMediaFields;
