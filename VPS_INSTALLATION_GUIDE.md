# 🔧 VPS Installation Guide - Node.js, PM2, and Nginx

This guide will help you install the required software on your Hostinger VPS.

---

## 🚀 Quick Installation (Recommended)

### Option 1: Use the Setup Script

1. **SSH into your VPS:**
   ```bash
   ssh root@your-vps-ip
   ```

2. **Download and run the setup script:**
   ```bash
   # Download the script
   curl -O https://raw.githubusercontent.com/YOUR_USERNAME/NewsAddaIndia/main/vps-initial-setup.sh
   
   # Or if you've already uploaded it:
   # Make it executable
   chmod +x vps-initial-setup.sh
   
   # Run the script
   ./vps-initial-setup.sh
   ```

### Option 2: Manual Installation

Follow the steps below to install everything manually.

---

## 📋 Manual Installation Steps

### Step 1: Connect to Your VPS

```bash
ssh root@your-vps-ip
# Or if you have a username:
ssh username@your-vps-ip
```

---

### Step 2: Update System Packages

```bash
sudo apt update
sudo apt upgrade -y
```

---

### Step 3: Install Node.js 20.x (LTS - Long Term Support)

```bash
# Add NodeSource repository
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -

# Install Node.js
sudo apt-get install -y nodejs

# Verify installation
node --version  # Should show v20.x.x or higher
npm --version   # Should show 10.x.x or higher
```

**Expected Output:**
```
v20.11.0
10.2.4
```

**Note:** Node.js 18.x is deprecated. We're using Node.js 20.x (LTS) which is actively supported.

**If you see errors:**
- Make sure you're using Ubuntu/Debian (Hostinger VPS usually comes with Ubuntu)
- Try: `sudo apt-get update` first
- Check internet connection: `ping google.com`

---

### Step 4: Install PM2

```bash
# Install PM2 globally
sudo npm install -g pm2

# Verify installation
pm2 --version  # Should show version number
```

**Expected Output:**
```
5.3.0
```

**PM2 Commands:**
```bash
pm2 list              # List all processes
pm2 start app.js      # Start an app
pm2 stop app          # Stop an app
pm2 restart app       # Restart an app
pm2 logs app          # View logs
pm2 save              # Save current process list
pm2 startup           # Setup PM2 to start on boot
```

---

### Step 5: Install Nginx

```bash
# Install Nginx
sudo apt install nginx -y

# Start Nginx
sudo systemctl start nginx

# Enable Nginx to start on boot
sudo systemctl enable nginx

# Check Nginx status
sudo systemctl status nginx
```

**Verify Nginx is running:**
```bash
# Test Nginx
curl http://localhost
# Should return HTML content

# Or check from browser
# Visit: http://your-vps-ip
# Should see "Welcome to nginx!" page
```

---

### Step 6: Install Git (if not already installed)

```bash
sudo apt install git -y

# Verify
git --version
```

---

### Step 7: Configure Firewall (Optional but Recommended)

```bash
# Install UFW (if not installed)
sudo apt install ufw -y

# Allow SSH (important - do this first!)
sudo ufw allow 22/tcp

# Allow HTTP
sudo ufw allow 80/tcp

# Allow HTTPS
sudo ufw allow 443/tcp

# Enable firewall
sudo ufw enable

# Check status
sudo ufw status
```

**⚠️ Important:** Make sure to allow SSH (port 22) before enabling the firewall, or you might lock yourself out!

---

## ✅ Verification Checklist

Run these commands to verify everything is installed:

```bash
# Check Node.js
node --version
npm --version

# Check PM2
pm2 --version

# Check Nginx
nginx -v
sudo systemctl status nginx

# Check Git
git --version

# Check if ports are listening
sudo netstat -tulpn | grep -E ':(80|443|3000|22)'
```

---

## 🐛 Troubleshooting

### Node.js Installation Issues

**Problem: `curl: command not found`**
```bash
sudo apt install curl -y
```

**Problem: `E: Unable to locate package nodejs`**
```bash
# Update package list
sudo apt update

# Try again
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs
```

**Problem: Wrong Node.js version**
```bash
# Remove existing Node.js
sudo apt remove nodejs npm -y
sudo apt autoremove -y

# Install correct version (Node.js 20.x LTS)
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs
```

### PM2 Installation Issues

**Problem: `npm: command not found`**
- Make sure Node.js is installed first
- Check: `which node` and `which npm`

**Problem: Permission denied**
```bash
# Use sudo for global installation
sudo npm install -g pm2

# Or fix npm permissions (alternative)
mkdir ~/.npm-global
npm config set prefix '~/.npm-global'
echo 'export PATH=~/.npm-global/bin:$PATH' >> ~/.bashrc
source ~/.bashrc
npm install -g pm2
```

### Nginx Issues

**Problem: Nginx won't start**
```bash
# Check Nginx configuration
sudo nginx -t

# Check error logs
sudo tail -f /var/log/nginx/error.log

# Check if port 80 is already in use
sudo netstat -tulpn | grep :80
```

**Problem: Can't access Nginx from browser**
- Check firewall: `sudo ufw status`
- Make sure port 80 is allowed: `sudo ufw allow 80/tcp`
- Check if Nginx is running: `sudo systemctl status nginx`

---

## 📚 Next Steps

After installing everything:

1. **Clone your repository:**
   ```bash
   cd ~
   git clone https://github.com/aseempsri/NewsAddaIndia.git
   ```

2. **Setup backend:**
   ```bash
   mkdir -p ~/news-adda-backend
   cp -r ~/NewsAddaIndia/backend/* ~/news-adda-backend/
   cd ~/news-adda-backend
   npm install --production
   ```

3. **Setup MongoDB:**

   **Option A: MongoDB Atlas (Recommended - Free Tier)**
   
   This is the easiest option and includes a free tier:
   
   1. **Create MongoDB Atlas Account**
      - Go to https://www.mongodb.com/cloud/atlas
      - Sign up for a free account
      - Create a new cluster (choose FREE tier M0)
   
   2. **Configure Database Access**
      - Go to **Database Access** → **Add New Database User**
      - Create a username and password (save these securely!)
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
   
   **Option B: Self-Hosted MongoDB on VPS**
   
   Install MongoDB directly on your VPS:
   
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
   
   # Option 2: MongoDB 7.0 (If you prefer version 7.0, use Ubuntu 22.04 repository)
   # This works on Ubuntu 24.04 as a fallback:
   # curl -fsSL https://www.mongodb.org/static/pgp/server-7.0.asc | sudo gpg -o /usr/share/keyrings/mongodb-server-7.0.gpg --dearmor
   # echo "deb [ arch=amd64,arm64 signed-by=/usr/share/keyrings/mongodb-server-7.0.gpg ] https://repo.mongodb.org/apt/ubuntu jammy/mongodb-org/7.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-7.0.list
   # sudo apt update
   # sudo apt-get install -y mongodb-org
   
   # Start MongoDB
   sudo systemctl start mongod
   sudo systemctl enable mongod
   
   # Verify MongoDB is running
   sudo systemctl status mongod
   
   # Test MongoDB connection
   mongosh --eval "db.version()"
   
   # Create database and user (optional but recommended)
   mongosh
   # Then in MongoDB shell:
   # use newsaddaindia
   # db.createUser({user: "newsadda_user", pwd: "your-secure-password", roles: [{role: "readWrite", db: "newsaddaindia"}]})
   # exit
   ```
   
   **Connection string for self-hosted MongoDB:**
   - Simple: `mongodb://localhost:27017/newsaddaindia`
   - With authentication: `mongodb://newsadda_user:your-password@localhost:27017/newsaddaindia?authSource=newsaddaindia`

4. **Create .env file:**
   ```bash
   nano ~/news-adda-backend/.env
   ```
   
   Add these variables (replace with your actual values):
   ```env
   # MongoDB Connection (use the connection string from step 3)
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
   ADMIN_PASSWORD=your-secure-admin-password
   
   # Optional: NewsAPI Key
   NEWSAPI_KEY=your-newsapi-key-if-needed
   ```
   
   **Generate JWT Secret:**
   ```bash
   node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
   ```
   
   **See `ENV_FILE_EXAMPLE.md` for complete .env file guide with detailed explanations.**

5. **Start backend:**
   ```bash
   cd ~/news-adda-backend
   pm2 start server.js --name news-adda-backend
   pm2 save
   pm2 startup  # Follow instructions shown
   ```

6. **Configure Nginx** (see `DEPLOYMENT_SETUP.md`)

---

## 🎉 Installation Complete!

Once everything is installed, you're ready to:
- ✅ Set up GitHub Secrets
- ✅ Configure your backend
- ✅ Deploy via GitHub Actions

**See `DEPLOYMENT_SETUP.md` for the complete deployment guide.**

---

## 💡 Useful Commands Reference

```bash
# Node.js
node --version
npm --version
npm install -g package-name

# PM2
pm2 list
pm2 start app.js --name my-app
pm2 stop my-app
pm2 restart my-app
pm2 logs my-app
pm2 delete my-app
pm2 save
pm2 startup

# Nginx
sudo systemctl start nginx
sudo systemctl stop nginx
sudo systemctl restart nginx
sudo systemctl reload nginx
sudo systemctl status nginx
sudo nginx -t  # Test configuration

# System
sudo apt update
sudo apt upgrade -y
sudo apt install package-name
```

---

**Need help?** Check the troubleshooting section or refer to `DEPLOYMENT_SETUP.md` for more details.

