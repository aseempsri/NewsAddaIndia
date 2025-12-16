# OpenAI API Setup for News Service

## Quick Setup

### Step 1: Get Your OpenAI API Key

1. Go to https://platform.openai.com/
2. Sign up or log in to your account
3. Navigate to **API Keys** section (https://platform.openai.com/api-keys)
4. Click **"Create new secret key"**
5. Copy the key (you'll only see it once!)

### Step 2: Set Your API Key

**Option A: Browser Console (Easiest)**
1. Open your application in the browser
2. Press `F12` to open Developer Tools
3. Go to the **Console** tab
4. Run this command:
```javascript
localStorage.setItem('openai_api_key', 'YOUR_API_KEY_HERE');
```
5. Refresh the page

**Option B: In Code (For Development)**
1. Open `src/app/services/news.service.ts`
2. In the constructor, add:
```typescript
constructor(private http: HttpClient) {
  this.setApiKey('YOUR_API_KEY_HERE');
}
```

**Option C: Environment Variable (For Production)**
1. Update `src/environments/environment.ts`:
```typescript
export const environment = {
  production: false,
  openaiApiKey: 'YOUR_API_KEY_HERE'
};
```
2. Update the service constructor to use it:
```typescript
this.apiKey = environment.openaiApiKey || localStorage.getItem('openai_api_key') || '';
```

## How It Works

The news service uses OpenAI's GPT-4o model to:
- Fetch REAL, CURRENT news articles from the web for different categories (National, International, Sports, Business, Entertainment, Health, Politics)
- Extract actual current events and breaking news from India
- Generate intelligent image search queries using OpenAI (similar to how ChatGPT fetches images from web)
- Fetch relevant images from web-based sources (Pixabay, Bing Image Search, Pexels) based on the news story details

**Note**: The service uses GPT-4o which has access to current information up to its knowledge cutoff. For the most up-to-date breaking news, the model will provide the latest information available to it.

## Categories Supported

- **National** - Indian national news
- **International** - Global news
- **Sports** - Sports news
- **Business** - Business and economy news
- **Entertainment** - Entertainment and Bollywood news
- **Health** - Health and medical news
- **Politics** - Political news

## Components Updated

All these components now use the OpenAI news service:
- ✅ Hero Section (Featured + Side News)
- ✅ News Grid (Latest Stories)
- ✅ Category Section (Entertainment & Sports)
- ✅ Category Pages (All category pages)

## Important Notes

⚠️ **Security**: Never commit your API key to version control!

💰 **Cost**: OpenAI API usage is billed per request. Monitor your usage at https://platform.openai.com/usage

🖼️ **Images**: Images are intelligently fetched using OpenAI to generate search queries, then retrieved from web-based image sources:
- **Pixabay** (free, no API key needed) - Primary source
- **Bing Image Search** (optional, requires Azure API key) - For news-specific images
- **Pexels** (optional, requires API key) - High-quality stock photos

To set up optional image API keys, use browser console:
```javascript
localStorage.setItem('bing_api_key', 'YOUR_BING_API_KEY');
localStorage.setItem('pexels_api_key', 'YOUR_PEXELS_API_KEY');
```

## Testing

After setting your API key:
1. Refresh the application
2. Check the browser console for any errors
3. News should load automatically on page load
4. Each category page will fetch news for that specific category

## Troubleshooting

**No news loading?**
- Check browser console for errors
- Verify API key is set correctly
- Check OpenAI API quota/balance
- Ensure you have internet connection

**Images not loading?**
- Images are fetched from Pixabay by default (no API key needed)
- OpenAI generates intelligent search queries for better image relevance
- For news-specific images, optionally set up Bing Image Search API key
- For higher quality stock photos, optionally set up Pexels API key

**API Errors?**
- Check OpenAI API status: https://status.openai.com/
- Verify your API key is valid
- Check your OpenAI account has credits
