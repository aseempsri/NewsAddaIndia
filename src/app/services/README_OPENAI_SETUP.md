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

## Optional: Image API Keys (for better images)

The service uses OpenAI to generate intelligent image search queries and fetches images from web-based sources:

### Pixabay (Default - No Key Needed)
- Works automatically without any setup
- Free stock photos

### Bing Image Search (Optional - For News Images)
1. Get Azure Cognitive Services API key from https://azure.microsoft.com/en-us/services/cognitive-services/bing-image-search-api/
2. Set via browser console:
```javascript
localStorage.setItem('bing_api_key', 'YOUR_BING_API_KEY');
```

### Pexels (Optional - High Quality Photos)
1. Get API key from https://www.pexels.com/api/
2. Set via browser console:
```javascript
localStorage.setItem('pexels_api_key', 'YOUR_PEXELS_API_KEY');
```

Without these keys, the service will use Pixabay (free) and placeholder images as fallback.
