const mongoose = require('mongoose');
require('dotenv').config();

// Import News model
const News = require('../models/News');

async function clearAllNews() {
  try {
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/newsaddaindia');
    console.log('✅ Connected to MongoDB\n');

    console.log('⚠️  WARNING: This will delete ALL news articles from the database!');
    console.log('📊 Counting existing articles...');
    
    const count = await News.countDocuments({});
    console.log(`   Found ${count} articles in database\n`);

    if (count === 0) {
      console.log('✅ Database is already empty. Nothing to delete.');
      await mongoose.connection.close();
      return;
    }

    console.log('🗑️  Deleting all news articles...');
    const result = await News.deleteMany({});
    
    console.log(`\n✅ Successfully deleted ${result.deletedCount} articles`);
    console.log('✅ Database cleared successfully!\n');

    // Verify deletion
    const remainingCount = await News.countDocuments({});
    if (remainingCount === 0) {
      console.log('✅ Verification: Database is now empty');
    } else {
      console.log(`⚠️  Warning: ${remainingCount} articles still remain`);
    }

    await mongoose.connection.close();
    console.log('\n✅ Done! Database cleared and connection closed.');
    
  } catch (error) {
    console.error('❌ Error clearing database:', error.message);
    process.exit(1);
  }
}

// Run
clearAllNews()
  .then(() => {
    console.log('🎉 Clear operation completed!');
    process.exit(0);
  })
  .catch(error => {
    console.error('💥 Clear operation failed:', error);
    process.exit(1);
  });
