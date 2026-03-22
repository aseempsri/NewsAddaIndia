const express = require('express');
const multer = require('multer');
const sharp = require('sharp');
const path = require('path');
const fs = require('fs');
const mongoose = require('mongoose');
const News = require('../models/News');
const PendingNews = require('../models/PendingNews');
const { authenticateAdmin } = require('../middleware/auth');
const { sendPushForNews } = require('../services/pushNotification.service');

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
    const { category, page, limit = 20, skip = 0, published = true, breaking, featured, trending, excludeBreaking, search, searchHi } = req.query;

    // Debug: Log all query parameters
    if (search) {
      console.log('[Backend News Route] Received search parameters:', {
        search: search,
        searchHi: searchHi,
        searchType: typeof search,
        searchHiType: typeof searchHi,
        allQueryParams: Object.keys(req.query)
      });
    }

    // Enforce maximum limit to prevent connection resets and memory issues
    // Reduced to 200 to prevent large response sizes that cause connection resets
    const maxLimit = 200;
    const requestedLimit = parseInt(limit);
    const finalLimit = requestedLimit > maxLimit ? maxLimit : requestedLimit;
    const skipCount = parseInt(skip) || 0;

    const query = { published: published === 'true' || published === true };

    // Search filter - search in title, titleEn, excerpt, and content
    // Support bilingual search: search in both English and Hindi fields
    // Handle three cases:
    // 1. English search only (search provided, no searchHi) - search ONLY in English fields (titleEn, excerptEn, contentEn)
    // 2. Bilingual search (both search and searchHi) - search English fields with English term, Hindi fields with Hindi term
    // 3. Hindi search only (only searchHi provided) - search ONLY in Hindi fields (title, excerpt, content)
    const hasEnglishSearch = search && search.trim();
    const hasHindiSearch = searchHi && searchHi.trim();

    // Declare these outside the if block so they're accessible for debugging
    let englishTerm = null;
    let hindiTerm = null;

    if (hasEnglishSearch || hasHindiSearch) {
      const searchTerms = [];
      englishTerm = hasEnglishSearch ? search.trim() : null;
      hindiTerm = hasHindiSearch ? searchHi.trim() : null;

      console.log('[Backend News Route] Search parameters:', {
        englishTerm,
        hindiTerm,
        searchType: hasEnglishSearch && hasHindiSearch ? 'bilingual' : (hasHindiSearch ? 'hindi-only' : 'english-only'),
        englishTermLength: englishTerm ? englishTerm.length : 0,
        hindiTermLength: hindiTerm ? hindiTerm.length : 0
      });

      // Escape special regex characters to prevent regex injection
      const escapeRegex = (str) => str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

      // If English term is provided, search ONLY in English fields
      if (englishTerm) {
        const englishRegex = new RegExp(escapeRegex(englishTerm), 'i');
        searchTerms.push(
          { titleEn: englishRegex },
          { excerptEn: englishRegex },
          { contentEn: englishRegex }
        );
        console.log('[Backend News Route] Added English search terms for:', englishTerm);
      }

      // If Hindi term is provided, search ONLY in Hindi fields
      if (hindiTerm) {
        const hindiRegex = new RegExp(escapeRegex(hindiTerm), 'i');
        searchTerms.push(
          { title: hindiRegex },
          { excerpt: hindiRegex },
          { content: hindiRegex }
        );
        console.log('[Backend News Route] Added Hindi search terms for:', hindiTerm);
      }

      // Use $or operator - document matches if ANY of these conditions are true
      // This means: match if text is found in titleEn OR excerptEn OR contentEn OR title OR excerpt OR content
      // IMPORTANT: $or must be an array of conditions, each condition is an object
      query.$or = searchTerms;

      console.log('[Backend News Route] Search query built with', searchTerms.length, 'OR conditions');
      console.log('[Backend News Route] OR logic: Document matches if ANY field contains the search term(s)');
      console.log('[Backend News Route] $or array length:', query.$or ? query.$or.length : 0);
      console.log('[Backend News Route] $or is array?', Array.isArray(query.$or));

      if (searchTerms.length > 0) {
        console.log('[Backend News Route] Sample search conditions:', searchTerms.slice(0, 3).map(term => {
          const key = Object.keys(term)[0];
          return `${key}: ${term[key].toString()}`;
        }));

        // Verify the structure of the first search term
        const firstTerm = searchTerms[0];
        const firstKey = Object.keys(firstTerm)[0];
        console.log('[Backend News Route] First search term structure:', {
          key: firstKey,
          valueType: typeof firstTerm[firstKey],
          isRegExp: firstTerm[firstKey] instanceof RegExp,
          pattern: firstTerm[firstKey].toString()
        });
      }
    }

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
    // Log query structure (RegExp objects won't serialize, but we can see the structure)
    const queryForLog = { ...query };
    if (queryForLog.$or) {
      queryForLog.$or = queryForLog.$or.map(term => {
        const key = Object.keys(term)[0];
        return { [key]: term[key].toString() };
      });
    }
    console.log('[Backend News Route] MongoDB query structure:', JSON.stringify(queryForLog, null, 2));
    console.log('[Backend News Route] Query logic: published=true AND ($or conditions)');
    console.log('[Backend News Route] $or means: Match if ANY field contains the search term(s)');

    // Test query: Get a sample document to see what fields contain
    if ((search && search.trim()) || (searchHi && searchHi.trim())) {
      const sampleDoc = await News.findOne({ published: true }).select('title titleEn excerpt excerptEn').lean();
      if (sampleDoc) {
        console.log('[Backend News Route] Sample document fields:', {
          title: sampleDoc.title?.substring(0, 50),
          titleEn: sampleDoc.titleEn?.substring(0, 50),
          excerpt: sampleDoc.excerpt?.substring(0, 50),
          excerptEn: sampleDoc.excerptEn?.substring(0, 50)
        });
      }
    }

    // Test the query with a simple findOne to verify it works
    if (query.$or && query.$or.length > 0) {
      const testResult = await News.findOne(query).select('_id title titleEn').lean();
      console.log('[Backend News Route] Test query result (first match):', testResult ? {
        _id: testResult._id,
        title: testResult.title?.substring(0, 30),
        titleEn: testResult.titleEn?.substring(0, 30)
      } : 'No matches found');
    }

    // CRITICAL: Verify the query structure before executing
    if (query.$or && query.$or.length > 0) {
      console.log('[Backend News Route] Final query has $or with', query.$or.length, 'conditions');
      // Verify each condition in $or
      query.$or.forEach((condition, index) => {
        const field = Object.keys(condition)[0];
        const regex = condition[field];
        console.log(`[Backend News Route] $or[${index}]: ${field} = ${regex.toString()}`);
      });
    }

    const totalCount = await News.countDocuments(query);
    console.log('[Backend News Route] Total matching documents:', totalCount);

    // If search is active but totalCount equals all published posts, the search filter isn't working
    if ((search && search.trim()) || (searchHi && searchHi.trim())) {
      const allPublishedCount = await News.countDocuments({ published: true });
      console.log('[Backend News Route] All published posts count:', allPublishedCount);

      if (totalCount === allPublishedCount) {
        console.error('[Backend News Route] ❌ ERROR: Search filter is NOT working! Total matches equals all published posts.');
        console.error('[Backend News Route] Query object structure:', JSON.stringify(queryForLog, null, 2));
        console.error('[Backend News Route] This suggests the $or query is matching all documents or not being applied.');

        // Try a simpler test query to debug - test with just title field
        if (englishTerm || hindiTerm) {
          const testTerm = hindiTerm || englishTerm;
          const escapedTerm = testTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
          const testRegex = new RegExp(escapedTerm, 'i');
          const simpleQuery = {
            published: true,
            $or: [{ title: testRegex }]
          };
          const simpleCount = await News.countDocuments(simpleQuery);
          console.log('[Backend News Route] Simple test query (title only) count:', simpleCount);
          console.log('[Backend News Route] Test regex pattern:', testRegex.toString());

          // Also test if the issue is with the $or structure
          const directQuery = {
            published: true,
            title: testRegex
          };
          const directCount = await News.countDocuments(directQuery);
          console.log('[Backend News Route] Direct query (without $or) count:', directCount);
        }
      } else {
        console.log('[Backend News Route] ✅ Search filter is working. Filtered from', allPublishedCount, 'to', totalCount, 'documents');
      }
    }

    // Select only necessary fields for list views to reduce response size
    const fieldsToSelect = '_id title titleEn excerpt excerptEn summary summaryEn category tags pages author image images isBreaking isFeatured isTrending trendingTitle date createdAt updatedAt published slug';

    const news = await News.find(query)
      .select(fieldsToSelect)
      .sort(sortOrder)
      .skip(skipCount)
      .limit(finalLimit)
      .lean() // Use lean() for better performance with large datasets
      .exec();

    // Deduplicate by _id and ensure slug for share URLs (persist if missing so slug is unique)
    const seenIds = new Set();
    const slugifyTitle = (t, id) => {
      const titleForSlug = (t || '').trim();
      if (!titleForSlug) return id ? 'news-' + id.toString().slice(-8) : 'news';
      let base = titleForSlug.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9\-]/gi, '').replace(/-+/g, '-').replace(/^-|-$/g, '').slice(0, 50);
      if (!base) base = id ? 'news-' + id.toString().slice(-8) : 'news';
      return base;
    };
    const dedupedNews = [];
    for (const item of news) {
      const id = item._id ? item._id.toString() : null;
      if (!id || seenIds.has(id)) continue;
      seenIds.add(id);
      if (!item.slug || item.slug === 'article' || /^article-\d+$/.test(item.slug) || /[^\x00-\x7F]/.test(item.slug)) {
        let baseSlug = slugifyTitle(item.titleEn || item.title || '', item._id);
        let slug = baseSlug;
        let n = 2;
        for (;;) {
          const inNews = await News.findOne({ slug }).select('_id').lean();
          const inPending = await PendingNews.findOne({ slug }).select('_id').lean();
          const other = (inNews && String(inNews._id) !== id) || (inPending && String(inPending._id) !== id);
          if (!other) break;
          slug = `${baseSlug}-${n}`;
          n++;
        }
        item.slug = slug;
        await News.findByIdAndUpdate(id, { slug }).catch(() => {});
        await PendingNews.findByIdAndUpdate(id, { slug }).catch(() => {});
      }
      dedupedNews.push(item);
    }

    console.log('[Backend News Route] Found', dedupedNews.length, 'news articles matching query');

    res.json({
      success: true,
      count: dedupedNews.length,
      total: totalCount,
      limit: finalLimit,
      skip: skipCount,
      hasMore: (skipCount + dedupedNews.length) < totalCount,
      data: dedupedNews
    });
  } catch (error) {
    console.error('Error fetching news:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch news'
    });
  }
});

// GET /api/news/images/gallery - Get all images from published news (Admin only, desc by date)
router.get('/images/gallery', authenticateAdmin, async (req, res) => {
  try {
    const news = await News.find({ published: true })
      .select('_id title titleEn image images createdAt slug')
      .sort({ createdAt: -1 })
      .lean();

    const items = [];
    for (const n of news) {
      const images = [];
      if (n.image && String(n.image).trim()) images.push(n.image);
      if (Array.isArray(n.images)) {
        for (const img of n.images) {
          if (img && String(img).trim() && !images.includes(img)) images.push(img);
        }
      }
      for (const img of images) {
        items.push({
          url: img.startsWith('/') ? img : `/${img}`,
          newsId: n._id,
          slug: n.slug,
          title: n.titleEn || n.title || '',
          createdAt: n.createdAt
        });
      }
    }

    res.json({ success: true, items });
  } catch (err) {
    console.error('[News images gallery] Error:', err);
    res.status(500).json({ error: 'Failed to fetch images' });
  }
});

// GET /api/news/:id - Get single news article (by ObjectId or by slug)
router.get('/:id', async (req, res) => {
  try {
    let param = decodeURIComponent(req.params.id).trim().replace(/[\s\u00A0]/g, '');
    console.log('[Backend GET /api/news/:id] Fetching news:', param, 'Original:', req.params.id);

    const isValidObjectId = mongoose.Types.ObjectId.isValid(param) &&
                            param.length === 24 &&
                            /^[0-9a-fA-F]{24}$/.test(param);

    let news = null;
    const db = mongoose.connection.db;
    const newsCollection = db.collection('news');
    const pendingNewsCollection = db.collection('pendingnews');
    let directQuery = null;

    if (isValidObjectId) {
      try {
        directQuery = await newsCollection.findOne({ _id: new mongoose.Types.ObjectId(param) });
        if (!directQuery) {
          directQuery = await pendingNewsCollection.findOne({ _id: new mongoose.Types.ObjectId(param) });
        }
      } catch (err) {
        console.error('[Backend GET /api/news/:id] Error in direct MongoDB query:', err.message);
      }
      news = await News.findById(param).lean();
      if (!news) {
        news = await PendingNews.findById(param).lean();
      }
    } else {
      // Resolve by slug (URL without id at the end)
      news = await News.findOne({ slug: param }).lean();
      if (!news) {
        news = await PendingNews.findOne({ slug: param }).lean();
      }
      // If link was truncated when shared, try match by slug prefix
      if (!news && param.length >= 10) {
        const escaped = param.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const prefixRegex = new RegExp('^' + escaped);
        const fromNews = await News.find({ slug: prefixRegex }).sort({ slug: 1 }).limit(1).lean();
        if (fromNews && fromNews.length > 0) news = fromNews[0];
        if (!news) {
          const fromPending = await PendingNews.find({ slug: prefixRegex }).sort({ slug: 1 }).limit(1).lean();
          if (fromPending && fromPending.length > 0) news = fromPending[0];
        }
        if (news) {
          console.log('[Backend GET /api/news/:id] Found by slug prefix (truncated link):', param);
        }
      }
      if (news) {
        directQuery = news;
        if (!directQuery) directQuery = news;
        if (!isValidObjectId) console.log('[Backend GET /api/news/:id] Found by slug:', param);
      }
    }

    if (!news) {
      return res.status(404).json({
        success: false,
        error: 'News article not found'
      });
    }

    const newsData = news;

    // Ensure slug exists for response (backfill for old docs; replace article/article-N or non-Latin with Latin slug)
    const hasBadSlug = !newsData.slug || newsData.slug === 'article' || /^article-\d+$/.test(newsData.slug) || /[^\x00-\x7F]/.test(newsData.slug);
    if (hasBadSlug) {
      const titleForSlug = (newsData.titleEn || newsData.title || '').trim();
      let baseSlug = '';
      if (titleForSlug) {
        baseSlug = titleForSlug
          .toLowerCase()
          .replace(/\s+/g, '-')
          .replace(/[^a-z0-9\-]/gi, '')
          .replace(/-+/g, '-')
          .replace(/^-|-$/g, '')
          .slice(0, 50);
      }
      if (!baseSlug) {
        baseSlug = 'news-' + (newsData._id || '').toString().slice(-8);
      }
      let slug = baseSlug;
      let n = 2;
      const checkSlug = async (s) => {
        const inNews = await News.findOne({ slug: s }).select('_id').lean();
        const inPending = await PendingNews.findOne({ slug: s }).select('_id').lean();
        const other = (inNews && String(inNews._id) !== String(newsData._id)) ? inNews : (inPending && String(inPending._id) !== String(newsData._id)) ? inPending : null;
        return !!other;
      };
      while (await checkSlug(slug)) {
        slug = `${baseSlug}-${n}`;
        n++;
      }
      newsData.slug = slug;
      await News.findByIdAndUpdate(newsData._id, { slug }).catch(() => {});
      await PendingNews.findByIdAndUpdate(newsData._id, { slug }).catch(() => {});
    }

    // Compare direct query vs Mongoose query (only when we used id)
    if (directQuery && isValidObjectId) {
      console.log('[Backend GET /api/news/:id] Comparison:', {
        directContentLength: directQuery.content ? directQuery.content.length : 0,
        mongooseContentLength: newsData.content ? newsData.content.length : 0
      });
      if (directQuery.content && directQuery.content.length > (newsData.content || '').length) {
        newsData.content = directQuery.content;
      }
    }

    // Log raw MongoDB response BEFORE any processing
    // Log FULL content to see what MongoDB actually returns
    const fullContentValue = newsData.content || '';
    const fullExcerptValue = newsData.excerpt || '';

    console.log('[Backend GET /api/news/:id] Raw MongoDB response:', {
      hasContent: !!newsData.content,
      contentType: typeof newsData.content,
      contentLength: fullContentValue.length,
      contentFirst200: fullContentValue.substring(0, 200),
      contentLast200: fullContentValue.length > 200 ? fullContentValue.substring(fullContentValue.length - 200) : 'N/A',
      contentFullValue: fullContentValue, // Log the ENTIRE content value
      hasExcerpt: !!newsData.excerpt,
      excerptLength: fullExcerptValue.length,
      excerptFirst200: fullExcerptValue.substring(0, 200),
      excerptFullValue: fullExcerptValue, // Log the ENTIRE excerpt value
      contentEqualsExcerpt: fullContentValue === fullExcerptValue,
      allFields: Object.keys(newsData),
      contentStartsWithHTML: fullContentValue.trim().startsWith('<'),
      excerptStartsWithHTML: fullExcerptValue.trim().startsWith('<')
    });

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

    // Log detailed content information
    const contentLength = newsData.content ? newsData.content.length : 0;
    const excerptLength = newsData.excerpt ? newsData.excerpt.length : 0;
    const contentStartsWith = newsData.content ? newsData.content.substring(0, 100) : 'missing';
    const excerptStartsWith = newsData.excerpt ? newsData.excerpt.substring(0, 100) : 'missing';
    const contentEqualsExcerpt = newsData.content === newsData.excerpt;

    console.log('[Backend GET /api/news/:id] News found:', {
      id: newsData._id,
      image: newsData.image,
      images: newsData.images,
      imagesCount: newsData.images ? newsData.images.length : 0,
      imagesType: typeof newsData.images,
      imagesIsArray: Array.isArray(newsData.images),
      isTrending: newsData.isTrending,
      trendingTitle: newsData.trendingTitle,
      trendingTitleType: typeof newsData.trendingTitle,
      contentExists: !!newsData.content,
      contentLength: contentLength,
      contentStartsWith: contentStartsWith,
      excerptExists: !!newsData.excerpt,
      excerptLength: excerptLength,
      excerptStartsWith: excerptStartsWith,
      contentEqualsExcerpt: contentEqualsExcerpt,
      contentEnExists: !!newsData.contentEn,
      contentEnLength: newsData.contentEn ? newsData.contentEn.length : 0
    });

    // WARNING: If content equals excerpt, the database might have excerpt in content field
    if (contentEqualsExcerpt && contentLength > 0) {
      console.warn('[Backend GET /api/news/:id] WARNING: content field equals excerpt field! Content field may contain excerpt instead of full article.');
    }

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

// GET /api/news/:id/meta - Serve HTML with meta tags for social media crawlers
router.get('/:id/meta', async (req, res) => {
  try {
    let param = decodeURIComponent(req.params.id).trim().replace(/[\s\u00A0]/g, '');
    
    const isValidObjectId = mongoose.Types.ObjectId.isValid(param) &&
                            param.length === 24 &&
                            /^[0-9a-fA-F]{24}$/.test(param);

    let news = null;
    if (isValidObjectId) {
      news = await News.findById(param).lean();
      if (!news) {
        news = await PendingNews.findById(param).lean();
      }
    } else {
      news = await News.findOne({ slug: param }).lean();
      if (!news) {
        news = await PendingNews.findOne({ slug: param }).lean();
      }
    }

    if (!news) {
      return res.status(404).send('<!DOCTYPE html><html><head><title>Article Not Found</title></head><body><h1>Article Not Found</h1></body></html>');
    }

    // Get image URL - use first image from images array or single image
    let imageUrl = '';
    if (news.images && Array.isArray(news.images) && news.images.length > 0) {
      imageUrl = news.images[0];
    } else if (news.image) {
      imageUrl = news.image;
    }

    // Normalize image URL to use frontend domain
    // Extract first URL from FRONTEND_URL if it contains multiple comma-separated URLs
    let frontendDomain = process.env.FRONTEND_URL || 'https://newsaddaindia.com';
    if (frontendDomain.includes(',')) {
      // If multiple URLs, take the first one
      frontendDomain = frontendDomain.split(',')[0].trim();
    }
    // Ensure it's a single domain without trailing slash
    frontendDomain = frontendDomain.replace(/\/$/, '').trim();
    
    let normalizedImageUrl = imageUrl;
    if (imageUrl) {
      if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) {
        try {
          const urlObj = new URL(imageUrl);
          const path = urlObj.pathname;
          normalizedImageUrl = `${frontendDomain}${path}`;
        } catch (e) {
          const pathMatch = imageUrl.match(/\/uploads\/[^\s"']+/);
          if (pathMatch) {
            normalizedImageUrl = `${frontendDomain}${pathMatch[0]}`;
          }
        }
      } else {
        normalizedImageUrl = imageUrl.startsWith('/') 
          ? `${frontendDomain}${imageUrl}` 
          : `${frontendDomain}/${imageUrl}`;
      }
      // Ensure HTTPS
      normalizedImageUrl = normalizedImageUrl.replace(/^http:/, 'https:');
    }

    const title = news.title || news.titleEn || 'News Adda India';
    const description = (news.excerpt || '').slice(0, 200).replace(/<[^>]*>/g, '');
    const slug = news.slug || param;
    const articleUrl = `${frontendDomain}/news/${slug}`;

    // Generate HTML with meta tags
    const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${title.replace(/"/g, '&quot;')} - News Adda India</title>
  <meta name="description" content="${description.replace(/"/g, '&quot;')}" />
  
  <!-- Open Graph / Facebook -->
  <meta property="og:type" content="article" />
  <meta property="og:url" content="${articleUrl}" />
  <meta property="og:title" content="${title.replace(/"/g, '&quot;')}" />
  <meta property="og:description" content="${description.replace(/"/g, '&quot;')}" />
  ${normalizedImageUrl ? `<meta property="og:image" content="${normalizedImageUrl.replace(/"/g, '&quot;')}" />
  <meta property="og:image:secure_url" content="${normalizedImageUrl.replace(/"/g, '&quot;')}" />
  <meta property="og:image:type" content="image/jpeg" />
  <meta property="og:image:width" content="1200" />
  <meta property="og:image:height" content="630" />` : ''}
  <meta property="og:site_name" content="NewsAddaIndia" />
  
  <!-- Twitter -->
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content="${title.replace(/"/g, '&quot;')}" />
  <meta name="twitter:description" content="${description.replace(/"/g, '&quot;')}" />
  ${normalizedImageUrl ? `<meta name="twitter:image" content="${normalizedImageUrl.replace(/"/g, '&quot;')}" />` : ''}
  
  <link rel="canonical" href="${articleUrl}" />
  
  <!-- Redirect to actual article after a short delay -->
  <meta http-equiv="refresh" content="0;url=${articleUrl}" />
  <script>window.location.href="${articleUrl}";</script>
</head>
<body>
  <h1>${title.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</h1>
  <p>${description.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</p>
  ${normalizedImageUrl ? `<img src="${normalizedImageUrl.replace(/"/g, '&quot;')}" alt="${title.replace(/"/g, '&quot;')}" />` : ''}
  <p><a href="${articleUrl}">Read full article</a></p>
</body>
</html>`;

    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.send(html);
  } catch (error) {
    console.error('[Backend GET /api/news/:id/meta] Error:', error);
    res.status(500).send('<!DOCTYPE html><html><head><title>Error</title></head><body><h1>Error loading article</h1></body></html>');
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
    const { title, titleEn, excerpt, excerptEn, summary, summaryEn, content, contentEn, category, tags, pages, author, isBreaking, isFeatured, isTrending, trendingTitle, trendingTitleEn, pushNotification, pushNotificationEn, pushNotificationHi, imagePaths: imagePathsBody } = req.body;

    // Validate required fields
    if (!title || !excerpt || !category) {
      return res.status(400).json({
        success: false,
        error: 'Title, excerpt, and category are required'
      });
    }

    let imagePath = '';
    let imagePaths = [];

    // Parse existing image paths from gallery selection (reuse existing uploads)
    try {
      const parsed = typeof imagePathsBody === 'string' ? JSON.parse(imagePathsBody) : imagePathsBody;
      if (Array.isArray(parsed)) {
        for (const p of parsed) {
          if (p && typeof p === 'string' && (p.startsWith('/uploads/') || p.startsWith('uploads/'))) {
            const normalized = p.startsWith('/') ? p : `/${p}`;
            imagePaths.push(normalized);
          }
        }
      }
    } catch (e) { /* ignore */ }

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

          // Verify the resized file actually exists
          const fullResizedPath = path.join(uploadsDir, actualFilename);
          if (!fs.existsSync(fullResizedPath)) {
            console.error(`[Backend POST /api/news] ERROR: Resized image not found at ${fullResizedPath}`);
            console.error(`[Backend POST /api/news] Expected outputPath: ${resizeResult.outputPath}`);
            // Fall back to original if resized file doesn't exist
            const originalPath = `/uploads/${file.filename}`;
            imagePaths.push(originalPath);
            if (imagePath === '') {
              imagePath = originalPath;
            }
          } else {
            console.log(`[Backend POST /api/news] Successfully saved image: ${fullResizedPath}`);
            imagePaths.push(processedPath);
            // Set first image as the main image for backward compatibility
            if (imagePath === '') {
              imagePath = processedPath;
            }
          }
        } else {
          // Use original if resize fails
          console.warn(`[Backend POST /api/news] Resize failed, using original: ${file.filename}`);
          const originalPath = `/uploads/${file.filename}`;
          imagePaths.push(originalPath);
          if (imagePath === '') {
            imagePath = originalPath;
          }
        }
      }
    }

    // Use first gallery path as main image if no uploads
    if (imagePath === '' && imagePaths.length > 0) {
      imagePath = imagePaths[0];
    }

    // Limit total to 3
    imagePaths = imagePaths.slice(0, 3);

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
      // Preserve empty string if sent, otherwise fallback to Hindi title
      titleEn: titleEn !== undefined ? titleEn : title,
      excerpt,
      // Preserve empty string if sent
      excerptEn: excerptEn !== undefined ? excerptEn : '',
      summary: hindiSummary,
      summaryEn: englishSummary,
      content: finalContent,
      // Preserve empty string if sent
      contentEn: contentEn !== undefined ? contentEn : '',
      category,
      tags: parsedTags,
      pages: parsedPages.length > 0 ? parsedPages : ['home'], // Default to home if no pages specified
      author: author || 'News Adda India',
      image: imagePath, // First image for backward compatibility
      images: imagePaths, // All images array
      isBreaking: isBreaking === 'true' || isBreaking === true,
      isFeatured: isFeatured === 'true' || isFeatured === true,
      isTrending: isTrending === 'true' || isTrending === true,
      trendingTitle: trendingTitle || undefined,
      // Preserve empty string if sent for trendingTitleEn
      trendingTitleEn: req.body.trendingTitleEn !== undefined ? req.body.trendingTitleEn : undefined
    });

    await news.save();

    const pushEn = pushNotificationEn === 'true' || pushNotificationEn === true || (pushNotification === 'true' || pushNotification === true);
    const pushHi = pushNotificationHi === 'true' || pushNotificationHi === true;
    if (pushEn || pushHi) {
      sendPushForNews(news, { pushEn, pushHi }).catch(err => console.error('[Backend POST /api/news] Push notification error:', err.message));
    }

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
    const { title, titleEn, excerpt, excerptEn, summary, summaryEn, content, contentEn, category, tags, pages, author, published, isBreaking, isFeatured, isTrending, trendingTitle, trendingTitleEn, existingImagePaths: existingPathsBody } = req.body;

    // Extract files from req.files.images (when using upload.fields)
    const imageFiles = req.files && req.files.images ? req.files.images : [];

    // Parse existing image paths (from current post + gallery selection - paths to keep)
    let existingImagePaths = [];
    try {
      const parsed = typeof existingPathsBody === 'string' ? JSON.parse(existingPathsBody) : existingPathsBody;
      if (Array.isArray(parsed)) {
        for (const p of parsed) {
          if (p && typeof p === 'string' && (p.startsWith('/uploads/') || p.startsWith('uploads/'))) {
            existingImagePaths.push(p.startsWith('/') ? p : `/${p}`);
          }
        }
      }
    } catch (e) { /* ignore */ }

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
      // Log English fields to debug empty string handling
      titleEn: req.body.titleEn,
      titleEnType: typeof req.body.titleEn,
      titleEnLength: req.body.titleEn ? req.body.titleEn.length : 'N/A',
      excerptEn: req.body.excerptEn,
      excerptEnType: typeof req.body.excerptEn,
      summaryEn: req.body.summaryEn,
      summaryEnType: typeof req.body.summaryEn,
      trendingTitleEn: req.body.trendingTitleEn,
      trendingTitleEnType: typeof req.body.trendingTitleEn,
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

    // Update fields - allow clearing all fields with empty strings
    // Check if field exists in req.body (even if empty string) to allow clearing
    if ('title' in req.body) {
      news.title = req.body.title !== undefined ? req.body.title : '';
      news.markModified('title');
      console.log('[Backend PUT] Setting title:', {
        received: req.body.title,
        receivedType: typeof req.body.title,
        value: news.title,
        type: typeof news.title,
        length: news.title ? news.title.length : 0,
        isModified: news.isModified('title')
      });
    }
    if ('excerpt' in req.body) {
      news.excerpt = req.body.excerpt !== undefined ? req.body.excerpt : '';
      news.markModified('excerpt');
      console.log('[Backend PUT] Setting excerpt:', {
        received: req.body.excerpt ? `${req.body.excerpt.substring(0, 50)}...` : '(empty)',
        receivedType: typeof req.body.excerpt,
        value: news.excerpt ? `${news.excerpt.substring(0, 50)}...` : '(empty)',
        length: news.excerpt ? news.excerpt.length : 0,
        isModified: news.isModified('excerpt')
      });
    }

    // For optional English fields, explicitly handle empty strings
    // Check if field exists in req.body (even if empty string) to allow clearing
    if ('titleEn' in req.body) {
      // Preserve empty string if sent, otherwise use the value or empty string
      news.titleEn = req.body.titleEn !== undefined ? req.body.titleEn : '';
      news.markModified('titleEn'); // Explicitly mark as modified to ensure save
      console.log('[Backend PUT] Setting titleEn:', {
        received: req.body.titleEn,
        receivedType: typeof req.body.titleEn,
        value: news.titleEn,
        type: typeof news.titleEn,
        length: news.titleEn ? news.titleEn.length : 0,
        isModified: news.isModified('titleEn')
      });
    }
    if ('excerptEn' in req.body) {
      news.excerptEn = req.body.excerptEn !== undefined ? req.body.excerptEn : '';
      news.markModified('excerptEn');
      console.log('[Backend PUT] Setting excerptEn:', {
        received: req.body.excerptEn,
        receivedType: typeof req.body.excerptEn,
        value: news.excerptEn,
        type: typeof news.excerptEn,
        length: news.excerptEn ? news.excerptEn.length : 0,
        isModified: news.isModified('excerptEn')
      });
    }
    if ('summaryEn' in req.body) {
      news.summaryEn = req.body.summaryEn !== undefined ? req.body.summaryEn : '';
      news.markModified('summaryEn');
      console.log('[Backend PUT] Setting summaryEn:', {
        received: req.body.summaryEn,
        receivedType: typeof req.body.summaryEn,
        value: news.summaryEn,
        type: typeof news.summaryEn,
        length: news.summaryEn ? news.summaryEn.length : 0,
        isModified: news.isModified('summaryEn')
      });
    }
    if ('contentEn' in req.body) {
      news.contentEn = req.body.contentEn !== undefined ? req.body.contentEn : '';
      news.markModified('contentEn');
      console.log('[Backend PUT] Setting contentEn:', {
        received: req.body.contentEn ? `${req.body.contentEn.substring(0, 50)}...` : '(empty)',
        receivedType: typeof req.body.contentEn,
        value: news.contentEn ? `${news.contentEn.substring(0, 50)}...` : '(empty)',
        length: news.contentEn ? news.contentEn.length : 0,
        isModified: news.isModified('contentEn')
      });
    }

    // Content can be empty, so check for presence in req.body
    if ('content' in req.body) {
      news.content = req.body.content !== undefined ? req.body.content : '';
      news.markModified('content');
      console.log('[Backend PUT] Setting content:', {
        received: req.body.content ? `${req.body.content.substring(0, 50)}...` : '(empty)',
        receivedType: typeof req.body.content,
        value: news.content ? `${news.content.substring(0, 50)}...` : '(empty)',
        length: news.content ? news.content.length : 0,
        isModified: news.isModified('content')
      });
    }

    // Handle summary - allow clearing with empty string
    if ('summary' in req.body) {
      if (req.body.summary !== undefined && req.body.summary !== '') {
        // If summary is provided and not empty, use it
        news.summary = req.body.summary;
      } else if (req.body.summary === '') {
        // If summary is explicitly cleared (empty string), clear it
        news.summary = '';
      } else if (content !== undefined && content !== '') {
        // If content changed and summary not provided, generate it
        news.summary = generateSummary(content || news.excerpt, 60);
      }
      news.markModified('summary');
      console.log('[Backend PUT] Setting summary:', {
        received: req.body.summary ? `${req.body.summary.substring(0, 50)}...` : '(empty)',
        value: news.summary ? `${news.summary.substring(0, 50)}...` : '(empty)',
        length: news.summary ? news.summary.length : 0
      });
    }

    // Handle summaryEn - already handled above, but ensure it's marked as modified
    // (summaryEn is already handled in the English fields section above)

    // Handle category - allow clearing with empty string
    if ('category' in req.body) {
      news.category = req.body.category !== undefined ? req.body.category : '';
      news.markModified('category');
      console.log('[Backend PUT] Setting category:', {
        received: req.body.category,
        value: news.category
      });
    }

    // Handle author - allow clearing with empty string
    if ('author' in req.body) {
      news.author = req.body.author !== undefined ? req.body.author : '';
      news.markModified('author');
      console.log('[Backend PUT] Setting author:', {
        received: req.body.author,
        value: news.author
      });
    }
    if (published !== undefined) news.published = published === 'true' || published === true;
    if (isBreaking !== undefined) news.isBreaking = isBreaking === 'true' || isBreaking === true;
    if (isFeatured !== undefined) news.isFeatured = isFeatured === 'true' || isFeatured === true;
    if (isTrending !== undefined) news.isTrending = isTrending === 'true' || isTrending === true;
    // Handle trendingTitle: allow clearing with empty string
    if ('trendingTitle' in req.body) {
      if (req.body.trendingTitle !== undefined && req.body.trendingTitle !== null && req.body.trendingTitle !== '') {
        // If trendingTitle is provided and not empty, use it
        const trimmedTitle = typeof req.body.trendingTitle === 'string' ? req.body.trendingTitle.trim() : String(req.body.trendingTitle).trim();
        news.trendingTitle = trimmedTitle || '';
      } else {
        // If trendingTitle is empty string or null, clear it
        news.trendingTitle = '';
      }
      news.markModified('trendingTitle');
      console.log('[Backend PUT] Setting trendingTitle:', {
        received: req.body.trendingTitle,
        receivedType: typeof req.body.trendingTitle,
        value: news.trendingTitle,
        isModified: news.isModified('trendingTitle')
      });
    } else if (isTrending === 'false' || isTrending === false) {
      // Clear trendingTitle if trending is unchecked (even if not in req.body)
      news.trendingTitle = '';
      news.markModified('trendingTitle');
      console.log('[Backend PUT] Cleared trendingTitle (trending unchecked)');
    }

    // Handle trendingTitleEn: allow clearing with empty string
    if ('trendingTitleEn' in req.body) {
      news.trendingTitleEn = req.body.trendingTitleEn !== undefined ? req.body.trendingTitleEn : '';
      news.markModified('trendingTitleEn');
      console.log('[Backend PUT] Setting trendingTitleEn:', {
        received: req.body.trendingTitleEn,
        receivedType: typeof req.body.trendingTitleEn,
        value: news.trendingTitleEn,
        type: typeof news.trendingTitleEn,
        length: news.trendingTitleEn ? news.trendingTitleEn.length : 0,
        isModified: news.isModified('trendingTitleEn')
      });
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
    const hasNewFiles = imageFiles && imageFiles.length > 0;
    const hasExistingPaths = existingImagePaths && existingImagePaths.length > 0;

    if (hasExistingPaths && !hasNewFiles) {
      // Gallery-only or keep-only: use existing paths, don't delete anything
      const finalPaths = existingImagePaths.slice(0, 3);
      news.images = finalPaths;
      news.image = finalPaths[0] || '';
      console.log('[Backend PUT /api/news/:id] Using existing image paths (no new uploads):', finalPaths);
    } else if (hasNewFiles) {
      console.log('[Backend PUT /api/news/:id] Processing', imageFiles.length, 'new image(s), keeping', existingImagePaths.length, 'existing');

      // Delete old images that we're REMOVING (not in existingImagePaths - i.e. we're replacing with new selection)
      const keepSet = new Set(existingImagePaths.map(p => (p.startsWith('/') ? p : `/${p}`)));
      const toDelete = [...(news.images || []), news.image].filter(Boolean);
      toDelete.forEach(oldImagePath => {
        const normalized = oldImagePath.startsWith('/') ? oldImagePath : `/${oldImagePath}`;
        if (!keepSet.has(normalized)) {
          const fullPath = path.join(__dirname, '..', oldImagePath);
          if (fs.existsSync(fullPath)) {
            fs.unlinkSync(fullPath);
            console.log('[Backend PUT /api/news/:id] Deleted removed image:', oldImagePath);
          }
        }
      });
      if (news.image && !keepSet.has(news.image.startsWith('/') ? news.image : `/${news.image}`)) {
        const oldImagePath = path.join(__dirname, '..', news.image);
        if (fs.existsSync(oldImagePath)) {
          fs.unlinkSync(oldImagePath);
        }
      }

      let imagePaths = [...existingImagePaths];
      let imagePath = imagePaths[0] || '';

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

          // Verify the resized file actually exists
          const fullResizedPath = path.join(uploadsDir, actualFilename);
          if (!fs.existsSync(fullResizedPath)) {
            console.error(`[Backend PUT /api/news/:id] ERROR: Resized image not found at ${fullResizedPath}`);
            console.error(`[Backend PUT /api/news/:id] Expected outputPath: ${resizeResult.outputPath}`);
            // Fall back to original if resized file doesn't exist
            const originalPath = `/uploads/${file.filename}`;
            imagePaths.push(originalPath);
            console.log('[Backend PUT /api/news/:id] Using original image:', originalPath);
            if (imagePath === '') {
              imagePath = originalPath;
            }
          } else {
            console.log(`[Backend PUT /api/news/:id] Successfully saved image: ${fullResizedPath}`);
            imagePaths.push(processedPath);
            console.log('[Backend PUT /api/news/:id] Processed image:', processedPath);
            // Set first image as the main image for backward compatibility
            if (imagePath === '') {
              imagePath = processedPath;
            }
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

      // Merge existing + new, limit to 3
      const merged = imagePaths.slice(0, 3);
      news.images = merged;
      news.image = merged[0] || '';
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

    const pushEn = req.body.pushNotificationEn === 'true' || req.body.pushNotificationEn === true || req.body.pushNotification === 'true' || req.body.pushNotification === true;
    const pushHi = req.body.pushNotificationHi === 'true' || req.body.pushNotificationHi === true;
    if (pushEn || pushHi) {
      const savedForPush = await News.findById(req.params.id).lean();
      sendPushForNews(savedForPush, { pushEn, pushHi }).catch(err => console.error('[Backend PUT /api/news/:id] Push notification error:', err.message));
    }

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

