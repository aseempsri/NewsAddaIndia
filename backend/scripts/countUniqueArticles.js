const mongoose = require('mongoose');
require('dotenv').config();

// Import News model
const News = require('../models/News');

async function countUniqueArticles() {
  try {
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/newsaddaindia');
    console.log('✅ Connected to MongoDB\n');

    // Count total unique articles
    const totalCount = await News.countDocuments({});
    console.log(`📊 Total unique articles in database: ${totalCount}`);

    // Count by category
    const categoryCounts = await News.aggregate([
      {
        $group: {
          _id: '$category',
          count: { $sum: 1 }
        }
      },
      {
        $sort: { count: -1 }
      }
    ]);

    console.log('\n📊 Articles by Category:');
    console.log('='.repeat(50));
    categoryCounts.forEach((item, index) => {
      const category = item._id || 'Unknown';
      const count = item.count;
      const percentage = ((count / totalCount) * 100).toFixed(1);
      console.log(`${(index + 1).toString().padStart(2)}. ${category.padEnd(20)} : ${count.toString().padStart(4)} articles (${percentage}%)`);
    });

    console.log('='.repeat(50));
    console.log(`\n✅ Total: ${totalCount} unique articles\n`);

    await mongoose.connection.close();
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

countUniqueArticles()
  .then(() => {
    process.exit(0);
  })
  .catch(error => {
    console.error('💥 Failed:', error);
    process.exit(1);
  });
