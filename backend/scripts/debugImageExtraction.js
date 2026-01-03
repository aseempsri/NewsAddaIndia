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

async function debugImageExtraction() {
  try {
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
    
    // Find the specific article
    const article = items.find(item => {
      const title = extractText(item.title);
      return title.includes('वाराणसी में अवैध कालोनियों पर बुलडोज़र');
    });
    
    if (!article) {
      console.log('❌ Article not found in XML');
      return;
    }
    
    console.log('✅ Found article in XML\n');
    console.log('📋 Post Meta Data:');
    console.log('─'.repeat(80));
    
    if (article['wp:postmeta'] && Array.isArray(article['wp:postmeta'])) {
      article['wp:postmeta'].forEach((meta, idx) => {
        const key = meta['wp:meta_key'];
        const value = meta['wp:meta_value'];
        
        const keyStr = Array.isArray(key) ? extractText(key[0]) : extractText(key);
        const valueStr = Array.isArray(value) ? extractText(value[0]) : extractText(value);
        
        console.log(`${idx + 1}. Key: ${keyStr}`);
        console.log(`   Value: ${valueStr}`);
        
        if (keyStr === '_thumbnail_id') {
          console.log(`   ⭐ THIS IS THE THUMBNAIL ID!`);
        }
        console.log('');
      });
    } else {
      console.log('❌ No postmeta found');
    }
    
    // Find attachments
    const attachments = items.filter(item => {
      const postType = item['wp:post_type'];
      if (!postType) return false;
      const typeArray = Array.isArray(postType) ? postType[0] : postType;
      const type = (typeArray && typeArray._) ? typeArray._ : (typeof typeArray === 'string' ? typeArray : '');
      return type === 'attachment' || type === 'Attachment';
    });
    
    console.log(`\n📎 Found ${attachments.length} attachments\n`);
    
    // Find thumbnail_id
    const thumbnailMeta = article['wp:postmeta']?.find(
      meta => {
        const key = meta['wp:meta_key'];
        const keyStr = Array.isArray(key) ? extractText(key[0]) : extractText(key);
        return keyStr === '_thumbnail_id';
      }
    );
    
    if (thumbnailMeta) {
      const thumbnailId = Array.isArray(thumbnailMeta['wp:meta_value']) 
        ? extractText(thumbnailMeta['wp:meta_value'][0])
        : extractText(thumbnailMeta['wp:meta_value']);
      
      console.log(`🔍 Looking for attachment with post_id: ${thumbnailId}\n`);
      
      // Find matching attachment
      const attachment = attachments.find(att => {
        const postId = att['wp:post_id'];
        const id = Array.isArray(postId) ? extractText(postId[0]) : extractText(postId);
        console.log(`   Checking attachment post_id: ${id} (type: ${typeof id})`);
        return id === thumbnailId || id === String(thumbnailId) || String(id) === String(thumbnailId);
      });
      
      if (attachment) {
        console.log('\n✅ Found matching attachment!\n');
        console.log('📎 Attachment Details:');
        console.log('─'.repeat(80));
        
        // Try wp:attachment_url
        if (attachment['wp:attachment_url']) {
          const url = Array.isArray(attachment['wp:attachment_url']) 
            ? extractText(attachment['wp:attachment_url'][0])
            : extractText(attachment['wp:attachment_url']);
          console.log(`✅ Image URL (from wp:attachment_url): ${url}`);
        }
        
        // Try guid
        if (attachment.guid) {
          const guid = Array.isArray(attachment.guid) ? attachment.guid[0] : attachment.guid;
          const guidStr = extractText(guid);
          console.log(`📎 GUID: ${guidStr}`);
        }
      } else {
        console.log(`\n❌ No matching attachment found for thumbnail_id: ${thumbnailId}`);
      }
    } else {
      console.log('\n❌ No _thumbnail_id found in postmeta');
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

debugImageExtraction()
  .then(() => {
    console.log('\n✅ Debug completed!');
    process.exit(0);
  })
  .catch(error => {
    console.error('💥 Failed:', error);
    process.exit(1);
  });

