const mongoose = require('mongoose');
const News = require('../models/News');
require('dotenv').config();

/**
 * Migration Script: Sync Pages with Category
 * 
 * This script updates all existing news articles to ensure their 'pages' field
 * is synchronized with their 'category' field.
 * 
 * Mapping:
 * - National -> ['home', 'national']
 * - International -> ['home', 'international']
 * - Sports -> ['home', 'sports']
 * - Business -> ['home', 'business']
 * - Entertainment -> ['home', 'entertainment']
 * - Health -> ['home', 'health']
 * - Politics -> ['home', 'politics']
 * 
 * The script preserves any additional pages that were manually selected,
 * but ensures the category's corresponding page is always included.
 */

const categoryToPageMap = {
  'National': 'national',
  'International': 'international',
  'Sports': 'sports',
  'Business': 'business',
  'Entertainment': 'entertainment',
  'Health': 'health',
  'Politics': 'politics'
};

async function syncPagesWithCategory() {
  try {
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/newsaddaindia');
    console.log('✅ Connected to MongoDB\n');

    // Get all news articles
    const allNews = await News.find({});
    console.log(`📰 Found ${allNews.length} news articles\n`);

    let updated = 0;
    let skipped = 0;
    let errors = 0;

    for (const news of allNews) {
      try {
        if (!news.category) {
          console.log(`⚠️  Skipping article "${news.title}" - no category`);
          skipped++;
          continue;
        }

        const correspondingPage = categoryToPageMap[news.category];
        if (!correspondingPage) {
          console.log(`⚠️  Skipping article "${news.title}" - unknown category: ${news.category}`);
          skipped++;
          continue;
        }

        // Determine default pages for this category
        const defaultPages = ['home', correspondingPage];
        
        // Get current pages (or empty array if not set)
        const currentPages = news.pages || [];
        
        // Keep other pages that don't conflict with category pages
        const otherPages = currentPages.filter(
          p => p !== 'home' && !Object.values(categoryToPageMap).includes(p)
        );
        
        // Combine default pages with other selected pages
        const newPages = [...defaultPages, ...otherPages];
        
        // Remove duplicates
        const uniquePages = [...new Set(newPages)];
        
        // Check if update is needed
        const currentPagesSet = new Set(currentPages);
        const newPagesSet = new Set(uniquePages);
        
        const needsUpdate = 
          currentPagesSet.size !== newPagesSet.size ||
          ![...currentPagesSet].every(p => newPagesSet.has(p));
        
        if (needsUpdate) {
          news.pages = uniquePages;
          await news.save();
          console.log(`✅ Updated: "${news.title.substring(0, 50)}..."`);
          console.log(`   Category: ${news.category} -> Pages: [${uniquePages.join(', ')}]`);
          updated++;
        } else {
          skipped++;
        }
      } catch (error) {
        console.error(`❌ Error updating article "${news.title}":`, error.message);
        errors++;
      }
    }

    console.log('\n📊 Migration Summary:');
    console.log(`   ✅ Updated: ${updated}`);
    console.log(`   ⏭️  Skipped: ${skipped}`);
    console.log(`   ❌ Errors: ${errors}`);
    console.log(`   📝 Total: ${allNews.length}`);

    await mongoose.disconnect();
    console.log('\n✅ Migration completed successfully!');
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

// Run migration
syncPagesWithCategory();

