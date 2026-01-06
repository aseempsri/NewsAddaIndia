# 📋 Deployment Summary - What You Need to Do

## ✅ Files Already Configured

The following files are **already set up** and ready to use:

1. ✅ **`.github/workflows/deploy-hostinger-vps.yml`** - GitHub Actions workflow (updated and ready)
2. ✅ **`DEPLOYMENT_SETUP.md`** - Complete setup guide
3. ✅ **`QUICK_DEPLOYMENT_REFERENCE.md`** - Quick reference guide
4. ✅ **`Frontend/src/environments/environment.prod.ts`** - Updated with placeholder

---

## 🔧 What YOU Need to Do

### Step 0: Install Node.js, PM2, and Nginx on VPS (If Not Installed)

**⚠️ IMPORTANT:** If Node.js, PM2, or Nginx are NOT installed on your VPS, install them first!

**Quick Install (copy-paste these commands):**
```bash
# SSH into your VPS first
ssh root@your-vps-ip

# Then run:
sudo apt update && sudo apt upgrade -y
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs
sudo npm install -g pm2
sudo apt install nginx -y
sudo systemctl start nginx
sudo systemctl enable nginx
```

**📖 Detailed Guide:** See `INSTALL_NOW.md` for quick install or `VPS_INSTALLATION_GUIDE.md` for complete guide

---

### Step 1: Set Up GitHub Secrets (5 minutes)

Go to: **Your GitHub Repo → Settings → Secrets and variables → Actions**

Add these secrets (click "New repository secret" for each):

1. **`HOSTINGER_VPS_HOST`**
   - Value: Your VPS IP address (e.g., `123.456.789.0`)

2. **`HOSTINGER_VPS_USER`**
   - Value: SSH username (usually `root`)

3. **`HOSTINGER_VPS_SSH_KEY`**
   - Generate SSH key: `ssh-keygen -t rsa -b 4096 -C "github-actions" -f ~/.ssh/hostinger_github`
   - Copy private key: `cat ~/.ssh/hostinger_github`
   - Add public key to VPS: `cat ~/.ssh/hostinger_github.pub` → add to `~/.ssh/authorized_keys` on VPS

4. **`MONGODB_URI`**
   - Value: Your MongoDB connection string

5. **`JWT_SECRET`**
   - Generate: `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`

6. **`ADMIN_PASSWORD`**
   - Value: Your admin password

7. **`BACKEND_API_URL`** (Optional but recommended)
   - Value: Your backend URL (e.g., `https://api.yourdomain.com`)

8. **`FRONTEND_URL`** (Optional but recommended)
   - Value: Your frontend URL (e.g., `https://yourdomain.com`)

---

### Step 2: Update Frontend Environment File

**File:** `Frontend/src/environments/environment.prod.ts`

Change this line:
```typescript
apiUrl: 'https://api.yourdomain.com' // ⚠️ Change this to your actual backend URL
```

---

### Step 3: Initial VPS Setup (One-time)

SSH into your VPS and run these commands:

```bash
# Install Node.js 20.x (LTS)
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install PM2
sudo npm install -g pm2

# Install Nginx
sudo apt install nginx -y

# Clone repository
cd ~
git clone https://github.com/YOUR_USERNAME/NewsAddaIndia.git

# Setup backend
mkdir -p ~/news-adda-backend
cp -r ~/NewsAddaIndia/backend/* ~/news-adda-backend/
cd ~/news-adda-backend
npm install --production

# Setup MongoDB (choose one):
# Option A: MongoDB Atlas (recommended - free tier)
# - Go to https://www.mongodb.com/cloud/atlas
# - Create free account and cluster, get connection string

# Option B: Self-hosted MongoDB on VPS (Ubuntu 24.04)
# MongoDB 8.0 (recommended for Ubuntu 24.04):
# curl -fsSL https://www.mongodb.org/static/pgp/server-8.0.asc | sudo gpg -o /usr/share/keyrings/mongodb-server-8.0.gpg --dearmor
# echo "deb [ arch=amd64,arm64 signed-by=/usr/share/keyrings/mongodb-server-8.0.gpg ] https://repo.mongodb.org/apt/ubuntu noble/mongodb-org/8.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-8.0.list
# sudo apt update && sudo apt-get install -y mongodb-org
# sudo systemctl start mongod && sudo systemctl enable mongod

# Create .env file (add your MongoDB URI, JWT_SECRET, etc.)
nano .env

# Start backend
pm2 start server.js --name news-adda-backend
pm2 save
pm2 startup

# Configure Nginx (see DEPLOYMENT_SETUP.md for details)
```

**📖 Full VPS setup instructions:** See `DEPLOYMENT_SETUP.md` Step 1

---

### Step 4: Deploy!

Once secrets are configured, deployment happens automatically when you push to `main`:

```bash
git add .
git commit -m "Initial deployment setup"
git push origin main
```

Or trigger manually:
- Go to **Actions** tab → **Deploy to Hostinger VPS** → **Run workflow**

---

## 📚 Documentation Files

- **`DEPLOYMENT_SETUP.md`** - Complete step-by-step guide
- **`QUICK_DEPLOYMENT_REFERENCE.md`** - Quick reference for common tasks
- **`HOSTINGER_DEPLOYMENT_GUIDE.md`** - Original deployment guide

---

## 🎯 Quick Checklist

- [ ] GitHub Secrets configured (8 secrets)
- [ ] SSH key generated and added to VPS
- [ ] Frontend `environment.prod.ts` updated with backend URL
- [ ] VPS has Node.js, PM2, Nginx installed
- [ ] Repository cloned on VPS
- [ ] Backend `.env` file created on VPS
- [ ] Backend started with PM2
- [ ] Nginx configured for backend and frontend
- [ ] Push code to trigger deployment

---

## 🆘 Need Help?

1. Check **GitHub Actions** logs for errors
2. See **`DEPLOYMENT_SETUP.md`** for detailed troubleshooting
3. Verify all secrets are set correctly
4. Test SSH connection: `ssh -i ~/.ssh/hostinger_github root@your-vps-ip`

---

**🚀 You're all set! Once secrets are configured, just push to GitHub and watch it deploy automatically!**

