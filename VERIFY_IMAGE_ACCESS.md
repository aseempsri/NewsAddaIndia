# Verify Image Access and WhatsApp Integration

## Step 1: Verify Image is Accessible

```bash
# Test if the image URL is accessible
curl -I https://newsaddaindia.com/uploads/696d247abbe90425ac65db27-c23b00c43cf65ca745e952b698784d91-1771513864137.jpg

# Should return HTTP 200 OK
# If 404, the image doesn't exist at that path
```

## Step 2: Test via Nginx (Not Direct Backend)

```bash
# Test via nginx with WhatsApp user-agent (this is what WhatsApp actually uses)
curl -H "User-Agent: WhatsApp/2.0" https://newsaddaindia.com/news/696d247abbe90425ac65db27 | grep "og:image"

# Should show the og:image meta tag
```

## Step 3: Check Nginx is Routing Correctly

```bash
# Check nginx error logs
sudo tail -f /var/log/nginx/error.log

# In another terminal, test the route
curl -H "User-Agent: WhatsApp/2.0" https://newsaddaindia.com/news/696d247abbe90425ac65db27
```

## Step 4: Verify Image Requirements

WhatsApp requires:
- Image must be accessible via HTTPS
- Image should be at least 200x200 pixels
- Image format: JPG, PNG, or GIF
- Image size: Max 8MB
- Image must be publicly accessible (no authentication)

## Step 5: Test with Facebook Sharing Debugger

1. Go to: https://developers.facebook.com/tools/debug/
2. Enter URL: `https://newsaddaindia.com/news/696d247abbe90425ac65db27`
3. Click "Debug"
4. Click "Scrape Again" to refresh cache
5. Check if image appears in preview

## Step 6: Clear WhatsApp Cache

WhatsApp caches link previews. To force refresh:
- Add `?v=2` to the URL when sharing
- Or wait 24-48 hours for cache to expire
- Or use Facebook Sharing Debugger to clear cache

## Step 7: Check Actual Image File Exists

```bash
# Check if file exists on server
ls -lh /root/NewsAddaIndia/backend/uploads/696d247abbe90425ac65db27-c23b00c43cf65ca745e952b698784d91-1771513864137.jpg

# Check file permissions
ls -l /root/NewsAddaIndia/backend/uploads/ | grep 696d247abbe90425ac65db27
```
