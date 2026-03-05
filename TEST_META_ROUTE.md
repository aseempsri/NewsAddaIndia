# Test Meta Route - Troubleshooting Guide

## Issue: No "[Meta Route]" logs found

This means the backend route hasn't been hit yet. Let's verify and test:

### Step 1: Verify Backend Code is Updated

```bash
# Check if the route exists in server.js
grep -n "Meta Route" /root/NewsAddaIndia/backend/server.js

# Should show lines with [Meta Route] logging
```

### Step 2: Restart Backend to Load New Code

```bash
cd /root/NewsAddaIndia/backend
git pull origin main
pm2 restart news-adda-backend

# Wait a few seconds
sleep 3

# Check if it's running
pm2 status
```

### Step 3: Test the Route Manually

```bash
# Test with a real news slug (replace with actual slug from your database)
curl -H "User-Agent: WhatsApp/2.0" http://localhost:3000/news/YOUR_SLUG_HERE

# Or test via domain
curl -H "User-Agent: WhatsApp/2.0" https://newsaddaindia.com/news/YOUR_SLUG_HERE

# Check logs immediately after
pm2 logs news-adda-backend --lines 20
```

### Step 4: Find a Real News Slug

```bash
# Connect to MongoDB and get a slug
mongosh "YOUR_MONGODB_URI" --eval "db.news.findOne({}, {slug: 1, title: 1})"

# Or use Node.js
cd /root/NewsAddaIndia/backend
node -e "require('dotenv').config(); const mongoose = require('mongoose'); mongoose.connect(process.env.MONGODB_URI).then(async () => { const News = require('./models/News'); const news = await News.findOne({}).select('slug title').lean(); console.log('Slug:', news.slug); console.log('Title:', news.title); process.exit(0); });"
```

### Step 5: Check All Log Locations

```bash
# Check PM2 default location
grep "Meta Route" ~/.pm2/logs/news-adda-backend-out.log

# Check ecosystem config location
grep "Meta Route" /root/NewsAddaIndia/backend/logs/pm2-out.log 2>/dev/null

# Check if logs directory exists
ls -la /root/NewsAddaIndia/backend/logs/

# Check recent logs
pm2 logs news-adda-backend --lines 100 | tail -20
```

### Step 6: Verify Nginx is Routing Correctly

```bash
# Test nginx config
sudo nginx -t

# Check nginx error logs for routing issues
sudo tail -f /var/log/nginx/error.log

# Test with curl simulating WhatsApp
curl -v -H "User-Agent: WhatsApp/2.0" https://newsaddaindia.com/news/YOUR_SLUG_HERE
```

### Step 7: Check Backend is Listening

```bash
# Verify backend is running on port 3000
netstat -tlnp | grep 3000

# Or
ss -tlnp | grep 3000

# Test backend directly
curl http://localhost:3000/health
```

## Quick Test Command

Replace `YOUR_SLUG` with an actual slug from your database:

```bash
# Test the meta route directly
curl -H "User-Agent: WhatsApp/2.0" http://localhost:3000/news/YOUR_SLUG

# Immediately check logs
pm2 logs news-adda-backend --lines 10
```

If you see HTML output but no logs, the logging might not be working. If you see no output, the route isn't being hit.
