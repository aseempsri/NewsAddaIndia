const mongoose = require('mongoose');
require('dotenv').config();
const News = require('../models/News');

async function checkImageUrls() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/newsaddaindia');
    console.log('Connected to MongoDB\n');

    const total = await News.countDocuments({});
    const withImages = await News.countDocuments({ image: { $ne: '', $exists: true } });
    const withHttpImages = await News.countDocuments({ image: /^https?:\/\// });
    const emptyImages = await News.countDocuments({ $or: [{ image: '' }, { image: { $exists: false } }] });
    
    const sample = await News.findOne({ image: /^https?:\/\// }).select('title image').lean();
    
    console.log('📊 Image Statistics:');
    console.log(`Total articles: ${total}`);
    console.log(`Articles with images: ${withImages}`);
    console.log(`Articles with HTTP/HTTPS URLs: ${withHttpImages}`);
    console.log(`Articles with empty images: ${emptyImages}`);
    console.log(`\nSample image URL: ${sample?.image || 'N/A'}`);
    
    // Check a few sample URLs
    const samples = await News.find({ image: /^https?:\/\// }).limit(5).select('title image').lean();
    console.log('\n📸 Sample Image URLs:');
    samples.forEach((article, index) => {
      console.log(`${index + 1}. ${article.title.substring(0, 50)}...`);
      console.log(`   URL: ${article.image}`);
    });
    
    await mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

checkImageUrls();
