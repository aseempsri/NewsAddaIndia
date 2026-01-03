const mongoose = require('mongoose');
const News = require('../models/News');
require('dotenv').config();

async function checkArticleImage() {
  try {
    // Connect to MongoDB
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/newsaddaindia');
    console.log('✅ Connected to MongoDB\n');

    // Search for the article - using partial title match
    const searchTitle = 'वाराणसी में अवैध कालोनियों पर बुलडोज़र';
    
    console.log(`🔍 Searching for article: "${searchTitle}"...\n`);
    
    const article = await News.findOne({
      title: { $regex: searchTitle, $options: 'i' }
    });

    if (!article) {
      console.log('❌ Article not found in database');
      console.log('\n🔍 Trying broader search...');
      
      // Try searching for "बुलडोज़र" or "अवैध कालोनियों"
      const articles = await News.find({
        $or: [
          { title: { $regex: 'बुलडोज़र', $options: 'i' } },
          { title: { $regex: 'अवैध कालोनियों', $options: 'i' } },
          { title: { $regex: 'वाराणसी.*कालोनियों', $options: 'i' } }
        ]
      }).limit(5);

      if (articles.length > 0) {
        console.log(`\n📰 Found ${articles.length} related articles:\n`);
        articles.forEach((art, idx) => {
          console.log(`${idx + 1}. Title: ${art.title.substring(0, 80)}...`);
          console.log(`   Image: ${art.image || '(empty)'}`);
          console.log(`   Date: ${art.date}`);
          console.log('');
        });
      } else {
        console.log('❌ No related articles found');
      }
      
      await mongoose.connection.close();
      return;
    }

    // Article found - display details
    console.log('✅ Article found!\n');
    console.log('📰 Article Details:');
    console.log('─'.repeat(80));
    console.log(`Title: ${article.title}`);
    console.log(`Author: ${article.author}`);
    console.log(`Date: ${article.date}`);
    console.log(`Category: ${article.category}`);
    console.log(`\n🖼️  Image URL:`);
    console.log('─'.repeat(80));
    
    if (article.image && article.image.trim() !== '') {
      console.log(`✅ Image URL: ${article.image}`);
      console.log(`\n📊 Image Status: Fetched and stored`);
      console.log(`\n🔗 You can access the image at: ${article.image}`);
    } else {
      console.log(`❌ No image URL found (empty string)`);
      console.log(`\n📊 Image Status: NOT fetched`);
    }
    
    console.log('\n' + '─'.repeat(80));
    console.log(`\n📝 Full Article Data:`);
    console.log(JSON.stringify({
      title: article.title,
      image: article.image,
      excerpt: article.excerpt?.substring(0, 100) + '...',
      category: article.category,
      tags: article.tags,
      date: article.date
    }, null, 2));

    // Close MongoDB connection
    await mongoose.connection.close();
    console.log('\n✅ Check completed!');
    
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

// Run the check
checkArticleImage()
  .then(() => {
    process.exit(0);
  })
  .catch(error => {
    console.error('💥 Failed:', error);
    process.exit(1);
  });

