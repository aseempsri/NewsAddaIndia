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
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit per file
  fileFilter: (req, file, cb) => {
    // Accept all image types - check if it's an image MIME type
    const isImage = file.mimetype.startsWith('image/');

    if (isImage) {
      return cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
    }
  }
});

// Middleware to limit number of files (max 3)
const limitFiles = (req, res, next) => {
  if (req.files && req.files.length > 3) {
    return res.status(400).json({
      success: false,
      error: 'Maximum 3 images allowed'
    });
  }
  next();
};

// Helper function to resize image while preserving format
async function resizeImage(inputPath, outputPath) {
  try {
    const metadata = await sharp(inputPath).metadata();
    const format = metadata.format; // jpeg, png, webp, gif, heic, avif, etc.

    // Determine output format and adjust path if needed
    let finalOutputPath = outputPath;
    let sharpInstance = sharp(inputPath)
      .resize(800, 600, {
        fit: 'cover',
        position: 'center'
      });

    // Preserve original format when possible, otherwise convert to jpeg
    if (format === 'png') {
      sharpInstance = sharpInstance.png({ quality: 90 });
      finalOutputPath = outputPath.replace(/\.(jpg|jpeg)$/i, '.png');
    } else if (format === 'webp') {
      sharpInstance = sharpInstance.webp({ quality: 85 });
      finalOutputPath = outputPath.replace(/\.(jpg|jpeg|png)$/i, '.webp');
    } else if (format === 'gif') {
      // GIFs are converted to PNG to preserve transparency
      sharpInstance = sharpInstance.png({ quality: 90 });
      finalOutputPath = outputPath.replace(/\.(jpg|jpeg|gif)$/i, '.png');
    } else {
      // Default to JPEG for jpeg, jpg, heic, avif, tiff, bmp, etc.
      sharpInstance = sharpInstance.jpeg({ quality: 85 });
      finalOutputPath = outputPath.replace(/\.(png|webp|gif|heic|avif|tiff|bmp)$/i, '.jpg');
    }

    await sharpInstance.toFile(finalOutputPath);
    return { success: true, outputPath: finalOutputPath };
  } catch (error) {
    console.error('Error resizing image:', error);
    return { success: false, outputPath: outputPath };
  }
}

// Middleware to handle multer errors
const handleMulterError = (err, req, res, next) => {
  if (err) {
    // Handle multer errors
    if (err instanceof multer.MulterError) {
      console.error('[Multer Error]', err.code, err.message, err.field);
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({ success: false, error: 'File too large. Maximum size is 10MB.' });
      }
      if (err.code === 'LIMIT_UNEXPECTED_FILE') {
        return res.status(400).json({
          success: false,
          error: `Unexpected field: ${err.field}. Expected field name: 'images'`
        });
      }
      return res.status(400).json({ success: false, error: err.message });
    }
    // Handle fileFilter errors (like unsupported file types)
    console.error('[File Filter Error]', err.message);
    return res.status(400).json({ success: false, error: err.message });
  }
  next();
};

// GET /api/news - Get all news (with optional filters)
router.get('/', async (req, res) => {
  try {
    const { category, page, limit = 20, published = true, breaking, featured, trending, excludeBreaking } = req.query;

    // Enforce maximum limit to prevent connection resets and memory issues
    // Reduced to 200 to prevent large response sizes that cause connection resets
    const maxLimit = 200;
    const requestedLimit = parseInt(limit);
    const finalLimit = requestedLimit > maxLimit ? maxLimit : requestedLimit;

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

    // Filter for trending news
    if (trending === 'true' || trending === true) {
      query.isTrending = true;
    }

    // Exclude breaking news from regular feed
    if (excludeBreaking === 'true' || excludeBreaking === true) {
      query.isBreaking = { $ne: true };
    }

    // Sort: breaking news first, then by date
    const sortOrder = breaking === 'true' || breaking === true
      ? { isBreaking: -1, createdAt: -1 }
      : { createdAt: -1 };

    // Get total count for pagination info
    const totalCount = await News.countDocuments(query);

    // Select only necessary fields for list views to reduce response size
    // Exclude large fields like full content unless specifically needed
    const fieldsToSelect = '_id title titleEn excerpt excerptEn summary summaryEn category tags pages author image images isBreaking isFeatured isTrending trendingTitle date createdAt updatedAt published';

    const news = await News.find(query)
      .select(fieldsToSelect)
      .sort(sortOrder)
      .limit(finalLimit)
      .lean() // Use lean() for better performance with large datasets
      .exec();

    res.json({
      success: true,
      count: news.length,
      total: totalCount,
      limit: finalLimit,
      hasMore: totalCount > finalLimit,
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
    console.log('[Backend GET /api/news/:id] Fetching news:', req.params.id);
    const news = await News.findById(req.params.id);

    if (!news) {
      console.log('[Backend GET /api/news/:id] News not found:', req.params.id);
      return res.status(404).json({
        success: false,
        error: 'News article not found'
      });
    }

    // Convert to plain object to ensure all fields are included
    const newsData = news.toObject ? news.toObject() : news;

    // Ensure images array exists
    if (!newsData.images || !Array.isArray(newsData.images)) {
      if (newsData.image) {
        newsData.images = [newsData.image];
        console.log('[Backend GET /api/news/:id] Created images array from single image');
      } else {
        newsData.images = [];
        console.log('[Backend GET /api/news/:id] Initialized empty images array');
      }
    }

    console.log('[Backend GET /api/news/:id] News found:', {
      id: newsData._id,
      image: newsData.image,
      images: newsData.images,
      imagesCount: newsData.images ? newsData.images.length : 0,
      imagesType: typeof newsData.images,
      imagesIsArray: Array.isArray(newsData.images),
      isTrending: newsData.isTrending,
      trendingTitle: newsData.trendingTitle,
      trendingTitleType: typeof newsData.trendingTitle
    });

    res.json({
      success: true,
      data: newsData
    });
  } catch (error) {
    console.error('[Backend GET /api/news/:id] Error fetching news:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch news'
    });
  }
});

// Helper function to generate 60-word summary
function generateSummary(content, maxWords = 60) {
  if (!content || !content.trim()) {
    return '';
  }
  // Remove HTML tags if present
  const textContent = content.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
  // Split into words
  const words = textContent.split(/\s+/);
  // Take first maxWords words
  const summaryWords = words.slice(0, maxWords);
  // Join and ensure it ends properly
  let summary = summaryWords.join(' ');
  // If original content was longer, add ellipsis
  if (words.length > maxWords) {
    summary += '...';
  }
  return summary.trim();
}

// POST /api/news - Create new news (Admin only)
router.post('/', authenticateAdmin, upload.array('images', 3), handleMulterError, async (req, res) => {
  try {
    const { title, titleEn, excerpt, excerptEn, summary, summaryEn, content, contentEn, category, tags, pages, author, isBreaking, isFeatured, isTrending, trendingTitle } = req.body;

    // Validate required fields
    if (!title || !excerpt || !category) {
      return res.status(400).json({
        success: false,
        error: 'Title, excerpt, and category are required'
      });
    }

    let imagePath = '';
    let imagePaths = [];

    // Process multiple images if uploaded (max 3)
    if (req.files && req.files.length > 0) {
      for (const file of req.files) {
        const resizedFilename = 'resized-' + file.filename;
        const resizedPath = path.join(uploadsDir, resizedFilename);

        // Resize image
        const resizeResult = await resizeImage(file.path, resizedPath);

        if (resizeResult.success) {
          // Delete original and keep resized
          if (fs.existsSync(file.path)) {
            fs.unlinkSync(file.path);
          }
          // Use the actual output filename (may have different extension)
          const actualFilename = path.basename(resizeResult.outputPath);
          const processedPath = `/uploads/${actualFilename}`;
          imagePaths.push(processedPath);

          // Set first image as the main image for backward compatibility
          if (imagePath === '') {
            imagePath = processedPath;
          }
        } else {
          // Use original if resize fails
          const originalPath = `/uploads/${file.filename}`;
          imagePaths.push(originalPath);
          if (imagePath === '') {
            imagePath = originalPath;
          }
        }
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

    // Generate summaries if not provided
    const finalContent = content || excerpt;
    const hindiSummary = summary || generateSummary(finalContent, 60);
    const englishSummary = summaryEn || (contentEn ? generateSummary(contentEn, 60) : '');

    const news = new News({
      title,
      titleEn: titleEn || title,
      excerpt,
      excerptEn: excerptEn || '',
      summary: hindiSummary,
      summaryEn: englishSummary,
      content: finalContent,
      contentEn: contentEn || '',
      category,
      tags: parsedTags,
      pages: parsedPages.length > 0 ? parsedPages : ['home'], // Default to home if no pages specified
      author: author || 'News Adda India',
      image: imagePath, // First image for backward compatibility
      images: imagePaths, // All images array
      isBreaking: isBreaking === 'true' || isBreaking === true,
      isFeatured: isFeatured === 'true' || isFeatured === true,
      isTrending: isTrending === 'true' || isTrending === true,
      trendingTitle: trendingTitle || undefined
    });

    await news.save();

    res.status(201).json({
      success: true,
      message: 'News article created successfully',
      data: news
    });
  } catch (error) {
    console.error('Error creating news:', error);

    // Clean up uploaded files if error occurred
    if (req.files && req.files.length > 0) {
      req.files.forEach(file => {
        if (fs.existsSync(file.path)) {
          fs.unlinkSync(file.path);
        }
      });
    }

    res.status(500).json({
      success: false,
      error: 'Failed to create news article',
      details: error.message
    });
  }
});

// PUT /api/news/:id - Update news (Admin only)
router.put('/:id', authenticateAdmin, upload.fields([{ name: 'images', maxCount: 3 }]), handleMulterError, async (req, res) => {
  try {
    const { title, titleEn, excerpt, excerptEn, summary, summaryEn, content, contentEn, category, tags, pages, author, published, isBreaking, isFeatured, isTrending, trendingTitle } = req.body;

    // Extract files from req.files.images (when using upload.fields)
    const imageFiles = req.files && req.files.images ? req.files.images : [];

    console.log('[Backend PUT /api/news/:id] Update request received:', {
      id: req.params.id,
      filesCount: imageFiles.length,
      files: imageFiles.map(f => ({ fieldname: f.fieldname, name: f.filename, size: f.size, mimetype: f.mimetype })),
      hasFiles: imageFiles.length > 0,
      bodyKeys: Object.keys(req.body),
      allFilesKeys: req.files ? Object.keys(req.files) : [],
      trendingTitle: req.body.trendingTitle,
      trendingTitleType: typeof req.body.trendingTitle,
      isTrending: req.body.isTrending,
      fullBody: JSON.stringify(req.body, null, 2)
    });

    const news = await News.findById(req.params.id);

    if (!news) {
      return res.status(404).json({
        success: false,
        error: 'News article not found'
      });
    }

    console.log('[Backend PUT /api/news/:id] Current news in DB:', {
      id: news._id,
      currentImage: news.image,
      currentImages: news.images,
      currentImagesCount: news.images ? news.images.length : 0
    });

    // Update fields
    if (title) news.title = title;
    if (titleEn !== undefined) news.titleEn = titleEn;
    if (excerpt) news.excerpt = excerpt;
    if (excerptEn !== undefined) news.excerptEn = excerptEn;
    if (content !== undefined) news.content = content;
    if (contentEn !== undefined) news.contentEn = contentEn;

    // Generate summaries if content changed and summary not provided
    if (content !== undefined && !summary) {
      news.summary = generateSummary(content || news.excerpt, 60);
    } else if (summary !== undefined) {
      news.summary = summary;
    }

    if (contentEn !== undefined && !summaryEn) {
      news.summaryEn = generateSummary(contentEn, 60);
    } else if (summaryEn !== undefined) {
      news.summaryEn = summaryEn;
    }

    if (category) news.category = category;
    if (author) news.author = author;
    if (published !== undefined) news.published = published === 'true' || published === true;
    if (isBreaking !== undefined) news.isBreaking = isBreaking === 'true' || isBreaking === true;
    if (isFeatured !== undefined) news.isFeatured = isFeatured === 'true' || isFeatured === true;
    if (isTrending !== undefined) news.isTrending = isTrending === 'true' || isTrending === true;
    // Handle trendingTitle: set it if provided, clear it if trending is unchecked
    console.log('[Backend PUT /api/news/:id] Processing trendingTitle:', {
      trendingTitleReceived: trendingTitle,
      trendingTitleType: typeof trendingTitle,
      trendingTitleUndefined: trendingTitle === undefined,
      isTrending: isTrending,
      currentTrendingTitle: news.trendingTitle
    });

    if (trendingTitle !== undefined && trendingTitle !== null) {
      const trimmedTitle = typeof trendingTitle === 'string' ? trendingTitle.trim() : String(trendingTitle).trim();
      news.trendingTitle = trimmedTitle || undefined;
      console.log('[Backend PUT /api/news/:id] Set trendingTitle:', {
        original: trendingTitle,
        trimmed: trimmedTitle,
        final: news.trendingTitle
      });
    } else if (isTrending === 'false' || isTrending === false) {
      // Clear trendingTitle if trending is unchecked
      news.trendingTitle = undefined;
      console.log('[Backend PUT /api/news/:id] Cleared trendingTitle (trending unchecked)');
    } else {
      console.log('[Backend PUT /api/news/:id] Keeping existing trendingTitle:', news.trendingTitle);
    }

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

    // Handle multiple images update
    if (imageFiles && imageFiles.length > 0) {
      console.log('[Backend PUT /api/news/:id] Processing', imageFiles.length, 'new image(s)');

      // Delete old images if they exist
      if (news.images && news.images.length > 0) {
        console.log('[Backend PUT /api/news/:id] Deleting', news.images.length, 'old image(s)');
        news.images.forEach(oldImagePath => {
          const fullPath = path.join(__dirname, '..', oldImagePath);
          if (fs.existsSync(fullPath)) {
            fs.unlinkSync(fullPath);
            console.log('[Backend PUT /api/news/:id] Deleted old image:', oldImagePath);
          } else {
            console.log('[Backend PUT /api/news/:id] Old image not found:', oldImagePath);
          }
        });
      }
      // Also delete old single image if exists
      if (news.image) {
        const oldImagePath = path.join(__dirname, '..', news.image);
        if (fs.existsSync(oldImagePath)) {
          fs.unlinkSync(oldImagePath);
          console.log('[Backend PUT /api/news/:id] Deleted old single image:', news.image);
        }
      }

      let imagePaths = [];
      let imagePath = '';

      for (const file of imageFiles) {
        console.log('[Backend PUT /api/news/:id] Processing file:', file.filename, file.size, 'bytes');
        const resizedFilename = 'resized-' + file.filename;
        const resizedPath = path.join(uploadsDir, resizedFilename);

        const resizeResult = await resizeImage(file.path, resizedPath);

        if (resizeResult.success) {
          if (fs.existsSync(file.path)) {
            fs.unlinkSync(file.path);
          }
          const actualFilename = path.basename(resizeResult.outputPath);
          const processedPath = `/uploads/${actualFilename}`;
          imagePaths.push(processedPath);
          console.log('[Backend PUT /api/news/:id] Processed image:', processedPath);

          // Set first image as the main image for backward compatibility
          if (imagePath === '') {
            imagePath = processedPath;
          }
        } else {
          const originalPath = `/uploads/${file.filename}`;
          imagePaths.push(originalPath);
          console.log('[Backend PUT /api/news/:id] Using original image:', originalPath);
          if (imagePath === '') {
            imagePath = originalPath;
          }
        }
      }

      news.images = imagePaths;
      news.image = imagePath; // First image for backward compatibility
      console.log('[Backend PUT /api/news/:id] Updated images:', {
        image: news.image,
        images: news.images,
        imagesCount: news.images.length
      });
    } else {
      console.log('[Backend PUT /api/news/:id] No new images uploaded, keeping existing images');
      // Ensure images array exists even if no new images are uploaded
      if (!news.images || !Array.isArray(news.images)) {
        // If images array doesn't exist but image field does, create array from it
        if (news.image) {
          news.images = [news.image];
          console.log('[Backend PUT /api/news/:id] Created images array from single image:', news.images);
        } else {
          news.images = [];
          console.log('[Backend PUT /api/news/:id] Initialized empty images array');
        }
      } else {
        console.log('[Backend PUT /api/news/:id] Keeping existing images array:', news.images);
      }
    }

    await news.save();

    // Reload from DB to ensure we have the latest data
    const savedNews = await News.findById(req.params.id).lean();
    console.log('[Backend PUT /api/news/:id] News saved to DB:', {
      id: savedNews._id,
      image: savedNews.image,
      images: savedNews.images,
      imagesCount: savedNews.images ? savedNews.images.length : 0,
      imagesType: typeof savedNews.images,
      imagesIsArray: Array.isArray(savedNews.images),
      isTrending: savedNews.isTrending,
      trendingTitle: savedNews.trendingTitle,
      trendingTitleType: typeof savedNews.trendingTitle
    });

    // Ensure images array exists in response
    if (!savedNews.images || !Array.isArray(savedNews.images)) {
      if (savedNews.image) {
        savedNews.images = [savedNews.image];
        console.log('[Backend PUT /api/news/:id] Created images array from single image for response');
      } else {
        savedNews.images = [];
        console.log('[Backend PUT /api/news/:id] Initialized empty images array for response');
      }
    }

    const responseData = {
      success: true,
      message: 'News article updated successfully',
      data: savedNews
    };

    console.log('[Backend PUT /api/news/:id] Sending response:', {
      success: responseData.success,
      image: responseData.data.image,
      images: responseData.data.images,
      imagesCount: responseData.data.images ? responseData.data.images.length : 0
    });

    res.json(responseData);
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

