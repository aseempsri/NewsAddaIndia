const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
const xml2js = require('xml2js');
const News = require('../models/News');
require('dotenv').config();

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

// Helper function to extract image URL from postmeta (same as fixed version)
function extractImageUrl(item, attachments) {
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
        if (attachment['wp:attachment_url']) {
          const url = extractText(attachment['wp:attachment_url']);
          if (url && url.trim() !== '') {
            return url;
          }
        }
        
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

async function fixMissingImages() {
  try {
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/newsaddaindia');
    console.log('✅ Connected to MongoDB\n');

    // Find articles without images
    const articlesWithoutImages = await News.find({ 
      $or: [
        { image: '' },
        { image: { $exists: false } }
      ]
    });
    
    console.log(`📊 Found ${articlesWithoutImages.length} articles without images\n`);
    
    if (articlesWithoutImages.length === 0) {
      console.log('✅ All articles already have images!');
      await mongoose.connection.close();
      return;
    }

    // Load XML file
    console.log('📖 Reading XML file...');
    const xmlFilePath = path.join(__dirname, '../../newsaddaindia.WordPress.2026-01-03.xml');
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
    const items = channel.item || [];
    
    // Extract attachments
    const attachments = items.filter(item => {
      const postType = item['wp:post_type'];
      if (!postType) return false;
      const typeArray = Array.isArray(postType) ? postType[0] : postType;
      const type = (typeArray && typeArray._) ? typeArray._ : (typeof typeArray === 'string' ? typeArray : '');
      return type === 'attachment' || type === 'Attachment';
    });
    
    console.log(`📎 Found ${attachments.length} attachments in XML\n`);
    console.log('🚀 Starting image fix...\n');
    
    let fixed = 0;
    let notFound = 0;
    
    for (const article of articlesWithoutImages) {
      // Find matching item in XML by title
      const xmlItem = items.find(item => {
        const title = extractText(item.title);
        return title.trim() === article.title.trim();
      });
      
      if (xmlItem) {
        const imageUrl = extractImageUrl(xmlItem, attachments);
        if (imageUrl && imageUrl.trim() !== '') {
          article.image = imageUrl;
          await article.save();
          fixed++;
          console.log(`✅ Fixed [${fixed}]: ${article.title.substring(0, 60)}...`);
        } else {
          notFound++;
          console.log(`⏭️  No image found: ${article.title.substring(0, 60)}...`);
        }
      } else {
        notFound++;
        console.log(`⏭️  XML item not found: ${article.title.substring(0, 60)}...`);
      }
    }
    
    console.log('\n📊 Fix Summary:');
    console.log(`✅ Fixed: ${fixed}`);
    console.log(`⏭️  Not found/No image: ${notFound}`);
    console.log(`📝 Total processed: ${articlesWithoutImages.length}`);
    
    await mongoose.connection.close();
    console.log('\n✅ Fix completed!');
    
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

fixMissingImages()
  .then(() => {
    process.exit(0);
  })
  .catch(error => {
    console.error('💥 Failed:', error);
    process.exit(1);
  });

