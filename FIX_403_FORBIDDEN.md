# 🔧 Fix 403 Forbidden Error

## ✅ Good News: Backend is Working!

Your backend is running successfully:
- ✅ `curl http://localhost:3000/health` works
- ✅ `curl http://72.60.235.158/health` works  
- ✅ `curl http://72.60.235.158/api/news` works
- ✅ Backend status: `online`

## 🚨 Issue: 403 Forbidden for Frontend

The 403 error means Nginx can't serve files from `/var/www/html`. This is because:
1. Frontend files haven't been deployed yet, OR
2. Permission issues with `/var/www/html`

---

## ✅ Solution 1: Deploy Frontend Files

### Option A: Deploy via GitHub Actions (Recommended)

Your GitHub Actions workflow will automatically deploy frontend files. But first, make sure:

1. **Frontend is built and ready**
2. **GitHub Secrets are configured**
3. **Push to trigger deployment**

### Option B: Manual Deployment (Quick Test)

**Build frontend locally or on VPS:**

```bash
# On VPS, navigate to frontend directory
cd ~/NewsAddaIndia/Frontend

# Install dependencies (if not done)
npm install

# Update environment.prod.ts with your backend URL
nano src/environments/environment.prod.ts
# Set: apiUrl: 'http://72.60.235.158'

# Build for production
npm run build -- --configuration production

# Copy build files to web root
sudo cp -r dist/news-adda-india/browser/* /var/www/html/

# Set proper permissions
sudo chown -R www-data:www-data /var/www/html
sudo chmod -R 755 /var/www/html
```

---

## ✅ Solution 2: Fix Permissions

If files exist but you're getting 403:

```bash
# Check if directory exists
ls -la /var/www/html

# Fix ownership (Nginx runs as www-data)
sudo chown -R www-data:www-data /var/www/html

# Fix permissions
sudo chmod -R 755 /var/www/html

# Ensure index.html exists and is readable
sudo chmod 644 /var/www/html/index.html

# Reload Nginx
sudo systemctl reload nginx
```

---

## ✅ Solution 3: Update Nginx Config (If Needed)

Check your current Nginx config:

```bash
sudo cat /etc/nginx/sites-available/news-adda-india
```

**Make sure it has:**

```nginx
server {
    listen 80;
    server_name 72.60.235.158;
    
    # Backend API routes
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
    
    # Frontend - serve Angular app
    location / {
        root /var/www/html;
        index index.html;
        try_files $uri $uri/ /index.html;
    }
    
    # Cache static assets
    location ~* \.(jpg|jpeg|png|gif|ico|css|js|svg|woff|woff2|ttf|eot)$ {
        root /var/www/html;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
```

**Important:** Make sure the `root` directive is set correctly for the frontend location.

---

## 🔍 Debug Steps

### 1. Check if frontend files exist:

```bash
ls -la /var/www/html
```

**Expected:** Should see `index.html` and other Angular build files.

**If empty:** Frontend hasn't been deployed yet.

### 2. Check Nginx error logs:

```bash
sudo tail -f /var/log/nginx/error.log
```

Look for permission errors or file not found errors.

### 3. Test file access:

```bash
# Check if Nginx can read the files
sudo -u www-data cat /var/www/html/index.html
```

If this fails, it's a permission issue.

### 4. Check Nginx access logs:

```bash
sudo tail -f /var/log/nginx/access.log
```

---

## 🚀 Quick Fix Commands

**If `/var/www/html` is empty (frontend not deployed):**

```bash
# Create a test index.html (temporary)
sudo bash -c 'echo "<h1>Frontend will be deployed here</h1><p>Backend API: <a href=\"/api/news\">/api/news</a></p><p>Health: <a href=\"/health\">/health</a></p>" > /var/www/html/index.html'

# Set permissions
sudo chown www-data:www-data /var/www/html/index.html
sudo chmod 644 /var/www/html/index.html

# Test
curl http://72.60.235.158/
```

**If files exist but 403:**

```bash
# Fix permissions
sudo chown -R www-data:www-data /var/www/html
sudo chmod -R 755 /var/www/html
sudo find /var/www/html -type f -exec chmod 644 {} \;
sudo find /var/www/html -type d -exec chmod 755 {} \;

# Reload Nginx
sudo systemctl reload nginx
```

---

## 📝 Deploy Frontend Properly

**Option 1: Via GitHub Actions (Recommended)**

1. Make sure GitHub Secrets are configured
2. Push your code to trigger deployment
3. Frontend will be built and deployed automatically

**Option 2: Manual Build and Deploy**

```bash
# On VPS
cd ~/NewsAddaIndia/Frontend

# Update environment
nano src/environments/environment.prod.ts
# Set: apiUrl: 'http://72.60.235.158'

# Build
npm install
npm run build -- --configuration production

# Deploy
sudo rm -rf /var/www/html/*
sudo cp -r dist/news-adda-india/browser/* /var/www/html/
sudo chown -R www-data:www-data /var/www/html
sudo chmod -R 755 /var/www/html

# Reload Nginx
sudo systemctl reload nginx
```

---

## ✅ Verify Fix

After deploying frontend:

```bash
# Test frontend
curl http://72.60.235.158/
# Should return HTML content

# Test in browser
# Visit: http://72.60.235.158
# Should show your Angular app (not 403)
```

---

## 🎯 Summary

**Current Status:**
- ✅ Backend: Working perfectly
- ❌ Frontend: 403 Forbidden (files not deployed or permission issue)

**Next Steps:**
1. Deploy frontend files to `/var/www/html`
2. Fix permissions: `sudo chown -R www-data:www-data /var/www/html`
3. Reload Nginx: `sudo systemctl reload nginx`

**Your backend API is working!** You just need to deploy the frontend. 🚀

