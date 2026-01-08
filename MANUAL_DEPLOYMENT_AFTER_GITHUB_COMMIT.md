# 🚀 Manual Deployment After GitHub Commit

## Quick Deployment Guide for Hostinger VPS

This guide provides step-by-step instructions to manually deploy your latest GitHub changes to your currently running Hostinger VPS.

---

## 📋 Prerequisites

- ✅ Latest code pushed to GitHub (`main` branch)
- ✅ SSH access to your Hostinger VPS
- ✅ VPS IP address and credentials
- ✅ Node.js, PM2, and Nginx installed on VPS

---

## 🔐 Step 1: Connect to Your VPS

**SSH into your Hostinger VPS:**

```bash
ssh root@72.60.235.158
```

**Or if using SSH key:**
```bash
ssh -i ~/.ssh/hostinger_github root@72.60.235.158
```

---

## 📥 Step 2: Navigate to Project Directory

```bash
cd /root/NewsAddaIndia
```

**Verify you're in the right directory:**
```bash
pwd
# Should show: /root/NewsAddaIndia
ls -la
# Should see: Frontend/, backend/, .git/, etc.
```

---

## 🔄 Step 3: Pull Latest Changes from GitHub

**Check current branch:**
```bash
git branch
# Should show: * main
```

**Check for local changes:**
```bash
git status
```

### Option A: If you have local changes (merge conflict)

**If you see "Your local changes would be overwritten by merge":**

**Option 1: Stash local changes (recommended for cache/build files)**
```bash
# Stash local changes temporarily
git stash

# Pull latest changes
git pull origin main

# Apply stashed changes back (if needed)
git stash pop
```

**Option 2: Discard local changes (safe for cache/build files)**
```bash
# Discard changes to specific files
git checkout -- Frontend/.angular/cache/18.2.21/news-adda-india/.tsbuildinfo
git checkout -- Frontend/src/environments/environment.prod.ts

# Or discard all local changes (⚠️ Use with caution!)
git reset --hard HEAD

# Then pull
git pull origin main
```

**Option 3: Commit local changes first**
```bash
# Add and commit local changes
git add .
git commit -m "Local VPS changes"

# Pull with merge
git pull origin main

# Resolve any conflicts if they occur
```

### Resolving Merge Conflicts

**If you see "CONFLICT (content): Merge conflict in..." after stash pop or pull:**

**Step 1: Check which files have conflicts**
```bash
git status
# Look for "Unmerged paths" section
```

**Step 2: Resolve conflicts**

**For cache/build files (safe to discard):**
```bash
# Discard local changes to cache files
git checkout --theirs Frontend/.angular/cache/18.2.21/news-adda-india/.tsbuildinfo
git add Frontend/.angular/cache/18.2.21/news-adda-india/.tsbuildinfo
```

**For environment.prod.ts (check what changed):**
```bash
# See what the conflict is
cat Frontend/src/environments/environment.prod.ts
# Look for conflict markers: <<<<<<< HEAD, =======, >>>>>>>

# Option A: Use GitHub version (recommended if you want latest changes)
git checkout --theirs Frontend/src/environments/environment.prod.ts
git add Frontend/src/environments/environment.prod.ts

# Option B: Use your local VPS version (if you have VPS-specific settings)
git checkout --ours Frontend/src/environments/environment.prod.ts
git add Frontend/src/environments/environment.prod.ts

# Option C: Manually edit the file to merge both versions
nano Frontend/src/environments/environment.prod.ts
# Remove conflict markers (<<<<<<<, =======, >>>>>>>)
# Keep the version you want
# Save and exit (Ctrl+X, Y, Enter)
git add Frontend/src/environments/environment.prod.ts
```

**Step 3: Complete the merge**
```bash
# After resolving all conflicts, mark them as resolved
git add .

# If you were in the middle of a stash pop, drop the stash
git stash drop

# If you were pulling, complete the merge
git commit -m "Resolve merge conflicts"
```

**Step 4: Continue with pull (if needed)**
```bash
git pull origin main
```

### Option B: If no local changes

**Pull latest changes:**
```bash
git pull origin main
```

**Verify latest commit:**
```bash
git log --oneline -5
# Should show your latest commit
```

---

## 🔧 Step 4: Install/Update Dependencies

### Backend Dependencies

```bash
cd backend
npm install
cd ..
```

### Frontend Dependencies

```bash
cd Frontend
npm install
cd ..
```

---

## 🏗️ Step 5: Build Frontend

```bash
cd Frontend
npm run build
```

**Wait for build to complete** (this may take 2-5 minutes)

**Verify build output:**
```bash
ls -la dist/news-adda-india/browser/
# Should see: index.html, main-*.js, styles-*.css, etc.
cd ..
```

---

## 📦 Step 6: Deploy Frontend Files

**Copy built files to web root:**
```bash
# Remove old files
sudo rm -rf /var/www/html/*

# Copy new files
sudo cp -r /root/NewsAddaIndia/Frontend/dist/news-adda-india/browser/* /var/www/html/

# Set proper permissions
sudo chown -R www-data:www-data /var/www/html
sudo chmod -R 755 /var/www/html
sudo find /var/www/html -type f -exec chmod 644 {} \;
sudo find /var/www/html -type d -exec chmod 755 {} \;
```

**Verify files are deployed:**
```bash
ls -la /var/www/html/
# Should see: index.html, main-*.js, styles-*.css, etc.
```

---

## 🔄 Step 7: Restart Backend Service

**Check what PM2 processes are running:**
```bash
pm2 list
# Or
pm2 status
```

**Stop existing backend process (if it exists):**
```bash
cd /root/NewsAddaIndia/backend

# Check what backend processes are running
pm2 list | grep -i "backend\|server"

# Stop/delete by common names (try both possible names)
pm2 stop news-adda-backend 2>/dev/null || pm2 stop news-adda-india-backend 2>/dev/null || true
pm2 delete news-adda-backend 2>/dev/null || pm2 delete news-adda-india-backend 2>/dev/null || true

# Or if you see a different name in pm2 list, use that name:
# pm2 stop <actual-process-name>
# pm2 delete <actual-process-name>
```

**Start backend with PM2:**
```bash
# Make sure you're in the backend directory
cd /root/NewsAddaIndia/backend

# Start backend (use the name that matches your existing setup)
pm2 start server.js --name news-adda-backend

# Or if you prefer the longer name:
# pm2 start server.js --name news-adda-india-backend

# Or if using ecosystem file:
pm2 start ecosystem.config.js
# Or to restart if already running:
pm2 restart ecosystem.config.js
```

**Save PM2 configuration:**
```bash
pm2 save
pm2 startup
```

**Check backend status:**
```bash
pm2 status
# Check logs (use the actual process name from pm2 list)
pm2 logs news-adda-backend --lines 20
# Or if using different name:
# pm2 logs news-adda-india-backend --lines 20
```

**Verify backend is running:**
```bash
# Check if backend is listening on port 3000
sudo lsof -i :3000
# Or
curl http://localhost:3000/health
```

---

## 🔄 Step 8: Reload Nginx

```bash
sudo systemctl reload nginx
```

**Check Nginx status:**
```bash
sudo systemctl status nginx
```

**Check Nginx error logs (if needed):**
```bash
sudo tail -20 /var/log/nginx/error.log
```

---

## ✅ Step 9: Verify Deployment

### Test Backend API

```bash
curl http://localhost:3000/health
# Should return: {"status":"ok","timestamp":"..."}

curl http://localhost:3000/api/news?limit=1
# Should return news data
```

### Test Frontend

**In your browser, visit:**
- `http://72.60.235.158/` → Should show your Angular app
- `http://72.60.235.158/health` → Backend health check
- `http://72.60.235.158/api/news` → Backend API

---

## 🐛 Troubleshooting

### Admin Password Not Working

**If admin password `adrikA@2025#` is not being accepted:**

**Issue:** The `#` character in passwords is treated as a comment in `.env` files, so the password gets truncated.

**Fix on VPS:**

```bash
# 1. Navigate to backend directory
cd /root/NewsAddaIndia/backend

# 2. Edit .env file
nano .env

# 3. Find ADMIN_PASSWORD line and wrap it in quotes:
# Change from: ADMIN_PASSWORD=adrikA@2025#
# To: ADMIN_PASSWORD="adrikA@2025#"

# 4. Save: Ctrl+O, Enter, Ctrl+X

# 5. Verify password is read correctly
node -e "require('dotenv').config(); console.log('Password:', process.env.ADMIN_PASSWORD);"
# Should show: Password: adrikA@2025# (with the # character)

# 6. Restart backend to load new password
pm2 restart news-adda-backend

# 7. Check logs
pm2 logs news-adda-backend --lines 10
```

**Quick fix (one-liner):**
```bash
cd /root/NewsAddaIndia/backend && sed -i 's/^ADMIN_PASSWORD=.*/ADMIN_PASSWORD="adrikA@2025#"/' .env && pm2 restart news-adda-backend
```

**Test login after fix:**
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"adrikA@2025#"}'
```

**Expected response:**
```json
{
  "success": true,
  "token": "eyJhbGc...",
  "message": "Login successful"
}
```

### Backend Not Starting

**Check if port 3000 is in use:**
```bash
sudo lsof -i :3000
# Or
sudo netstat -tulpn | grep 3000
```

**Kill process if needed:**
```bash
sudo kill -9 <PID>
```

**Check backend logs:**
```bash
# Use the actual process name from pm2 list (likely news-adda-backend)
pm2 logs news-adda-backend --lines 50
# Or if using different name:
# pm2 logs news-adda-india-backend --lines 50
```

**Check environment variables:**
```bash
cd /root/NewsAddaIndia/backend
cat .env
# Verify all required variables are set
```

### Frontend Not Loading

**Check file permissions:**
```bash
ls -la /var/www/html/
sudo chown -R www-data:www-data /var/www/html
```

**Check Nginx configuration:**
```bash
sudo nginx -t
sudo cat /etc/nginx/sites-available/default
```

**Check Nginx error logs:**
```bash
sudo tail -50 /var/log/nginx/error.log
```

### Build Errors

**Clear Angular cache:**
```bash
cd /root/NewsAddaIndia/Frontend
rm -rf .angular
npm run build
```

**Clear node_modules and reinstall:**
```bash
rm -rf node_modules package-lock.json
npm install
npm run build
```

---

## 📝 Quick Deployment Script

**Save this as a script for faster deployment:**

```bash
#!/bin/bash
# Quick deployment script

echo "🚀 Starting deployment..."

# Navigate to project
cd /root/NewsAddaIndia

# Pull latest changes
echo "📥 Pulling latest changes..."
git pull origin main

# Install backend dependencies
echo "📦 Installing backend dependencies..."
cd backend
npm install
cd ..

# Install frontend dependencies
echo "📦 Installing frontend dependencies..."
cd Frontend
npm install

# Build frontend
echo "🏗️ Building frontend..."
npm run build
cd ..

# Deploy frontend
echo "📦 Deploying frontend..."
sudo rm -rf /var/www/html/*
sudo cp -r Frontend/dist/news-adda-india/browser/* /var/www/html/
sudo chown -R www-data:www-data /var/www/html
sudo chmod -R 755 /var/www/html

# Restart backend
echo "🔄 Restarting backend..."
cd backend
# Try both possible process names (check pm2 list first to see which one exists)
pm2 restart news-adda-backend 2>/dev/null || pm2 restart news-adda-india-backend 2>/dev/null || pm2 start server.js --name news-adda-backend
pm2 save
cd ..

# Reload Nginx
echo "🔄 Reloading Nginx..."
sudo systemctl reload nginx

echo "✅ Deployment complete!"
echo "🌐 Test your site: http://72.60.235.158/"
```

**To use the script:**
```bash
# Save the script
nano deploy.sh
# Paste the script above, then save (Ctrl+X, Y, Enter)

# Make it executable
chmod +x deploy.sh

# Run it
./deploy.sh
```

---

## 🎯 Deployment Checklist

After deployment, verify:

- [ ] Latest code pulled from GitHub
- [ ] Backend dependencies installed
- [ ] Frontend dependencies installed
- [ ] Frontend build completed successfully
- [ ] Frontend files copied to `/var/www/html/`
- [ ] File permissions set correctly
- [ ] Backend service running (check `pm2 status`)
- [ ] Nginx reloaded successfully
- [ ] Frontend loads in browser
- [ ] Backend API responds correctly
- [ ] No errors in PM2 logs
- [ ] No errors in Nginx logs

---

## 📌 Important Notes

1. **Always pull latest changes** before deploying
2. **Check PM2 logs** if backend doesn't start
3. **Check Nginx logs** if frontend doesn't load
4. **Verify environment variables** are set correctly
5. **Test in browser** after deployment
6. **Keep PM2 process running** - it auto-restarts on server reboot if configured

---

## 🔗 Related Files

- `DEPLOY_FRONTEND_NOW.md` - Quick frontend deployment
- `DEPLOYMENT_SUMMARY.md` - Complete deployment setup
- `HOSTINGER_DEPLOYMENT_GUIDE.md` - Full deployment guide

---

**🎉 Your deployment is complete! Visit http://72.60.235.158/ to see your changes live.**

