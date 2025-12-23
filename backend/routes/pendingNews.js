const express = require('express');
const multer = require('multer');
const sharp = require('sharp');
const path = require('path');
const fs = require('fs');
const PendingNews = require('../models/PendingNews');
const News = require('../models/News');
const { authenticateAdmin } = require('../middleware/auth');

const router = express.Router();

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'pending-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: (req, file, cb) => {
    const allowedExtensions = /jpeg|jpg|jfif|png|webp|gif/;
    const allowedMimeTypes = /image\/(jpeg|jpg|png|webp|gif)/;
    const extname = allowedExtensions.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedMimeTypes.test(file.mimetype) || file.mimetype === 'image/jpeg'; // jfif files might have image/jpeg mimetype
    
    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Only image files are allowed (jpeg, jpg, jfif, png, webp, gif)'));
    }
  }
});

// Helper function to resize image
async function resizeImage(inputPath, outputPath) {
  try {
    await sharp(inputPath)
      .resize(800, 600, {
        fit: 'cover',
        position: 'center'
      })
      .toFile(outputPath);
    return true;
  } catch (error) {
    console.error('Error resizing image:', error);
    return false;
  }
}

// GET all pending news (Admin only)
router.get('/', authenticateAdmin, async (req, res) => {
  try {
    const { category, limit = 50, skip = 0 } = req.query;
    const query = {};
    
    if (category) {
      query.category = category;
    }
    
    const pendingNews = await PendingNews.find(query)
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip(parseInt(skip));
    
    const total = await PendingNews.countDocuments(query);
    
    res.json({
      success: true,
      count: pendingNews.length,
      total,
      data: pendingNews
    });
  } catch (error) {
    console.error('Error fetching pending news:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch pending news' });
  }
});

// GET single pending news by ID (Admin only)
router.get('/:id', authenticateAdmin, async (req, res) => {
  try {
    const pendingNews = await PendingNews.findById(req.params.id);
    
    if (!pendingNews) {
      return res.status(404).json({ success: false, error: 'Pending news not found' });
    }
    
    res.json({ success: true, data: pendingNews });
  } catch (error) {
    console.error('Error fetching pending news:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch pending news' });
  }
});

// PUT update pending news (Admin only)
router.put('/:id', authenticateAdmin, (req, res, next) => {
  upload.single('image')(req, res, (err) => {
    if (err) {
      // Handle multer errors
      if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
          return res.status(400).json({ success: false, error: 'File too large. Maximum size is 10MB.' });
        }
        return res.status(400).json({ success: false, error: err.message });
      }
      // Handle fileFilter errors (like unsupported file types)
      return res.status(400).json({ success: false, error: err.message });
    }
    next();
  });
}, async (req, res) => {
  try {
    const pendingNews = await PendingNews.findById(req.params.id);
    
    if (!pendingNews) {
      return res.status(404).json({ success: false, error: 'Pending news not found' });
    }
    
    // Parse tags and pages safely
    let tags = pendingNews.tags;
    let pages = pendingNews.pages;
    
    try {
      if (req.body.tags) {
        tags = typeof req.body.tags === 'string' ? JSON.parse(req.body.tags) : req.body.tags;
      }
    } catch (e) {
      console.error('Error parsing tags:', e);
      // Keep existing tags if parsing fails
    }
    
    try {
      if (req.body.pages) {
        pages = typeof req.body.pages === 'string' ? JSON.parse(req.body.pages) : req.body.pages;
      }
    } catch (e) {
      console.error('Error parsing pages:', e);
      // Keep existing pages if parsing fails
    }
    
    // Update fields
    const updateData = {
      title: req.body.title || pendingNews.title,
      titleEn: req.body.titleEn || req.body.title || pendingNews.titleEn,
      excerpt: req.body.excerpt || pendingNews.excerpt,
      content: req.body.content !== undefined ? req.body.content : pendingNews.content,
      category: req.body.category || pendingNews.category,
      tags: tags,
      pages: pages,
      author: req.body.author || pendingNews.author,
      isBreaking: req.body.isBreaking === 'true' || req.body.isBreaking === true,
      isFeatured: req.body.isFeatured === 'true' || req.body.isFeatured === true,
      updatedAt: Date.now()
    };
    
    // Handle image upload
    if (req.file) {
      try {
        // Delete old image if it exists
        if (pendingNews.image) {
          const oldImagePath = path.join(uploadsDir, path.basename(pendingNews.image));
          if (fs.existsSync(oldImagePath)) {
            fs.unlink(oldImagePath, (err) => {
              if (err) console.error('Error deleting old image:', err);
            });
          }
        }
        
        const inputPath = req.file.path;
        const resizedFileName = `resized-${req.file.filename}`;
        const outputPath = path.join(uploadsDir, resizedFileName);
        
        // Resize image
        const resized = await resizeImage(inputPath, outputPath);
        
        if (resized) {
          // Delete original uploaded file
          if (fs.existsSync(inputPath)) {
            fs.unlink(inputPath, (err) => {
              if (err) console.error('Error deleting original file:', err);
            });
          }
          updateData.image = `/uploads/${resizedFileName}`;
        } else {
          // If resize failed, use original but still try to clean up
          updateData.image = `/uploads/${req.file.filename}`;
        }
      } catch (imageError) {
        console.error('Error processing image:', imageError);
        // Continue without updating image if processing fails
      }
    }
    
    const updated = await PendingNews.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    );
    
    res.json({
      success: true,
      message: 'Pending news updated successfully',
      data: updated
    });
  } catch (error) {
    console.error('Error updating pending news:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to update pending news',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// POST publish pending news (move to News collection) (Admin only)
router.post('/:id/publish', authenticateAdmin, async (req, res) => {
  try {
    const pendingNews = await PendingNews.findById(req.params.id);
    
    if (!pendingNews) {
      return res.status(404).json({ success: false, error: 'Pending news not found' });
    }
    
    // Create news article from pending news
    const newsData = {
      title: pendingNews.title,
      titleEn: pendingNews.titleEn,
      excerpt: pendingNews.excerpt,
      content: pendingNews.content,
      image: pendingNews.image,
      category: pendingNews.category,
      tags: pendingNews.tags,
      pages: pendingNews.pages,
      author: pendingNews.author,
      isBreaking: pendingNews.isBreaking,
      isFeatured: pendingNews.isFeatured,
      published: true,
      date: new Date()
    };
    
    // Create news article
    const news = new News(newsData);
    await news.save();
    
    // Delete pending news
    await PendingNews.findByIdAndDelete(req.params.id);
    
    res.json({
      success: true,
      message: 'News published successfully',
      data: news
    });
  } catch (error) {
    console.error('Error publishing pending news:', error);
    res.status(500).json({ success: false, error: 'Failed to publish news' });
  }
});

// DELETE pending news (Admin only)
router.delete('/:id', authenticateAdmin, async (req, res) => {
  try {
    const pendingNews = await PendingNews.findById(req.params.id);
    
    if (!pendingNews) {
      return res.status(404).json({ success: false, error: 'Pending news not found' });
    }
    
    // Delete associated image if exists
    if (pendingNews.image) {
      const imagePath = path.join(__dirname, '..', pendingNews.image);
      if (fs.existsSync(imagePath)) {
        fs.unlinkSync(imagePath);
      }
    }
    
    await PendingNews.findByIdAndDelete(req.params.id);
    
    res.json({
      success: true,
      message: 'Pending news deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting pending news:', error);
    res.status(500).json({ success: false, error: 'Failed to delete pending news' });
  }
});

module.exports = router;

