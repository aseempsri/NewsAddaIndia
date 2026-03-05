# 📋 Backend Logs Location Guide

## PM2 Logs Location

PM2 stores logs in the following locations:

### Default PM2 Log Directory
```
~/.pm2/logs/
```

### Specific Log Files for `news-adda-backend`
```
~/.pm2/logs/news-adda-backend-out.log    # Standard output logs
~/.pm2/logs/news-adda-backend-error.log # Error logs
```

### If Using Ecosystem Config (backend/ecosystem.config.js)
```
/root/NewsAddaIndia/backend/logs/pm2-out.log   # Standard output
/root/NewsAddaIndia/backend/logs/pm2-error.log # Errors
```

## 📖 How to View Logs

### Method 1: PM2 Command (Recommended)
```bash
# View live logs (follow mode)
pm2 logs news-adda-backend

# View last 50 lines
pm2 logs news-adda-backend --lines 50

# View only errors
pm2 logs news-adda-backend --err

# View only standard output
pm2 logs news-adda-backend --out

# View logs with timestamps
pm2 logs news-adda-backend --timestamp
```

### Method 2: Direct File Access
```bash
# View standard output logs
tail -f ~/.pm2/logs/news-adda-backend-out.log

# View error logs
tail -f ~/.pm2/logs/news-adda-backend-error.log

# View last 100 lines
tail -n 100 ~/.pm2/logs/news-adda-backend-out.log

# Search for specific text (e.g., "Meta Route")
grep "Meta Route" ~/.pm2/logs/news-adda-backend-out.log

# View logs from ecosystem config location
tail -f /root/NewsAddaIndia/backend/logs/pm2-out.log
```

### Method 3: Check PM2 Status
```bash
# Check if process is running
pm2 status

# Get detailed info
pm2 describe news-adda-backend

# Monitor in real-time
pm2 monit
```

## 🔍 What to Look For

When checking logs for the WhatsApp image issue, look for:

1. **Meta Route Requests**:
   ```
   [Meta Route] Request received: { slug: '...', userAgent: '...' }
   [Meta Route] News found: { id: '...', title: '...', image: '...' }
   [Meta Route] Original image URL: ...
   [Meta Route] Normalized image URL: ...
   [Meta Route] Sending HTML response with image URL: ...
   ```

2. **WhatsApp User-Agent**:
   - Look for requests with `WhatsApp` in the user-agent string
   - Example: `WhatsApp/2.0` or `WhatsAppBot`

3. **Image URL Issues**:
   - Check if image URLs are being normalized correctly
   - Verify URLs use `https://newsaddaindia.com` domain

## 📝 Quick Commands Reference

```bash
# Navigate to project directory
cd /root/NewsAddaIndia

# View live logs
pm2 logs news-adda-backend

# View last 100 lines and follow
pm2 logs news-adda-backend --lines 100

# Search for Meta Route logs
pm2 logs news-adda-backend | grep "Meta Route"

# View error logs only
pm2 logs news-adda-backend --err --lines 50

# Clear PM2 logs (if needed)
pm2 flush news-adda-backend
```

## 🐛 Debugging WhatsApp Crawler

To test if WhatsApp is hitting your backend:

```bash
# Watch logs in real-time
pm2 logs news-adda-backend --lines 0

# Then share a news article on WhatsApp
# You should see logs like:
# [Meta Route] Request received: { slug: '...', userAgent: 'WhatsApp/...' }
```

## 📁 Alternative Log Locations

If logs aren't in the default location, check:

```bash
# Find PM2 home directory
pm2 info news-adda-backend | grep "pm2 home"

# Check ecosystem config log path
cat /root/NewsAddaIndia/backend/ecosystem.config.js | grep log

# List all PM2 log files
ls -lah ~/.pm2/logs/
```
