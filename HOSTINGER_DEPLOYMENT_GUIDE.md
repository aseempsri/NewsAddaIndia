# Complete Hostinger Deployment Guide
## News Adda India - Frontend, Backend & MongoDB

This guide provides step-by-step instructions to deploy your News Adda India project on Hostinger.

---

## 📋 Table of Contents

1. [Prerequisites](#prerequisites)
2. [MongoDB Setup](#mongodb-setup)
3. [Backend Deployment](#backend-deployment)
4. [Frontend Deployment](#frontend-deployment)
5. [Domain & SSL Configuration](#domain--ssl-configuration)
6. [Post-Deployment Checklist](#post-deployment-checklist)
7. [Troubleshooting](#troubleshooting)

---

## Prerequisites

### Required Hostinger Services:
- **VPS Hosting** (for Node.js backend) - Minimum: 1GB RAM, 1 CPU core
- **Shared Hosting** (for Angular frontend) OR use VPS for both
- **Domain name** (optional but recommended)

### Required Accounts:
- Hostinger account with VPS access
- MongoDB Atlas account (free tier available)
- SSH access to your VPS
- FTP/File Manager access for shared hosting (if using)

### Required Software:
- Node.js (v18 or higher)
- npm
- Git
- PM2 (for process management)
- Nginx (for reverse proxy - usually pre-installed on VPS)

---

## MongoDB Setup

### Option 1: MongoDB Atlas (Recommended - Free Tier Available)

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
   - Go to **Database** → **Connect**
   - Choose **Connect your application**
   - Copy the connection string
   - Replace `<password>` with your database user password
   - Replace `<dbname>` with `newsaddaindia` or your preferred database name
   - Example: `mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/newsaddaindia?retryWrites=true&w=majority`

### Option 2: MongoDB on Hostinger VPS (Advanced)

If you prefer self-hosted MongoDB:

```bash
# SSH into your VPS
ssh root@your-vps-ip

# Install MongoDB
wget -qO - https://www.mongodb.org/static/pgp/server-7.0.asc | sudo apt-key add -
echo "deb [ arch=amd64,arm64 ] https://repo.mongodb.org/apt/ubuntu jammy/mongodb-org/7.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-7.0.list
sudo apt-get update
sudo apt-get install -y mongodb-org

# Start MongoDB
sudo systemctl start mongod
sudo systemctl enable mongod

# Connection string: mongodb://localhost:27017/newsaddaindia
```

---

## Backend Deployment

### Step 1: Connect to Your Hostinger VPS

```bash
# SSH into your VPS
ssh root@your-vps-ip
# Or if you have a username:
ssh username@your-vps-ip
```

### Step 2: Install Node.js

```bash
# Update system packages
sudo apt update && sudo apt upgrade -y

# Install Node.js 18.x
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Verify installation
node --version  # Should show v18.x or higher
npm --version
```

### Step 3: Install PM2 (Process Manager)

```bash
# Install PM2 globally
sudo npm install -g pm2

# Verify installation
pm2 --version
```

### Step 4: Install Nginx (if not already installed)

```bash
sudo apt install nginx -y
sudo systemctl start nginx
sudo systemctl enable nginx
```

### Step 5: Upload Backend Code

**Option A: Using Git (Recommended)**

```bash
# Navigate to your home directory
cd ~

# Clone your repository (if using Git)
git clone https://github.com/your-username/NewsAddaIndia.git
cd NewsAddaIndia/backend

# Or create directory and upload files manually
mkdir -p ~/news-adda-backend
cd ~/news-adda-backend
```

**Option B: Using FTP/SFTP**

1. Use FileZilla or WinSCP to connect to your VPS
2. Upload the entire `backend` folder to `/root/news-adda-backend` or `/home/username/news-adda-backend`

### Step 6: Install Backend Dependencies

```bash
cd ~/news-adda-backend  # or wherever you uploaded the backend
npm install --production
```

### Step 7: Create Environment File

```bash
# Create .env file
nano .env
```

Add the following content (replace with your actual values):

```env
# MongoDB Connection
MONGODB_URI=mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/newsaddaindia?retryWrites=true&w=majority

# Server Configuration
PORT=3000
NODE_ENV=production

# Frontend URL (update after frontend deployment)
FRONTEND_URL=https://yourdomain.com

# JWT Secret (generate a strong random string)
JWT_SECRET=your-super-secret-jwt-key-change-this-to-random-string

# Admin Credentials (change these!)
ADMIN_USERNAME=admin
ADMIN_PASSWORD=your-secure-admin-password

# Optional: If using NewsAPI
NEWSAPI_KEY=your-newsapi-key-if-needed
```

**Generate a secure JWT secret:**
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Save the file: `Ctrl+O`, then `Enter`, then `Ctrl+X`

### Step 8: Create Uploads Directory

```bash
mkdir -p uploads
chmod 755 uploads
```

### Step 9: Test Backend Locally

```bash
# Test if backend starts correctly
npm start

# If successful, stop it with Ctrl+C
```

### Step 10: Start Backend with PM2

```bash
# Start the backend with PM2
pm2 start server.js --name news-adda-backend

# Save PM2 configuration
pm2 save

# Setup PM2 to start on system boot
pm2 startup
# Follow the instructions shown (usually run a sudo command)

# Check status
pm2 status
pm2 logs news-adda-backend
```

### Step 11: Configure Nginx Reverse Proxy

```bash
# Create Nginx configuration
sudo nano /etc/nginx/sites-available/news-adda-backend
```

Add the following configuration:

```nginx
server {
    listen 80;
    server_name api.yourdomain.com;  # Replace with your subdomain or domain

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

Enable the site:

```bash
# Create symbolic link
sudo ln -s /etc/nginx/sites-available/news-adda-backend /etc/nginx/sites-enabled/

# Test Nginx configuration
sudo nginx -t

# Reload Nginx
sudo systemctl reload nginx
```

### Step 12: Configure Firewall

```bash
# Allow HTTP and HTTPS
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp

# Allow SSH (if not already allowed)
sudo ufw allow 22/tcp

# Enable firewall
sudo ufw enable
```

---

## Frontend Deployment

### Option A: Deploy on Hostinger Shared Hosting

1. **Build Angular Application Locally**

   ```bash
   # On your local machine
   cd Frontend
   npm install
   
   # Update environment.prod.ts with your backend URL
   # Edit src/environments/environment.prod.ts
   # Set apiUrl to: https://api.yourdomain.com
   
   # Build for production
   npm run build
   ```

2. **Update Production Environment**

   Edit `Frontend/src/environments/environment.prod.ts`:
   ```typescript
   export const environment = {
     production: true,
     newsApiKey: 'your-newsapi-key', // If needed
     apiUrl: 'https://api.yourdomain.com' // Your backend URL
   };
   ```

3. **Upload Build Files**

   - Connect to Hostinger via FTP (FileZilla) or File Manager
   - Navigate to `public_html` folder
   - Upload all contents from `Frontend/dist/news-adda-india/browser/` to `public_html/`

4. **Create .htaccess File** (for Angular routing)

   Create `.htaccess` in `public_html/`:
   ```apache
   <IfModule mod_rewrite.c>
     RewriteEngine On
     RewriteBase /
     RewriteRule ^index\.html$ - [L]
     RewriteCond %{REQUEST_FILENAME} !-f
     RewriteCond %{REQUEST_FILENAME} !-d
     RewriteRule . /index.html [L]
   </IfModule>
   ```

### Option B: Deploy on Same VPS (Recommended)

1. **Build Angular Application**

   ```bash
   # SSH into VPS
   cd ~/NewsAddaIndia/Frontend  # or wherever your frontend code is
   
   # Install dependencies
   npm install
   
   # Update environment.prod.ts
   nano src/environments/environment.prod.ts
   # Set apiUrl to: https://api.yourdomain.com
   
   # Build for production
   npm run build -- --configuration production
   ```

2. **Configure Nginx for Frontend**

   ```bash
   sudo nano /etc/nginx/sites-available/news-adda-frontend
   ```

   Add configuration:

   ```nginx
   server {
       listen 80;
       server_name yourdomain.com www.yourdomain.com;  # Your domain

       root /root/NewsAddaIndia/Frontend/dist/news-adda-india/browser;
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

   Enable and reload:

   ```bash
   sudo ln -s /etc/nginx/sites-available/news-adda-frontend /etc/nginx/sites-enabled/
   sudo nginx -t
   sudo systemctl reload nginx
   ```

---

## Domain & SSL Configuration

### Step 1: Point Domain to Hostinger

1. **In Hostinger Control Panel:**
   - Go to **Domains** → **Manage**
   - Add your domain or subdomain
   - Point A record to your VPS IP address

2. **For Subdomain (api.yourdomain.com):**
   - Add A record: `api` → `your-vps-ip`

### Step 2: Install SSL Certificate (Let's Encrypt)

```bash
# Install Certbot
sudo apt install certbot python3-certbot-nginx -y

# Get SSL certificate for backend
sudo certbot --nginx -d api.yourdomain.com

# Get SSL certificate for frontend
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com

# Certbot will automatically update Nginx configuration
# Test auto-renewal
sudo certbot renew --dry-run
```

### Step 3: Update Environment Variables

After SSL is configured, update your backend `.env`:

```bash
nano ~/news-adda-backend/.env
```

Update:
```env
FRONTEND_URL=https://yourdomain.com
```

Restart backend:
```bash
pm2 restart news-adda-backend
```

---

## Post-Deployment Checklist

### ✅ Backend Verification

1. **Check Backend Health:**
   ```bash
   curl https://api.yourdomain.com/health
   # Should return: {"status":"OK","message":"Server is running"}
   ```

2. **Check PM2 Status:**
   ```bash
   pm2 status
   pm2 logs news-adda-backend --lines 50
   ```

3. **Test API Endpoints:**
   ```bash
   curl https://api.yourdomain.com/api/news
   ```

### ✅ Frontend Verification

1. **Visit your website:** `https://yourdomain.com`
2. **Check browser console** for any errors
3. **Test API connection** - news should load
4. **Test admin login** - go to `/admin` route

### ✅ MongoDB Verification

1. **Check MongoDB connection** in backend logs:
   ```bash
   pm2 logs news-adda-backend | grep -i mongo
   # Should show: "Connected to MongoDB"
   ```

2. **Test from MongoDB Atlas dashboard:**
   - Go to Collections
   - Verify data is being created

### ✅ Security Checklist

- [ ] Changed default admin username/password
- [ ] Set strong JWT_SECRET
- [ ] MongoDB network access restricted to VPS IP
- [ ] SSL certificates installed
- [ ] Firewall configured
- [ ] Regular backups scheduled

---

## Troubleshooting

### Backend Issues

**Problem: Backend not starting**
```bash
# Check logs
pm2 logs news-adda-backend

# Check if port is in use
sudo netstat -tulpn | grep 3000

# Restart backend
pm2 restart news-adda-backend
```

**Problem: MongoDB connection error**
- Verify MONGODB_URI in .env file
- Check MongoDB Atlas network access (IP whitelist)
- Verify database user credentials

**Problem: CORS errors**
- Update FRONTEND_URL in backend .env
- Restart backend: `pm2 restart news-adda-backend`

### Frontend Issues

**Problem: 404 errors on routes**
- Ensure .htaccess file exists (shared hosting)
- Check Nginx try_files configuration (VPS)
- Verify base-href in angular.json

**Problem: API calls failing**
- Check environment.prod.ts apiUrl
- Verify CORS settings in backend
- Check browser console for errors

### Nginx Issues

**Problem: 502 Bad Gateway**
```bash
# Check Nginx error logs
sudo tail -f /var/log/nginx/error.log

# Verify backend is running
pm2 status

# Check Nginx configuration
sudo nginx -t
```

**Problem: SSL certificate issues**
```bash
# Renew certificate manually
sudo certbot renew

# Check certificate status
sudo certbot certificates
```

### PM2 Issues

**Problem: PM2 not starting on boot**
```bash
# Re-run startup script
pm2 startup
# Follow the instructions shown

# Save current process list
pm2 save
```

---

## Maintenance Commands

### Backend Updates

```bash
# SSH into VPS
cd ~/news-adda-backend

# Pull latest code (if using Git)
git pull

# Install new dependencies
npm install --production

# Restart backend
pm2 restart news-adda-backend

# Check logs
pm2 logs news-adda-backend
```

### Frontend Updates

```bash
# On VPS
cd ~/NewsAddaIndia/Frontend

# Pull latest code
git pull

# Install dependencies
npm install

# Rebuild
npm run build -- --configuration production

# Reload Nginx
sudo systemctl reload nginx
```

### Backup MongoDB

```bash
# Install MongoDB tools (if using Atlas, use Atlas backup feature)
# Or use mongodump for local MongoDB
mongodump --uri="your-mongodb-uri" --out=/backup/$(date +%Y%m%d)
```

---

## Useful PM2 Commands

```bash
# View all processes
pm2 list

# View logs
pm2 logs news-adda-backend

# Restart
pm2 restart news-adda-backend

# Stop
pm2 stop news-adda-backend

# Delete
pm2 delete news-adda-backend

# Monitor
pm2 monit
```

---

## Support & Resources

- **Hostinger Support:** https://www.hostinger.com/contact
- **MongoDB Atlas Docs:** https://docs.atlas.mongodb.com/
- **PM2 Documentation:** https://pm2.keymetrics.io/docs/
- **Nginx Documentation:** https://nginx.org/en/docs/

---

## Quick Reference: Important Paths

- **Backend Code:** `~/news-adda-backend/`
- **Backend Logs:** `pm2 logs news-adda-backend`
- **Frontend Build:** `~/NewsAddaIndia/Frontend/dist/news-adda-india/browser/`
- **Nginx Config:** `/etc/nginx/sites-available/`
- **SSL Certificates:** `/etc/letsencrypt/live/`
- **Environment File:** `~/news-adda-backend/.env`

---

**Deployment Complete! 🎉**

Your News Adda India application should now be live at:
- **Frontend:** https://yourdomain.com
- **Backend API:** https://api.yourdomain.com

