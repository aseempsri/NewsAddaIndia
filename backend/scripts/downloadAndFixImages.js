const mongoose = require('mongoose');
const axios = require('axios');
const fs = require('fs');
const path = require('path');
const https = require('https');
require('dotenv').config();
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

/**
 * Download image from URL and save locally
 */
async function downloadImage(imageUrl, articleId) {
  try {
    // Skip if already a local path
    if (!imageUrl.startsWith('http://') && !imageUrl.startsWith('https://')) {
      return imageUrl; // Already local
    }

    // Extract filename from URL
    const urlParts = imageUrl.split('/');
    const filename = urlParts[urlParts.length - 1];
    
    // Generate unique filename to avoid conflicts
    const ext = path.extname(filename) || '.jpg';
    const baseName = path.basename(filename, ext);
    const uniqueFilename = `${articleId}-${baseName}-${Date.now()}${ext}`;
    const localPath = path.join(uploadsDir, uniqueFilename);

    console.log(`  Downloading: ${imageUrl.substring(0, 60)}...`);

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
        console.log(`  ✅ Saved: ${relativePath}`);
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

/**
 * Process all articles and download images
 */
async function downloadAndFixImages() {
  try {
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/newsaddaindia');
    console.log('✅ Connected to MongoDB\n');

    // Find all articles with external WordPress URLs
    const articles = await News.find({
      image: /^https?:\/\/newsaddaindia\.com/
    }).select('_id title image images').lean();

    console.log(`📊 Found ${articles.length} articles with external WordPress image URLs\n`);
    console.log('🚀 Starting image download process...\n');

    let downloaded = 0;
    let failed = 0;
    let skipped = 0;

    for (let i = 0; i < articles.length; i++) {
      const article = articles[i];
      console.log(`[${i + 1}/${articles.length}] Processing: ${article.title.substring(0, 50)}...`);

      try {
        // Download main image
        let newImagePath = null;
        if (article.image && article.image.startsWith('http')) {
          newImagePath = await downloadImage(article.image, article._id.toString());
          
          if (newImagePath) {
            // Update article with local path
            await News.updateOne(
              { _id: article._id },
              { $set: { image: newImagePath } }
            );
            downloaded++;
            console.log(`  ✅ Updated image field\n`);
          } else {
            failed++;
            console.log(`  ⚠️  Failed to download image, keeping original URL\n`);
          }
        } else {
          skipped++;
          console.log(`  ⏭️  Already local or empty\n`);
        }

        // Small delay to avoid overwhelming the server
        await new Promise(resolve => setTimeout(resolve, 500));
      } catch (error) {
        console.error(`  ❌ Error processing article: ${error.message}\n`);
        failed++;
      }
    }

    console.log('\n📊 Summary:');
    console.log(`✅ Successfully downloaded: ${downloaded}`);
    console.log(`⏭️  Skipped: ${skipped}`);
    console.log(`❌ Failed: ${failed}`);
    console.log(`📝 Total processed: ${articles.length}`);

    await mongoose.connection.close();
    console.log('\n✅ Process completed!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    await mongoose.connection.close();
    process.exit(1);
  }
}

// Run the script
downloadAndFixImages();
