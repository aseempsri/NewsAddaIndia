# OpenAI API Key Setup

To use the news service with OpenAI, you need to set your API key.

## Option 1: Set API Key via Browser Console (Recommended)

1. Open your browser's Developer Console (F12)
2. Run this command:
```javascript
localStorage.setItem('openai_api_key', 'YOUR_API_KEY_HERE');
```
3. Refresh the page

## Option 2: Set API Key Programmatically

You can also set it in your component:

```typescript
import { NewsService } from './services/news.service';

constructor(private newsService: NewsService) {
  this.newsService.setApiKey('YOUR_API_KEY_HERE');
}
```

## Option 3: Environment Variable (For Production)

1. Update `src/environments/environment.ts`:
```typescript
export const environment = {
  production: false,
  openaiApiKey: 'YOUR_API_KEY_HERE'
};
```

## Getting Your OpenAI API Key

1. Go to https://platform.openai.com/
2. Sign up or log in
3. Navigate to API Keys section
4. Create a new secret key
5. Copy the key and use it in one of the methods above

## Important Notes

- **Never commit your API key to version control**
- The API key is stored in browser localStorage for convenience
- For production, use environment variables or a secure backend service
- OpenAI API usage is billed per request - monitor your usage

## Image Fetching Flow

The service follows a smart image fetching strategy to find the best images for news headlines:

### How It Works

1. **Step 1**: Fetch latest news articles
2. **Step 2**: Use OpenAI to generate intelligent search queries from headlines
3. **Step 3**: Search for real published images on the web (general web search from news sources)
4. **Step 4**: If web search fails, try **Pixabay** and **Pexels**:
   - **Pixabay** (free, no API key needed) - Free stock photos from the web
   - **Pexels** (optional) - High-quality stock photos from the web (requires API key)
5. **Step 5**: Only if all web sources fail, use **OpenAI DALL-E 3** to generate images
   - Uses the same OpenAI API key you set above
   - Creates professional news-style photographs
   - High quality, realistic images

### Priority Order

1. **Web Images First** (general web search from news sources) - Real published images from the web
2. **Pixabay/Pexels** - Stock photo libraries if web search fails
3. **DALL-E Generation** - Only if all web sources fail to find suitable images
4. **Placeholder** - Last resort if all methods fail

### Optional: Pexels API Key (for better web images)

If you want access to higher quality web images:

1. Get API key from https://www.pexels.com/api/
2. Set via browser console:
```javascript
localStorage.setItem('pexels_api_key', 'YOUR_PEXELS_API_KEY');
```

**Note**: The service prioritizes finding real published images on the web. DALL-E is only used as a fallback when no suitable web images are available.
