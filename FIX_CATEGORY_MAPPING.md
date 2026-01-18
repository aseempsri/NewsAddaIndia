# Fix Category Mapping Issue

## Problem Identified

The category mapping logic had critical bugs:
1. **Tags were being used for category mapping** - "Breaking news" tag was overriding actual categories
2. **Case-sensitive matching** - Categories with different cases weren't matching
3. **Missing category mappings** - Technology, state names, Hindi categories weren't mapped

### Example Issue:
- XML shows: `<category domain="category">Religious</category>` + `<category domain="post_tag">Breaking news</category>`
- Old logic: Mapped to "National" (because Breaking news tag → National)
- Fixed logic: Maps to "Religious" (only uses domain="category", ignores tags)

## Fixes Applied

✅ **Fixed `mapCategory()` function:**
- Only processes categories (domain="category"), NOT tags
- Case-insensitive matching with whitespace trimming
- Added all missing category mappings

✅ **Added missing category mappings:**
- Technology → Technology
- State names (Bihar, Madhya Pradesh, etc.) → National
- Hindi categories (खेल → Sports, etc.)
- Crime, Desh, Uncategorized → National

## Verification

All tests pass ✅:
- Religious category + Breaking news tag → Religious ✅
- National category → National ✅
- Technology category → Technology ✅
- Case-insensitive matching ✅
- Hindi categories ✅

---

## Commands to Fix Database

### Step 1: Test Category Mapping (Optional but Recommended)
```bash
cd backend
node scripts/testCategoryMapping.js
```

Expected output: All tests should pass ✅

### Step 2: Clear All News from Database

**⚠️ WARNING: This will delete ALL news articles (approximately 7k articles)**

```bash
cd backend
npm run clear:news
```

Or directly:
```bash
cd backend
node scripts/clearAllNews.js
```

**Expected output:**
```
✅ Successfully deleted XXXX articles
✅ Database cleared successfully!
```

### Step 3: Re-import All XML Files with Corrected Logic

```bash
cd backend
npm run import:multiple
```

Or directly:
```bash
cd backend
node scripts/importMultipleWordPressXML.js
```

**Expected output:**
- All XML files will be processed
- Articles will be imported with CORRECT categories
- Final summary showing imported count

### Step 4: Verify Categories (Optional)

You can verify categories are correct by checking a few articles:

```bash
# Connect to MongoDB and check
# Example: Check Religious category articles
# Should show articles with category: "Religious" (not "National")
```

---

## Summary of Changes

### Files Modified:
1. `backend/scripts/importMultipleWordPressXML.js`
   - Fixed `mapCategory()` function
   - Added comprehensive category mappings
   - Removed tag-based category mapping

### Files Created:
1. `backend/scripts/clearAllNews.js` - Script to clear all news
2. `backend/scripts/testCategoryMapping.js` - Test script for verification
3. `backend/package.json` - Added `clear:news` script

---

## Important Notes

1. **Backup Recommended**: Before clearing, consider backing up your database if needed
2. **Import Time**: Re-importing 7k articles may take 10-30 minutes depending on server
3. **No Data Loss**: The XML files contain all data, so you can re-import anytime
4. **Category Verification**: After import, verify a few articles to ensure categories are correct

---

## Expected Results After Fix

- ✅ Religious articles → category: "Religious" (not "National")
- ✅ Technology articles → category: "Technology" (not "National")
- ✅ State articles → category: "National" (correctly mapped)
- ✅ All categories match their XML category field
- ✅ Tags no longer affect category assignment

---

## Troubleshooting

If you encounter issues:

1. **Check MongoDB connection**: Ensure `.env` has correct `MONGODB_URI`
2. **Check XML files**: Ensure XML files are in project root
3. **Check logs**: Review console output for specific errors
4. **Test mapping**: Run `testCategoryMapping.js` to verify logic

---

## Quick Command Reference

```bash
# Test category mapping
cd backend && node scripts/testCategoryMapping.js

# Clear database
cd backend && npm run clear:news

# Re-import all XML files
cd backend && npm run import:multiple
```
