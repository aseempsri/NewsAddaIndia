const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
const xml2js = require('xml2js');
const axios = require('axios');
const https = require('https');
require('dotenv').config();

// Import News model
const News = require('../models/News');

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Configure axios to handle SSL issues
const httpsAgent = new https.Agent({
  rejectUnauthorized: false // Allow self-signed certificates
});

// Cache to track downloaded image URLs and their local paths (prevents duplicate downloads)
// Shared across all XML files in this import session
const imageUrlCache = new Map();

/**
 * Generate a hash-based filename from image URL to ensure same URL = same filename
 */
function generateImageFilename(imageUrl, articleTitle) {
  const crypto = require('crypto');
  // Create hash from URL (without query params) for consistent naming
  const urlWithoutQuery = imageUrl.split('?')[0];
  const urlHash = crypto.createHash('md5').update(urlWithoutQuery).digest('hex').substring(0, 8);
  
  // Extract extension from URL
  const urlParts = urlWithoutQuery.split('/');
  let filename = urlParts[urlParts.length - 1];
  const ext = path.extname(filename) || '.jpg';
  
  // Use hash + original filename (first 20 chars) for uniqueness
  const baseName = path.basename(filename, ext).substring(0, 20).replace(/[^a-zA-Z0-9]/g, '_');
  return `${baseName}-${urlHash}${ext}`;
}

/**
 * Check if image already exists locally by URL hash
 */
function findExistingImage(imageUrl) {
  if (!imageUrl || (!imageUrl.startsWith('http://') && !imageUrl.startsWith('https://'))) {
    return null; // Not a URL, skip check
  }
  
  const filename = generateImageFilename(imageUrl);
  const localPath = path.join(uploadsDir, filename);
  
  if (fs.existsSync(localPath)) {
    return `/uploads/${filename}`;
  }
  
  return null;
}

/**
 * Download image from URL and save locally
 * Returns local path (e.g., /uploads/filename.jpg) or null on failure
 * Prevents duplicate downloads by checking cache and file system
 */
async function downloadImage(imageUrl, articleTitle) {
  try {
    // Skip if already a local path
    if (!imageUrl || (!imageUrl.startsWith('http://') && !imageUrl.startsWith('https://'))) {
      return imageUrl; // Already local or empty
    }

    // Normalize URL (remove query params and fragments for comparison)
    const normalizedUrl = imageUrl.split('?')[0].split('#')[0];

    // Check cache first (same URL already downloaded in this session)
    if (imageUrlCache.has(normalizedUrl)) {
      const cachedPath = imageUrlCache.get(normalizedUrl);
      console.log(`  ♻️  Using cached image: ${cachedPath}`);
      return cachedPath;
    }

    // Check if file already exists on disk (from previous import)
    const existingPath = findExistingImage(imageUrl);
    if (existingPath) {
      console.log(`  ♻️  Image already exists: ${existingPath}`);
      imageUrlCache.set(normalizedUrl, existingPath);
      return existingPath;
    }

    // Check database for articles with same image URL (avoid re-downloading)
    const existingArticle = await News.findOne({ image: new RegExp(normalizedUrl.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')) });
    if (existingArticle && existingArticle.image && existingArticle.image.startsWith('/uploads/')) {
      console.log(`  ♻️  Image already in database: ${existingArticle.image}`);
      imageUrlCache.set(normalizedUrl, existingArticle.image);
      return existingArticle.image;
    }

    // Generate consistent filename based on URL hash
    const uniqueFilename = generateImageFilename(imageUrl, articleTitle);
    const localPath = path.join(uploadsDir, uniqueFilename);

    // Double-check file doesn't exist (race condition protection)
    if (fs.existsSync(localPath)) {
      const relativePath = `/uploads/${uniqueFilename}`;
      console.log(`  ♻️  Image file exists: ${relativePath}`);
      imageUrlCache.set(normalizedUrl, relativePath);
      return relativePath;
    }

    console.log(`  📥 Downloading image: ${imageUrl.substring(0, 60)}...`);

    // Download image
    const response = await axios.get(imageUrl, {
      responseType: 'stream',
      timeout: 30000, // 30 second timeout
      httpsAgent: httpsAgent,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });

    // Save to file
    const writer = fs.createWriteStream(localPath);
    response.data.pipe(writer);

    return new Promise((resolve, reject) => {
      writer.on('finish', () => {
        const relativePath = `/uploads/${uniqueFilename}`;
        console.log(`  ✅ Saved image: ${relativePath}`);
        imageUrlCache.set(normalizedUrl, relativePath);
        resolve(relativePath);
      });
      writer.on('error', (error) => {
        console.error(`  ❌ Error saving image: ${error.message}`);
        reject(error);
      });
    });
  } catch (error) {
    console.error(`  ❌ Failed to download ${imageUrl}: ${error.message}`);
    return null; // Return null on failure
  }
}

// Category mapping from WordPress to MongoDB
// IMPORTANT: Keys are case-insensitive and trimmed
const categoryMapping = {
  // Main categories
  'national': 'National',
  'international': 'International',
  'sports': 'Sports',
  'business': 'Business',
  'entertainment': 'Entertainment',
  'health': 'Health',
  'politics': 'Politics',
  'religious': 'Religious',
  'technology': 'Technology',

  // State/Region categories -> National
  'state': 'National',
  'bihar': 'National',
  'madhya pradesh': 'National',
  'uttar pradesh': 'National',
  'उत्तर प्रदेश': 'National', // Hindi: Uttar Pradesh
  'उत्तराखंड': 'National', // Hindi: Uttarakhand
  'वाराणसी': 'National', // Hindi: Varanasi
  'jharkhand': 'National', // State news
  'desh': 'National', // Hindi: Country

  // News types -> National
  'crime': 'National',
  'breaking news': 'National', // Only if it's a category, not a tag
  'uncategorized': 'National',
  'current affairs': 'National',
  'defence': 'National',
  'news': 'National',
  'short news': 'National',

  // International news variants
  'foreign news': 'International',

  // Entertainment variants
  'lifestyle': 'Entertainment',
  'social media': 'Entertainment',
  'video news': 'Entertainment',
  'मनोरंजन': 'Entertainment', // Hindi: Entertainment
  'हंसमुख उवाच': 'Entertainment', // Special entertainment column

  // Politics variants
  'poltics': 'Politics', // Typo fix

  // Special categories
  'न्यूज़ अड्डा स्पेशल': 'National', // Hindi: News Adda Special

  // Sports (Hindi)
  'खेल': 'Sports', // Hindi: Sports

  'default': 'National' // Default category
};

// Helper function to extract text safely from XML parsed structure
function extractText(field) {
  if (!field) return '';
  if (Array.isArray(field)) {
    const value = field[0];
    if (!value) return '';
    return (value._ !== undefined) ? value._ : (typeof value === 'string' ? value : String(value));
  }
  if (typeof field === 'object' && field._ !== undefined) {
    return field._;
  }
  return typeof field === 'string' ? field : String(field);
}

// Helper function to strip HTML tags and get excerpt
function stripHTML(html) {
  if (!html) return '';
  const htmlString = typeof html === 'string' ? html : String(html);
  return htmlString
    .replace(/<[^>]*>/g, '') // Remove HTML tags
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .trim();
}

// Helper function to extract excerpt from content
function getExcerpt(content, maxLength = 200) {
  const text = stripHTML(content);
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength).trim() + '...';
}

// Helper function to map WordPress category to MongoDB category
function mapCategory(wordPressCategories) {
  if (!wordPressCategories || !Array.isArray(wordPressCategories)) {
    return categoryMapping['default'];
  }

  // CRITICAL FIX: Only look for main category (domain="category")
  // DO NOT use tags for category mapping - tags are separate
  for (const cat of wordPressCategories) {
    // Handle different XML parsing structures
    let domain, categoryName;

    if (cat.$ && cat.$.domain) {
      // xml2js parsed structure: { $: { domain: 'category' }, _: 'Category Name' }
      domain = cat.$.domain;
      categoryName = cat._ || (typeof cat === 'string' ? cat : '');
    } else if (cat.domain) {
      // Handle domain as array or string: ["category"] or "category"
      const domainValue = Array.isArray(cat.domain) ? cat.domain[0] : cat.domain;
      domain = typeof domainValue === 'string' ? domainValue : (domainValue._ || domainValue);
      categoryName = cat._ || cat.name || (typeof cat === 'string' ? cat : '');
    } else if (typeof cat === 'string') {
      // Plain string (fallback)
      categoryName = cat;
      domain = 'unknown';
    } else {
      continue;
    }

    // Normalize domain: handle arrays and extract string value
    let normalizedDomain = domain;
    if (Array.isArray(domain)) {
      normalizedDomain = domain[0];
    }
    if (normalizedDomain && typeof normalizedDomain === 'object' && normalizedDomain._) {
      normalizedDomain = normalizedDomain._;
    }
    normalizedDomain = String(normalizedDomain || '').toLowerCase();

    // Only process categories, NOT tags
    if (normalizedDomain === 'category' && categoryName) {
      // Normalize: trim whitespace and convert to lowercase for matching
      const normalizedName = String(categoryName).trim().toLowerCase();
      const mapped = categoryMapping[normalizedName];
      if (mapped) {
        return mapped;
      }
    }
  }

  // If no category found, return default
  // DO NOT check tags - tags should not determine category
  return categoryMapping['default'];
}

// Helper function to extract image URL from postmeta
// Returns the URL (will be downloaded later)
function extractImageUrl(item, attachments) {
  if (!item['wp:postmeta'] || !Array.isArray(item['wp:postmeta'])) {
    // Try to extract image from content
    const contentRaw = item['content:encoded'];
    const content = extractText(contentRaw);
    if (content && typeof content === 'string') {
      const imgMatch = content.match(/<img[^>]+src=["']([^"']+)["']/i);
      if (imgMatch && imgMatch[1]) {
        return imgMatch[1];
      }
    }
    return '';
  }

  // Find thumbnail_id in postmeta using extractText for consistent parsing
  const thumbnailMeta = item['wp:postmeta'].find(
    meta => {
      const key = meta['wp:meta_key'];
      const keyStr = Array.isArray(key) ? extractText(key[0]) : extractText(key);
      return keyStr === '_thumbnail_id';
    }
  );

  if (thumbnailMeta && thumbnailMeta['wp:meta_value']) {
    const thumbnailId = extractText(thumbnailMeta['wp:meta_value']);

    if (thumbnailId && attachments) {
      // Find attachment with matching post_id
      const attachment = attachments.find(
        att => {
          const postId = att['wp:post_id'];
          const id = extractText(postId);
          // Compare as strings to handle type mismatches
          return String(id) === String(thumbnailId);
        }
      );

      if (attachment) {
        // Try wp:attachment_url
        if (attachment['wp:attachment_url']) {
          const url = extractText(attachment['wp:attachment_url']);
          if (url && url.trim() !== '') {
            return url;
          }
        }

        // Try to get attachment URL from postmeta
        if (attachment['wp:postmeta'] && Array.isArray(attachment['wp:postmeta'])) {
          const attachmentUrlMeta = attachment['wp:postmeta'].find(
            meta => {
              const key = meta['wp:meta_key'];
              const keyStr = Array.isArray(key) ? extractText(key[0]) : extractText(key);
              return keyStr === '_wp_attached_file';
            }
          );

          if (attachmentUrlMeta && attachmentUrlMeta['wp:meta_value']) {
            const filePath = extractText(attachmentUrlMeta['wp:meta_value']);
            if (filePath && filePath.trim() !== '') {
              return `https://newsaddaindia.com/wp-content/uploads/${filePath}`;
            }
          }
        }

        // Try guid
        if (attachment.guid) {
          const guid = Array.isArray(attachment.guid) ? attachment.guid[0] : attachment.guid;
          const guidStr = extractText(guid);
          if (guidStr && guidStr.trim() !== '') {
            return guidStr;
          }
        }
      }
    }
  }

  // Try to extract image from content
  const contentRaw = item['content:encoded'];
  const content = extractText(contentRaw);
  if (content && typeof content === 'string') {
    const imgMatch = content.match(/<img[^>]+src=["']([^"']+)["']/i);
    if (imgMatch && imgMatch[1]) {
      return imgMatch[1];
    }
  }

  return '';
}

// Helper function to extract tags
function extractTags(wordPressCategories) {
  if (!wordPressCategories || !Array.isArray(wordPressCategories)) {
    return [];
  }

  const tags = [];
  const excludeTags = ['news', 'newsaddaindia', 'hindi news', 'latest news', 'today', 'breaking-news', 'breaking news'];

  for (const cat of wordPressCategories) {
    let domain, tag;

    if (cat.$ && cat.$.domain) {
      domain = cat.$.domain;
      tag = cat._ || (typeof cat === 'string' ? cat : '');
    } else if (cat.domain) {
      domain = cat.domain;
      tag = cat._ || cat.name || (typeof cat === 'string' ? cat : '');
    } else if (typeof cat === 'string') {
      tag = cat;
      domain = 'unknown';
    } else {
      continue;
    }

    if (domain === 'post_tag' && tag && !excludeTags.includes(tag.toLowerCase())) {
      tags.push(tag);
    }
  }

  return tags;
}

// Helper function to determine if breaking news
function isBreakingNews(wordPressCategories) {
  if (!wordPressCategories || !Array.isArray(wordPressCategories)) {
    return false;
  }

  for (const cat of wordPressCategories) {
    let categoryName;

    if (cat.$ && cat._) {
      categoryName = cat._;
    } else if (cat._) {
      categoryName = cat._;
    } else if (typeof cat === 'string') {
      categoryName = cat;
    } else {
      continue;
    }

    const lowerName = categoryName.toLowerCase();
    if (lowerName === 'breaking news' || lowerName === 'breaking-news') {
      return true;
    }
  }

  return false;
}

// Helper function to clean content (remove WordPress blocks but keep formatting)
function cleanContent(content) {
  if (!content) return '';

  // Remove WordPress block comments
  content = content.replace(/<!--\s*\/?wp:[^>]*-->/g, '');

  // Keep paragraph tags but clean them
  content = content.replace(/<p>/g, '<p>').replace(/<\/p>/g, '</p>');

  // Remove other WordPress blocks but keep content
  content = content.replace(/<!--\s*wp:[^>]*-->/g, '');

  return content.trim();
}

async function importWordPressXML(xmlFilePath, stats) {
  try {
    console.log(`\n📖 Reading XML file: ${path.basename(xmlFilePath)}...`);
    const xmlData = fs.readFileSync(xmlFilePath, 'utf8');

    console.log('🔄 Parsing XML...');
    const parser = new xml2js.Parser({
      explicitArray: true,
      mergeAttrs: true,
      explicitCharkey: true,
      trim: true,
      normalize: true,
      normalizeTags: false,
      attrkey: '$',
      charkey: '_'
    });

    const result = await parser.parseStringPromise(xmlData);
    const channel = result.rss.channel[0];

    console.log('📊 Extracting data...');

    // Extract all items
    const items = channel.item || [];
    console.log(`Found ${items.length} items in XML`);

    // Separate posts and attachments
    const posts = items.filter(item => {
      const postType = item['wp:post_type'];
      if (!postType) return false;
      const typeArray = Array.isArray(postType) ? postType[0] : postType;
      const type = (typeArray && typeArray._) ? typeArray._ : (typeof typeArray === 'string' ? typeArray : '');
      return type === 'post' || type === 'Post';
    });

    const attachments = items.filter(item => {
      const postType = item['wp:post_type'];
      if (!postType) return false;
      const typeArray = Array.isArray(postType) ? postType[0] : postType;
      const type = (typeArray && typeArray._) ? typeArray._ : (typeof typeArray === 'string' ? typeArray : '');
      return type === 'attachment' || type === 'Attachment';
    });

    console.log(`Found ${posts.length} posts`);
    console.log(`Found ${attachments.length} attachments`);

    // Filter only published posts
    const publishedPosts = posts.filter(item => {
      const status = item['wp:status'];
      if (!status) return false;
      const statusArray = Array.isArray(status) ? status[0] : status;
      const stat = (statusArray && statusArray._) ? statusArray._ : (typeof statusArray === 'string' ? statusArray : '');
      return stat === 'publish' || stat === 'Publish';
    });

    console.log(`Found ${publishedPosts.length} published posts`);

    console.log(`\n🚀 Starting import from ${path.basename(xmlFilePath)}...\n`);

    for (const item of publishedPosts) {
      try {
        // Extract title
        const title = extractText(item.title);

        // Extract content
        const content = extractText(item['content:encoded']);

        // Extract excerpt
        const excerpt = extractText(item['excerpt:encoded']);

        // Extract categories
        const categories = item.category || [];

        // Extract date
        const postDateRaw = item['wp:post_date'] || item.pubDate;
        const postDate = extractText(postDateRaw);

        // Extract author
        const authorRaw = item['dc:creator'];
        const author = extractText(authorRaw) || 'News Adda India';

        // Skip if no title or content
        if (!title || !content) {
          stats.skipped++;
          continue;
        }

        // Map category
        const category = mapCategory(categories);

        // Extract tags
        const tags = extractTags(categories);

        // Extract image URL
        const imageUrl = extractImageUrl(item, attachments);

        // Download image and get local path
        let image = '';
        if (imageUrl && imageUrl.trim() !== '') {
          const localImagePath = await downloadImage(imageUrl, title);
          image = localImagePath || imageUrl; // Use local path if download succeeded, otherwise keep URL as fallback
          // Small delay to avoid overwhelming the server
          await new Promise(resolve => setTimeout(resolve, 200));
        }

        // Get excerpt (ensure content is string)
        const contentString = typeof content === 'string' ? content : String(content);
        const excerptString = typeof excerpt === 'string' ? excerpt : String(excerpt);
        const newsExcerpt = excerptString ? stripHTML(excerptString) : getExcerpt(contentString);

        // Clean content (ensure it's a string)
        const cleanedContent = cleanContent(typeof content === 'string' ? content : String(content));

        // Check if breaking news
        const isBreaking = isBreakingNews(categories);

        // Parse date
        let date = new Date();
        if (postDate) {
          const parsedDate = new Date(postDate);
          if (!isNaN(parsedDate.getTime())) {
            date = parsedDate;
          }
        }

        // Check if news already exists (by title AND date to avoid false duplicates)
        const trimmedTitle = title.trim();
        const existingNews = await News.findOne({ 
          title: trimmedTitle,
          date: {
            $gte: new Date(date.getTime() - 24 * 60 * 60 * 1000), // Same day
            $lte: new Date(date.getTime() + 24 * 60 * 60 * 1000)
          }
        });

        if (existingNews) {
          // Update existing article with corrected category and other fields
          existingNews.category = category; // Update category (this was the main issue)
          existingNews.tags = tags; // Update tags
          existingNews.isBreaking = isBreaking; // Update breaking status
          existingNews.excerpt = newsExcerpt || getExcerpt(contentString); // Update excerpt
          existingNews.content = cleanedContent; // Update content
          existingNews.image = image || existingNews.image; // Update image if available, keep existing if not
          existingNews.author = author; // Update author
          existingNews.updatedAt = new Date(); // Update timestamp

          await existingNews.save();
          stats.imported++; // Count as imported (updated)
          if (stats.imported % 10 === 0) {
            console.log(`✅ Processed ${stats.imported} articles so far (imported/updated)...`);
          }
          continue;
        }

        // Create news document for new articles
        const newsData = {
          title: (typeof title === 'string' ? title : String(title)).trim(),
          titleEn: (typeof title === 'string' ? title : String(title)).trim(), // Same as title for now
          excerpt: newsExcerpt || getExcerpt(contentString),
          content: cleanedContent,
          image: image,
          category: category,
          tags: tags,
          author: author,
          date: date,
          published: true,
          isBreaking: isBreaking,
          isFeatured: false,
          createdAt: date,
          updatedAt: date
        };

        // Create and save
        const news = new News(newsData);
        await news.save();

        stats.imported++;
        if (stats.imported % 10 === 0) {
          console.log(`✅ Imported ${stats.imported} articles so far...`);
        }

      } catch (error) {
        stats.errors++;
        console.error(`❌ Error importing post:`, error.message);
        console.error(`   Title: ${item.title?.[0] || 'Unknown'}`);
      }
    }

    console.log(`\n✅ Completed ${path.basename(xmlFilePath)}`);
    console.log(`   Imported/Updated: ${stats.imported - (stats.prevImported || 0)}`);
    console.log(`   Skipped (no title/content): ${stats.skipped - (stats.prevSkipped || 0)}`);
    console.log(`   Errors: ${stats.errors - (stats.prevErrors || 0)}`);

    // Mark this XML file as processed
    saveProcessedFile(xmlFilePath);
    console.log(`   ✅ Marked as processed (will skip on next run unless file changes)`);

    stats.prevImported = stats.imported;
    stats.prevSkipped = stats.skipped;
    stats.prevErrors = stats.errors;

  } catch (error) {
    console.error(`❌ Failed to process ${xmlFilePath}:`, error.message);
    stats.errors++;
  }
}

// Track processed XML files to avoid reprocessing
const processedFilesTracker = path.join(__dirname, '../.processed-xml-files.json');

/**
 * Load list of processed XML files
 */
function loadProcessedFiles() {
  try {
    if (fs.existsSync(processedFilesTracker)) {
      const data = fs.readFileSync(processedFilesTracker, 'utf8');
      return JSON.parse(data);
    }
  } catch (error) {
    console.warn('⚠️  Could not load processed files tracker:', error.message);
  }
  return {};
}

/**
 * Save processed XML file info
 */
function saveProcessedFile(xmlFilePath) {
  try {
    const processed = loadProcessedFiles();
    const stats = fs.statSync(xmlFilePath);
    const fileKey = path.basename(xmlFilePath);
    processed[fileKey] = {
      path: xmlFilePath,
      size: stats.size,
      mtime: stats.mtime.getTime(),
      processedAt: new Date().toISOString()
    };
    fs.writeFileSync(processedFilesTracker, JSON.stringify(processed, null, 2));
  } catch (error) {
    console.warn(`⚠️  Could not save processed file tracker: ${error.message}`);
  }
}

/**
 * Check if XML file was already processed (by filename and modification time)
 */
function isFileProcessed(xmlFilePath) {
  try {
    const processed = loadProcessedFiles();
    const fileKey = path.basename(xmlFilePath);
    
    if (!processed[fileKey]) {
      return false; // File not in tracker
    }
    
    // Check if file was modified since last processing
    const stats = fs.statSync(xmlFilePath);
    const trackedInfo = processed[fileKey];
    
    // If file size or modification time changed, reprocess
    if (stats.size !== trackedInfo.size || stats.mtime.getTime() !== trackedInfo.mtime) {
      console.log(`  📝 File modified since last import, will reprocess: ${fileKey}`);
      return false;
    }
    
    return true; // File already processed and unchanged
  } catch (error) {
    // If we can't check, assume not processed (safer to reprocess)
    return false;
  }
}

// Find all XML files matching the pattern
function findXMLFiles() {
  const possibleDirs = [
    path.join(__dirname, '../../'), // Project root
    path.join(__dirname, '../../NewsAddaIndia'), // NewsAddaIndia directory
    '/root/NewsAddaIndia', // Absolute path on VPS
    '/root' // Alternative absolute path
  ];

  const xmlFiles = [];
  let foundDir = null;

  for (const dir of possibleDirs) {
    if (!fs.existsSync(dir)) continue;

    try {
      const files = fs.readdirSync(dir);

      // Find monthly files (2026-01-16_*.xml)
      const monthlyFiles = files.filter(file =>
        file.startsWith('newsaddaindia.WordPress.2026-01-16_') && file.endsWith('.xml')
      );

      // Find dec-jan file (2026-01-03.xml)
      const decJanFile = files.find(file =>
        file === 'newsaddaindia.WordPress.2026-01-03.xml'
      );

      if (monthlyFiles.length > 0 || decJanFile) {
        foundDir = dir;

        // Sort monthly files by month order
        const monthOrder = {
          'jan-feb': 1, 'feb-mar': 2, 'mar-apr': 3, 'apr-may': 4,
          'may-jun': 5, 'jun-jul': 6, 'jul-aug': 7, 'aug-sept': 8,
          'sept-oct': 9, 'oct-nov': 10, 'nov-dec': 11
        };

        monthlyFiles.sort((a, b) => {
          const aMonth = a.match(/2026-01-16_([a-z]+-[a-z]+)\.xml/)?.[1];
          const bMonth = b.match(/2026-01-16_([a-z]+-[a-z]+)\.xml/)?.[1];
          return (monthOrder[aMonth] || 99) - (monthOrder[bMonth] || 99);
        });

        // Add dec-jan file first (it covers Dec-Jan period, so should be processed first)
        if (decJanFile) {
          const decJanPath = path.join(dir, decJanFile);
          if (!isFileProcessed(decJanPath)) {
            xmlFiles.push(decJanPath);
            console.log(`✅ Found dec-jan file: ${decJanFile}`);
          } else {
            console.log(`⏭️  Skipping already processed: ${decJanFile}`);
          }
        }

        // Add monthly files (only if not already processed)
        monthlyFiles.forEach(file => {
          const filePath = path.join(dir, file);
          if (!isFileProcessed(filePath)) {
            xmlFiles.push(filePath);
          } else {
            console.log(`⏭️  Skipping already processed: ${file}`);
          }
        });

        const skippedCount = (decJanFile && isFileProcessed(path.join(dir, decJanFile)) ? 1 : 0) + 
                             monthlyFiles.filter(f => isFileProcessed(path.join(dir, f))).length;
        
        console.log(`✅ Found ${monthlyFiles.length} monthly XML files in: ${dir}`);
        if (skippedCount > 0) {
          console.log(`⏭️  Skipped ${skippedCount} already processed files`);
        }
        if (xmlFiles.length > 0) {
          console.log(`✅ Total files to process: ${xmlFiles.length}`);
        } else {
          console.log(`ℹ️  All XML files have already been processed`);
        }
        break; // Use first directory that has files
      }
    } catch (error) {
      // Continue to next directory
    }
  }

  return xmlFiles;
}

// Main execution
async function main() {
  console.log('🔍 Searching for XML files...\n');

  const xmlFiles = findXMLFiles();

  if (xmlFiles.length === 0) {
    console.error('❌ No XML files found matching patterns:');
    console.error('   - newsaddaindia.WordPress.2026-01-16_*.xml (monthly files)');
    console.error('   - newsaddaindia.WordPress.2026-01-03.xml (dec-jan file)');
    console.log('\nPlease ensure the XML files are in one of these locations:');
    console.log('  - Project root directory');
    console.log('  - NewsAddaIndia directory');
    console.log('  - /root/NewsAddaIndia (on VPS)');
    console.log('  - /root (on VPS)');
    process.exit(1);
  }

  console.log(`\n📋 Found ${xmlFiles.length} XML files to process:`);
  xmlFiles.forEach((file, index) => {
    console.log(`   ${index + 1}. ${path.basename(file)}`);
  });

  // Connect to MongoDB once
  console.log('\n🔌 Connecting to MongoDB...');
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/newsaddaindia');
    console.log('✅ Connected to MongoDB\n');
  } catch (error) {
    console.error('❌ Failed to connect to MongoDB:', error.message);
    process.exit(1);
  }

  // Stats tracking
  const stats = {
    imported: 0,
    skipped: 0,
    errors: 0,
    prevImported: 0,
    prevSkipped: 0,
    prevErrors: 0
  };

  // Process each XML file
  for (let i = 0; i < xmlFiles.length; i++) {
    const xmlFile = xmlFiles[i];
    console.log(`\n${'='.repeat(60)}`);
    console.log(`Processing file ${i + 1} of ${xmlFiles.length}`);
    console.log(`${'='.repeat(60)}`);

    await importWordPressXML(xmlFile, stats);
  }

  // Final summary
  console.log(`\n${'='.repeat(60)}`);
  console.log('📊 FINAL IMPORT SUMMARY');
  console.log(`${'='.repeat(60)}`);
  console.log(`✅ Successfully imported/updated: ${stats.imported}`);
  console.log(`⏭️  Skipped (missing title/content): ${stats.skipped}`);
  console.log(`❌ Errors: ${stats.errors}`);
  console.log(`📝 Total files processed: ${xmlFiles.length}`);
  console.log(`${'='.repeat(60)}\n`);

  // Close MongoDB connection
  await mongoose.connection.close();
  console.log('✅ All imports completed!');
}

// Run import
main()
  .then(() => {
    console.log('🎉 Migration completed successfully!');
    process.exit(0);
  })
  .catch(error => {
    console.error('💥 Migration failed:', error);
    process.exit(1);
  });
