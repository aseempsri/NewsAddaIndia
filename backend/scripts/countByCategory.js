const mongoose = require('mongoose');
const News = require('../models/News');
require('dotenv').config();

async function countByCategory() {
    try {
        console.log('🔌 Connecting to MongoDB...');
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/newsaddaindia');
        console.log('✅ Connected to MongoDB\n');

        // Get total count
        const totalCount = await News.countDocuments({});
        console.log(`📊 Total Articles: ${totalCount}\n`);

        // Get count by category
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

        console.log('📰 Articles by Category:');
        console.log('─'.repeat(50));

        let total = 0;
        categoryCounts.forEach((item, index) => {
            const category = item._id || 'Unknown';
            const count = item.count;
            total += count;
            const percentage = ((count / totalCount) * 100).toFixed(1);
            console.log(`${(index + 1).toString().padStart(2)}. ${category.padEnd(20)} : ${count.toString().padStart(4)} articles (${percentage}%)`);
        });

        console.log('─'.repeat(50));
        console.log(`   Total${' '.repeat(16)} : ${total.toString().padStart(4)} articles`);

        // Get count by published status
        const publishedCount = await News.countDocuments({ published: true });
        const unpublishedCount = await News.countDocuments({ published: false });

        console.log('\n📋 Published Status:');
        console.log(`   Published   : ${publishedCount} articles`);
        console.log(`   Unpublished : ${unpublishedCount} articles`);

        // Get count by breaking news
        const breakingCount = await News.countDocuments({ isBreaking: true });
        const nonBreakingCount = await News.countDocuments({ isBreaking: false });

        console.log('\n🔥 Breaking News Status:');
        console.log(`   Breaking    : ${breakingCount} articles`);
        console.log(`   Regular     : ${nonBreakingCount} articles`);

        // Get count by pages
        console.log('\n📄 Articles by Page (Pages to Display):');
        const pageCounts = await News.aggregate([
            { $unwind: '$pages' },
            {
                $group: {
                    _id: '$pages',
                    count: { $sum: 1 }
                }
            },
            {
                $sort: { count: -1 }
            }
        ]);

        pageCounts.forEach((item, index) => {
            const page = item._id || 'Unknown';
            const count = item.count;
            console.log(`   ${page.padEnd(15)} : ${count.toString().padStart(4)} articles`);
        });

        // Get articles with no pages
        const noPagesCount = await News.countDocuments({
            $or: [
                { pages: { $exists: false } },
                { pages: { $size: 0 } }
            ]
        });

        if (noPagesCount > 0) {
            console.log(`   ${'No pages'.padEnd(15)} : ${noPagesCount.toString().padStart(4)} articles`);
        }

        // Get articles with images
        const withImageCount = await News.countDocuments({
            image: { $exists: true, $ne: '', $ne: null }
        });
        const withoutImageCount = totalCount - withImageCount;

        console.log('\n🖼️  Image Status:');
        console.log(`   With Image  : ${withImageCount} articles`);
        console.log(`   Without Image: ${withoutImageCount} articles`);

        await mongoose.disconnect();
        console.log('\n✅ Analysis completed!');
    } catch (error) {
        console.error('❌ Error:', error);
        process.exit(1);
    }
}

countByCategory();

