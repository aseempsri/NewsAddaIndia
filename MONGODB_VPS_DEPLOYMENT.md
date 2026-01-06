# Deploying MongoDB on VPS - Complete Guide
## Keep Everything on One Server

This guide shows you how to deploy MongoDB directly on your Hostinger VPS, keeping your entire stack (Frontend, Backend, and Database) on a single server.

---

## 🎯 Overview

**Architecture:**
```
Frontend (Angular) → Hostinger VPS ✅
Backend (Node.js)  → Hostinger VPS ✅
Database (MongoDB) → Hostinger VPS ✅ (Self-hosted)
```

**Benefits:**
- ✅ Everything on one server (easier management)
- ✅ No external database dependency
- ✅ Lower latency (database on same server)
- ✅ Full control over database
- ✅ No MongoDB Atlas costs after free tier

**Requirements:**
- Hostinger VPS (KVM 1 or higher recommended)
- SSH access to VPS
- Basic Linux knowledge

---

## 📋 Prerequisites

### VPS Requirements:
- **Minimum:** KVM 1 (1 vCPU, 4GB RAM) - Tight but works
- **Recommended:** KVM 2 (2 vCPU, 8GB RAM) - Comfortable
- **Storage:** At least 20GB free space for MongoDB

### Software Needed:
- Ubuntu/Debian Linux (usually pre-installed on Hostinger VPS)
- SSH access
- Root or sudo access

---

## 🚀 Step-by-Step Installation

### Step 1: Connect to Your VPS

```bash
# SSH into your VPS
ssh root@your-vps-ip
# Or if you have a username:
ssh username@your-vps-ip
```

### Step 2: Update System Packages

```bash
# Update package list
sudo apt update

# Upgrade existing packages
sudo apt upgrade -y
```

### Step 3: Install MongoDB

#### For Ubuntu 24.04 (Noble) - Latest LTS:

**Option A: MongoDB 8.0 (Recommended - Officially Supported)**

```bash
# Import MongoDB 8.0 GPG key
curl -fsSL https://www.mongodb.org/static/pgp/server-8.0.asc | sudo gpg -o /usr/share/keyrings/mongodb-server-8.0.gpg --dearmor

# Create MongoDB 8.0 repository list file
echo "deb [ arch=amd64,arm64 signed-by=/usr/share/keyrings/mongodb-server-8.0.gpg ] https://repo.mongodb.org/apt/ubuntu noble/mongodb-org/8.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-8.0.list

# Update package list
sudo apt update

# Install MongoDB 8.0
sudo apt-get install -y mongodb-org

# Verify installation
mongod --version
```

**Option B: MongoDB 7.0 (Fallback - Use Ubuntu 22.04 Repository)**

If you prefer MongoDB 7.0, use the Ubuntu 22.04 (jammy) repository which works on Ubuntu 24.04:

```bash
# Import MongoDB 7.0 GPG key
curl -fsSL https://www.mongodb.org/static/pgp/server-7.0.asc | sudo gpg -o /usr/share/keyrings/mongodb-server-7.0.gpg --dearmor

# Use Ubuntu 22.04 repository (works on Ubuntu 24.04)
echo "deb [ arch=amd64,arm64 signed-by=/usr/share/keyrings/mongodb-server-7.0.gpg ] https://repo.mongodb.org/apt/ubuntu jammy/mongodb-org/7.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-7.0.list

# Update package list
sudo apt update

# Install MongoDB 7.0
sudo apt-get install -y mongodb-org

# Verify installation
mongod --version
```

#### For Ubuntu 22.04 (Jammy):

```bash
# Import MongoDB GPG key (modern method)
wget -qO - https://www.mongodb.org/static/pgp/server-7.0.asc | sudo gpg --dearmor -o /usr/share/keyrings/mongodb-server-7.0.gpg

# Create MongoDB repository list file
echo "deb [ arch=amd64,arm64 signed-by=/usr/share/keyrings/mongodb-server-7.0.gpg ] https://repo.mongodb.org/apt/ubuntu jammy/mongodb-org/7.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-7.0.list

# Update and install
sudo apt update
sudo apt-get install -y mongodb-org
```

#### For Ubuntu 20.04 (Focal):

```bash
# Import MongoDB GPG key (modern method)
wget -qO - https://www.mongodb.org/static/pgp/server-7.0.asc | sudo gpg --dearmor -o /usr/share/keyrings/mongodb-server-7.0.gpg

# Create MongoDB repository list file
echo "deb [ arch=amd64,arm64 signed-by=/usr/share/keyrings/mongodb-server-7.0.gpg ] https://repo.mongodb.org/apt/ubuntu focal/mongodb-org/7.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-7.0.list

# Update and install
sudo apt update
sudo apt-get install -y mongodb-org
```

### Step 4: Start MongoDB Service

```bash
# Start MongoDB service
sudo systemctl start mongod

# Enable MongoDB to start on boot
sudo systemctl enable mongod

# Check MongoDB status
sudo systemctl status mongod
```

**Expected output:** Should show "active (running)"

### Step 5: Verify MongoDB is Running

```bash
# Connect to MongoDB shell
mongosh

# Or if mongosh is not installed, use:
mongo
```

**If connection successful, you'll see:**
```
Current Mongosh Log ID: ...
Connecting to: mongodb://127.0.0.1:27017/?directConnection=true&serverSelectionTimeoutMS=2000
Using MongoDB: 7.0.x
Using Mongosh: x.x.x
```

**Test commands:**
```javascript
// Show databases
show dbs

// Create test database
use testdb

// Insert test document
db.test.insertOne({name: "test", value: 123})

// Show collections
show collections

// Exit MongoDB shell
exit
```

---

## 🔒 Security Configuration

### Step 6: Create MongoDB Admin User

```bash
# Connect to MongoDB
mongosh
```

```javascript
// Switch to admin database
use admin

// Create admin user
db.createUser({
  user: "admin",
  pwd: "your-secure-password-here",
  roles: [ { role: "userAdminAnyDatabase", db: "admin" }, "readWriteAnyDatabase" ]
})

// Exit
exit
```

**Important:** Replace `your-secure-password-here` with a strong password!

### Step 7: Enable MongoDB Authentication

```bash
# Edit MongoDB configuration
sudo nano /etc/mongod.conf
```

**Find and modify these sections:**

```yaml
# Network interfaces
net:
  port: 27017
  bindIp: 127.0.0.1  # Only allow local connections (more secure)

# Security
security:
  authorization: enabled  # Enable authentication
```

**Save:** `Ctrl+O`, then `Enter`, then `Ctrl+X`

### Step 8: Restart MongoDB

```bash
# Restart MongoDB to apply changes
sudo systemctl restart mongod

# Verify it's running
sudo systemctl status mongod
```

### Step 9: Test Authentication

```bash
# Connect with authentication
mongosh -u admin -p your-secure-password --authenticationDatabase admin
```

---

## 📁 Database Setup for Your Project

### Step 10: Create Application Database and User

```bash
# Connect to MongoDB as admin
mongosh -u admin -p your-secure-password --authenticationDatabase admin
```

```javascript
// Create database for your application
use newsaddaindia

// Create application user with read/write access
db.createUser({
  user: "newsadda_user",
  pwd: "your-app-password-here",
  roles: [
    { role: "readWrite", db: "newsaddaindia" }
  ]
})

// Verify user creation
db.getUsers()

// Exit
exit
```

---

## 🔧 Configure Backend to Use Local MongoDB

### Step 11: Update Backend Environment Variables

```bash
# Navigate to your backend directory
cd ~/news-adda-backend

# Edit .env file
nano .env
```

**Update MongoDB connection string:**

```env
# MongoDB Connection (Local VPS)
MONGODB_URI=mongodb://newsadda_user:your-app-password-here@localhost:27017/newsaddaindia?authSource=newsaddaindia

# Or without authentication (less secure, for testing):
# MONGODB_URI=mongodb://localhost:27017/newsaddaindia

# Server Configuration
PORT=3000
NODE_ENV=production

# Frontend URL
FRONTEND_URL=https://yourdomain.com

# JWT Secret
JWT_SECRET=your-super-secret-jwt-key

# Admin Credentials
ADMIN_USERNAME=admin
ADMIN_PASSWORD=your-secure-admin-password
```

**Save and exit:** `Ctrl+O`, `Enter`, `Ctrl+X`

### Step 12: Test Backend Connection

```bash
# Restart your backend
pm2 restart news-adda-backend

# Check logs
pm2 logs news-adda-backend

# Look for: "Connected to MongoDB"
```

---

## 📊 MongoDB Management

### Common MongoDB Commands

```bash
# Connect to MongoDB shell
mongosh -u admin -p your-password --authenticationDatabase admin

# Or connect to specific database
mongosh -u newsadda_user -p your-app-password --authenticationDatabase newsaddaindia
```

**Inside MongoDB shell:**

```javascript
// Show all databases
show dbs

// Switch to your database
use newsaddaindia

// Show collections
show collections

// Count documents in a collection
db.news.countDocuments()

// Find documents
db.news.find().limit(5)

// Find specific document
db.news.findOne({title: "Your News Title"})

// Delete all documents (be careful!)
// db.news.deleteMany({})

// Drop collection (be careful!)
// db.news.drop()

// Exit
exit
```

### Backup MongoDB

```bash
# Create backup directory
mkdir -p ~/mongodb-backups

# Backup database
mongodump --uri="mongodb://newsadda_user:your-app-password@localhost:27017/newsaddaindia?authSource=newsaddaindia" --out=~/mongodb-backups/backup-$(date +%Y%m%d)

# Or backup all databases (as admin)
mongodump --uri="mongodb://admin:your-admin-password@localhost:27017/?authSource=admin" --out=~/mongodb-backups/full-backup-$(date +%Y%m%d)
```

### Restore MongoDB

```bash
# Restore from backup
mongorestore --uri="mongodb://newsadda_user:your-app-password@localhost:27017/newsaddaindia?authSource=newsaddaindia" ~/mongodb-backups/backup-20250115/newsaddaindia
```

---

## 🔐 Security Best Practices

### 1. Firewall Configuration

```bash
# MongoDB should only accept local connections (127.0.0.1)
# This is already configured in mongod.conf

# If you need remote access (not recommended), update bindIp:
# bindIp: 0.0.0.0
# Then configure firewall:
sudo ufw allow from your-trusted-ip to any port 27017
```

### 2. Regular Backups

```bash
# Create backup script
nano ~/backup-mongodb.sh
```

**Add this content:**

```bash
#!/bin/bash
BACKUP_DIR=~/mongodb-backups
DATE=$(date +%Y%m%d_%H%M%S)
mkdir -p $BACKUP_DIR

mongodump --uri="mongodb://newsadda_user:your-app-password@localhost:27017/newsaddaindia?authSource=newsaddaindia" --out=$BACKUP_DIR/backup-$DATE

# Keep only last 7 days of backups
find $BACKUP_DIR -type d -mtime +7 -exec rm -rf {} +

echo "Backup completed: backup-$DATE"
```

**Make executable:**
```bash
chmod +x ~/backup-mongodb.sh
```

**Add to crontab (daily backup at 2 AM):**
```bash
crontab -e

# Add this line:
0 2 * * * /root/backup-mongodb.sh >> /var/log/mongodb-backup.log 2>&1
```

### 3. Monitor MongoDB

```bash
# Check MongoDB status
sudo systemctl status mongod

# View MongoDB logs
sudo tail -f /var/log/mongodb/mongod.log

# Check disk space (MongoDB needs space)
df -h

# Check MongoDB process
ps aux | grep mongod
```

---

## 📈 Performance Optimization

### MongoDB Configuration Tuning

```bash
# Edit MongoDB config
sudo nano /etc/mongod.conf
```

**Recommended settings for KVM 2 (8GB RAM):**

```yaml
# Storage
storage:
  dbPath: /var/lib/mongodb
  journal:
    enabled: true

# System Log
systemLog:
  destination: file
  logAppend: true
  path: /var/log/mongodb/mongod.log

# Process Management
processManagement:
  fork: true
  pidFilePath: /var/run/mongodb/mongod.pid

# Network
net:
  port: 27017
  bindIp: 127.0.0.1

# Security
security:
  authorization: enabled

# Operation Profiling (optional, for debugging)
# operationProfiling:
#   slowOpThresholdMs: 100
#   mode: slowOp
```

**Restart MongoDB:**
```bash
sudo systemctl restart mongod
```

---

## 🆘 Troubleshooting

### MongoDB Won't Start

```bash
# Check MongoDB status
sudo systemctl status mongod

# Check logs
sudo tail -f /var/log/mongodb/mongod.log

# Common issues:
# 1. Port already in use
sudo netstat -tulpn | grep 27017

# 2. Permission issues
sudo chown -R mongodb:mongodb /var/lib/mongodb
sudo chown -R mongodb:mongodb /var/log/mongodb

# 3. Disk space full
df -h
```

### Connection Refused

```bash
# Check if MongoDB is running
sudo systemctl status mongod

# Check if port is listening
sudo netstat -tulpn | grep 27017

# Verify bindIp in config
sudo cat /etc/mongod.conf | grep bindIp
```

### Authentication Failed

```bash
# Verify user exists
mongosh -u admin -p your-password --authenticationDatabase admin
use newsaddaindia
db.getUsers()

# Reset password (if needed)
db.changeUserPassword("newsadda_user", "new-password")
```

### Out of Memory

```bash
# Check memory usage
free -h

# MongoDB uses available RAM
# For KVM 1 (4GB): MongoDB may use 1-2GB
# For KVM 2 (8GB): MongoDB can use 2-4GB comfortably

# Monitor MongoDB memory
mongosh
db.serverStatus().mem
```

---

## ✅ Verification Checklist

After installation, verify:

- [ ] MongoDB service is running (`sudo systemctl status mongod`)
- [ ] Can connect to MongoDB shell (`mongosh`)
- [ ] Admin user created and can authenticate
- [ ] Application database created (`newsaddaindia`)
- [ ] Application user created with proper permissions
- [ ] Backend can connect to MongoDB (check logs)
- [ ] Backups are working (test backup/restore)
- [ ] MongoDB starts on boot (`sudo systemctl is-enabled mongod`)

---

## 📊 Resource Usage

### MongoDB Memory Usage:
- **KVM 1 (4GB RAM):** MongoDB ~1-2GB, System ~1GB, Backend ~500MB = **Tight but works**
- **KVM 2 (8GB RAM):** MongoDB ~2-4GB, System ~2GB, Backend ~500MB = **Comfortable**

### Storage Usage:
- MongoDB data: ~100MB - 1GB (depends on data)
- Logs: ~100-500MB
- Backups: ~500MB - 2GB (if keeping multiple backups)

**Recommendation:** KVM 2 (8GB RAM) is better for self-hosted MongoDB.

---

## 🎯 Complete Deployment Architecture

```
┌─────────────────────────────────────┐
│      Hostinger VPS (KVM 2)         │
│                                     │
│  ┌──────────────────────────────┐  │
│  │  Frontend (Angular)          │  │
│  │  Nginx → /var/www/html       │  │
│  └──────────────────────────────┘  │
│                                     │
│  ┌──────────────────────────────┐  │
│  │  Backend (Node.js/Express)   │  │
│  │  PM2 → Port 3000             │  │
│  └──────────────────────────────┘  │
│                                     │
│  ┌──────────────────────────────┐  │
│  │  Database (MongoDB)          │  │
│  │  Port 27017 (localhost only) │  │
│  └──────────────────────────────┘  │
│                                     │
│  ┌──────────────────────────────┐  │
│  │  Nginx (Reverse Proxy)       │  │
│  │  Ports 80, 443                │  │
│  └──────────────────────────────┘  │
└─────────────────────────────────────┘
```

---

## 💡 Advantages of Self-Hosted MongoDB

**Pros:**
- ✅ Everything on one server (simpler)
- ✅ Lower latency (database on same machine)
- ✅ No external dependency
- ✅ Full control over database
- ✅ No MongoDB Atlas costs
- ✅ Better for learning

**Cons:**
- ⚠️ Need to manage backups yourself
- ⚠️ Requires more RAM (MongoDB is memory-intensive)
- ⚠️ Need to handle updates/security patches
- ⚠️ No automatic scaling (MongoDB Atlas has this)

---

## 🔄 Migration from MongoDB Atlas

If you're currently using MongoDB Atlas and want to migrate:

```bash
# Export from MongoDB Atlas
mongodump --uri="mongodb+srv://user:pass@cluster.mongodb.net/newsaddaindia" --out=~/atlas-backup

# Import to local MongoDB
mongorestore --uri="mongodb://newsadda_user:pass@localhost:27017/newsaddaindia?authSource=newsaddaindia" ~/atlas-backup/newsaddaindia
```

---

## 📚 Additional Resources

- **MongoDB Documentation:** https://docs.mongodb.com/
- **MongoDB Shell (mongosh):** https://docs.mongodb.com/mongodb-shell/
- **MongoDB Performance:** https://docs.mongodb.com/manual/administration/production-notes/
- **Backup & Restore:** https://docs.mongodb.com/manual/core/backups/

---

## ✅ Summary

**You now have:**
- ✅ MongoDB installed and running on VPS
- ✅ Secure authentication configured
- ✅ Application database and user created
- ✅ Backend connected to local MongoDB
- ✅ Backup strategy in place

**Everything is on one server!** 🎉

---

**Next Steps:**
1. Test your application
2. Set up automated backups
3. Monitor MongoDB performance
4. Scale as needed

**Need help?** Refer to troubleshooting section or MongoDB documentation.

