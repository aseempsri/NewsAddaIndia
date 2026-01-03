# WordPress to MongoDB Migration - Quick Start

## 🚀 Quick Setup (3 Steps)

### Step 1: Install Dependencies

```bash
cd backend
npm install
```

This installs `xml2js` package needed for XML parsing.

### Step 2: Ensure XML File is in Root

Make sure `newsaddaindia.WordPress.2026-01-03.xml` is in the project root:

```
NewsAddaIndia/
├── newsaddaindia.WordPress.2026-01-03.xml  ← Must be here
├── backend/
└── ...
```

### Step 3: Run Migration

```bash
cd backend
npm run import:wordpress
```

**OR**

```bash
cd backend
node scripts/importWordPressToMongoDB.js
```

---

## ✅ That's It!

The script will:
- ✅ Parse WordPress XML file
- ✅ Extract all published posts
- ✅ Map categories and tags
- ✅ Extract images
- ✅ Clean HTML content
- ✅ Import to MongoDB
- ✅ Skip duplicates automatically

---

## 📊 Expected Output

```
📖 Reading XML file...
🔄 Parsing XML...
📊 Extracting data...
Found 500 items in XML
Found 450 posts
Found 50 attachments
Found 420 published posts

🔌 Connecting to MongoDB...
✅ Connected to MongoDB

🚀 Starting import...

✅ Imported [1]: दिल्ली में प्रदूषण के खिलाफ...
✅ Imported [2]: तिगरी एक्सटेंशन में आग का कहर...
...

📊 Import Summary:
✅ Successfully imported: 400
⏭️  Skipped: 15
❌ Errors: 5
📝 Total processed: 420

✅ Import completed!
🎉 Migration completed successfully!
```

---

## 🔍 Verify Import

After migration, check your data:

```bash
# Connect to MongoDB
mongosh "your-connection-string"

# Use database
use newsaddaindia

# Count news
db.news.countDocuments()

# View sample
db.news.find().limit(5).pretty()
```

---

## 🆘 Troubleshooting

**Can't find XML file?**
- Ensure file is in project root (not in backend folder)
- Check filename matches exactly

**MongoDB connection failed?**
- Check `.env` file has correct `MONGODB_URI`
- Ensure MongoDB is running

**xml2js not found?**
```bash
cd backend
npm install xml2js
```

---

**For detailed guide, see:** `backend/scripts/WORDPRESS_MIGRATION_README.md`


