# Find News Article for Testing

## Get a News Article with Slug or ID

```bash
cd /root/NewsAddaIndia/backend

# Method 1: Get article with slug
node -e "require('dotenv').config(); const mongoose = require('mongoose'); mongoose.connect(process.env.MONGODB_URI).then(async () => { const News = require('./models/News'); const news = await News.findOne({slug: {$exists: true, $ne: null, $ne: ''}}).select('slug title _id').lean(); if (news) { console.log('Found article:'); console.log('ID:', news._id); console.log('Slug:', news.slug); console.log('Title:', news.title); } else { const anyNews = await News.findOne({}).select('_id title slug').lean(); console.log('No slug found, using ID:'); console.log('ID:', anyNews._id); console.log('Title:', anyNews.title); } process.exit(0); }).catch(e => {console.error(e); process.exit(1);});"
```

## Test the Meta Route

Once you have a slug or ID, test it:

```bash
# Replace YOUR_SLUG_OR_ID with actual value from above

# Test 1: Direct backend test
curl -H "User-Agent: WhatsApp/2.0" http://localhost:3000/news/YOUR_SLUG_OR_ID

# Test 2: Via nginx (should route to backend for WhatsApp user-agent)
curl -H "User-Agent: WhatsApp/2.0" https://newsaddaindia.com/news/YOUR_SLUG_OR_ID

# Test 3: Check logs immediately
pm2 logs news-adda-backend --lines 30 | grep -A 5 "Meta Route"
```

## If No Slug Exists, Use Article ID

```bash
# Get any article ID
node -e "require('dotenv').config(); const mongoose = require('mongoose'); mongoose.connect(process.env.MONGODB_URI).then(async () => { const News = require('./models/News'); const news = await News.findOne({}).select('_id title').lean(); console.log('Article ID:', news._id.toString()); console.log('Title:', news.title); process.exit(0); }).catch(e => {console.error(e); process.exit(1);});"

# Then test with ID
curl -H "User-Agent: WhatsApp/2.0" http://localhost:3000/news/ARTICLE_ID_HERE
```
