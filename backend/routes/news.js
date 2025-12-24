const express = require('express');
const multer = require('multer');
const sharp = require('sharp');
const path = require('path');
const fs = require('fs');
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
    cb(null, 'news-' + uniqueSuffix + path.extname(file.originalname));
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
      .jpeg({ quality: 85 })
      .toFile(outputPath);
    return true;
  } catch (error) {
    console.error('Error resizing image:', error);
    return false;
  }
}

// Middleware to handle multer errors
const handleMulterError = (err, req, res, next) => {
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
};

// GET /api/news - Get all news (with optional filters)
router.get('/', async (req, res) => {
  try {
    const { category, page, limit = 20, published = true, breaking, featured, excludeBreaking } = req.query;
    
    const query = { published: published === 'true' || published === true };
    
    if (category) {
      query.category = category;
    }
    
    if (page) {
      query.pages = { $in: [page.toLowerCase()] };
    }

    // Filter for breaking news
    if (breaking === 'true' || breaking === true) {
      query.isBreaking = true;
    }

    // Filter for featured news
    if (featured === 'true' || featured === true) {
      query.isFeatured = true;
    }

    // Exclude breaking news from regular feed
    if (excludeBreaking === 'true' || excludeBreaking === true) {
      query.isBreaking = { $ne: true };
    }

    // Sort: breaking news first, then by date
    const sortOrder = breaking === 'true' || breaking === true 
      ? { isBreaking: -1, createdAt: -1 }
      : { createdAt: -1 };

    const news = await News.find(query)
      .sort(sortOrder)
      .limit(parseInt(limit))
      .exec();

    res.json({
      success: true,
      count: news.length,
      data: news
    });
  } catch (error) {
    console.error('Error fetching news:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch news'
    });
  }
});

// GET /api/news/:id - Get single news article
router.get('/:id', async (req, res) => {
  try {
    const news = await News.findById(req.params.id);
    
    if (!news) {
      return res.status(404).json({
        success: false,
        error: 'News article not found'
      });
    }

    res.json({
      success: true,
      data: news
    });
  } catch (error) {
    console.error('Error fetching news:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch news'
    });
  }
});

// POST /api/news - Create new news (Admin only)
router.post('/', authenticateAdmin, upload.single('image'), handleMulterError, async (req, res) => {
  try {
    const { title, titleEn, excerpt, content, category, tags, pages, author, isBreaking, isFeatured } = req.body;
    
    // Validate required fields
    if (!title || !excerpt || !category) {
      return res.status(400).json({
        success: false,
        error: 'Title, excerpt, and category are required'
      });
    }

    let imagePath = '';
    
    // Process image if uploaded
    if (req.file) {
      const resizedFilename = 'resized-' + req.file.filename;
      const resizedPath = path.join(uploadsDir, resizedFilename);
      
      // Resize image
      const resizeSuccess = await resizeImage(req.file.path, resizedPath);
      
      if (resizeSuccess) {
        // Delete original and keep resized
        fs.unlinkSync(req.file.path);
        imagePath = `/uploads/${resizedFilename}`;
      } else {
        // Use original if resize fails
        imagePath = `/uploads/${req.file.filename}`;
      }
    }

    // Parse tags and pages from JSON strings if needed
    let parsedTags = [];
    let parsedPages = [];
    
    try {
      parsedTags = typeof tags === 'string' ? JSON.parse(tags) : (tags || []);
      parsedPages = typeof pages === 'string' ? JSON.parse(pages) : (pages || []);
    } catch (e) {
      // If parsing fails, treat as comma-separated strings
      parsedTags = typeof tags === 'string' ? tags.split(',').map(t => t.trim()) : (tags || []);
      parsedPages = typeof pages === 'string' ? pages.split(',').map(p => p.trim()) : (pages || []);
    }

    const news = new News({
      title,
      titleEn: titleEn || title,
      excerpt,
      content: content || excerpt,
      category,
      tags: parsedTags,
      pages: parsedPages.length > 0 ? parsedPages : ['home'], // Default to home if no pages specified
      author: author || 'News Adda India',
      image: imagePath,
      isBreaking: isBreaking === 'true' || isBreaking === true,
      isFeatured: isFeatured === 'true' || isFeatured === true
    });

    await news.save();

    res.status(201).json({
      success: true,
      message: 'News article created successfully',
      data: news
    });
  } catch (error) {
    console.error('Error creating news:', error);
    
    // Clean up uploaded file if error occurred
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    
    res.status(500).json({
      success: false,
      error: 'Failed to create news article',
      details: error.message
    });
  }
});

// PUT /api/news/:id - Update news (Admin only)
router.put('/:id', authenticateAdmin, upload.single('image'), handleMulterError, async (req, res) => {
  try {
    const { title, titleEn, excerpt, content, category, tags, pages, author, published, isBreaking, isFeatured } = req.body;
    
    const news = await News.findById(req.params.id);
    
    if (!news) {
      return res.status(404).json({
        success: false,
        error: 'News article not found'
      });
    }

    // Update fields
    if (title) news.title = title;
    if (titleEn) news.titleEn = titleEn;
    if (excerpt) news.excerpt = excerpt;
    if (content !== undefined) news.content = content;
    if (category) news.category = category;
    if (author) news.author = author;
    if (published !== undefined) news.published = published === 'true' || published === true;
    if (isBreaking !== undefined) news.isBreaking = isBreaking === 'true' || isBreaking === true;
    if (isFeatured !== undefined) news.isFeatured = isFeatured === 'true' || isFeatured === true;

    // Parse tags and pages
    if (tags !== undefined) {
      try {
        news.tags = typeof tags === 'string' ? JSON.parse(tags) : tags;
      } catch (e) {
        news.tags = typeof tags === 'string' ? tags.split(',').map(t => t.trim()) : tags;
      }
    }

    if (pages !== undefined) {
      try {
        news.pages = typeof pages === 'string' ? JSON.parse(pages) : pages;
      } catch (e) {
        news.pages = typeof pages === 'string' ? pages.split(',').map(p => p.trim()) : pages;
      }
    }

    // Handle image update
    if (req.file) {
      // Delete old image if exists
      if (news.image) {
        const oldImagePath = path.join(__dirname, '..', news.image);
        if (fs.existsSync(oldImagePath)) {
          fs.unlinkSync(oldImagePath);
        }
      }

      const resizedFilename = 'resized-' + req.file.filename;
      const resizedPath = path.join(uploadsDir, resizedFilename);
      
      const resizeSuccess = await resizeImage(req.file.path, resizedPath);
      
      if (resizeSuccess) {
        fs.unlinkSync(req.file.path);
        news.image = `/uploads/${resizedFilename}`;
      } else {
        news.image = `/uploads/${req.file.filename}`;
      }
    }

    await news.save();

    res.json({
      success: true,
      message: 'News article updated successfully',
      data: news
    });
  } catch (error) {
    console.error('Error updating news:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update news article'
    });
  }
});

// DELETE /api/news/:id - Delete news (Admin only)
router.delete('/:id', authenticateAdmin, async (req, res) => {
  try {
    const news = await News.findById(req.params.id);
    
    if (!news) {
      return res.status(404).json({
        success: false,
        error: 'News article not found'
      });
    }

    // Delete associated image
    if (news.image) {
      const imagePath = path.join(__dirname, '..', news.image);
      if (fs.existsSync(imagePath)) {
        fs.unlinkSync(imagePath);
      }
    }

    await News.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: 'News article deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting news:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete news article'
    });
  }
});

module.exports = router;

