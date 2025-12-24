# Image Fetching Setup

The news service uses Pixabay and Pexels to fetch images for news headlines.

## Image Fetching Flow

The service follows a simple image fetching strategy:

### How It Works

1. **Step 1**: Fetch latest news articles
2. **Step 2**: Generate search queries from headlines using intelligent keyword extraction
3. **Step 3**: Search for images on **Pixabay** (free, no API key needed)
4. **Step 4**: If Pixabay fails, try **Pexels** (optional, requires API key)
5. **Step 5**: If both fail, use placeholder images

### Priority Order

1. **Pixabay** - Free stock photos (no API key needed)
2. **Pexels** - High-quality stock photos (optional, requires API key)
3. **Placeholder** - Last resort if both sources fail

### Optional: Pexels API Key (for better images)

If you want access to higher quality images from Pexels:

1. Get API key from https://www.pexels.com/api/
2. Set via browser console:
```javascript
localStorage.setItem('pexels_api_key', 'YOUR_PEXELS_API_KEY');
```

**Note**: Pixabay works automatically without any API key. Pexels is optional and provides higher quality images when available.
