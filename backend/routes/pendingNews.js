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
    // Accept all image types - check if it's an image MIME type
    const isImage = file.mimetype.startsWith('image/');
    
    if (isImage) {
      return cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
    }
  }
});

// Helper function to filter out paid/premium text
function filterPaidPlansText(text) {
  if (!text) return '';
  const paidKeywords = [
    'only available in paid plans',
    'only available in paid version',
    'paid version',
    'premium version',
    'paid content',
    'members only',
    'only available in paid',
    'paid plans',
    'premium plans'
  ];
  let filtered = text;
  for (const keyword of paidKeywords) {
    const regex = new RegExp(keyword, 'gi');
    filtered = filtered.replace(regex, '');
  }
  return filtered.replace(/\s+/g, ' ').trim();
}

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

// GET all pending news (Admin only)
router.get('/', authenticateAdmin, async (req, res) => {
  try {
    const { category, limit = 50, skip = 0 } = req.query;
    const query = {};
    
    if (category) {
      query.category = category;
    }
    
    // Fetch pending news from PendingNews collection
    const pendingNews = await PendingNews.find(query)
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip(parseInt(skip));
    
    // Fetch unpublished news from News collection (published: false)
    const unpublishedQuery = { published: false };
    if (category) {
      unpublishedQuery.category = category;
    }
    
    const unpublishedNews = await News.find(unpublishedQuery)
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip(parseInt(skip));
    
    // Add source field to distinguish between pending and unpublished
    // Also filter out paid plans text from content fields
    const pendingWithSource = pendingNews.map(item => {
      const itemObj = item.toObject();
      return {
        ...itemObj,
        source: 'pending',
        sourceUrl: itemObj.source || null, // Map source field to sourceUrl for frontend
        sourceName: itemObj.sourceName || null,
        content: filterPaidPlansText(itemObj.content || ''),
        contentEn: filterPaidPlansText(itemObj.contentEn || ''),
        excerpt: filterPaidPlansText(itemObj.excerpt || ''),
        excerptEn: filterPaidPlansText(itemObj.excerptEn || ''),
        summary: filterPaidPlansText(itemObj.summary || ''),
        summaryEn: filterPaidPlansText(itemObj.summaryEn || '')
      };
    });
    
    const unpublishedWithSource = unpublishedNews.map(item => {
      const itemObj = item.toObject();
      return {
        ...itemObj,
        source: 'unpublished',
        sourceUrl: itemObj.source || null,
        sourceName: itemObj.sourceName || null,
        content: filterPaidPlansText(itemObj.content || ''),
        contentEn: filterPaidPlansText(itemObj.contentEn || ''),
        excerpt: filterPaidPlansText(itemObj.excerpt || ''),
        excerptEn: filterPaidPlansText(itemObj.excerptEn || ''),
        summary: filterPaidPlansText(itemObj.summary || ''),
        summaryEn: filterPaidPlansText(itemObj.summaryEn || '')
      };
    });
    
    // Combine and sort by createdAt
    const allUnpublished = [...pendingWithSource, ...unpublishedWithSource]
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .slice(0, parseInt(limit));
    
    const totalPending = await PendingNews.countDocuments(query);
    const totalUnpublished = await News.countDocuments(unpublishedQuery);
    const total = totalPending + totalUnpublished;
    
    res.json({
      success: true,
      count: allUnpublished.length,
      total,
      data: allUnpublished
    });
  } catch (error) {
    console.error('Error fetching pending news:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch pending news' });
  }
});

// GET archived news (Admin only) - MUST come before /:id route
router.get('/archived', authenticateAdmin, async (req, res) => {
  try {
    const { year, month, limit = 50, skip = 0 } = req.query;
    const query = {};
    
    console.log('[Archived News] Request params:', { year, month, limit, skip });
    
    // Filter by year and month
    if (year && year !== 'undefined' && year !== 'null') {
      const yearNum = parseInt(year);
      if (isNaN(yearNum)) {
        return res.status(400).json({ success: false, error: 'Invalid year parameter' });
      }
      
      query.createdAt = {};
      
      if (month && month !== 'undefined' && month !== 'null') {
        const monthNum = parseInt(month) - 1; // JavaScript months are 0-indexed
        if (isNaN(monthNum) || monthNum < 0 || monthNum > 11) {
          return res.status(400).json({ success: false, error: 'Invalid month parameter' });
        }
        // Use UTC dates to avoid timezone issues
        query.createdAt.$gte = new Date(Date.UTC(yearNum, monthNum, 1, 0, 0, 0));
        query.createdAt.$lt = new Date(Date.UTC(yearNum, monthNum + 1, 1, 0, 0, 0));
      } else {
        // Use UTC dates to avoid timezone issues
        query.createdAt.$gte = new Date(Date.UTC(yearNum, 0, 1, 0, 0, 0));
        query.createdAt.$lt = new Date(Date.UTC(yearNum + 1, 0, 1, 0, 0, 0));
      }
      
      // Ensure createdAt exists
      query.createdAt.$exists = true;
      query.createdAt.$ne = null;
    } else if (month && month !== 'undefined' && month !== 'null') {
      // If only month is provided, filter current year
      const currentYear = new Date().getFullYear();
      const monthNum = parseInt(month) - 1;
      if (isNaN(monthNum) || monthNum < 0 || monthNum > 11) {
        return res.status(400).json({ success: false, error: 'Invalid month parameter' });
      }
      query.createdAt = {
        $gte: new Date(Date.UTC(currentYear, monthNum, 1, 0, 0, 0)),
        $lt: new Date(Date.UTC(currentYear, monthNum + 1, 1, 0, 0, 0)),
        $exists: true,
        $ne: null
      };
    } else {
      // No filters - just ensure createdAt exists
      query.createdAt = {
        $exists: true,
        $ne: null
      };
    }
    
    console.log('[Archived News] MongoDB query:', JSON.stringify(query, null, 2));
    
    // First check total count
    const totalCount = await PendingNews.countDocuments({});
    const totalWithCreatedAt = await PendingNews.countDocuments(query);
    console.log(`[Archived News] Total documents: ${totalCount}, Matching query: ${totalWithCreatedAt}`);
    
    // Fetch archived news from PendingNews collection, sorted by date descending (latest first)
    const limitNum = parseInt(limit) || 50;
    const skipNum = parseInt(skip) || 0;
    
    const archivedNews = await PendingNews.find(query)
      .sort({ createdAt: -1 }) // Descending order - latest first
      .limit(limitNum)
      .skip(skipNum)
      .lean(); // Use lean() for better performance
    
    // Get total count for pagination
    const total = await PendingNews.countDocuments(query);
    
    console.log(`[Archived News] Returning ${archivedNews.length} articles, total: ${total}`);
    
    res.json({
      success: true,
      data: archivedNews || [],
      total: total || 0
    });
  } catch (error) {
    console.error('[Archived News] Error fetching archived news:', error);
    console.error('[Archived News] Error stack:', error.stack);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to fetch archived news',
      message: error.message,
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// GET available years from archived news (Admin only) - MUST come before /:id route
router.get('/archived/years', authenticateAdmin, async (req, res) => {
  try {
    // Get all documents with valid createdAt dates and extract years
    const allNews = await PendingNews.find(
      { 
        createdAt: { 
          $exists: true, 
          $ne: null 
        } 
      }, 
      { createdAt: 1 }
    ).lean();
    
    const uniqueYears = [...new Set(
      allNews
        .map(item => {
          try {
            if (!item || !item.createdAt) return null;
            const date = new Date(item.createdAt);
            if (isNaN(date.getTime())) return null;
            const year = date.getFullYear();
            // Validate year is reasonable (between 2000 and 2100)
            if (year < 2000 || year > 2100) return null;
            return year;
          } catch (err) {
            console.warn('Error parsing date:', item?.createdAt, err);
            return null;
          }
        })
        .filter(year => year !== null)
    )];
    
    res.json({
      success: true,
      data: uniqueYears.sort((a, b) => b - a) // Descending order
    });
  } catch (error) {
    console.error('Error fetching available years:', error);
    console.error('Error stack:', error.stack);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to fetch available years',
      message: error.message,
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// GET single pending news by ID (Admin only)
router.get('/:id', authenticateAdmin, async (req, res) => {
  try {
    const pendingNews = await PendingNews.findById(req.params.id);
    
    if (!pendingNews) {
      return res.status(404).json({ success: false, error: 'Pending news not found' });
    }
    
    // Filter out paid plans text from content fields before returning
    const cleanedData = pendingNews.toObject();
    cleanedData.content = filterPaidPlansText(cleanedData.content || '');
    cleanedData.contentEn = filterPaidPlansText(cleanedData.contentEn || '');
    cleanedData.excerpt = filterPaidPlansText(cleanedData.excerpt || '');
    cleanedData.excerptEn = filterPaidPlansText(cleanedData.excerptEn || '');
    cleanedData.summary = filterPaidPlansText(cleanedData.summary || '');
    cleanedData.summaryEn = filterPaidPlansText(cleanedData.summaryEn || '');
    
    res.json({ success: true, data: cleanedData });
  } catch (error) {
    console.error('Error fetching pending news:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch pending news' });
  }
});

// PUT update pending news (Admin only)
router.put('/:id', authenticateAdmin, (req, res, next) => {
  upload.array('images', 3)(req, res, (err) => {
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
    
    // Update fields - allow clearing all fields with empty strings
    // Check if field exists in req.body (even if empty string) to allow clearing
    const updateData = {
      // Preserve empty string if sent for title
      title: 'title' in req.body ? (req.body.title !== undefined ? req.body.title : '') : pendingNews.title,
      // Preserve empty string if sent, don't fallback to Hindi title
      titleEn: 'titleEn' in req.body ? (req.body.titleEn !== undefined ? req.body.titleEn : '') : (pendingNews.titleEn || req.body.title || pendingNews.title),
      // Preserve empty string if sent for excerpt
      excerpt: 'excerpt' in req.body ? (req.body.excerpt !== undefined ? req.body.excerpt : '') : pendingNews.excerpt,
      // Preserve empty string if sent
      excerptEn: 'excerptEn' in req.body ? (req.body.excerptEn !== undefined ? req.body.excerptEn : '') : (pendingNews.excerptEn || ''),
      // Handle summary - allow clearing
      summary: 'summary' in req.body 
        ? (req.body.summary !== undefined && req.body.summary !== '' 
          ? req.body.summary 
          : (req.body.summary === '' ? '' : (pendingNews.summary || generateSummary(req.body.content !== undefined ? req.body.content : pendingNews.content, 60))))
        : (pendingNews.summary || generateSummary(req.body.content !== undefined ? req.body.content : pendingNews.content, 60)),
      // Preserve empty string if sent
      summaryEn: 'summaryEn' in req.body ? (req.body.summaryEn !== undefined ? req.body.summaryEn : '') : (pendingNews.summaryEn || (req.body.contentEn ? generateSummary(req.body.contentEn, 60) : '')),
      // Preserve empty string if sent for content
      content: 'content' in req.body ? (req.body.content !== undefined ? req.body.content : '') : pendingNews.content,
      // Preserve empty string if sent
      contentEn: 'contentEn' in req.body ? (req.body.contentEn !== undefined ? req.body.contentEn : '') : (pendingNews.contentEn || ''),
      // Preserve empty string if sent for category
      category: 'category' in req.body ? (req.body.category !== undefined ? req.body.category : '') : pendingNews.category,
      tags: tags,
      pages: pages,
      // Preserve empty string if sent for author
      author: 'author' in req.body ? (req.body.author !== undefined ? req.body.author : '') : pendingNews.author,
      isBreaking: req.body.isBreaking === 'true' || req.body.isBreaking === true,
      isFeatured: req.body.isFeatured === 'true' || req.body.isFeatured === true,
      isTrending: req.body.isTrending === 'true' || req.body.isTrending === true,
      // Preserve empty string if sent for trendingTitle
      trendingTitle: 'trendingTitle' in req.body ? (req.body.trendingTitle !== undefined && req.body.trendingTitle !== null && req.body.trendingTitle !== '' ? req.body.trendingTitle.trim() : '') : pendingNews.trendingTitle,
      // Preserve empty string if sent
      trendingTitleEn: 'trendingTitleEn' in req.body ? (req.body.trendingTitleEn !== undefined ? req.body.trendingTitleEn : '') : pendingNews.trendingTitleEn,
      updatedAt: Date.now()
    };
    
    // Handle multiple images upload (max 3)
    if (req.files && req.files.length > 0) {
      try {
        // Delete old images if they exist
        if (pendingNews.images && pendingNews.images.length > 0) {
          pendingNews.images.forEach(oldImagePath => {
            const fullPath = path.join(uploadsDir, path.basename(oldImagePath));
            if (fs.existsSync(fullPath)) {
              fs.unlink(fullPath, (err) => {
                if (err) console.error('Error deleting old image:', err);
              });
            }
          });
        }
        // Also delete old single image if exists
        if (pendingNews.image) {
          const oldImagePath = path.join(uploadsDir, path.basename(pendingNews.image));
          if (fs.existsSync(oldImagePath)) {
            fs.unlink(oldImagePath, (err) => {
              if (err) console.error('Error deleting old image:', err);
            });
          }
        }
        
        let imagePaths = [];
        let imagePath = '';
        
        for (const file of req.files) {
          const inputPath = file.path;
          const resizedFileName = `resized-${file.filename}`;
          const outputPath = path.join(uploadsDir, resizedFileName);
          
          // Resize image
          const resizeResult = await resizeImage(inputPath, outputPath);
          
          if (resizeResult.success) {
            // Delete original uploaded file
            if (fs.existsSync(inputPath)) {
              fs.unlink(inputPath, (err) => {
                if (err) console.error('Error deleting original file:', err);
              });
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
            const originalPath = `/uploads/${file.filename}`;
            imagePaths.push(originalPath);
            if (imagePath === '') {
              imagePath = originalPath;
            }
          }
        }
        
        updateData.images = imagePaths;
        updateData.image = imagePath; // First image for backward compatibility
      } catch (imageError) {
        console.error('Error processing images:', imageError);
        // Continue without updating images if processing fails
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

// POST publish pending news (move to News collection) or republish unpublished news (Admin only)
router.post('/:id/publish', authenticateAdmin, async (req, res) => {
  try {
    const { source } = req.body; // 'pending' or 'unpublished'
    
    if (source === 'unpublished') {
      // Republish unpublished News post
      const news = await News.findById(req.params.id);
      
      if (!news) {
        return res.status(404).json({ success: false, error: 'News article not found' });
      }
      
      if (news.published) {
        return res.status(400).json({ success: false, error: 'News article is already published' });
      }
      
      // Update published status
      news.published = true;
      news.date = new Date();
      await news.save();
      
      res.json({
        success: true,
        message: 'News republished successfully',
        data: news
      });
    } else {
      // Publish pending news (create new News post)
      const pendingNews = await PendingNews.findById(req.params.id);
      
      if (!pendingNews) {
        return res.status(404).json({ success: false, error: 'Pending news not found' });
      }
      
      // Create news article from pending news
      const newsData = {
        title: pendingNews.title,
        titleEn: pendingNews.titleEn || pendingNews.title,
        excerpt: pendingNews.excerpt,
        excerptEn: pendingNews.excerptEn || '',
        summary: pendingNews.summary || '',
        summaryEn: pendingNews.summaryEn || '',
        content: pendingNews.content,
        contentEn: pendingNews.contentEn || '',
        image: pendingNews.image,
        images: pendingNews.images || (pendingNews.image ? [pendingNews.image] : []),
        category: pendingNews.category,
        tags: pendingNews.tags,
        pages: pendingNews.pages,
        author: pendingNews.author,
        isBreaking: pendingNews.isBreaking,
        isFeatured: pendingNews.isFeatured,
        isTrending: pendingNews.isTrending,
        trendingTitle: pendingNews.trendingTitle,
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
    }
  } catch (error) {
    console.error('Error publishing news:', error);
    res.status(500).json({ success: false, error: 'Failed to publish news' });
  }
});

// DELETE all pending news (Admin only) - for clearing before refetch
router.delete('/all', authenticateAdmin, async (req, res) => {
  try {
    const result = await PendingNews.deleteMany({});
    res.json({
      success: true,
      message: `Deleted ${result.deletedCount} pending news articles`,
      deletedCount: result.deletedCount
    });
  } catch (error) {
    console.error('Error deleting all pending news:', error);
    res.status(500).json({ success: false, error: 'Failed to delete all pending news' });
  }
});

// DELETE pending news or unpublished news (Admin only)
router.delete('/:id', authenticateAdmin, async (req, res) => {
  try {
    const { source } = req.query; // 'pending' or 'unpublished'
    
    if (source === 'unpublished') {
      // Delete unpublished News post
      const news = await News.findById(req.params.id);
      
      if (!news) {
        return res.status(404).json({ success: false, error: 'News article not found' });
      }
      
      // Delete associated image if exists
      if (news.image) {
        const imagePath = path.join(__dirname, '..', news.image);
        if (fs.existsSync(imagePath)) {
          fs.unlinkSync(imagePath);
        }
      }
      
      await News.findByIdAndDelete(req.params.id);
      
      res.json({
        success: true,
        message: 'Unpublished news deleted successfully'
      });
    } else {
      // Delete pending news
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
    }
  } catch (error) {
    console.error('Error deleting news:', error);
    res.status(500).json({ success: false, error: 'Failed to delete news' });
  }
});

module.exports = router;

