# 🔧 Fix Backend Errors - Sharp Dependency & Nginx Conflict

## 🚨 Issues Found

1. **Nginx Conflict:** Both frontend and backend using same `server_name`
2. **Backend Error:** Missing `sharp` library dependency (`libvips-cpp.so.42`)
3. **502 Bad Gateway:** Backend not running, so Nginx can't proxy

---

## ✅ Fix 1: Install Sharp Dependencies

The `sharp` package needs system libraries. Install them:

```bash
# Install required dependencies for sharp
sudo apt update
sudo apt install -y build-essential libvips-dev

# Reinstall sharp in backend directory
cd ~/news-adda-backend
npm uninstall sharp
npm install sharp --include=optional

# Or rebuild node_modules
rm -rf node_modules package-lock.json
npm install --production
```

**Alternative (if above doesn't work):**
```bash
# Install all build dependencies
sudo apt install -y \
    build-essential \
    libvips-dev \
    libvips42 \
    libvips-tools \
    pkg-config \
    python3

# Reinstall backend dependencies
cd ~/news-adda-backend
rm -rf node_modules
npm install --production
```

---

## ✅ Fix 2: Resolve Nginx Conflict

**Problem:** Both configs use `server_name 72.60.235.158`, causing conflict.

**Solution:** Use a single server block with location-based routing.

### Create Combined Nginx Config

```bash
# Remove the conflicting configs
sudo rm /etc/nginx/sites-enabled/news-adda-backend
sudo rm /etc/nginx/sites-enabled/news-adda-frontend

# Create a single combined config
sudo nano /etc/nginx/sites-available/news-adda-india
```

**Paste this configuration:**

```nginx
server {
    listen 80;
    server_name 72.60.235.158;  # Your VPS IP
    
    # Backend API routes - proxy to Node.js
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
    
    # Backend health check - proxy to Node.js
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

**Enable and test:**
```bash
# Enable the new config
sudo ln -s /etc/nginx/sites-available/news-adda-india /etc/nginx/sites-enabled/

# Test configuration
sudo nginx -t

# Reload Nginx
sudo systemctl reload nginx
```

---

## ✅ Fix 3: Restart Backend

After fixing the sharp dependency:

```bash
# Stop the errored process
pm2 delete news-adda-backend

# Navigate to backend directory
cd ~/news-adda-backend

# Start backend again
pm2 start server.js --name news-adda-backend

# Save PM2 configuration
pm2 save

# Check status
pm2 status
pm2 logs news-adda-backend --lines 20
```

---

## 🔍 Verify Everything Works

```bash
# 1. Check backend is running
pm2 status
# Should show: status: "online" (not "errored")

# 2. Test backend directly
curl http://localhost:3000/health
# Should return: {"status":"OK","message":"Server is running"}

# 3. Test through Nginx
curl http://72.60.235.158/health
# Should return: {"status":"OK","message":"Server is running"}

# 4. Test API endpoint
curl http://72.60.235.158/api/news
# Should return news data or empty array

# 5. Check Nginx error logs (if still having issues)
sudo tail -f /var/log/nginx/error.log
```

---

## 🐛 Troubleshooting

### If sharp still doesn't work:

```bash
# Check if libvips is installed
dpkg -l | grep vips

# Install specific version if needed
sudo apt install -y libvips42 libvips-dev

# Rebuild sharp
cd ~/news-adda-backend
npm rebuild sharp
```

### If backend still won't start:

```bash
# Check backend logs
pm2 logs news-adda-backend --lines 50

# Check if port 3000 is in use
sudo netstat -tulpn | grep 3000

# Try starting manually to see errors
cd ~/news-adda-backend
node server.js
```

### If Nginx still shows 502:

```bash
# Check Nginx error logs
sudo tail -f /var/log/nginx/error.log

# Verify backend is running
pm2 status

# Test backend directly
curl http://localhost:3000/health
```

---

## ✅ Complete Fix Script

Run these commands in order:

```bash
# 1. Install sharp dependencies
sudo apt update
sudo apt install -y build-essential libvips-dev libvips42

# 2. Fix backend dependencies
cd ~/news-adda-backend
rm -rf node_modules package-lock.json
npm install --production

# 3. Fix Nginx config
sudo rm /etc/nginx/sites-enabled/news-adda-backend
sudo rm /etc/nginx/sites-enabled/news-adda-frontend

# Create combined config (copy the config above)
sudo nano /etc/nginx/sites-available/news-adda-india
# Paste the combined config from above

sudo ln -s /etc/nginx/sites-available/news-adda-india /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx

# 4. Restart backend
pm2 delete news-adda-backend
cd ~/news-adda-backend
pm2 start server.js --name news-adda-backend
pm2 save

# 5. Verify
pm2 status
curl http://localhost:3000/health
curl http://72.60.235.158/health
```

---

## 🎯 Expected Results

After fixes:
- ✅ PM2 status shows: `status: online` (green)
- ✅ `curl http://localhost:3000/health` returns JSON
- ✅ `curl http://72.60.235.158/health` returns JSON
- ✅ No Nginx warnings about conflicting server names
- ✅ Browser shows your app (not 502 error)

---

**Run the fixes above and your backend should start successfully!** 🚀

