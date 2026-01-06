# ⚡ Quick Deployment Reference

## 🎯 What You Need to Edit

### 1. **GitHub Secrets** (Required)
Go to: **GitHub Repo → Settings → Secrets and variables → Actions**

Add these secrets:
- `HOSTINGER_VPS_HOST` - Your VPS IP address
- `HOSTINGER_VPS_USER` - SSH username (usually `root`)
- `HOSTINGER_VPS_SSH_KEY` - Private SSH key (from `~/.ssh/hostinger_github`)
- `MONGODB_URI` - MongoDB connection string
- `JWT_SECRET` - Random secret key
- `ADMIN_PASSWORD` - Admin password
- `BACKEND_API_URL` - Your backend URL (e.g., `https://api.yourdomain.com`)
- `FRONTEND_URL` - Your frontend URL (e.g., `https://yourdomain.com`)

### 2. **Frontend Environment File**
**File:** `Frontend/src/environments/environment.prod.ts`

```typescript
export const environment = {
  production: true,
  newsApiKey: 'NEWSAPI_KEY_PLACEHOLDER', // Auto-replaced by workflow
  apiUrl: 'https://api.yourdomain.com' // ⚠️ UPDATE THIS with your backend URL
};
```

### 3. **Workflow File** (Already configured)
**File:** `.github/workflows/deploy-hostinger-vps.yml`

✅ Already set up! No changes needed unless you want to customize paths.

---

## 🚀 How to Deploy

### Automatic (Recommended)
Just push to `main` branch:
```bash
git add .
git commit -m "Your changes"
git push origin main
```

### Manual Trigger
1. Go to **Actions** tab in GitHub
2. Select **Deploy to Hostinger VPS**
3. Click **Run workflow**

### Control What Deploys
Add to commit message:
- `[backend]` - Backend only
- `[frontend]` - Frontend only  
- `[all]` - Both

---

## 📍 Key Files & Locations

### On VPS:
- **Backend:** `~/news-adda-backend/`
- **Frontend:** `/var/www/html/`
- **Nginx Config:** `/etc/nginx/sites-available/`
- **PM2 Process:** `news-adda-backend`

### In Repository:
- **Workflow:** `.github/workflows/deploy-hostinger-vps.yml`
- **Backend Code:** `backend/`
- **Frontend Code:** `Frontend/`
- **Environment:** `Frontend/src/environments/environment.prod.ts`

---

## ✅ Checklist Before First Deployment

- [ ] **VPS has Node.js 18+ installed** (See `VPS_INSTALLATION_GUIDE.md` if not)
- [ ] **VPS has PM2 installed** (See `VPS_INSTALLATION_GUIDE.md` if not)
- [ ] **VPS has Nginx installed** (See `VPS_INSTALLATION_GUIDE.md` if not)
- [ ] Repository cloned on VPS: `~/NewsAddaIndia`
- [ ] Backend directory created: `~/news-adda-backend`
- [ ] SSH key generated and added to VPS
- [ ] GitHub Secrets configured
- [ ] `environment.prod.ts` updated with backend URL
- [ ] MongoDB connection string ready
- [ ] Nginx configured for backend and frontend

---

## 🔍 Verify Deployment

```bash
# SSH into VPS
ssh root@your-vps-ip

# Check backend
pm2 status
pm2 logs news-adda-backend

# Check frontend files
ls -la /var/www/html

# Test API
curl http://localhost:3000/health
```

---

## 🆘 Common Issues

**Deployment fails:**
- Check GitHub Actions logs
- Verify all secrets are set correctly
- Test SSH connection manually

**Backend not starting:**
- Check PM2 logs: `pm2 logs news-adda-backend`
- Verify `.env` file exists on VPS
- Check MongoDB connection

**Frontend not updating:**
- Verify files in `/var/www/html`
- Check Nginx: `sudo nginx -t`
- Reload Nginx: `sudo systemctl reload nginx`

---

**📖 Full Guide:** See `DEPLOYMENT_SETUP.md` for detailed instructions.

