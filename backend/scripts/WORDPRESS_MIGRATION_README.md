# WordPress to MongoDB Migration Guide

This script imports WordPress posts from a WordPress XML export file into MongoDB.

---

## 📋 Prerequisites

1. **Node.js** installed (v18 or higher)
2. **MongoDB** running (local or Atlas)
3. **WordPress XML export file** (`newsaddaindia.WordPress.2026-01-03.xml`)
4. **Backend dependencies** installed

---

## 🚀 Setup

### Step 1: Install Dependencies

```bash
cd backend
npm install
```

This will install `xml2js` package required for parsing XML.

### Step 2: Place XML File

Ensure the WordPress XML export file is in the project root directory:

```
NewsAddaIndia/
├── newsaddaindia.WordPress.2026-01-03.xml  ← Place here
├── backend/
│   └── scripts/
│       └── importWordPressToMongoDB.js
└── ...
```

### Step 3: Configure MongoDB Connection

Make sure your `.env` file has the correct MongoDB connection:

```env
MONGODB_URI=mongodb://localhost:27017/newsaddaindia
# OR for MongoDB Atlas:
# MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/newsaddaindia
```

---

## 🔧 Running the Migration

### Option 1: Run Directly

```bash
cd backend
node scripts/importWordPressToMongoDB.js
```

### Option 2: Add to package.json

Add this script to `backend/package.json`:

```json
{
  "scripts": {
    "import:wordpress": "node scripts/importWordPressToMongoDB.js"
  }
}
```

Then run:
```bash
npm run import:wordpress
```

---

## 📊 What Gets Imported

### Fields Mapped:

| WordPress Field | MongoDB Field | Notes |
|----------------|---------------|-------|
| `title` | `title` | Direct mapping |
| `title` | `titleEn` | Same as title (can be translated later) |
| `excerpt:encoded` or first 200 chars | `excerpt` | HTML stripped |
| `content:encoded` | `content` | WordPress blocks cleaned |
| `category` (domain="category") | `category` | Mapped to MongoDB categories |
| `category` (domain="post_tag") | `tags` | Array of tags |
| `wp:post_date` | `date`, `createdAt`, `updatedAt` | Date parsing |
| `dc:creator` | `author` | Author name |
| `_thumbnail_id` → attachment URL | `image` | Featured image URL |
| Breaking news tag | `isBreaking` | Boolean flag |
| `wp:status` = "publish" | `published` | Only published posts imported |

### Category Mapping:

WordPress categories are mapped to MongoDB categories:

- `National` → `National`
- `International` → `International`
- `Sports` → `Sports`
- `Business` → `Business`
- `Entertainment` → `Entertainment`
- `Health` → `Health`
- `Politics` → `Politics`
- `State` → `National` (mapped)
- `Breaking news` → `National` (mapped)
- Default → `National`

---

## 🔍 Features

### ✅ Automatic Processing:

1. **HTML Cleaning**: Strips WordPress block comments and cleans HTML
2. **Excerpt Generation**: Creates excerpt from content if not available
3. **Image Extraction**: Finds featured images from attachments
4. **Duplicate Detection**: Skips posts that already exist (by title)
5. **Date Parsing**: Converts WordPress dates to MongoDB dates
6. **Tag Extraction**: Extracts tags and filters common ones
7. **Breaking News Detection**: Identifies breaking news posts

### ⚠️ What's Skipped:

- Draft posts (`wp:status` != "publish")
- Posts without title or content
- Duplicate posts (already in database)
- WordPress pages (only posts are imported)
- Comments (not imported)

---

## 📝 Output

The script provides detailed progress:

```
📖 Reading XML file...
🔄 Parsing XML...
📊 Extracting data...
Found 500 items in XML
Found 450 posts
Found 50 attachments
Found 420 published posts

🚀 Starting import...

✅ Imported [1]: दिल्ली में प्रदूषण के खिलाफ नई पहल...
✅ Imported [2]: तिगरी एक्सटेंशन में आग का कहर...
⏭️  Skipped (already exists): संसद का शीतकालीन सत्र...
...

📊 Import Summary:
✅ Successfully imported: 400
⏭️  Skipped: 15
❌ Errors: 5
📝 Total processed: 420

✅ Import completed!
```

---

## 🛠️ Customization

### Modify Category Mapping

Edit the `categoryMapping` object in `importWordPressToMongoDB.js`:

```javascript
const categoryMapping = {
  'Your WordPress Category': 'MongoDB Category',
  // Add more mappings
};
```

### Change Excerpt Length

Modify the `getExcerpt` function:

```javascript
function getExcerpt(content, maxLength = 300) { // Change 200 to 300
  // ...
}
```

### Skip Duplicate Check

Comment out the duplicate check:

```javascript
// Check if news already exists (by title)
// const existingNews = await News.findOne({ title: title.trim() });
// if (existingNews) {
//   skipped++;
//   continue;
// }
```

### Clear Existing Data First

Uncomment the clear section:

```javascript
// Clear existing news
console.log('🗑️  Clearing existing news...');
await News.deleteMany({});
console.log('✅ Cleared existing news');
```

---

## 🆘 Troubleshooting

### Issue: XML file not found

**Error:** `❌ XML file not found`

**Solution:**
- Ensure XML file is in project root directory
- Check file name matches exactly: `newsaddaindia.WordPress.2026-01-03.xml`
- Use absolute path if needed

### Issue: MongoDB connection failed

**Error:** `MongoDB connection error`

**Solution:**
- Check MongoDB is running
- Verify `MONGODB_URI` in `.env` file
- Test connection: `mongosh "your-connection-string"`

### Issue: xml2js not found

**Error:** `Cannot find module 'xml2js'`

**Solution:**
```bash
cd backend
npm install xml2js
```

### Issue: Memory error (large XML file)

**Error:** `JavaScript heap out of memory`

**Solution:**
```bash
node --max-old-space-size=4096 scripts/importWordPressToMongoDB.js
```

### Issue: Some posts not importing

**Check:**
- Are they published? (Only published posts are imported)
- Do they have title and content?
- Check error messages in console

---

## 📊 Verification

After import, verify data:

```bash
# Connect to MongoDB
mongosh "your-connection-string"

# Use database
use newsaddaindia

# Count imported news
db.news.countDocuments()

# View sample news
db.news.find().limit(5).pretty()

# Check categories
db.news.distinct("category")

# Check breaking news
db.news.countDocuments({ isBreaking: true })
```

---

## 🔄 Re-running Migration

The script automatically skips duplicates (by title). To re-import:

1. **Clear existing data first** (uncomment clear section)
2. **Or** modify duplicate check logic
3. **Or** delete specific posts manually

---

## 📚 Next Steps

After successful import:

1. ✅ Verify data in MongoDB
2. ✅ Test API endpoints (`/api/news`)
3. ✅ Check frontend displays news correctly
4. ✅ Update images if needed (download from WordPress)
5. ✅ Translate titles to English (if needed)

---

## 💡 Tips

1. **Backup first**: Always backup MongoDB before large imports
2. **Test with small subset**: Test with a few posts first
3. **Monitor progress**: Watch console output for errors
4. **Check images**: Verify image URLs are accessible
5. **Review categories**: Check category mapping is correct

---

**Need help?** Check the troubleshooting section or review the script comments.

---

## 🔄 Category-Pages Synchronization

**IMPORTANT:** The `pages` field is automatically synchronized with the `category` field.

### Automatic Sync Rules

When a category is selected, the corresponding page is automatically added to the `pages` array:

| Category       | Auto-Added Pages        |
|----------------|------------------------|
| National       | `['home', 'national']` |
| International  | `['home', 'international']` |
| Sports         | `['home', 'sports']` |
| Business       | `['home', 'business']` |
| Entertainment  | `['home', 'entertainment']` |
| Health         | `['home', 'health']` |
| Politics       | `['home', 'politics']` |

### Implementation Details

1. **Frontend (Admin Forms):**
   - When a category is selected, the `onCategoryChange()` method automatically syncs the pages
   - Users can still manually add/remove other pages, but the category's corresponding page is always included

2. **Backend (MongoDB Model):**
   - The `News` model has a pre-save hook that ensures pages are synced with category
   - This ensures data consistency even if articles are created/updated via API

3. **Migration Script:**
   - Run `node backend/scripts/syncPagesWithCategory.js` to sync existing articles
   - This script updates all existing news articles to match the category-pages relationship

### Running the Sync Migration

To sync existing articles in the database:

```bash
cd backend
node scripts/syncPagesWithCategory.js
```

This will:
- Update all articles to have the correct pages based on their category
- Preserve any manually selected additional pages
- Ensure 'home' and the category page are always included


