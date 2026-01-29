const mongoose = require('mongoose');
require('dotenv').config();

// Connect to MongoDB first
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/newsaddaindia')
  .then(async () => {
    console.log('Connected to MongoDB');
    
    // Import and run the service
    const newsDataService = require('../services/newsdata.service');
    
    console.log('Starting NewsData.io fetch...');
    try {
      const saved = await newsDataService.fetchAndSaveAllCategories();
      console.log(`\n✅ Successfully fetched and saved ${saved.length} articles`);
      console.log('\nArticles saved:');
      saved.forEach((article, index) => {
        console.log(`${index + 1}. [${article.category}] ${article.title.substring(0, 60)}...`);
      });
      process.exit(0);
    } catch (error) {
      console.error('❌ Error:', error.message);
      process.exit(1);
    }
  })
  .catch((error) => {
    console.error('MongoDB connection error:', error);
    process.exit(1);
  });
