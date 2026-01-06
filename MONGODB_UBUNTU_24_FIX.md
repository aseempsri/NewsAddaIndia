# 🔧 MongoDB Installation Fix for Ubuntu 24.04

## ⚠️ Issue

MongoDB 7.0 repository is **not available** for Ubuntu 24.04 (noble), causing a 404 error:
```
Err:6 https://repo.mongodb.org/apt/ubuntu noble/mongodb-org/7.0 Release 404 Not Found
```

## ✅ Solution

### Option 1: MongoDB 8.0 (Recommended)

MongoDB 8.0 is officially supported for Ubuntu 24.04. Use this:

```bash
# Remove any previous MongoDB repository (if you added it)
sudo rm -f /etc/apt/sources.list.d/mongodb-org-*.list

# Import MongoDB 8.0 GPG key
curl -fsSL https://www.mongodb.org/static/pgp/server-8.0.asc | sudo gpg -o /usr/share/keyrings/mongodb-server-8.0.gpg --dearmor

# Add MongoDB 8.0 repository for Ubuntu 24.04
echo "deb [ arch=amd64,arm64 signed-by=/usr/share/keyrings/mongodb-server-8.0.gpg ] https://repo.mongodb.org/apt/ubuntu noble/mongodb-org/8.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-8.0.list

# Update and install
sudo apt update
sudo apt-get install -y mongodb-org

# Start MongoDB
sudo systemctl start mongod
sudo systemctl enable mongod

# Verify
sudo systemctl status mongod
mongod --version
```

**✅ This will work!** MongoDB 8.0 is fully compatible with your application.

---

### Option 2: MongoDB 7.0 (Using Ubuntu 22.04 Repository)

If you prefer MongoDB 7.0, use the Ubuntu 22.04 (jammy) repository which works on Ubuntu 24.04:

```bash
# Remove any previous MongoDB repository (if you added it)
sudo rm -f /etc/apt/sources.list.d/mongodb-org-*.list

# Import MongoDB 7.0 GPG key
curl -fsSL https://www.mongodb.org/static/pgp/server-7.0.asc | sudo gpg -o /usr/share/keyrings/mongodb-server-7.0.gpg --dearmor

# Use Ubuntu 22.04 repository (works on Ubuntu 24.04)
echo "deb [ arch=amd64,arm64 signed-by=/usr/share/keyrings/mongodb-server-7.0.gpg ] https://repo.mongodb.org/apt/ubuntu jammy/mongodb-org/7.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-7.0.list

# Update and install
sudo apt update
sudo apt-get install -y mongodb-org

# Start MongoDB
sudo systemctl start mongod
sudo systemctl enable mongod

# Verify
sudo systemctl status mongod
mongod --version
```

---

## 🎯 Quick Fix (Copy-Paste)

**If you already tried installing and got the 404 error, run this:**

```bash
# Clean up previous attempt
sudo rm -f /etc/apt/sources.list.d/mongodb-org-*.list

# Install MongoDB 8.0 (recommended)
curl -fsSL https://www.mongodb.org/static/pgp/server-8.0.asc | sudo gpg -o /usr/share/keyrings/mongodb-server-8.0.gpg --dearmor
echo "deb [ arch=amd64,arm64 signed-by=/usr/share/keyrings/mongodb-server-8.0.gpg ] https://repo.mongodb.org/apt/ubuntu noble/mongodb-org/8.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-8.0.list
sudo apt update
sudo apt-get install -y mongodb-org
sudo systemctl start mongod
sudo systemctl enable mongod
```

---

## 📝 Connection String

After installation, your MongoDB connection string will be:

**For local MongoDB:**
```env
MONGODB_URI=mongodb://localhost:27017/newsaddaindia
```

**With authentication (if you set it up):**
```env
MONGODB_URI=mongodb://username:password@localhost:27017/newsaddaindia?authSource=newsaddaindia
```

---

## ✅ Verification

After installation, verify MongoDB is working:

```bash
# Check MongoDB status
sudo systemctl status mongod

# Test MongoDB connection
mongosh --eval "db.version()"

# Or connect to MongoDB shell
mongosh
```

---

## 🔄 What Changed?

- **Before:** MongoDB 7.0 repository for Ubuntu 24.04 (noble) - **Not Available** ❌
- **After:** MongoDB 8.0 repository for Ubuntu 24.04 (noble) - **Available** ✅
- **Alternative:** MongoDB 7.0 using Ubuntu 22.04 (jammy) repository - **Works** ✅

---

**✅ Use MongoDB 8.0 - it's the recommended version for Ubuntu 24.04 and fully compatible with your application!**

