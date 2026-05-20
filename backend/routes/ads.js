const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const Ad = require('../models/Ad');
const { authenticateAdmin } = require('../middleware/auth');

const router = express.Router();

const AD_SITES = Ad.AD_SITES || ['newsadda', 'socialscreen'];

function resolveSite(req) {
  const fromQuery = req.query.site;
  const fromBody = req.body && req.body.site;
  const raw = fromQuery || fromBody || 'newsadda';
  return AD_SITES.includes(raw) ? raw : 'newsadda';
}

// Ensure uploads/ads directory exists
const adsUploadsDir = path.join(__dirname, '../uploads/ads');
if (!fs.existsSync(adsUploadsDir)) {
  fs.mkdirSync(adsUploadsDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, adsUploadsDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, `ad-${uniqueSuffix}${ext}`);
  }
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 50 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const isImage = file.mimetype.startsWith('image/');
    const isVideo = file.mimetype.startsWith('video/');
    if (isImage || isVideo) {
      return cb(null, true);
    }
    cb(new Error('Only image and video files are allowed'));
  }
});

function deleteMediaFile(mediaUrl) {
  if (!mediaUrl) return;
  const filePath = path.join(__dirname, '..', mediaUrl);
  if (fs.existsSync(filePath)) {
    try {
      fs.unlinkSync(filePath);
    } catch (err) {
      console.error('Error deleting file:', err);
    }
  }
}

function fileToMediaItem(file) {
  const mediaType = file.mimetype.startsWith('image/') ? 'image' : 'video';
  const mediaUrl = `/uploads/ads/${file.filename}`;
  return { mediaType, mediaUrl };
}

function buildMediaAppend(existingAd, file) {
  return buildMediaAppendMany(existingAd, [file]);
}

function buildMediaAppendMany(existingAd, files) {
  const synced = existingAd ? Ad.syncLegacyMediaFields(existingAd) : { mediaItems: [] };
  const added = (files || []).map(fileToMediaItem);
  const mediaItems = [...(synced.mediaItems || []), ...added];
  return {
    mediaItems,
    mediaUrl: mediaItems.length > 0 ? mediaItems[0].mediaUrl : null,
    mediaType: mediaItems.length > 0 ? mediaItems[0].mediaType : null
  };
}

async function initMissingAds(site) {
  const adIds = site === 'socialscreen'
    ? Ad.getSocialScreenAdIds()
    : (Ad.NEWSADDA_AD_IDS || ['ad1', 'ad2', 'ad3', 'ad4', 'ad5']);
  let ads = await Ad.getAllAds(site);
  const existingAdIds = ads.map(ad => ad.adId);
  const missingAdIds = adIds.filter(id => !existingAdIds.includes(id));
  if (missingAdIds.length > 0) {
    for (const adId of missingAdIds) {
      await Ad.updateAd(adId, site, {
        enabled: false,
        mediaType: null,
        mediaUrl: null,
        mediaItems: [],
        linkUrl: null,
        altText: ''
      });
    }
    console.log(`Initialized ${missingAdIds.length} ad spaces for ${site}: ${missingAdIds.join(', ')}`);
    ads = await Ad.getAllAds(site);
  }
  return ads;
}

// GET all ads (public) — ?site=newsadda|socialscreen (default newsadda)
router.get('/', async (req, res) => {
  try {
    await Ad.migrateLegacySiteField();
    const site = resolveSite(req);
    const ads = await initMissingAds(site);

    res.json({
      success: true,
      data: ads,
      site
    });
  } catch (error) {
    console.error('Error fetching ads:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch ads'
    });
  }
});

// GET single ad (public)
router.get('/:adId', async (req, res) => {
  try {
    const site = resolveSite(req);
    const ad = await Ad.getAdById(req.params.adId, site);
    if (!ad) {
      return res.status(404).json({
        success: false,
        error: 'Ad not found'
      });
    }
    res.json({
      success: true,
      data: ad
    });
  } catch (error) {
    console.error('Error fetching ad:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch ad'
    });
  }
});

// POST toggle all ads (admin only)
router.post('/toggle-all', authenticateAdmin, async (req, res) => {
  try {
    const { enabled } = req.body;
    const site = resolveSite(req);

    if (typeof enabled !== 'boolean') {
      return res.status(400).json({
        success: false,
        error: 'enabled must be a boolean'
      });
    }

    await Ad.toggleAllAds(enabled, site);
    const ads = await Ad.getAllAds(site);

    res.json({
      success: true,
      data: ads,
      site,
      message: `All ads ${enabled ? 'enabled' : 'disabled'} for ${site}`
    });
  } catch (error) {
    console.error('Error toggling all ads:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to toggle all ads'
    });
  }
});

// POST append one or more media files (admin only) — atomic, avoids race on multi-upload
router.post('/:adId/media', authenticateAdmin, upload.array('media', 20), async (req, res) => {
  try {
    const { adId } = req.params;
    const site = resolveSite(req);
    const files = req.files || [];

    if (!Ad.isValidAdId(adId, site)) {
      return res.status(400).json({ success: false, error: 'Invalid ad ID' });
    }

    if (files.length === 0) {
      return res.status(400).json({ success: false, error: 'No media files provided' });
    }

    const existingAd = await Ad.findOne({ adId, site });
    const updateData = buildMediaAppendMany(existingAd, files);
    const updatedAd = await Ad.updateAd(adId, site, updateData);

    res.json({
      success: true,
      data: updatedAd,
      site,
      added: files.length
    });
  } catch (error) {
    console.error('Error uploading ad media:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to upload media'
    });
  }
});

// PUT update ad (admin only) — supports multiple `media` files in one request
router.put('/:adId', authenticateAdmin, upload.array('media', 20), async (req, res) => {
  try {
    const { adId } = req.params;
    const site = resolveSite(req);
    const { enabled, linkUrl, altText } = req.body;

    if (!Ad.isValidAdId(adId, site)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid ad ID'
      });
    }

    const updateData = {};

    if (enabled !== undefined) {
      updateData.enabled = enabled === 'true' || enabled === true;
    }

    if (linkUrl !== undefined) {
      updateData.linkUrl = linkUrl || null;
    }

    if (altText !== undefined) {
      updateData.altText = altText || '';
    }

    const uploadedFiles = req.files && req.files.length > 0 ? req.files : (req.file ? [req.file] : []);
    if (uploadedFiles.length > 0) {
      const existingAd = await Ad.findOne({ adId, site });
      Object.assign(updateData, buildMediaAppendMany(existingAd, uploadedFiles));
    }

    const updatedAd = await Ad.updateAd(adId, site, updateData);

    res.json({
      success: true,
      data: updatedAd,
      site
    });
  } catch (error) {
    console.error('Error updating ad:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update ad'
    });
  }
});

// DELETE all ad media (admin only)
router.delete('/:adId/media', authenticateAdmin, async (req, res) => {
  try {
    const { adId } = req.params;
    const site = resolveSite(req);
    const ad = await Ad.getAdById(adId, site);

    if (!ad) {
      return res.status(404).json({
        success: false,
        error: 'Ad not found'
      });
    }

    for (const item of ad.mediaItems || []) {
      deleteMediaFile(item.mediaUrl);
    }
    if (ad.mediaUrl && !(ad.mediaItems || []).some((i) => i.mediaUrl === ad.mediaUrl)) {
      deleteMediaFile(ad.mediaUrl);
    }

    const updatedAd = await Ad.updateAd(adId, site, {
      mediaType: null,
      mediaUrl: null,
      mediaItems: []
    });

    res.json({
      success: true,
      data: updatedAd,
      site
    });
  } catch (error) {
    console.error('Error deleting ad media:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete ad media'
    });
  }
});

// DELETE one media item by index (admin only)
router.delete('/:adId/media/:mediaIndex', authenticateAdmin, async (req, res) => {
  try {
    const { adId, mediaIndex } = req.params;
    const site = resolveSite(req);
    const index = parseInt(mediaIndex, 10);

    if (Number.isNaN(index) || index < 0) {
      return res.status(400).json({
        success: false,
        error: 'Invalid media index'
      });
    }

    const ad = await Ad.getAdById(adId, site);
    if (!ad) {
      return res.status(404).json({
        success: false,
        error: 'Ad not found'
      });
    }

    let items = [...(ad.mediaItems || [])];
    if (items.length === 0 && ad.mediaUrl) {
      items = [{ mediaType: ad.mediaType || 'image', mediaUrl: ad.mediaUrl }];
    }
    if (index >= items.length) {
      return res.status(404).json({
        success: false,
        error: 'Media item not found'
      });
    }

    const [removed] = items.splice(index, 1);
    deleteMediaFile(removed.mediaUrl);

    const updatePayload = {
      mediaItems: items,
      mediaUrl: items.length > 0 ? items[0].mediaUrl : null,
      mediaType: items.length > 0 ? items[0].mediaType : null
    };

    const updatedAd = await Ad.updateAd(adId, site, updatePayload);

    res.json({
      success: true,
      data: updatedAd,
      site
    });
  } catch (error) {
    console.error('Error deleting ad media item:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete ad media item'
    });
  }
});

module.exports = router;
