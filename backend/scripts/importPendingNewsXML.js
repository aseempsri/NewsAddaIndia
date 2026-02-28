const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
const xml2js = require('xml2js');
const axios = require('axios');
const https = require('https');
require('dotenv').config();

// Import PendingNews model
const PendingNews = require('../models/PendingNews');

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
const imageUrlCache = new Map();

/**
 * Generate a hash-based filename from image URL to ensure same URL = same filename
 */
function generateImageFilename(imageUrl, articleTitle) {
  const crypto = require('crypto');
  const urlWithoutQuery = imageUrl.split('?')[0];
  const urlHash = crypto.createHash('md5').update(urlWithoutQuery).digest('hex').substring(0, 8);
  
  const urlParts = urlWithoutQuery.split('/');
  let filename = urlParts[urlParts.length - 1];
  const ext = path.extname(filename) || '.jpg';
  
  const baseName = path.basename(filename, ext).substring(0, 20).replace(/[^a-zA-Z0-9]/g, '_');
  return `${baseName}-${urlHash}${ext}`;
}

/**
 * Check if image already exists locally by URL hash
 */
function findExistingImage(imageUrl) {
  if (!imageUrl || (!imageUrl.startsWith('http://') && !imageUrl.startsWith('https://'))) {
    return null;
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
 */
async function downloadImage(imageUrl, articleTitle) {
  try {
    if (!imageUrl || (!imageUrl.startsWith('http://') && !imageUrl.startsWith('https://'))) {
      return imageUrl;
    }

    const normalizedUrl = imageUrl.split('?')[0].split('#')[0];

    // Check cache first
    if (imageUrlCache.has(normalizedUrl)) {
      const cachedPath = imageUrlCache.get(normalizedUrl);
      console.log(`  ♻️  Using cached image: ${cachedPath}`);
      return cachedPath;
    }

    // Check if file already exists on disk
    const existingPath = findExistingImage(imageUrl);
    if (existingPath) {
      console.log(`  ♻️  Image already exists: ${existingPath}`);
      imageUrlCache.set(normalizedUrl, existingPath);
      return existingPath;
    }

    // Check database for articles with same image URL
    const existingArticle = await PendingNews.findOne({ image: new RegExp(normalizedUrl.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')) });
    if (existingArticle && existingArticle.image && existingArticle.image.startsWith('/uploads/')) {
      console.log(`  ♻️  Image already in database: ${existingArticle.image}`);
      imageUrlCache.set(normalizedUrl, existingArticle.image);
      return existingArticle.image;
    }

    // Download image
    console.log(`  📥 Downloading image: ${imageUrl.substring(0, 60)}...`);
    const response = await axios.get(imageUrl, {
      responseType: 'arraybuffer',
      httpsAgent: httpsAgent,
      timeout: 30000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });

    const filename = generateImageFilename(imageUrl, articleTitle);
    const localPath = path.join(uploadsDir, filename);
    
    fs.writeFileSync(localPath, response.data);
    const localUrl = `/uploads/${filename}`;
    
    imageUrlCache.set(normalizedUrl, localUrl);
    console.log(`  ✅ Downloaded: ${localUrl}`);
    
    return localUrl;
  } catch (error) {
    console.warn(`  ⚠️  Failed to download image: ${error.message}`);
    return imageUrl; // Return original URL as fallback
  }
}

// Category mapping from WordPress to MongoDB
// IMPORTANT: Keys are case-insensitive and trimmed
// All mapped values must match PendingNews model enum: ['National', 'International', 'Sports', 'Business', 'Entertainment', 'Health', 'Politics', 'Religious']
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
    .replace(/<[^>]*>/g, '')
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

  for (const cat of wordPressCategories) {
    let domain, categoryName;

    if (cat.$ && cat.$.domain) {
      domain = cat.$.domain;
      categoryName = cat._ || (typeof cat === 'string' ? cat : '');
    } else if (cat.domain) {
      const domainValue = Array.isArray(cat.domain) ? cat.domain[0] : cat.domain;
      domain = typeof domainValue === 'string' ? domainValue : (domainValue._ || domainValue);
      categoryName = cat._ || cat.name || (typeof cat === 'string' ? cat : '');
    } else if (typeof cat === 'string') {
      categoryName = cat;
      domain = 'unknown';
    } else {
      continue;
    }

    let normalizedDomain = domain;
    if (Array.isArray(domain)) {
      normalizedDomain = domain[0];
    }
    if (normalizedDomain && typeof normalizedDomain === 'object' && normalizedDomain._) {
      normalizedDomain = normalizedDomain._;
    }
    normalizedDomain = String(normalizedDomain || '').toLowerCase();

    if (normalizedDomain === 'category' && categoryName) {
      const normalizedName = String(categoryName).trim().toLowerCase();
      const mapped = categoryMapping[normalizedName];
      if (mapped) {
        return mapped;
      }
    }
  }

  return categoryMapping['default'];
}

// Helper function to extract image URL from postmeta
function extractImageUrl(item, attachments, baseSiteUrl) {
  if (!item['wp:postmeta'] || !Array.isArray(item['wp:postmeta'])) {
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
      const attachment = attachments.find(
        att => {
          const postId = att['wp:post_id'];
          const id = extractText(postId);
          return String(id) === String(thumbnailId);
        }
      );

      if (attachment) {
        // First try: use wp:attachment_url (already has full URL)
        if (attachment['wp:attachment_url']) {
          const url = extractText(attachment['wp:attachment_url']);
          if (url && url.trim() !== '') {
            return url;
          }
        }

        // Second try: construct from _wp_attached_file using original base URL
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
              // Use original base site URL from XML, not hardcoded newsaddaindia.com
              const baseUrl = baseSiteUrl || 'https://newsaddaindia.com';
              return `${baseUrl}/wp-content/uploads/${filePath}`;
            }
          }
        }

        // Third try: use guid (usually has full URL)
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

  // Fallback: extract from content
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

  content = content.replace(/<!--\s*\/?wp:[^>]*-->/g, '');
  content = content.replace(/<p>/g, '<p>').replace(/<\/p>/g, '</p>');
  content = content.replace(/<!--\s*wp:[^>]*-->/g, '');

  return content.trim();
}

// Helper function to determine pages array from category
function getPagesFromCategory(category) {
  const pageMap = {
    'National': ['home', 'national'],
    'International': ['home', 'international'],
    'Sports': ['home', 'sports'],
    'Business': ['home', 'business'],
    'Entertainment': ['home', 'entertainment'],
    'Health': ['home', 'health'],
    'Politics': ['home', 'politics'],
    'Religious': ['home', 'religious']
  };
  
  return pageMap[category] || ['home'];
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

    // Extract base site URL from XML (preserves original domain)
    const baseSiteUrl = extractText(channel['wp:base_site_url']) || extractText(channel.link) || 'https://newsaddaindia.com';
    console.log(`📍 Base site URL: ${baseSiteUrl}`);

    const items = channel.item || [];
    console.log(`Found ${items.length} items in XML`);

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
        const title = extractText(item.title);
        const content = extractText(item['content:encoded']);
        const excerpt = extractText(item['excerpt:encoded']);
        const categories = item.category || [];
        const postDateRaw = item['wp:post_date'] || item.pubDate;
        const postDate = extractText(postDateRaw);
        const authorRaw = item['dc:creator'];
        const author = extractText(authorRaw) || 'News Adda India';

        if (!title || !content) {
          stats.skipped++;
          continue;
        }

        const category = mapCategory(categories);
        const tags = extractTags(categories);
        const imageUrl = extractImageUrl(item, attachments, baseSiteUrl);

        let image = '';
        if (imageUrl && imageUrl.trim() !== '') {
          const localImagePath = await downloadImage(imageUrl, title);
          image = localImagePath || imageUrl;
          await new Promise(resolve => setTimeout(resolve, 200));
        }

        const contentString = typeof content === 'string' ? content : String(content);
        const excerptString = typeof excerpt === 'string' ? excerpt : String(excerpt);
        
        // Extract excerpt: try from excerpt field, then from content, then use title as fallback
        let newsExcerpt = '';
        if (excerptString && excerptString.trim()) {
          newsExcerpt = stripHTML(excerptString).trim();
        }
        if (!newsExcerpt && contentString && contentString.trim()) {
          newsExcerpt = getExcerpt(contentString).trim();
        }
        if (!newsExcerpt) {
          // Final fallback: use title (first 200 chars)
          const titleString = typeof title === 'string' ? title : String(title);
          newsExcerpt = titleString.trim().substring(0, 200);
        }
        // Ensure excerpt is never empty (required field)
        if (!newsExcerpt || newsExcerpt.trim() === '') {
          newsExcerpt = 'News article'; // Absolute fallback
        }

        const cleanedContent = cleanContent(typeof content === 'string' ? content : String(content));
        const isBreaking = isBreakingNews(categories);

        let date = new Date();
        if (postDate) {
          const parsedDate = new Date(postDate);
          if (!isNaN(parsedDate.getTime())) {
            date = parsedDate;
          }
        }

        // Check if pending news already exists (by title)
        const trimmedTitle = title.trim();
        const existingPendingNews = await PendingNews.findOne({ 
          title: trimmedTitle
        });

        if (existingPendingNews) {
          // Update existing article
          existingPendingNews.category = category;
          existingPendingNews.tags = tags;
          existingPendingNews.isBreaking = isBreaking;
          existingPendingNews.excerpt = newsExcerpt; // Always has a value now
          existingPendingNews.content = cleanedContent;
          existingPendingNews.image = image || existingPendingNews.image;
          existingPendingNews.author = author;
          existingPendingNews.updatedAt = new Date();

          await existingPendingNews.save();
          stats.imported++;
          if (stats.imported % 10 === 0) {
            console.log(`✅ Processed ${stats.imported} articles so far (imported/updated)...`);
          }
          continue;
        }

        // Create new pending news document
        const pages = getPagesFromCategory(category);
        const pendingNewsData = {
          title: (typeof title === 'string' ? title : String(title)).trim(),
          titleEn: (typeof title === 'string' ? title : String(title)).trim(),
          excerpt: newsExcerpt, // Always has a value now
          excerptEn: '',
          content: cleanedContent,
          contentEn: '',
          image: image,
          images: image ? [image] : [],
          category: category,
          tags: tags,
          pages: pages,
          author: author,
          isBreaking: isBreaking,
          isFeatured: false,
          isTrending: false,
          generatedBy: 'manual',
          generatedAt: date,
          createdAt: date,
          updatedAt: date
        };

        const pendingNews = new PendingNews(pendingNewsData);
        await pendingNews.save();

        stats.imported++;
        if (stats.imported % 10 === 0) {
          console.log(`✅ Imported ${stats.imported} articles so far...`);
        }

      } catch (error) {
        stats.errors++;
        const errorTitle = extractText(item.title) || 'Unknown';
        console.error(`❌ Error importing post:`, error.message);
        console.error(`   Title: ${errorTitle.substring(0, 100)}`);
      }
    }

    console.log(`\n✅ Completed ${path.basename(xmlFilePath)}`);
    console.log(`   Imported/Updated: ${stats.imported - (stats.prevImported || 0)}`);
    console.log(`   Skipped (no title/content): ${stats.skipped - (stats.prevSkipped || 0)}`);
    console.log(`   Errors: ${stats.errors - (stats.prevErrors || 0)}`);

    stats.prevImported = stats.imported;
    stats.prevSkipped = stats.skipped;
    stats.prevErrors = stats.errors;

  } catch (error) {
    console.error(`❌ Failed to process ${xmlFilePath}:`, error.message);
    stats.errors++;
  }
}

// Find all XML files in pendingnews directory
function findXMLFiles() {
  const possibleDirs = [
    path.join(__dirname, '../../pendingnews'), // pendingnews directory in project root
    path.join(__dirname, '../../pendingnews'), // Alternative path
    path.join(__dirname, '../../../pendingnews'), // If backend is nested
    './pendingnews' // Current directory relative
  ];

  const xmlFiles = [];
  let foundDir = null;

  for (const dir of possibleDirs) {
    if (!fs.existsSync(dir)) continue;

    try {
      const files = fs.readdirSync(dir);
      const xmlFilesInDir = files.filter(file => file.endsWith('.xml'));

      if (xmlFilesInDir.length > 0) {
        foundDir = dir;
        xmlFilesInDir.forEach(file => {
          const filePath = path.join(dir, file);
          xmlFiles.push(filePath);
        });
        console.log(`✅ Found ${xmlFiles.length} XML files in: ${dir}`);
        break;
      }
    } catch (error) {
      // Continue to next directory
    }
  }

  return xmlFiles;
}

// Main execution
async function main() {
  console.log('🔍 Searching for XML files in pendingnews directory...\n');

  const xmlFiles = findXMLFiles();

  if (xmlFiles.length === 0) {
    console.error('❌ No XML files found in pendingnews directory');
    console.log('\nPlease ensure XML files are in one of these locations:');
    console.log('  - ./pendingnews (project root)');
    console.log('  - ../pendingnews (relative to backend)');
    process.exit(1);
  }

  console.log(`\n📋 Found ${xmlFiles.length} XML files to process:`);
  xmlFiles.forEach((file, index) => {
    console.log(`   ${index + 1}. ${path.basename(file)}`);
  });

  // Connect to MongoDB
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
