# Instagram Reel Integration Guide

## Overview
The video banner component is set up to automatically fetch and display the latest Instagram reel from `@newsaddaindialive`. Currently, it uses a fallback video until you implement one of the solutions below.

## Implementation Options

### Option 1: Backend Service (Recommended)

Create a backend API endpoint that fetches the latest Instagram reel and returns the video URL.

**Steps:**
1. Create a backend service (Node.js, Python, etc.) that:
   - Uses Instagram Graph API with proper authentication
   - Or uses web scraping (be aware of Instagram's Terms of Service)
   - Returns the latest reel's video URL

2. Update `instagram.service.ts`:
   ```typescript
   private backendApiUrl = 'https://your-backend.com/api/instagram/latest-reel';
   ```

3. Uncomment the backend API call in `getLatestReelVideoUrl()` method

**Example Backend Endpoint Response:**
```json
{
  "videoUrl": "https://instagram.com/p/ABC123/video.mp4"
}
```

### Option 2: Instagram Graph API

1. Create a Facebook Developer account
2. Create a Facebook App
3. Get Instagram Business Account ID
4. Use Instagram Graph API to fetch latest media
5. Extract video URL from the response

**Required Permissions:**
- `instagram_basic`
- `instagram_content_publish` (if needed)

**API Endpoint:**
```
GET /{ig-user-id}/media?fields=media_type,media_url,thumbnail_url
```

### Option 3: Manual Configuration

For a simpler approach, you can manually update the video URL when you post a new reel:

1. Get the direct video URL from your Instagram reel
2. Update `instagram.service.ts`:
   ```typescript
   getLatestReelVideoUrl(): Observable<string | null> {
       // Manually update this URL when you post a new reel
       return of('https://instagram.com/p/YOUR_REEL_ID/video.mp4');
   }
   ```

### Option 4: Third-Party Services

Consider using services like:
- RapidAPI Instagram API
- Apify Instagram Scraper
- Other Instagram API services

## Current Status

The component currently uses a fallback video (`assets/videos/Video-279.mp4`). The service structure is in place and ready to be connected to your chosen implementation method.

## Testing

Once implemented, the component will:
1. Attempt to fetch the latest reel on component initialization
2. Use the fetched video URL if available
3. Fall back to the default video if fetching fails

Check the browser console for logs indicating which video is being used.

