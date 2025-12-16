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

## Image Generation

The service uses **OpenAI DALL-E 3** to generate images directly based on news headlines. This ensures high-quality, relevant images for each news article.

### How It Works

1. **Primary Method**: OpenAI DALL-E 3 generates images directly from headlines
   - Uses the same OpenAI API key you set above
   - Creates professional news-style photographs
   - High quality, realistic images

2. **Fallback Methods** (if DALL-E fails):
   - **Pixabay** (free, no API key needed) - Free stock photos
   - **Pexels** (optional) - High-quality stock photos (requires API key)

### Optional: Pexels API Key (for fallback images)

If you want better fallback images when DALL-E is unavailable:

1. Get API key from https://www.pexels.com/api/
2. Set via browser console:
```javascript
localStorage.setItem('pexels_api_key', 'YOUR_PEXELS_API_KEY');
```

**Note**: The service primarily uses DALL-E for image generation. Pixabay and Pexels are only used as fallbacks if DALL-E generation fails.
