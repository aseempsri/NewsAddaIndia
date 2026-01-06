# 🔧 Fix XML File Path Issue

## 🚨 Problem

The import script is looking for the XML file at:
- `/root/newsaddaindia.WordPress.2026-01-03.xml` ❌

But the file is actually at:
- `/root/NewsAddaIndia/newsaddaindia.WordPress.2026-01-03.xml` ✅

---

## ✅ Quick Fix Options

### Option 1: Create Symbolic Link (Recommended)

```bash
# Create a symbolic link so the script can find the file
ln -s /root/NewsAddaIndia/newsaddaindia.WordPress.2026-01-03.xml /root/newsaddaindia.WordPress.2026-01-03.xml

# Verify link was created
ls -lh /root/newsaddaindia.WordPress.2026-01-03.xml

# Now run the import
cd ~/news-adda-backend
npm run import:wordpress
```

### Option 2: Copy File to Expected Location

```bash
# Copy the file to where the script expects it
cp /root/NewsAddaIndia/newsaddaindia.WordPress.2026-01-03.xml /root/newsaddaindia.WordPress.2026-01-03.xml

# Verify copy
ls -lh /root/newsaddaindia.WordPress.2026-01-03.xml

# Run import
cd ~/news-adda-backend
npm run import:wordpress
```

### Option 3: Update Script (After Pulling Latest Code)

The script has been updated to check multiple locations. Pull the latest code:

```bash
# Pull latest code (includes updated script)
cd ~/NewsAddaIndia
git pull origin main

# Copy backend files if needed
cp -r ~/NewsAddaIndia/backend/* ~/news-adda-backend/

# Run import
cd ~/news-adda-backend
npm run import:wordpress
```

---

## 🎯 Recommended: Use Option 1 (Symbolic Link)

**Run these commands on your VPS:**

```bash
# Create symbolic link
ln -s /root/NewsAddaIndia/newsaddaindia.WordPress.2026-01-03.xml /root/newsaddaindia.WordPress.2026-01-03.xml

# Run import
cd ~/news-adda-backend
npm run import:wordpress
```

This creates a link so the script can find the file without duplicating it.

---

## ✅ Verify Fix

After creating the link:

```bash
# Check the link exists
ls -lh /root/newsaddaindia.WordPress.2026-01-03.xml
# Should show: lrwxrwxrwx ... /root/newsaddaindia.WordPress.2026-01-03.xml -> /root/NewsAddaIndia/newsaddaindia.WordPress.2026-01-03.xml

# Run import
cd ~/news-adda-backend
npm run import:wordpress
# Should now find the file and start importing!
```

---

**Use Option 1 (symbolic link) - it's the quickest fix!** 🔗

