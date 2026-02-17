# 🚀 GitHub to Hostinger VPS Deployment Setup Guide

This guide will help you set up automatic deployment from GitHub to your Hostinger VPS.

## 📋 Prerequisites

- ✅ Hostinger VPS is ready and accessible
- ✅ GitHub repository with your code
- ✅ SSH access to your VPS
- ✅ Node.js and PM2 installed on VPS (see Initial VPS Setup below)

---

## 🔧 Step 1: Initial VPS Setup (One-time)

**SSH into your VPS:**
```bash
ssh root@your-vps-ip
# Or: ssh username@your-vps-ip
```

### ⚠️ Prerequisites: Install Node.js, PM2, and Nginx

**If Node.js, PM2, or Nginx are NOT installed, follow this guide first:**
- **Quick Setup:** See `VPS_INSTALLATION_GUIDE.md` for detailed installation instructions
- **Or use the setup script:** `vps-initial-setup.sh`

**Quick Installation Commands:**
```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js 20.x (LTS - Long Term Support)
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install PM2
sudo npm install -g pm2

# Install Nginx
sudo apt install nginx -y
sudo systemctl start nginx
sudo systemctl enable nginx
```

**Note:** Node.js 18.x is deprecated. We're using Node.js 20.x (LTS) which is actively supported.

### Install Node.js (if not using quick setup above)
```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js 20.x (LTS - Long Term Support)
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# Verify
node --version  # Should show v20.x or higher
npm --version
```

### Install PM2
```bash
sudo npm install -g pm2
pm2 --version
```

### Install Nginx
```bash
sudo apt install nginx -y
sudo systemctl start nginx
sudo systemctl enable nginx
```

### Clone Your Repository
```bash
# Navigate to home directory
cd ~

# Clone your repository
git clone https://github.com/YOUR_USERNAME/NewsAddaIndia.git

# Create backend directory structure
mkdir -p ~/news-adda-backend
cd ~/news-adda-backend

# Copy backend files
cp -r ~/NewsAddaIndia/backend/* ~/news-adda-backend/
```

### Setup MongoDB

**Option 1: MongoDB Atlas (Recommended - Free Tier Available)**

1. **Create MongoDB Atlas Account**
   - Go to https://www.mongodb.com/cloud/atlas
   - Sign up for a free account
   - Create a new cluster (choose FREE tier M0)

2. **Configure Database Access**
   - Go to **Database Access** → **Add New Database User**
   - Create a username and password (save these securely)
   - Set privileges to **Read and write to any database**

3. **Configure Network Access**
   - Go to **Network Access** → **Add IP Address**
   - Add your Hostinger VPS IP address
   - Or add `0.0.0.0/0` for all IPs (less secure, but easier for testing)

4. **Get Connection String**
   - Go to **Database** → **Connect** → **Connect your application**
   - Copy the connection string
   - Replace `<password>` with your database user password
   - Replace `<dbname>` with `newsaddaindia`
   - Example: `mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/newsaddaindia?retryWrites=true&w=majority`

**Option 2: MongoDB on Hostinger VPS (Self-Hosted)**

If you prefer self-hosted MongoDB:

```bash
# Check Ubuntu version
lsb_release -a

# Option 1: MongoDB 8.0 (Recommended for Ubuntu 24.04)
# Import MongoDB 8.0 GPG key
curl -fsSL https://www.mongodb.org/static/pgp/server-8.0.asc | sudo gpg -o /usr/share/keyrings/mongodb-server-8.0.gpg --dearmor

# Add MongoDB 8.0 repository for Ubuntu 24.04 (Noble)
echo "deb [ arch=amd64,arm64 signed-by=/usr/share/keyrings/mongodb-server-8.0.gpg ] https://repo.mongodb.org/apt/ubuntu noble/mongodb-org/8.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-8.0.list

# Update and install MongoDB 8.0
sudo apt update
sudo apt-get install -y mongodb-org

# Option 2: MongoDB 7.0 (Fallback - use Ubuntu 22.04 repository)
# If you prefer MongoDB 7.0, use this instead:
# curl -fsSL https://www.mongodb.org/static/pgp/server-7.0.asc | sudo gpg -o /usr/share/keyrings/mongodb-server-7.0.gpg --dearmor
# echo "deb [ arch=amd64,arm64 signed-by=/usr/share/keyrings/mongodb-server-7.0.gpg ] https://repo.mongodb.org/apt/ubuntu jammy/mongodb-org/7.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-7.0.list
# sudo apt update
# sudo apt-get install -y mongodb-org

# Start MongoDB
sudo systemctl start mongod
sudo systemctl enable mongod

# Verify MongoDB is running
sudo systemctl status mongod

# Test connection
mongosh --eval "db.version()"
```

**Connection string for self-hosted MongoDB:**
- Simple: `mongodb://localhost:27017/newsaddaindia`
- With auth: `mongodb://username:password@localhost:27017/newsaddaindia?authSource=newsaddaindia`

**📖 Detailed MongoDB setup:** See `MONGODB_VPS_DEPLOYMENT.md` for complete guide

### Create Initial .env File
```bash
cd ~/news-adda-backend
nano .env
```

Add these variables (update with your actual values):
```env
# MongoDB Connection (use connection string from MongoDB setup above)
MONGODB_URI=mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/newsaddaindia?retryWrites=true&w=majority
# OR for self-hosted: MONGODB_URI=mongodb://localhost:27017/newsaddaindia

# Server Configuration
PORT=3000
NODE_ENV=production

# Frontend URL (update after frontend deployment)
FRONTEND_URL=https://yourdomain.com

# JWT Secret (generate a secure random string)
JWT_SECRET=generate-a-random-secret-key-here

# Admin Credentials (change these!)
ADMIN_USERNAME=admin
ADMIN_PASSWORD=your-secure-password

# Optional: NewsAPI Key
NEWSAPI_KEY=your-newsapi-key-if-needed
```

**Generate JWT Secret:**
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

**📖 Complete .env guide:** See `ENV_FILE_EXAMPLE.md` for detailed explanations of each variable

### Create Uploads Directory
```bash
mkdir -p ~/news-adda-backend/uploads
chmod 755 ~/news-adda-backend/uploads
```

**Note:** After importing WordPress XML files, run the image download script to store images locally:
```bash
cd ~/news-adda-backend
node scripts/downloadAndFixImages.js
```
See `MONGODB_VPS_DEPLOYMENT.md` for details about downloading images.

### Install Backend Dependencies
```bash
cd ~/news-adda-backend
npm install --production
```

### Start Backend with PM2
```bash
cd ~/news-adda-backend
pm2 start server.js --name news-adda-backend
pm2 save
pm2 startup  # Follow the instructions shown
```

### Configure Nginx

**Backend (API):**
```bash
sudo nano /etc/nginx/sites-available/news-adda-backend
```

Add:
```nginx
server {
    listen 80;
    server_name 72.60.235.158;

    location / {
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
}
```

**Frontend:**
```bash
sudo nano /etc/nginx/sites-available/news-adda-frontend
```

Add:
```nginx
server {
    listen 80;
    server_name 72.60.235.158;  # Your VPS IP (same as backend)
    # Later, if you have a domain: server_name yourdomain.com www.yourdomain.com;

    root /var/www/html;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    # Cache static assets
    location ~* \.(jpg|jpeg|png|gif|ico|css|js|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
```

**📝 Important Notes:** 
- **Yes, use the same IP `72.60.235.158` for both frontend and backend!**
- **Backend config:** `server_name 72.60.235.158;` → Handles `/api/*` and `/health` routes
- **Frontend config:** `server_name 72.60.235.158;` → Handles everything else (`/`)
- **How it works:** Nginx will route requests:
  - `http://72.60.235.158/api/*` → Backend (proxied to localhost:3000)
  - `http://72.60.235.158/health` → Backend (proxied to localhost:3000)
  - `http://72.60.235.158/` → Frontend (serves Angular app from /var/www/html)
- **Later:** When you get a domain, update to `yourdomain.com` and `api.yourdomain.com`

**Enable sites:**
```bash
sudo ln -s /etc/nginx/sites-available/news-adda-backend /etc/nginx/sites-enabled/
sudo ln -s /etc/nginx/sites-available/news-adda-frontend /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

### Configure Firewall
```bash
sudo ufw allow 22/tcp   # SSH
sudo ufw allow 80/tcp   # HTTP
sudo ufw allow 443/tcp  # HTTPS
sudo ufw enable
```

---

## 🔐 Step 2: Generate SSH Key for GitHub Actions

**On your local machine:**

```bash
# Generate SSH key pair
ssh-keygen -t rsa -b 4096 -C "github-actions-hostinger" -f ~/.ssh/hostinger_github

# This creates:
# ~/.ssh/hostinger_github (private key) - Add to GitHub Secrets
# ~/.ssh/hostinger_github.pub (public key) - Add to VPS
```

**Add public key to VPS:**
```bash
# Copy public key content
cat ~/.ssh/hostinger_github.pub

# SSH into VPS
ssh root@your-vps-ip

# Add to authorized_keys
mkdir -p ~/.ssh
chmod 700 ~/.ssh
nano ~/.ssh/authorized_keys
# Paste the public key content here
chmod 600 ~/.ssh/authorized_keys
```

**Test SSH connection:**
```bash
ssh -i ~/.ssh/hostinger_github root@your-vps-ip
# Should connect without password prompt
```

---

## 🔑 Step 3: Configure GitHub Secrets

Go to your GitHub repository → **Settings** → **Secrets and variables** → **Actions** → **New repository secret**

Add these secrets:

### Required Secrets:

| Secret Name | Description | Example |
|------------|-------------|---------|
| `HOSTINGER_VPS_HOST` | Your VPS IP address | `123.456.789.0` |
| `HOSTINGER_VPS_USER` | SSH username | `root` |
| `HOSTINGER_VPS_SSH_KEY` | Private SSH key content | `-----BEGIN RSA PRIVATE KEY-----...` |
| `MONGODB_URI` | MongoDB connection string | `mongodb+srv://user:pass@cluster.mongodb.net/db` |
| `JWT_SECRET` | JWT secret key | `your-random-secret-key` |
| `ADMIN_PASSWORD` | Admin password | `your-secure-password` |

### Optional Secrets:

| Secret Name | Description | Example |
|------------|-------------|---------|
| `HOSTINGER_VPS_PORT` | SSH port (default: 22) | `22` |
| `FRONTEND_URL` | Frontend URL for CORS | `https://yourdomain.com` |
| `BACKEND_API_URL` | Backend API URL | `https://api.yourdomain.com` |
| `ADMIN_USERNAME` | Admin username (default: admin) | `admin` |
| `NEWSAPI_KEY` | NewsAPI key (if using) | `your-newsapi-key` |

**To get SSH private key:**
```bash
cat ~/.ssh/hostinger_github
# Copy the entire output including -----BEGIN and -----END lines
```

---

## 📝 Step 4: Update Code Files

### Update Frontend Environment

Edit `Frontend/src/environments/environment.prod.ts`:

```typescript
export const environment = {
  production: true,
  newsApiKey: 'NEWSAPI_KEY_PLACEHOLDER', // Will be replaced by GitHub Actions
  apiUrl: 'https://api.yourdomain.com' // Update with your backend URL
};
```

### Verify Workflow File

The workflow file `.github/workflows/deploy-hostinger-vps.yml` is already configured. Verify these paths match your setup:

- Backend directory: `~/news-adda-backend` or `~/NewsAddaIndia/backend`
- Frontend build output: `Frontend/dist/news-adda-india/browser/`
- Frontend deployment path: `/var/www/html`

---

## 🚀 Step 5: Deploy!

### Automatic Deployment

The workflow will automatically deploy when you:
- Push to `main` branch
- Push changes to `backend/**` or `Frontend/**` directories

### Manual Deployment

1. Go to your GitHub repository
2. Click **Actions** tab
3. Select **Deploy to Hostinger VPS** workflow
4. Click **Run workflow** → **Run workflow**

### Deployment Triggers

You can control what deploys by adding to your commit message:
- `[backend]` - Deploy backend only
- `[frontend]` - Deploy frontend only
- `[all]` - Deploy both
- `[backend-only]` - Skip frontend
- `[frontend-only]` - Skip backend

**Example:**
```bash
git commit -m "[backend] Fix API endpoint"
git push origin main
```

---

## ✅ Step 6: Verify Deployment

### Check Backend
```bash
# SSH into VPS
ssh root@your-vps-ip

# Check PM2 status
pm2 status
pm2 logs news-adda-backend --lines 20

# Test API
curl http://localhost:3000/health
```

### Check Frontend
- Visit your domain: `https://yourdomain.com`
- Check browser console for errors
- Verify API calls are working

### Check GitHub Actions
- Go to **Actions** tab in GitHub
- Click on the latest workflow run
- Check for any errors in the logs

---

## 🔧 Troubleshooting

### SSH Connection Failed
```bash
# Test SSH manually
ssh -i ~/.ssh/hostinger_github root@your-vps-ip

# Check SSH key format in GitHub Secrets
# Should include: -----BEGIN RSA PRIVATE KEY-----
```

### Backend Not Starting
```bash
# Check PM2 logs
pm2 logs news-adda-backend

# Check if port is in use
sudo netstat -tulpn | grep 3000

# Restart manually
pm2 restart news-adda-backend
```

### Frontend Not Updating
```bash
# Check Nginx configuration
sudo nginx -t

# Check file permissions
ls -la /var/www/html

# Reload Nginx
sudo systemctl reload nginx
```

### Git Pull Failed
```bash
# On VPS, ensure git is configured
git config --global user.name "GitHub Actions"
git config --global user.email "actions@github.com"

# Check repository URL
cd ~/news-adda-backend
git remote -v
```

---

## 📚 Additional Resources

- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [PM2 Documentation](https://pm2.keymetrics.io/docs/)
- [Nginx Documentation](https://nginx.org/en/docs/)

---

## 🎉 Success!

Once configured, every push to `main` will automatically deploy your changes to Hostinger VPS!

**Next Steps:**
1. ✅ Set up GitHub Secrets
2. ✅ Push code to trigger first deployment
3. ✅ Monitor deployment in GitHub Actions
4. ✅ Verify your site is live

---

**Need Help?** Check the workflow logs in GitHub Actions for detailed error messages.
