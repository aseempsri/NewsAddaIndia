# GitHub Actions Setup for Hostinger VPS Deployment

## 🎯 Overview

This guide helps you set up automatic deployment from GitHub to your Hostinger VPS. Your existing GitHub Pages deployment (https://aseempsri.github.io/NewsAddaIndia/) will remain intact for testing.

---

## 📋 Prerequisites

1. ✅ Hostinger VPS with SSH access
2. ✅ Backend code deployed on VPS
3. ✅ Frontend build directory configured on VPS
4. ✅ MongoDB running on VPS
5. ✅ PM2 installed for backend process management
6. ✅ Nginx configured for frontend

---

## 🔐 Step 1: Set Up GitHub Secrets

Go to your GitHub repository → **Settings** → **Secrets and variables** → **Actions** → **New repository secret**

### Required Secrets:

| Secret Name | Description | Example |
|------------|-------------|---------|
| `HOSTINGER_VPS_HOST` | Your VPS IP address | `123.456.789.0` |
| `HOSTINGER_VPS_USER` | SSH username | `root` or `username` |
| `HOSTINGER_VPS_SSH_KEY` | Private SSH key | `-----BEGIN RSA PRIVATE KEY-----...` |
| `MONGODB_URI` | MongoDB connection string | `mongodb://user:pass@localhost:27017/newsaddaindia` |
| `JWT_SECRET` | JWT secret for authentication | `your-random-secret-key` |
| `ADMIN_PASSWORD` | Admin panel password | `your-secure-password` |

### Optional Secrets:

| Secret Name | Description | Example |
|------------|-------------|---------|
| `HOSTINGER_VPS_PORT` | SSH port (if not 22) | `22` |
| `FRONTEND_URL` | Your frontend domain | `https://yourdomain.com` |
| `BACKEND_API_URL` | Your backend API URL | `https://api.yourdomain.com` |
| `ADMIN_USERNAME` | Admin username (default: admin) | `admin` |
| `NEWSAPI_KEY` | NewsAPI key (if using) | `your-newsapi-key` |

---

## 🔑 Step 2: Generate SSH Key for GitHub Actions

### On Your Local Machine:

```bash
# Generate SSH key pair
ssh-keygen -t rsa -b 4096 -C "github-actions-hostinger" -f ~/.ssh/hostinger_github

# This creates:
# ~/.ssh/hostinger_github (private key) - Add to GitHub Secrets
# ~/.ssh/hostinger_github.pub (public key) - Add to VPS
```

### Add Public Key to VPS:

```bash
# SSH into your VPS
ssh root@your-vps-ip

# Add public key to authorized_keys
mkdir -p ~/.ssh
chmod 700 ~/.ssh
cat >> ~/.ssh/authorized_keys << EOF
# Paste content of ~/.ssh/hostinger_github.pub here
EOF
chmod 600 ~/.ssh/authorized_keys
```

### Add Private Key to GitHub:

1. Copy the content of `~/.ssh/hostinger_github` (private key)
2. Go to GitHub → Repository → Settings → Secrets → Actions
3. Click **New repository secret**
4. Name: `HOSTINGER_VPS_SSH_KEY`
5. Value: Paste the entire private key (including `-----BEGIN RSA PRIVATE KEY-----` and `-----END RSA PRIVATE KEY-----`)
6. Click **Add secret**

---

## 📁 Step 3: Verify VPS Directory Structure

Make sure your VPS has the correct directory structure:

```bash
# SSH into VPS
ssh root@your-vps-ip

# Backend should be at one of these locations:
~/news-adda-backend/
# OR
~/NewsAddaIndia/backend/

# Frontend build directory (Nginx root):
/var/www/html/
# OR
/root/NewsAddaIndia/Frontend/dist/news-adda-india/browser/
```

**Update the workflow file** if your paths are different!

---

## 🚀 Step 4: Test the Workflow

### Option 1: Manual Trigger

1. Go to GitHub → **Actions** tab
2. Select **Deploy to Hostinger VPS** workflow
3. Click **Run workflow**
4. Select branch: `main`
5. Click **Run workflow**

### Option 2: Push to Test

```bash
# Make a small change and push
git add .
git commit -m "[all] Test deployment"
git push origin main
```

### Option 3: Deploy Specific Components

```bash
# Deploy only backend
git commit -m "[backend] Update backend code"
git push origin main

# Deploy only frontend
git commit -m "[frontend] Update frontend code"
git push origin main

# Deploy both (default)
git commit -m "[all] Update both"
git push origin main
```

---

## 📊 How It Works

### Deployment Triggers:

1. **Push to main branch** - Automatically deploys
2. **Manual trigger** - Click "Run workflow" in GitHub Actions
3. **Tag push** - Deploy on version tags (if enabled)

### Deployment Process:

**Backend:**
1. ✅ Pulls latest code from GitHub
2. ✅ Installs/updates dependencies
3. ✅ Updates `.env` file with secrets
4. ✅ Restarts PM2 process
5. ✅ Verifies deployment

**Frontend:**
1. ✅ Builds Angular app locally (in GitHub Actions)
2. ✅ Uploads build files to VPS via SCP
3. ✅ Reloads Nginx

**Verification:**
1. ✅ Checks PM2 status
2. ✅ Tests backend health endpoint
3. ✅ Verifies Nginx status
4. ✅ Checks MongoDB connection

---

## 🎛️ Deployment Control

### Control What Deploys:

Add tags to your commit message:

- `[backend]` - Deploy only backend
- `[frontend]` - Deploy only frontend  
- `[all]` - Deploy both (default)
- `[backend-only]` - Skip frontend
- `[frontend-only]` - Skip backend

**Examples:**

```bash
# Deploy only backend
git commit -m "[backend] Fix API endpoint"

# Deploy only frontend
git commit -m "[frontend] Update UI styles"

# Deploy both (or no tag)
git commit -m "Update project"
git commit -m "[all] Full deployment"
```

---

## 🔍 Monitoring Deployments

### View Deployment Status:

1. Go to GitHub → **Actions** tab
2. Click on workflow run
3. View logs for each step
4. Check for errors or warnings

### Check Deployment on VPS:

```bash
# SSH into VPS
ssh root@your-vps-ip

# Check backend status
pm2 status
pm2 logs news-adda-backend --lines 50

# Check frontend files
ls -la /var/www/html/

# Check Nginx status
sudo systemctl status nginx
```

---

## 🆘 Troubleshooting

### Issue: SSH Connection Failed

**Solution:**
```bash
# Test SSH connection manually
ssh -i ~/.ssh/hostinger_github root@your-vps-ip

# Check SSH key format in GitHub Secrets
# Should include: -----BEGIN RSA PRIVATE KEY-----
```

### Issue: Git Pull Failed

**Solution:**
```bash
# On VPS, ensure git is configured
cd ~/news-adda-backend
git config --global user.name "GitHub Actions"
git config --global user.email "actions@github.com"

# Check git remote
git remote -v
# Should point to your GitHub repository
```

### Issue: PM2 Not Found

**Solution:**
```bash
# On VPS, install PM2 globally
npm install -g pm2

# Or use npx
npx pm2 restart news-adda-backend
```

### Issue: Frontend Not Updating

**Solution:**
```bash
# Check Nginx root directory
sudo cat /etc/nginx/sites-available/news-adda-frontend | grep root

# Verify files were uploaded
ls -la /var/www/html/

# Check Nginx permissions
sudo chown -R www-data:www-data /var/www/html/
```

### Issue: Backend Not Starting

**Solution:**
```bash
# Check PM2 logs
pm2 logs news-adda-backend

# Check .env file
cat ~/news-adda-backend/.env

# Test MongoDB connection
mongosh -u newsadda_user -p password --authenticationDatabase newsaddaindia
```

---

## 🔒 Security Best Practices

1. ✅ **Never commit secrets** - Use GitHub Secrets only
2. ✅ **Use SSH keys** - Not passwords
3. ✅ **Rotate keys regularly** - Every 90 days
4. ✅ **Limit SSH access** - Use firewall rules
5. ✅ **Monitor deployments** - Check logs regularly
6. ✅ **Use branch protection** - Require PR reviews

---

## 📝 Workflow File Location

The workflow file is located at:
```
.github/workflows/deploy-hostinger-vps.yml
```

**Your existing GitHub Pages workflow** (`deploy.yml`) remains untouched and will continue to deploy to:
- https://aseempsri.github.io/NewsAddaIndia/

**Both workflows run independently:**
- `deploy.yml` → GitHub Pages (for testing)
- `deploy-hostinger-vps.yml` → Hostinger VPS (for production)

---

## ✅ Verification Checklist

After setup, verify:

- [ ] GitHub Secrets configured
- [ ] SSH key added to VPS
- [ ] SSH key added to GitHub Secrets
- [ ] Workflow file created (`.github/workflows/deploy-hostinger-vps.yml`)
- [ ] Test deployment successful
- [ ] Backend running on VPS
- [ ] Frontend accessible on domain
- [ ] MongoDB connected
- [ ] GitHub Pages still working (for testing)

---

## 🎯 Next Steps

1. ✅ Set up GitHub Secrets
2. ✅ Generate and add SSH key
3. ✅ Push workflow file to repository
4. ✅ Test deployment
5. ✅ Monitor first few deployments
6. ✅ Adjust paths/configurations if needed

---

## 📚 Additional Resources

- **GitHub Actions Docs:** https://docs.github.com/en/actions
- **SSH Action:** https://github.com/appleboy/ssh-action
- **SCP Action:** https://github.com/appleboy/scp-action
- **PM2 Docs:** https://pm2.keymetrics.io/docs/

---

**Ready to deploy!** Push your code and watch it automatically deploy to Hostinger VPS! 🚀

