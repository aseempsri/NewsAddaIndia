# 📰 Trending News Implementation

## Overview

Trending news is now **dynamically fetched** from your MongoDB database instead of being hardcoded. The ticker displays the most relevant news based on priority.

---

## How It Works

### Priority Order

Trending news is fetched and sorted by this priority:

1. **Trending News** (`isTrending: true`) - Highest priority
2. **Featured News** (`isFeatured: true`) - Second priority
3. **Breaking News** (`isBreaking: true`) - Third priority  
4. **Recent News** - Sorted by creation date (newest first)

### Fetching Logic

**Frontend Service** (`news.service.ts`):
- Method: `fetchTrendingNews(limit: number = 10)`
- Fetches from: `/api/news?limit=10&published=true`
- Sorts by: Trending → Featured → Breaking → Date (newest first)
- Returns: Array of `NewsArticle` objects

**Component** (`news-ticker.component.ts`):
- Calls `fetchTrendingNews()` on component initialization
- Displays news titles in scrolling ticker
- Falls back to hardcoded news if API fails
- Duplicates news array for seamless infinite scroll

---

## Backend API

**Endpoint:** `GET /api/news`

**Query Parameters:**
- `limit` - Number of news items (default: 10)
- `published=true` - Only published news
- `featured=true` - Filter featured news (optional)
- `breaking=true` - Filter breaking news (optional)

**Response:**
```json
{
  "success": true,
  "count": 10,
  "data": [
    {
      "_id": "...",
      "title": "News Title",
      "titleEn": "News Title in English",
      "excerpt": "News excerpt...",
      "category": "National",
      "isTrending": true,
      "isFeatured": true,
      "isBreaking": false,
      "createdAt": "2026-01-06T...",
      ...
    }
  ]
}
```

---

## How to Control Trending News

### Option 1: Mark News as Trending (Highest Priority)

**In Admin Panel:**
1. Edit a news article
2. Check **"Trending"** checkbox
3. Save

**Trending news will appear first in trending ticker**

### Option 2: Mark News as Featured

**In Admin Panel:**
1. Edit a news article
2. Check **"Featured"** checkbox
3. Save

**Featured news will appear second in trending ticker**

### Option 3: Mark News as Breaking

**In Admin Panel:**
1. Edit a news article
2. Check **"Breaking"** checkbox
3. Save

**Breaking news will appear third in trending ticker**

### Option 4: Recent News

**Any published news** will appear in trending ticker, sorted by date (newest first)

---

## Frontend Component

**File:** `Frontend/src/app/components/news-ticker/news-ticker.component.ts`

**Features:**
- ✅ Fetches trending news from backend API
- ✅ Displays news titles in scrolling ticker
- ✅ Links to full news article (`/news/:id`)
- ✅ Loading state while fetching
- ✅ Fallback to hardcoded news if API fails
- ✅ Infinite scroll animation

**Template:**
- Shows "TRENDING" label with lightning icon
- Displays news titles with bullet points
- Links each news item to its detail page

---

## Customization

### Change Number of Trending News Items

**In component:**
```typescript
this.newsService.fetchTrendingNews(15).subscribe(...) // Fetch 15 items instead of 10
```

### Change Priority Order

**In service (`news.service.ts`):**
```typescript
// Modify the sort logic in fetchTrendingNews()
const sortedNews = response.data.sort((a, b) => {
  // Your custom sorting logic
});
```

### Add Custom Trending Criteria

**Backend** - Add new field to News model:
```javascript
isTrending: {
  type: Boolean,
  default: false,
  index: true
}
```

**Backend Route** - Add filter:
```javascript
if (trending === 'true') {
  query.isTrending = true;
}
```

**Frontend Service** - Update fetchTrendingNews():
```typescript
const url = `${this.backendApiUrl}/api/news?trending=true&limit=${limit}&published=true`;
```

---

## Performance

- **Caching:** News is cached in component (refreshes on page reload)
- **API Timeout:** 5 seconds timeout for API calls
- **Fallback:** Hardcoded news if API fails
- **Optimization:** Backend uses indexed queries for fast retrieval

---

## Testing

**To test trending news:**

1. **Add Featured News:**
   - Go to Admin Panel
   - Create/Edit news article
   - Mark as "Featured"
   - Check ticker - should appear first

2. **Add Breaking News:**
   - Create/Edit news article
   - Mark as "Breaking"
   - Check ticker - should appear after featured

3. **Check Recent News:**
   - Create new news articles
   - Check ticker - newest should appear

---

## Troubleshooting

### Issue: Ticker shows "No trending news available"

**Possible causes:**
- No published news in database
- Backend API not responding
- Network error

**Solution:**
- Check backend is running: `curl http://your-vps/api/news?limit=10&published=true`
- Verify news articles are published in database
- Check browser console for errors

### Issue: Ticker shows hardcoded news

**Possible causes:**
- API call failed
- Backend returned empty array

**Solution:**
- Check network tab in browser DevTools
- Verify backend API endpoint is accessible
- Check backend logs for errors

### Issue: News not appearing in correct order

**Possible causes:**
- Sorting logic issue
- Date fields missing

**Solution:**
- Verify `createdAt` or `date` fields exist in news articles
- Check sorting logic in `fetchTrendingNews()` method

---

## Summary

✅ **Trending news is now dynamic** - fetched from MongoDB  
✅ **Priority-based sorting** - Featured → Breaking → Recent  
✅ **Automatic updates** - Refreshes on page load  
✅ **Fallback support** - Shows hardcoded news if API fails  
✅ **Clickable links** - Each news item links to full article  

**Your trending ticker now displays real news from your database!** 🎉

