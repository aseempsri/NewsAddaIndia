# WhatsApp Image Preview Troubleshooting Guide

## Issue: Images not showing when sharing news articles on WhatsApp

## Quick Fixes

### 1. Clear WhatsApp Cache (Most Common Issue)
WhatsApp aggressively caches meta tags. Even if the fix is working, WhatsApp might still show cached data.

**Solution:**
- Share the link with a query parameter to force WhatsApp to fetch fresh data:
  ```
  https://newsaddaindia.com/news/ARTICLE_ID?v=2
  ```
- Or wait 24-48 hours for WhatsApp's cache to expire

### 2. Verify Meta Tags Are Working

Run these commands on your server:

```bash
# Test 1: Check if meta tags are present
curl -H "User-Agent: WhatsApp/2.0" https://newsaddaindia.com/news/696d247abbe90425ac65db27 | grep "og:image"

# Test 2: Check if image URL is accessible
curl -I https://newsaddaindia.com/uploads/696d247abbe90425ac65db27-c23b00c43cf65ca745e952b698784d91-1771513864137.jpg

# Test 3: Verify image returns 200 OK
curl -I -H "User-Agent: WhatsApp/2.0" https://newsaddaindia.com/uploads/696d247abbe90425ac65db27-c23b00c43cf65ca745e952b698784d91-1771513864137.jpg
```

**Expected Results:**
- Test 1: Should show `<meta property="og:image" content="..."/>`
- Test 2 & 3: Should return `HTTP/1.1 200 OK` and `Content-Type: image/jpeg`

### 3. Check Image Requirements

WhatsApp has specific requirements for images:
- **Minimum size**: 200x200 pixels
- **Maximum size**: 8MB
- **Recommended**: 1200x630 pixels (Open Graph standard)
- **Format**: JPEG, PNG, or GIF
- **Must be accessible**: Image must return 200 OK without authentication

### 4. Test with Facebook Sharing Debugger

Facebook's debugger uses the same crawler as WhatsApp:
1. Go to: https://developers.facebook.com/tools/debug/
2. Enter your article URL: `https://newsaddaindia.com/news/ARTICLE_ID`
3. Click "Debug"
4. Click "Scrape Again" to force refresh
5. Check if the image appears in the preview

### 5. Verify Backend Route is Working

```bash
# Check backend logs
pm2 logs news-adda-backend --lines 20 | grep "Meta Route"

# Test backend directly
curl -H "User-Agent: WhatsApp/2.0" http://localhost:3000/news/696d247abbe90425ac65db27 | grep "og:image"
```

### 6. Check Nginx Routing

```bash
# Verify nginx is routing crawlers correctly
sudo tail -20 /var/log/nginx/access.log | grep "news/"

# Check nginx error logs
sudo tail -20 /var/log/nginx/error.log
```

## Common Issues and Solutions

### Issue: Image URL returns 404
**Solution:** Verify the image file exists:
```bash
ls -la /root/NewsAddaIndia/backend/uploads/ | grep "696d247abbe90425ac65db27"
```

### Issue: Image URL returns 403 Forbidden
**Solution:** Check file permissions:
```bash
sudo chmod 644 /root/NewsAddaIndia/backend/uploads/*
```

### Issue: CORS errors
**Solution:** Already fixed - images now have `Access-Control-Allow-Origin: *` header

### Issue: WhatsApp still showing old preview
**Solution:** 
1. Add a version parameter to the URL: `?v=2`
2. Use Facebook Sharing Debugger to force refresh
3. Wait 24-48 hours for cache to expire

## Deployment Steps After Fix

```bash
# 1. Pull latest changes
cd /root/NewsAddaIndia
git pull origin main

# 2. Restart backend
pm2 restart news-adda-backend

# 3. Test meta route
curl -H "User-Agent: WhatsApp/2.0" https://newsaddaindia.com/news/696d247abbe90425ac65db27 | grep "og:image"

# 4. Test image accessibility
curl -I https://newsaddaindia.com/uploads/696d247abbe90425ac65db27-c23b00c43cf65ca745e952b698784d91-1771513864137.jpg
```

## Still Not Working?

If images still don't show after trying all the above:

1. **Check image file exists and is accessible**
2. **Verify image URL in meta tags matches actual file path**
3. **Test with Facebook Sharing Debugger** (most reliable test)
4. **Check server logs** for any errors when WhatsApp crawls
5. **Try sharing with a different article** to rule out article-specific issues

## Debug Commands Summary

```bash
# Full diagnostic
ARTICLE_ID="696d247abbe90425ac65db27"
echo "=== Testing Meta Tags ==="
curl -H "User-Agent: WhatsApp/2.0" https://newsaddaindia.com/news/$ARTICLE_ID | grep "og:image"
echo ""
echo "=== Testing Image Access ==="
IMAGE_URL=$(curl -s -H "User-Agent: WhatsApp/2.0" https://newsaddaindia.com/news/$ARTICLE_ID | grep -oP 'og:image" content="\K[^"]+' | head -1)
echo "Image URL: $IMAGE_URL"
curl -I "$IMAGE_URL"
echo ""
echo "=== Checking Backend Logs ==="
pm2 logs news-adda-backend --lines 10 | grep "Meta Route"
```
