/**
 * Script to clear all pending news and fetch Hindi news from NewsData.io
 * Run this with: node scripts/clear-and-fetch-hindi-news.js
 */

const mongoose = require('mongoose');
const PendingNews = require('../models/PendingNews');
const newsDataService = require('../services/newsdata.service');
require('dotenv').config();

async function clearAndFetchHindiNews() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/newsaddaindia');
    console.log('Connected to MongoDB');

    // Delete all pending news
    console.log('Deleting all existing pending news...');
    const deleteResult = await PendingNews.deleteMany({});
    console.log(`✅ Deleted ${deleteResult.deletedCount} pending news articles`);

    // Fetch Hindi news from NewsData.io
    console.log('\nFetching Hindi news from NewsData.io...');
    const savedArticles = await newsDataService.fetchAndSaveAllCategories();
    
    console.log(`\n✅ Successfully fetched and saved ${savedArticles.length} Hindi news articles`);
    console.log('\nSummary:');
    const categoryCounts = {};
    savedArticles.forEach(article => {
      categoryCounts[article.category] = (categoryCounts[article.category] || 0) + 1;
    });
    Object.entries(categoryCounts).forEach(([category, count]) => {
      console.log(`  - ${category}: ${count} articles`);
    });

    // Close MongoDB connection
    await mongoose.connection.close();
    console.log('\n✅ Process completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    await mongoose.connection.close();
    process.exit(1);
  }
}

// Run the script
clearAndFetchHindiNews();
