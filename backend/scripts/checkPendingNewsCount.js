const mongoose = require('mongoose');
const PendingNews = require('../models/PendingNews');
require('dotenv').config();

async function checkPendingNews() {
  try {
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/newsaddaindia');
    console.log('✅ Connected to MongoDB\n');

    // Count all pending news
    const totalCount = await PendingNews.countDocuments({});
    console.log(`📊 Total PendingNews documents: ${totalCount}\n`);

    // Count with createdAt
    const withCreatedAt = await PendingNews.countDocuments({ 
      createdAt: { $exists: true, $ne: null } 
    });
    console.log(`📅 Documents with createdAt: ${withCreatedAt}\n`);

    // Sample a few documents to check structure
    const samples = await PendingNews.find({}).limit(5).lean();
    console.log('📝 Sample documents:');
    samples.forEach((doc, index) => {
      console.log(`\n  ${index + 1}. Title: ${doc.title?.substring(0, 50)}...`);
      console.log(`     createdAt: ${doc.createdAt}`);
      console.log(`     category: ${doc.category}`);
      console.log(`     _id: ${doc._id}`);
    });

    // Check years distribution
    const allNews = await PendingNews.find({ 
      createdAt: { $exists: true, $ne: null } 
    }, { createdAt: 1 }).lean();
    
    const years = {};
    allNews.forEach(item => {
      try {
        if (item.createdAt) {
          const date = new Date(item.createdAt);
          if (!isNaN(date.getTime())) {
            const year = date.getFullYear();
            years[year] = (years[year] || 0) + 1;
          }
        }
      } catch (e) {
        // Skip invalid dates
      }
    });

    console.log('\n📅 Articles by year:');
    Object.keys(years).sort().forEach(year => {
      console.log(`   ${year}: ${years[year]} articles`);
    });

    await mongoose.connection.close();
    console.log('\n✅ Database connection closed');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

checkPendingNews();
