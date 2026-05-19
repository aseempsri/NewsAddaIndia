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

async function initMissingAds(site) {
  const adIds = ['ad1', 'ad2', 'ad3', 'ad4', 'ad5'];
  let ads = await Ad.getAllAds(site);
  const existingAdIds = ads.map(ad => ad.adId);
  const missingAdIds = adIds.filter(id => !existingAdIds.includes(id));
  if (missingAdIds.length > 0) {
    for (const adId of missingAdIds) {
      await Ad.updateAd(adId, site, {
        enabled: false,
        mediaType: null,
        mediaUrl: null,
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

// PUT update ad (admin only)
router.put('/:adId', authenticateAdmin, upload.single('media'), async (req, res) => {
  try {
    const { adId } = req.params;
    const site = resolveSite(req);
    const { enabled, linkUrl, altText } = req.body;

    const validAdIds = ['ad1', 'ad2', 'ad3', 'ad4', 'ad5'];
    if (!validAdIds.includes(adId)) {
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

    if (req.file) {
      const mediaType = req.file.mimetype.startsWith('image/') ? 'image' : 'video';
      const mediaUrl = `/uploads/ads/${req.file.filename}`;

      const existingAd = await Ad.getAdById(adId, site);
      if (existingAd && existingAd.mediaUrl) {
        const oldFilePath = path.join(__dirname, '..', existingAd.mediaUrl);
        if (fs.existsSync(oldFilePath)) {
          try {
            fs.unlinkSync(oldFilePath);
          } catch (err) {
            console.error('Error deleting old file:', err);
          }
        }
      }

      updateData.mediaType = mediaType;
      updateData.mediaUrl = mediaUrl;
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

// DELETE ad media (admin only)
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

    if (ad.mediaUrl) {
      const filePath = path.join(__dirname, '..', ad.mediaUrl);
      if (fs.existsSync(filePath)) {
        try {
          fs.unlinkSync(filePath);
        } catch (err) {
          console.error('Error deleting file:', err);
        }
      }
    }

    await Ad.updateAd(adId, site, {
      mediaType: null,
      mediaUrl: null
    });

    const updatedAd = await Ad.getAdById(adId, site);

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

module.exports = router;
