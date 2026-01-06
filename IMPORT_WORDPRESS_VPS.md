# 📥 Import WordPress XML to MongoDB on VPS

## 📋 Steps to Import WordPress Data

### Step 1: Upload XML File to VPS

**Option A: Using SCP (from your local machine)**

```bash
# From your local machine (Windows PowerShell or CMD)
scp "C:\Users\aseems\OneDrive - AMDOCS\Backup Folders\Documents\NewsAddaIndia\NewsAddaIndia\newsaddaindia.WordPress.2026-01-03.xml" root@72.60.235.158:~/NewsAddaIndia/
```

**Option B: Using SFTP Client (FileZilla, WinSCP)**

1. Connect to your VPS: `72.60.235.158` (port 22)
2. Upload file to: `/root/NewsAddaIndia/`

**Option C: Clone Repository (if XML is in Git)**

```bash
# On VPS
cd ~/NewsAddaIndia
git pull origin main
# XML file should be in the root directory
```

---

### Step 2: Verify XML File Location

**On VPS, check if file exists:**

```bash
# Check if file is in project root
ls -lh ~/NewsAddaIndia/newsaddaindia.WordPress.2026-01-03.xml

# Or check in backend directory
ls -lh ~/news-adda-backend/../newsaddaindia.WordPress.2026-01-03.xml
```

**Expected location:** `/root/NewsAddaIndia/newsaddaindia.WordPress.2026-01-03.xml`

---

### Step 3: Run Import Script

**On VPS, run these commands:**

```bash
# Navigate to backend directory
cd ~/news-adda-backend

# Make sure .env file has MongoDB connection string
cat .env | grep MONGODB_URI
# Should show your MongoDB connection string

# Run the import script
npm run import:wordpress

# OR run directly:
node scripts/importWordPressToMongoDB.js
```

---

### Step 4: Monitor Import Progress

The script will show progress:
- Reading XML file
- Parsing XML
- Importing posts
- Progress updates

**Expected output:**
```
📖 Reading XML file...
🔄 Parsing XML...
📝 Found X posts to import
📥 Importing posts...
✅ Import completed!
🎉 Migration completed successfully!
```

---

## 🔧 Troubleshooting

### Issue: XML file not found

**Error:** `❌ XML file not found: /path/to/file.xml`

**Solution:**
```bash
# Check where the script expects the file
cd ~/news-adda-backend
node -e "const path = require('path'); console.log(path.join(__dirname, '../../newsaddaindia.WordPress.2026-01-03.xml'))"

# Copy XML file to expected location
cp ~/NewsAddaIndia/newsaddaindia.WordPress.2026-01-03.xml ~/NewsAddaIndia/newsaddaindia.WordPress.2026-01-03.xml

# Or modify the script to use absolute path
nano scripts/importWordPressToMongoDB.js
# Change line 479 to use absolute path:
# const xmlFilePath = '/root/NewsAddaIndia/newsaddaindia.WordPress.2026-01-03.xml';
```

### Issue: MongoDB connection error

**Error:** `MongoDB connection error`

**Solution:**
```bash
# Check MongoDB connection string in .env
cd ~/news-adda-backend
cat .env | grep MONGODB_URI

# Test MongoDB connection
mongosh "YOUR_MONGODB_URI"
# Or if using local MongoDB:
mongosh mongodb://localhost:27017/newsaddaindia
```

### Issue: Out of memory

**Error:** `JavaScript heap out of memory`

**Solution:**
```bash
# Run with increased memory
node --max-old-space-size=4096 scripts/importWordPressToMongoDB.js
```

---

## 📝 Complete Command Sequence

**Copy-paste these commands on your VPS:**

```bash
# 1. Upload XML file first (from local machine using SCP)
# scp "C:\Users\aseems\OneDrive - AMDOCS\Backup Folders\Documents\NewsAddaIndia\NewsAddaIndia\newsaddaindia.WordPress.2026-01-03.xml" root@72.60.235.158:~/NewsAddaIndia/

# 2. On VPS: Verify file exists
ls -lh ~/NewsAddaIndia/newsaddaindia.WordPress.2026-01-03.xml

# 3. Navigate to backend
cd ~/news-adda-backend

# 4. Verify MongoDB connection string
cat .env | grep MONGODB_URI

# 5. Run import
npm run import:wordpress

# 6. Check imported data
mongosh "YOUR_MONGODB_URI"
# Then in MongoDB shell:
# use newsaddaindia
# db.news.countDocuments()
# db.news.find().limit(5)
```

---

## ✅ Verify Import

**After import completes:**

```bash
# Connect to MongoDB
mongosh "YOUR_MONGODB_URI"
# Or: mongosh mongodb://localhost:27017/newsaddaindia

# Check imported data
use newsaddaindia
db.news.countDocuments()
db.news.find().limit(5).pretty()

# Check categories
db.news.distinct("category")

# Exit MongoDB shell
exit
```

**Or test via API:**

```bash
# Test API endpoint
curl http://72.60.235.158/api/news
# Should return imported news data
```

---

## 🎯 Quick Reference

**File location on VPS:**
- Expected: `/root/NewsAddaIndia/newsaddaindia.WordPress.2026-01-03.xml`
- Script location: `/root/news-adda-backend/scripts/importWordPressToMongoDB.js`

**Import command:**
```bash
cd ~/news-adda-backend
npm run import:wordpress
```

**MongoDB database:** `newsaddaindia` (or as configured in MONGODB_URI)

---

## 🚀 Next Steps

After importing:
1. ✅ Verify data in MongoDB
2. ✅ Test API: `curl http://72.60.235.158/api/news`
3. ✅ Check frontend displays imported news
4. ✅ Verify images are working (if any)

---

**Ready to import! Upload the XML file and run the import command.** 📥

