# 🚀 Hostinger VPS Deployment Guide - Final Version

Complete step-by-step guide to deploy NewsAddaIndia backend and frontend on Hostinger VPS.

---

## 📋 Prerequisites

- SSH access to your Hostinger VPS
- Git repository with latest code pushed
- MongoDB connection string
- Admin password (wrap special characters in quotes)

---

## 🔧 Step 1: Connect to VPS and Navigate to Project

```bash
# SSH into your VPS (replace with your actual SSH command)
ssh root@72.60.235.158

# Navigate to project directory
cd /root/NewsAddaIndia

# Check current status
pwd
ls -la
```

---

## 🔄 Step 2: Pull Latest Code from GitHub

```bash
# Navigate to project root
cd /root/NewsAddaIndia

# Configure Git pull behavior (to avoid merge conflicts)
git config pull.rebase false


###git checkout -- backend/package-lock.json
###git checkout -- Frontend/.angular/cache/18.2.21/news-adda-india/.tsbuildinfo

# Pull latest code
git pull origin main

# If you get "divergent branches" error, use:
# git reset --hard origin/main

# Verify files are updated
git status
```

---

## 🗄️ Step 3: Setup Backend

### 3.1 Navigate to Backend Directory

```bash
cd /root/NewsAddaIndia/backend
```

### 3.2 Install Dependencies

```bash
# Install production dependencies
npm install --production

# If you get sharp module errors (non-critical), continue anyway
# The backend will still work
```

### 3.3 Configure Environment Variables

```bash
# Check if .env exists
ls -la .env

# Edit .env file
nano .env
```

**Required .env variables:**
```env
PORT=3000
MONGODB_URI=your_mongodb_connection_string_here
ADMIN_PASSWORD="adrikA@2025#"
FRONTEND_URL=http://72.60.235.158
```

**⚠️ IMPORTANT:** Wrap password in double quotes if it contains special characters like `#`, `@`, `$`, etc.

Save: `Ctrl+O`, `Enter`, `Ctrl+X`

### 3.4 Verify Environment Variables

```bash
# Test if .env loads correctly
node -e "require('dotenv').config(); console.log('MongoDB:', process.env.MONGODB_URI ? 'Set ✓' : 'Missing ✗'); console.log('Port:', process.env.PORT);"
```

### 3.5 Start Backend with PM2

```bash
# Stop and delete any existing backend process
pm2 delete news-adda-backend 2>/dev/null || echo "No existing process"

# Start backend
pm2 start server.js --name news-adda-backend

# Save PM2 configuration
pm2 save

# Check status
pm2 status

# View logs
pm2 logs news-adda-backend --lines 20
```

### 3.6 Verify Backend is Running

```bash
# Test backend directly (bypassing Nginx)
curl http://localhost:3000/health

# Should return: {"status":"OK","message":"Server is running"}

# Check if port 3000 is listening
sudo netstat -tulpn | grep :3000
```

**Note:** If you see `sharp` module errors in PM2 logs, ignore them - they're non-critical warnings and won't prevent the backend from working.

---

## 🎨 Step 4: Setup Frontend

### 4.1 Navigate to Frontend Directory

```bash
cd /root/NewsAddaIndia/Frontend
```

### 4.2 Install Dependencies

```bash
npm install
```

### 4.3 Configure Production Environment

```bash
# Edit production environment file
nano src/environments/environment.prod.ts
```

**Set API URL:**
```typescript
export const environment = {
  production: true,
  apiUrl: 'http://72.60.235.158'  // Your VPS IP (without /api - Angular will add it)
};
```

Save: `Ctrl+O`, `Enter`, `Ctrl+X`

### 4.4 Build Frontend

```bash
# Build for production with cache-busting
# This automatically injects a deployment timestamp into index.html
npm run build:prod

# Wait for build to complete (2-5 minutes)
# Output: dist/news-adda-india/browser/
# You should see: "✅ Build version injected" message after build completes
```

### 4.5 Deploy Frontend Files

```bash
# Remove old files
sudo rm -rf /var/www/html/*

# Copy new build files
sudo cp -r dist/news-adda-india/browser/* /var/www/html/

# Set proper permissions
sudo chown -R www-data:www-data /var/www/html
sudo chmod -R 755 /var/www/html
```

### 4.6 Verify Frontend Files

```bash
# Check if index.html exists
ls -la /var/www/html/index.html

# List files
ls -la /var/www/html/ | head -10
# Should see: index.html, main-*.js, styles-*.css, assets/
```

---

## 🌐 Step 5: Configure Nginx (CRITICAL)

### 5.1 Create Single Combined Nginx Config

**⚠️ IMPORTANT:** Use ONE combined config file to avoid routing conflicts.

```bash
# Create combined config
sudo nano /etc/nginx/sites-available/news-adda
```

**Paste this EXACT configuration:**

```nginx
server {
    listen 80 default_server;
    server_name 72.60.235.158;
    root /var/www/html;
    index index.html;

    # Backend API routes - MUST come before location /
    location /api {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }

    # Backend health check
    location /health {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Serve uploaded images from backend
    location /uploads {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        # Cache images for 1 year
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # Serve Angular static assets (JS, CSS, images in assets folder) - MUST come before location /
    # Matches files like: polyfills-abc123.js, main-def456.js, styles-ghi789.css, assets/...
    location ~* ^/(polyfills|main|styles|runtime|vendor|common|favicon|assets).*\.(js|css|jpg|jpeg|png|gif|ico|svg|woff|woff2|ttf|eot|webp|avif)$ {
        root /var/www/html;
        try_files $uri =404;
        expires 1y;
        add_header Cache-Control "public, immutable";
        access_log off;
    }

    # Don't cache index.html - Angular SPA needs fresh HTML
    location = /index.html {
        root /var/www/html;
        add_header Cache-Control "no-cache, no-store, must-revalidate";
        add_header Pragma "no-cache";
        add_header Expires "0";
        try_files $uri =404;
    }

    # Frontend - all other routes (MUST come after /api, /health, /uploads, and static assets)
    location / {
        root /var/www/html;
        try_files $uri $uri/ /index.html;
        # Don't cache HTML files (for SPA routing)
        add_header Cache-Control "no-cache, no-store, must-revalidate";
        add_header Pragma "no-cache";
        add_header Expires "0";
    }
}
```

Save: `Ctrl+O`, `Enter`, `Ctrl+X`

### 5.2 Remove Old Configs and Enable New Config

```bash
# Remove ALL existing symlinks
sudo rm -f /etc/nginx/sites-enabled/*

# Remove old config files (optional, but recommended)
sudo rm -f /etc/nginx/sites-available/news-adda-backend
sudo rm -f /etc/nginx/sites-available/news-adda-frontend

# Enable the new combined config
sudo ln -sf /etc/nginx/sites-available/news-adda /etc/nginx/sites-enabled/news-adda

# Verify symlink
ls -la /etc/nginx/sites-enabled/
# Should see: news-adda -> .../news-adda
```

### 5.3 Test and Reload Nginx

```bash
# Test Nginx configuration
sudo nginx -t

# Should show:
# nginx: the configuration file /etc/nginx/nginx.conf syntax is ok
# nginx: configuration file /etc/nginx/nginx.conf test is successful

# If test passes, reload Nginx
sudo systemctl reload nginx

# Check Nginx status
sudo systemctl status nginx
```

---

## ✅ Step 6: Verify Deployment

### 6.1 Test Backend Through Nginx

```bash
# Test health endpoint
curl http://localhost/health
# Should return: {"status":"OK","message":"Server is running"}

# Test API endpoint
curl http://localhost/api/news
# Should return news data or empty array []

# Test from external IP
curl http://72.60.235.158/health
curl http://72.60.235.158/api/news
```

### 6.2 Test Frontend

```bash
# Test frontend locally
curl http://localhost/ | head -20
# Should return HTML content, not "Cannot GET /"

# Test in browser
# Visit: http://72.60.235.158
# Should show your Angular app
```

### 6.3 Test Admin Login

```bash
# Test admin login endpoint
curl -X POST http://72.60.235.158/api/admin/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"adrikA@2025#"}'

# Should return authentication token or success message
```

---

## 🔄 Cache-Busting Strategy (Automatic Browser Cache Clearing)

After every deployment, browsers will automatically fetch the latest version thanks to multiple cache-busting mechanisms:

### How It Works:

1. **Angular Output Hashing**: Angular automatically generates unique filenames for JS/CSS files (e.g., `main-abc123.js`, `styles-def456.css`). When code changes, filenames change, forcing browsers to download new files.

2. **Deployment Timestamp Injection**: The build process automatically injects a unique build version and deployment timestamp into `index.html`. This ensures `index.html` is always unique after each deployment.

3. **Nginx Cache Headers**: 
   - `index.html` is set to **never cache** (`no-cache, no-store, must-revalidate`)
   - Static assets (JS/CSS) are cached for 1 year, but since filenames change with each build, old cached files become irrelevant

4. **Meta Tags**: `index.html` includes cache-control meta tags that instruct browsers not to cache the HTML file.

### What This Means:

✅ **Users will always see the latest deployed changes**  
✅ **No manual browser cache clearing needed**  
✅ **Old cached files become automatically obsolete**  
✅ **Faster page loads (static assets are cached, but always fresh when changed)**

### Verification:

After deployment, you can verify cache-busting is working:

```bash
# Check if build version was injected
grep "build-version" /var/www/html/index.html
# Should show: <meta name="build-version" content="v1234567890" />

# Check deployment timestamp
grep "deployment-timestamp" /var/www/html/index.html
# Should show the current deployment time
```

---

## 🐛 Troubleshooting

### Backend Not Starting

**Check PM2 status:**
```bash
pm2 list
pm2 logs news-adda-backend --lines 50
```

**Restart backend:**
```bash
cd /root/NewsAddaIndia/backend
pm2 delete news-adda-backend
pm2 start server.js --name news-adda-backend
pm2 save
pm2 logs news-adda-backend --lines 20
```

**Check if port 3000 is in use:**
```bash
sudo lsof -i :3000
# If another process is using it, kill it or change PORT in .env
```

**Verify .env file:**
```bash
cd /root/NewsAddaIndia/backend
node -e "require('dotenv').config(); console.log('MongoDB:', process.env.MONGODB_URI ? 'OK' : 'MISSING');"
```

### Backend Not Reachable from Browser

**Symptoms:** `ERR_CONNECTION_TIMED_OUT` when accessing `/api/admin/login`

**Fix:**
1. Verify backend is running: `pm2 list` and `curl http://localhost:3000/health`
2. Check Nginx config: `sudo cat /etc/nginx/sites-available/news-adda | grep -A 5 "location /api"`
3. Ensure `/api` location comes BEFORE `location /` in config
4. Reload Nginx: `sudo systemctl reload nginx`
5. Test: `curl http://localhost/api/health`

### Frontend Shows "Cannot GET /"

**Fix:**
1. Verify frontend files exist: `ls -la /var/www/html/index.html`
2. Check Nginx config has `default_server` flag: `sudo cat /etc/nginx/sites-available/news-adda | grep "listen"`
3. Ensure only ONE config is enabled: `ls -la /etc/nginx/sites-enabled/`
4. Test Nginx config: `sudo nginx -t`
5. Reload Nginx: `sudo systemctl reload nginx`

### Uploaded Images Not Showing

**Symptoms:** Images uploaded via admin panel are not displaying on the website

**Fix:**
1. Verify Nginx has `/uploads` location block:
   ```bash
   sudo cat /etc/nginx/sites-available/news-adda | grep -A 10 "location /uploads"
   ```
   Should show a proxy_pass to localhost:3000

2. If missing, add the `/uploads` location block to Nginx config (see Step 5.1)

3. Verify backend serves images:
   ```bash
   curl http://localhost:3000/uploads/resized-news-*.jpg
   # Replace * with actual filename from backend/uploads directory
   ```

4. Check if uploads directory exists and has files:
   ```bash
   ls -la /root/NewsAddaIndia/backend/uploads/
   ```

5. Verify image files have correct permissions:
   ```bash
   sudo chmod -R 755 /root/NewsAddaIndia/backend/uploads/
   ```

6. Test image access through Nginx:
   ```bash
   curl -I http://localhost/uploads/resized-news-*.jpg
   # Should return 200 OK, not 404
   ```

7. Reload Nginx after config changes:
   ```bash
   sudo nginx -t
   sudo systemctl reload nginx
   ```

### Admin Password Not Accepted

**Fix:**
1. Check .env file: `cat /root/NewsAddaIndia/backend/.env | grep ADMIN_PASSWORD`
2. Ensure password is wrapped in double quotes: `ADMIN_PASSWORD="adrikA@2025#"`
3. Restart backend: `pm2 restart news-adda-backend`

### Git Pull Conflicts

**Fix:**
```bash
# Configure Git
git config pull.rebase false

# Force pull (overwrites local changes)
git reset --hard origin/main
git pull origin main
```

### Nginx Configuration Errors

**Check Nginx error logs:**
```bash
sudo tail -f /var/log/nginx/error.log
```

**Check Nginx access logs:**
```bash
sudo tail -f /var/log/nginx/access.log
```

**Verify config syntax:**
```bash
sudo nginx -t
```

---

## 📝 Quick Reference Commands

### Backend Management

```bash
# Start backend
cd /root/NewsAddaIndia/backend
pm2 start server.js --name news-adda-backend
pm2 save

# Stop backend
pm2 stop news-adda-backend

# Restart backend
pm2 restart news-adda-backend

# View logs
pm2 logs news-adda-backend --lines 50

# Check status
pm2 status
```

### Frontend Management

```bash
# Rebuild and deploy frontend (with cache-busting)
cd /root/NewsAddaIndia/Frontend
npm run build:prod
sudo rm -rf /var/www/html/*
sudo cp -r dist/news-adda-india/browser/* /var/www/html/
sudo chown -R www-data:www-data /var/www/html
```

### Nginx Management

```bash
# Test config
sudo nginx -t

# Reload Nginx
sudo systemctl reload nginx

# Restart Nginx
sudo systemctl restart nginx

# Check status
sudo systemctl status nginx
```

### Git Management

```bash
# Pull latest code
cd /root/NewsAddaIndia
git pull origin main

# If conflicts occur
git reset --hard origin/main
git pull origin main
```

---

## 🎯 Deployment Checklist

- [ ] Code pulled from GitHub
- [ ] Backend dependencies installed
- [ ] Backend .env configured correctly
- [ ] Backend running with PM2
- [ ] Backend responds to `curl http://localhost:3000/health`
- [ ] Frontend dependencies installed
- [ ] Frontend built successfully
- [ ] Frontend files copied to `/var/www/html`
- [ ] Nginx config created (single combined config)
- [ ] Nginx config tested (`sudo nginx -t`)
- [ ] Nginx reloaded
- [ ] Frontend accessible at `http://72.60.235.158`
- [ ] Backend API accessible at `http://72.60.235.158/api/health`
- [ ] Admin login works

---

## 📞 Support

If you encounter issues not covered here:

1. Check PM2 logs: `pm2 logs news-adda-backend --lines 100`
2. Check Nginx logs: `sudo tail -100 /var/log/nginx/error.log`
3. Verify backend is running: `pm2 status` and `curl http://localhost:3000/health`
4. Verify Nginx config: `sudo nginx -t` and `sudo cat /etc/nginx/sites-available/news-adda`

---

**Last Updated:** January 2025
**VPS IP:** 72.60.235.158
**Project Path:** /root/NewsAddaIndia
