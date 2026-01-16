# 📥 Import 2025 XML Files to MongoDB - Quick Guide

This guide explains how to import all 2025 WordPress XML files into your MongoDB database on Hostinger in one go.

---

## 📋 Prerequisites

- SSH access to your Hostinger VPS
- XML files uploaded to the project directory
- MongoDB connection string configured in `.env` file
- Node.js and npm installed

---

## 📁 Step 1: Upload XML Files to VPS

You have 11 XML files for 2025 data:
- `newsaddaindia.WordPress.2026-01-16_jan-feb.xml`
- `newsaddaindia.WordPress.2026-01-16_feb-mar.xml`
- `newsaddaindia.WordPress.2026-01-16_mar-apr.xml`
- `newsaddaindia.WordPress.2026-01-16_apr-may.xml`
- `newsaddaindia.WordPress.2026-01-16_may-jun.xml`
- `newsaddaindia.WordPress.2026-01-16_jun-jul.xml`
- `newsaddaindia.WordPress.2026-01-16_jul-aug.xml`
- `newsaddaindia.WordPress.2026-01-16_aug-sept.xml`
- `newsaddaindia.WordPress.2026-01-16_sept-oct.xml`
- `newsaddaindia.WordPress.2026-01-16_oct-nov.xml`
- `newsaddaindia.WordPress.2026-01-16_nov-dec.xml`

### Option A: Upload via SCP (from your local machine)

```bash
# From your local machine (Windows PowerShell or Git Bash)
cd "C:\Users\aseems\OneDrive - AMDOCS\Backup Folders\Documents\NewsAddaIndia\NewsAddaIndia"

# Upload all XML files matching the pattern
scp newsaddaindia.WordPress.2026-01-16_*.xml root@72.60.235.158:/root/NewsAddaIndia/
```

### Option B: Upload via SFTP Client

Use FileZilla, WinSCP, or any SFTP client:
- **Host:** `72.60.235.158`
- **Username:** `root`
- **Password:** Your VPS password
- **Remote Directory:** `/root/NewsAddaIndia/`
- Upload all 11 XML files

### Option C: Use Git (if files are committed)

```bash
# On VPS
cd /root/NewsAddaIndia
git pull origin main
```

---

## 🔧 Step 2: Verify XML Files Are Present

```bash
# SSH into VPS
ssh root@72.60.235.158

# Navigate to project directory
cd /root/NewsAddaIndia

# List XML files
ls -lh newsaddaindia.WordPress.2026-01-16_*.xml

# You should see all 11 files
```

---

## 🔌 Step 3: Verify MongoDB Connection

```bash
# Navigate to backend directory
cd /root/NewsAddaIndia/backend

# Check .env file has MONGODB_URI
cat .env | grep MONGODB_URI

# Test MongoDB connection (optional)
node -e "require('dotenv').config(); const mongoose = require('mongoose'); mongoose.connect(process.env.MONGODB_URI).then(() => { console.log('✅ MongoDB connected'); process.exit(0); }).catch(err => { console.error('❌ MongoDB connection failed:', err.message); process.exit(1); });"
```

---

## 🚀 Step 4: Run the Import Script

```bash
# Make sure you're in the backend directory
cd /root/NewsAddaIndia/backend

# Install dependencies (if not already installed)
npm install

# Run the import script
npm run import:multiple

# OR run directly:
node scripts/importMultipleWordPressXML.js
```

---

## 📊 What the Script Does

1. **Finds all XML files** matching pattern `newsaddaindia.WordPress.2026-01-16_*.xml`
2. **Sorts them chronologically** (jan-feb, feb-mar, ..., nov-dec)
3. **Connects to MongoDB** once at the start
4. **Processes each file sequentially:**
   - Parses XML
   - Extracts posts and attachments
   - Filters published posts only
   - Checks for duplicates (by title)
   - Imports new articles
5. **Shows progress** for each file
6. **Displays final summary** with totals

---

## 📈 Expected Output

```
🔍 Searching for XML files...

✅ Found 11 XML files in: /root/NewsAddaIndia

📋 Found 11 XML files to process:
   1. newsaddaindia.WordPress.2026-01-16_jan-feb.xml
   2. newsaddaindia.WordPress.2026-01-16_feb-mar.xml
   ...
   11. newsaddaindia.WordPress.2026-01-16_nov-dec.xml

🔌 Connecting to MongoDB...
✅ Connected to MongoDB

============================================================
Processing file 1 of 11
============================================================
📖 Reading XML file: newsaddaindia.WordPress.2026-01-16_jan-feb.xml...
🔄 Parsing XML...
📊 Extracting data...
Found 150 items in XML
Found 120 posts
Found 30 attachments
Found 115 published posts

🚀 Starting import from newsaddaindia.WordPress.2026-01-16_jan-feb.xml...

✅ Imported 10 articles so far...
✅ Imported 20 articles so far...
...

✅ Completed newsaddaindia.WordPress.2026-01-16_jan-feb.xml
   Imported: 115
   Skipped: 0
   Errors: 0

============================================================
Processing file 2 of 11
============================================================
...

============================================================
📊 FINAL IMPORT SUMMARY
============================================================
✅ Successfully imported: 1250
⏭️  Skipped (duplicates/missing data): 45
❌ Errors: 2
📝 Total files processed: 11
============================================================

✅ All imports completed!
🎉 Migration completed successfully!
```

---

## ⚠️ Important Notes

1. **Duplicate Prevention:** The script checks for existing articles by title. If an article with the same title already exists, it will be skipped.

2. **Processing Time:** Depending on the number of articles, this may take 10-30 minutes or more. Be patient!

3. **No Data Loss:** The script does NOT delete existing data. It only adds new articles.

4. **Error Handling:** If one file fails, the script continues with the next file. Check the error messages for details.

5. **MongoDB Connection:** The script connects once at the start and reuses the connection for all files, making it more efficient.

6. **Progress Updates:** You'll see progress every 10 imported articles and a summary after each file.

---

## 🔍 Troubleshooting

### Issue: "No XML files found"

**Solution:**
- Verify files are in the correct location: `/root/NewsAddaIndia/`
- Check file names match the pattern exactly
- Use `ls -la` to see all files including hidden ones

### Issue: "MongoDB connection failed"

**Solution:**
- Check `.env` file has correct `MONGODB_URI`
- Verify MongoDB is running and accessible
- Test connection manually (see Step 3)

### Issue: "Permission denied"

**Solution:**
```bash
# Make sure you have read permissions
chmod 644 newsaddaindia.WordPress.2026-01-16_*.xml

# Make sure script is executable
chmod +x scripts/importMultipleWordPressXML.js
```

### Issue: "Module not found"

**Solution:**
```bash
# Install dependencies
cd /root/NewsAddaIndia/backend
npm install
```

### Issue: Script stops or hangs

**Solution:**
- Check MongoDB connection is stable
- Verify XML files are not corrupted
- Check server resources (memory/CPU)
- Run with `timeout` command if needed:
  ```bash
  timeout 3600 npm run import:multiple
  ```

---

## ✅ Verification After Import

```bash
# Connect to MongoDB and check count
node -e "
require('dotenv').config();
const mongoose = require('mongoose');
const News = require('./models/News');

mongoose.connect(process.env.MONGODB_URI).then(async () => {
  const count = await News.countDocuments();
  console.log('Total articles in database:', count);
  
  // Count by category
  const byCategory = await News.aggregate([
    { \$group: { _id: '\$category', count: { \$sum: 1 } } },
    { \$sort: { count: -1 } }
  ]);
  console.log('\nArticles by category:');
  byCategory.forEach(cat => {
    console.log(\`  \${cat._id}: \${cat.count}\`);
  });
  
  process.exit(0);
}).catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
"
```

---

## 🎯 Quick Command Reference

```bash
# 1. SSH into VPS
ssh root@72.60.235.158

# 2. Navigate to project
cd /root/NewsAddaIndia

# 3. Pull latest code (if using Git)
git pull origin main

# 4. Navigate to backend
cd backend

# 5. Run import
npm run import:multiple

# 6. Check results (optional)
node -e "require('dotenv').config(); const mongoose = require('mongoose'); const News = require('./models/News'); mongoose.connect(process.env.MONGODB_URI).then(async () => { console.log('Total articles:', await News.countDocuments()); process.exit(0); });"
```

---

## 📞 Need Help?

If you encounter any issues:
1. Check the error messages carefully
2. Verify all prerequisites are met
3. Check MongoDB connection
4. Verify XML files are valid
5. Review the troubleshooting section above

---

**Last Updated:** January 2026
