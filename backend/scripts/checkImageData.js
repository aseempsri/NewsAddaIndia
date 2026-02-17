const mongoose = require('mongoose');
require('dotenv').config();
const News = require('../models/News');

async function checkImageData() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/newsaddaindia');
    console.log('Connected to MongoDB\n');

    const samples = await News.find({}).limit(10).select('title image images content').lean();
    
    console.log('📸 Sample articles with images:\n');
    samples.forEach((article, i) => {
      console.log(`${i+1}. Title: ${article.title.substring(0, 60)}...`);
      console.log(`   Image field: ${article.image || '(empty)'}`);
      console.log(`   Images array: ${JSON.stringify(article.images)}`);
      
      if (article.content) {
        const imgMatch = article.content.match(/<img[^>]+src=["']([^"']+)["']/i);
        if (imgMatch) {
          console.log(`   Image in content: ${imgMatch[1]}`);
        }
      }
      console.log('');
    });

    // Check statistics
    const total = await News.countDocuments({});
    const withImages = await News.countDocuments({ image: { $ne: '', $exists: true } });
    const withHttpImages = await News.countDocuments({ image: /^https?:\/\// });
    const withRelativeImages = await News.countDocuments({ image: /^\// });
    const emptyImages = await News.countDocuments({ $or: [{ image: '' }, { image: { $exists: false } }] });
    
    console.log('\n📊 Image Statistics:');
    console.log(`Total articles: ${total}`);
    console.log(`Articles with images: ${withImages}`);
    console.log(`Articles with HTTP/HTTPS URLs: ${withHttpImages}`);
    console.log(`Articles with relative paths (/...): ${withRelativeImages}`);
    console.log(`Articles with empty images: ${emptyImages}`);
    
    // Check for different URL patterns
    const wordpressUrls = await News.countDocuments({ image: /newsaddaindia\.com/ });
    const localUrls = await News.countDocuments({ image: /^\/uploads/ });
    
    console.log(`\n📋 URL Patterns:`);
    console.log(`WordPress URLs (newsaddaindia.com): ${wordpressUrls}`);
    console.log(`Local uploads (/uploads/...): ${localUrls}`);
    
    await mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

checkImageData();
