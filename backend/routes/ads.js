const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const Ad = require('../models/Ad');
const { authenticateAdmin } = require('../middleware/auth');

const router = express.Router();

// Ensure uploads/ads directory exists
const adsUploadsDir = path.join(__dirname, '../uploads/ads');
if (!fs.existsSync(adsUploadsDir)) {
  fs.mkdirSync(adsUploadsDir, { recursive: true });
}

// Configure multer for ad file uploads (images and videos)
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
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB limit for videos
  fileFilter: (req, file, cb) => {
    // Accept images and videos
    const isImage = file.mimetype.startsWith('image/');
    const isVideo = file.mimetype.startsWith('video/');
    
    if (isImage || isVideo) {
      return cb(null, true);
    } else {
      cb(new Error('Only image and video files are allowed'));
    }
  }
});

// GET all ads (public endpoint - no auth required)
router.get('/', async (req, res) => {
  try {
    let ads = await Ad.getAllAds();
    
    // Initialize ads if they don't exist
    const adIds = ['ad1', 'ad2', 'ad3', 'ad4', 'ad5'];
    const existingAdIds = ads.map(ad => ad.adId);
    const missingAdIds = adIds.filter(id => !existingAdIds.includes(id));
    
    if (missingAdIds.length > 0) {
      // Create missing ads one by one using updateAd (which uses upsert)
      for (const adId of missingAdIds) {
        await Ad.updateAd(adId, {
          enabled: false,
          mediaType: null,
          mediaUrl: null,
          linkUrl: null,
          altText: ''
        });
      }
      console.log(`Initialized ${missingAdIds.length} new ad spaces: ${missingAdIds.join(', ')}`);
      
      // Fetch all ads again after initialization
      ads = await Ad.getAllAds();
    }
    
    res.json({
      success: true,
      data: ads
    });
  } catch (error) {
    console.error('Error fetching ads:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch ads'
    });
  }
});

// GET single ad (public endpoint)
router.get('/:adId', async (req, res) => {
  try {
    const ad = await Ad.getAdById(req.params.adId);
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

// POST/PUT update ad (admin only)
router.put('/:adId', authenticateAdmin, upload.single('media'), async (req, res) => {
  try {
    const { adId } = req.params;
    const { enabled, linkUrl, altText } = req.body;
    
    // Validate adId
    const validAdIds = ['ad1', 'ad2', 'ad3', 'ad4', 'ad5'];
    if (!validAdIds.includes(adId)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid ad ID'
      });
    }

    const updateData = {};
    
    // Handle enabled status
    if (enabled !== undefined) {
      updateData.enabled = enabled === 'true' || enabled === true;
    }
    
    // Handle link URL
    if (linkUrl !== undefined) {
      updateData.linkUrl = linkUrl || null;
    }
    
    // Handle alt text
    if (altText !== undefined) {
      updateData.altText = altText || '';
    }
    
    // Handle file upload
    if (req.file) {
      const mediaType = req.file.mimetype.startsWith('image/') ? 'image' : 'video';
      const mediaUrl = `/uploads/ads/${req.file.filename}`;
      
      // Delete old file if exists
      const existingAd = await Ad.getAdById(adId);
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
    
    // If enabled is being set to false and no file is uploaded, clear media
    if (enabled === 'false' || enabled === false) {
      // Don't clear media when disabling - allow re-enabling later
    }
    
    const updatedAd = await Ad.updateAd(adId, updateData);
    
    res.json({
      success: true,
      data: updatedAd
    });
  } catch (error) {
    console.error('Error updating ad:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update ad'
    });
  }
});

// POST toggle all ads (admin only)
router.post('/toggle-all', authenticateAdmin, async (req, res) => {
  try {
    const { enabled } = req.body;
    
    if (typeof enabled !== 'boolean') {
      return res.status(400).json({
        success: false,
        error: 'enabled must be a boolean'
      });
    }
    
    await Ad.toggleAllAds(enabled);
    const ads = await Ad.getAllAds();
    
    res.json({
      success: true,
      data: ads,
      message: `All ads ${enabled ? 'enabled' : 'disabled'}`
    });
  } catch (error) {
    console.error('Error toggling all ads:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to toggle all ads'
    });
  }
});

// DELETE ad media (admin only)
router.delete('/:adId/media', authenticateAdmin, async (req, res) => {
  try {
    const { adId } = req.params;
    const ad = await Ad.getAdById(adId);
    
    if (!ad) {
      return res.status(404).json({
        success: false,
        error: 'Ad not found'
      });
    }
    
    // Delete file if exists
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
    
    // Clear media data
    await Ad.updateAd(adId, {
      mediaType: null,
      mediaUrl: null
    });
    
    const updatedAd = await Ad.getAdById(adId);
    
    res.json({
      success: true,
      data: updatedAd
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
