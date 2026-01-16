const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
const xml2js = require('xml2js');
require('dotenv').config();

// Import News model
const News = require('../models/News');

// Category mapping from WordPress to MongoDB
const categoryMapping = {
  'National': 'National',
  'International': 'International',
  'Sports': 'Sports',
  'Business': 'Business',
  'Entertainment': 'Entertainment',
  'Health': 'Health',
  'Politics': 'Politics',
  'Religious': 'Religious',
  'State': 'National', // Map State to National
  'Breaking news': 'National', // Map Breaking news to National
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
  
  // Look for main category (domain="category")
  for (const cat of wordPressCategories) {
    // Handle different XML parsing structures
    let domain, categoryName;
    
    if (cat.$ && cat.$.domain) {
      // xml2js parsed structure: { $: { domain: 'category' }, _: 'Category Name' }
      domain = cat.$.domain;
      categoryName = cat._ || (typeof cat === 'string' ? cat : '');
    } else if (cat.domain) {
      // Alternative structure
      domain = cat.domain;
      categoryName = cat._ || cat.name || (typeof cat === 'string' ? cat : '');
    } else if (typeof cat === 'string') {
      // Plain string (fallback)
      categoryName = cat;
      domain = 'unknown';
    } else {
      continue;
    }
    
    if (domain === 'category' && categoryName) {
      const mapped = categoryMapping[categoryName];
      if (mapped) {
        return mapped;
      }
    }
  }
  
  // Check tags for category hints
  for (const cat of wordPressCategories) {
    let domain, categoryName;
    
    if (cat.$ && cat.$.domain) {
      domain = cat.$.domain;
      categoryName = cat._ || (typeof cat === 'string' ? cat : '');
    } else if (cat.domain) {
      domain = cat.domain;
      categoryName = cat._ || cat.name || (typeof cat === 'string' ? cat : '');
    } else if (typeof cat === 'string') {
      categoryName = cat;
      domain = 'unknown';
    } else {
      continue;
    }
    
    if (domain === 'post_tag' && categoryName) {
      const mapped = categoryMapping[categoryName];
      if (mapped) {
        return mapped;
      }
    }
  }
  
  return categoryMapping['default'];
}

// Helper function to extract image URL from postmeta
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
        
        // Extract image
        const image = extractImageUrl(item, attachments);
        
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
        
        // Check if news already exists (by title)
        const existingNews = await News.findOne({ title: title.trim() });
        if (existingNews) {
          stats.skipped++;
          continue;
        }
        
        // Create news document
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
    console.log(`   Imported: ${stats.imported - (stats.prevImported || 0)}`);
    console.log(`   Skipped: ${stats.skipped - (stats.prevSkipped || 0)}`);
    console.log(`   Errors: ${stats.errors - (stats.prevErrors || 0)}`);
    
    stats.prevImported = stats.imported;
    stats.prevSkipped = stats.skipped;
    stats.prevErrors = stats.errors;
    
  } catch (error) {
    console.error(`❌ Failed to process ${xmlFilePath}:`, error.message);
    stats.errors++;
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
  
  for (const dir of possibleDirs) {
    if (!fs.existsSync(dir)) continue;
    
    try {
      const files = fs.readdirSync(dir);
      const matchingFiles = files.filter(file => 
        file.startsWith('newsaddaindia.WordPress.2026-01-16_') && file.endsWith('.xml')
      );
      
      if (matchingFiles.length > 0) {
        // Sort files by month order
        const monthOrder = {
          'jan-feb': 1, 'feb-mar': 2, 'mar-apr': 3, 'apr-may': 4,
          'may-jun': 5, 'jun-jul': 6, 'jul-aug': 7, 'aug-sept': 8,
          'sept-oct': 9, 'oct-nov': 10, 'nov-dec': 11
        };
        
        matchingFiles.sort((a, b) => {
          const aMonth = a.match(/2026-01-16_([a-z]+-[a-z]+)\.xml/)?.[1];
          const bMonth = b.match(/2026-01-16_([a-z]+-[a-z]+)\.xml/)?.[1];
          return (monthOrder[aMonth] || 99) - (monthOrder[bMonth] || 99);
        });
        
        matchingFiles.forEach(file => {
          xmlFiles.push(path.join(dir, file));
        });
        
        console.log(`✅ Found ${matchingFiles.length} XML files in: ${dir}`);
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
    console.error('❌ No XML files found matching pattern: newsaddaindia.WordPress.2026-01-16_*.xml');
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
  console.log(`✅ Successfully imported: ${stats.imported}`);
  console.log(`⏭️  Skipped (duplicates/missing data): ${stats.skipped}`);
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
