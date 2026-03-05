const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const app = express();

// Middleware

// Allow multiple origins (comma-separated) or single; empty/unset = allow all
const corsOrigin = process.env.FRONTEND_URL
  ? process.env.FRONTEND_URL.split(',').map(s => s.trim()).filter(Boolean)
  : '*';
app.use(cors({
  origin: Array.isArray(corsOrigin) && corsOrigin.length === 1 ? corsOrigin[0] : corsOrigin,
  credentials: true
}));
app.use(express.json({ limit: '50mb' })); // Increase JSON payload limit
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Serve uploaded images
// Note: routes/news.js uses path.join(__dirname, '../uploads') where __dirname is backend/routes
// So files are saved to backend/uploads/. Server.js is in backend/, so use 'uploads' (same directory)
app.use('/uploads', express.static(path.join(__dirname, 'uploads'), {
  maxAge: '1y', // Cache images for 1 year
  etag: true,
  lastModified: true,
  setHeaders: (res, path) => {
    // Allow images to be embedded anywhere (important for social media crawlers)
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
  }
}));

// Routes
app.use('/api/news', require('./routes/news'));
app.use('/api/pending-news', require('./routes/pendingNews'));
app.use('/api/auth', require('./routes/auth'));
app.use('/api/stats', require('./routes/stats'));
app.use('/api/translation', require('./routes/translation'));
app.use('/api/cricket', require('./routes/cricket'));
app.use('/api/ads', require('./routes/ads'));
app.use('/api/tts', require('./routes/tts'));
app.use('/api/market', require('./routes/market'));

// Route for social media crawlers - serve HTML with meta tags
app.get('/news/:slug', async (req, res) => {
  try {
    console.log('[Meta Route] Request received:', {
      slug: req.params.slug,
      userAgent: req.get('user-agent'),
      host: req.get('host'),
      url: req.url
    });
    
    const News = require('./models/News');
    const PendingNews = require('./models/PendingNews');
    const mongoose = require('mongoose');
    
    const param = decodeURIComponent(req.params.slug).trim().replace(/[\s\u00A0]/g, '');
    
    let news = await News.findOne({ slug: param }).lean();
    if (!news) {
      news = await PendingNews.findOne({ slug: param }).lean();
    }
    
    // If not found by slug, try by ID
    if (!news) {
      const isValidObjectId = mongoose.Types.ObjectId.isValid(param) &&
                              param.length === 24 &&
                              /^[0-9a-fA-F]{24}$/.test(param);
      if (isValidObjectId) {
        news = await News.findById(param).lean();
        if (!news) {
          news = await PendingNews.findById(param).lean();
        }
      }
    }

    if (!news) {
      console.log('[Meta Route] News not found for slug:', param);
      // If not found, let nginx serve the Angular app
      return res.status(404).send('<!DOCTYPE html><html><head><title>Article Not Found</title><meta http-equiv="refresh" content="0;url=https://newsaddaindia.com/news/' + encodeURIComponent(param) + '" /></head><body><p>Redirecting...</p></body></html>');
    }

    console.log('[Meta Route] News found:', {
      id: news._id,
      title: news.title,
      image: news.image,
      images: news.images
    });

    // Get image URL
    let imageUrl = '';
    if (news.images && Array.isArray(news.images) && news.images.length > 0) {
      imageUrl = news.images[0];
    } else if (news.image) {
      imageUrl = news.image;
    }

    console.log('[Meta Route] Original image URL:', imageUrl);

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
      normalizedImageUrl = normalizedImageUrl.replace(/^http:/, 'https:');
    }

    console.log('[Meta Route] Normalized image URL:', normalizedImageUrl);

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
  
  <!-- Redirect to actual article -->
  <meta http-equiv="refresh" content="0;url=${articleUrl}" />
  <script>window.location.href="${articleUrl}";</script>
</head>
<body>
  <h1>${title.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</h1>
  <p>${description.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</p>
  ${normalizedImageUrl ? `<img src="${normalizedImageUrl.replace(/"/g, '&quot;')}" alt="${title.replace(/"/g, '&quot;')}" style="max-width: 100%;" />` : ''}
  <p><a href="${articleUrl}">Read full article</a></p>
</body>
</html>`;

    console.log('[Meta Route] Sending HTML response with image URL:', normalizedImageUrl);
    
    // Set headers for better crawler compatibility
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.setHeader('Cache-Control', 'public, max-age=3600'); // Cache for 1 hour
    res.setHeader('X-Robots-Tag', 'noindex, nofollow'); // Don't index this redirect page
    
    res.send(html);
  } catch (error) {
    console.error('[Meta Route] Error:', error);
    res.status(500).send('<!DOCTYPE html><html><head><title>Error</title></head><body><h1>Error loading article</h1></body></html>');
  }
});

// Initialize scheduled translation job (runs daily at 1 AM)
const translationService = require('./services/translation.service');
translationService.startScheduledTranslation();

// Initialize scheduled NewsData.io fetch (runs daily at 1 AM)
const newsDataService = require('./services/newsdata.service');
newsDataService.startScheduledFetch();

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'OK', message: 'Server is running' });
});

// Manual trigger for NewsData.io fetch (for testing)
app.post('/api/newsdata/fetch', async (req, res) => {
  try {
    const newsDataService = require('./services/newsdata.service');
    const saved = await newsDataService.fetchAndSaveAllCategories();
    res.json({ 
      success: true, 
      message: `Fetched and saved ${saved.length} articles`,
      count: saved.length
    });
  } catch (error) {
    console.error('Error in manual NewsData.io fetch:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/newsaddaindia')
  .then(() => {
    console.log('Connected to MongoDB');
    
    // Initialize scheduled cricket data refresh (runs every 2 minutes)
    // Start only after MongoDB connection is established
    const cricketService = require('./services/cricket.service');
    cricketService.startScheduledRefresh();
    console.log('Cricket service initialized and scheduled refresh started');
  })
  .catch((error) => {
    console.error('MongoDB connection error:', error);
  });

const PORT = process.env.PORT || 3000;
const server = app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

// Handle server errors
server.on('error', (error) => {
  if (error.code === 'EADDRINUSE') {
    console.error(`Port ${PORT} is already in use. Please stop the other process or use a different port.`);
    console.error('To find and kill the process, run:');
    console.error(`  Windows: netstat -ano | findstr :${PORT}`);
    console.error(`  Then: taskkill /PID <PID> /F`);
  } else {
    console.error('Server error:', error);
  }
  process.exit(1);
});

