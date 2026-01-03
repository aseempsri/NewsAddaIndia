const mongoose = require('mongoose');
const News = require('../models/News');
require('dotenv').config();

async function checkArticlePages() {
  try {
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/newsaddaindia');
    console.log('✅ Connected to MongoDB\n');

    // Search for the article by title (partial match)
    const searchTitle = 'अकबर के समय थमी परिक्रमा';
    
    console.log(`🔍 Searching for article: "${searchTitle}"...\n`);
    
    const article = await News.findOne({
      title: { $regex: searchTitle, $options: 'i' }
    });

    if (!article) {
      console.log('❌ Article not found in database');
      console.log('\n🔍 Trying broader search...');
      
      // Try searching for "परिक्रमा" or "जूना अखाड़ा"
      const articles = await News.find({
        $or: [
          { title: { $regex: 'परिक्रमा', $options: 'i' } },
          { title: { $regex: 'जूना अखाड़ा', $options: 'i' } }
        ]
      }).limit(5);

      if (articles.length > 0) {
        console.log(`\n📰 Found ${articles.length} similar articles:\n`);
        articles.forEach((art, idx) => {
          console.log(`${idx + 1}. Title: ${art.title.substring(0, 60)}...`);
          console.log(`   ID: ${art._id}`);
          console.log(`   Category: ${art.category}`);
          console.log(`   Pages: [${art.pages.join(', ')}]`);
          console.log(`   Published: ${art.published}`);
          console.log('');
        });
      } else {
        console.log('❌ No articles found');
      }
      
      await mongoose.disconnect();
      return;
    }

    console.log('✅ Article found!\n');
    console.log('📄 Article Details:');
    console.log(`   ID: ${article._id}`);
    console.log(`   Title: ${article.title}`);
    console.log(`   Category: ${article.category}`);
    console.log(`   Pages: [${article.pages.join(', ')}]`);
    console.log(`   Published: ${article.published}`);
    console.log(`   Is Breaking: ${article.isBreaking}`);
    console.log(`   Is Featured: ${article.isFeatured}`);
    console.log(`   Created At: ${article.createdAt}`);
    console.log(`   Updated At: ${article.updatedAt}`);
    
    // Check if pages are correct for National category
    const expectedPages = ['home', 'national'];
    const hasCorrectPages = 
      article.pages.includes('home') && 
      article.pages.includes('national');
    
    console.log('\n🔍 Analysis:');
    console.log(`   Expected pages for National: [${expectedPages.join(', ')}]`);
    console.log(`   Has correct pages: ${hasCorrectPages ? '✅ YES' : '❌ NO'}`);
    
    if (!hasCorrectPages) {
      console.log('\n⚠️  ISSUE FOUND: Pages are not correctly set!');
      console.log('   This might be why the article is not showing on the national page.');
      
      // Check if we should fix it
      console.log('\n💡 Solution:');
      console.log('   The pre-save hook only runs when category is modified.');
      console.log('   If you edited the article without changing category, pages might not sync.');
      console.log('   Run: node scripts/fixArticlePages.js <article_id>');
    } else {
      console.log('\n✅ Pages are correctly set.');
      
      // Check if article would be returned by the query
      const testQuery = {
        published: true,
        pages: { $in: ['national'] }
      };
      
      const wouldMatch = 
        article.published === true &&
        article.pages.includes('national');
      
      console.log(`\n🔍 Query Test (published=true, pages contains 'national'):`);
      console.log(`   Would match: ${wouldMatch ? '✅ YES' : '❌ NO'}`);
      
      if (!wouldMatch) {
        if (!article.published) {
          console.log('   ❌ Article is not published!');
        }
        if (!article.pages.includes('national')) {
          console.log('   ❌ Article pages array does not include "national"!');
        }
      }
    }

    await mongoose.disconnect();
    console.log('\n✅ Check completed!');
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

checkArticlePages();

