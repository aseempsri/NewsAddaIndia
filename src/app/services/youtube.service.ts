import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { map, catchError, timeout } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class YouTubeService {
  private readonly CHANNEL_HANDLE = 'newsaddaindialive';
  private readonly CACHE_KEY = 'youtube_latest_video';
  private readonly CACHE_TIMESTAMP_KEY = 'youtube_latest_video_timestamp';
  private readonly CACHE_DURATION = 30 * 60 * 1000; // 30 minutes

  constructor(private http: HttpClient) { }

  /**
   * Get the latest video URL from the YouTube channel
   * Uses RSS feed to avoid requiring API key
   */
  getLatestVideoUrl(): Observable<string | null> {
    // Check cache first
    const cachedUrl = this.getCachedVideoUrl();
    if (cachedUrl) {
      return of(cachedUrl);
    }

    // Try to get the channel ID first, then use RSS feed
    // For channels with handle, we need to find the channel ID
    // First, try to fetch channel page to get channel ID, then use RSS feed
    // Or use a simpler approach: parse the channel's videos page directly

    // Method 1: Try to use RSS feed (if we can get channel ID)
    // For now, let's try parsing the channel page directly which is more reliable
    return this.fetchLatestVideoFromChannelPage();
  }

  /**
   * Fetch latest video by parsing channel page
   * This method uses a CORS proxy to fetch the channel's videos page and extracts the latest video ID
   */
  private fetchLatestVideoFromChannelPage(): Observable<string | null> {
    // Use a CORS proxy to fetch the channel's videos page
    const channelUrl = `https://www.youtube.com/@${this.CHANNEL_HANDLE}/videos`;

    // Try multiple CORS proxy services for reliability
    const proxyUrls = [
      `https://api.allorigins.win/get?url=${encodeURIComponent(channelUrl)}`,
      `https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(channelUrl)}`,
    ];

    // Try first proxy
    return this.http.get<any>(proxyUrls[0]).pipe(
      timeout(15000),
      map(response => {
        try {
          // Handle different proxy response formats
          const html = response.contents || response || '';

          // Try multiple patterns to extract video ID
          // Pattern 1: Look for videoId in JSON data
          let videoIdMatch = html.match(/"videoId":"([a-zA-Z0-9_-]{11})"/);

          // Pattern 2: Look for watch?v= links (first one is usually latest)
          if (!videoIdMatch) {
            const watchLinkMatch = html.match(/watch\?v=([a-zA-Z0-9_-]{11})/);
            if (watchLinkMatch) {
              videoIdMatch = watchLinkMatch;
            }
          }

          // Pattern 3: Look for /videos/VIDEO_ID pattern
          if (!videoIdMatch) {
            const videosMatch = html.match(/\/videos\/([a-zA-Z0-9_-]{11})/);
            if (videosMatch) {
              videoIdMatch = videosMatch;
            }
          }

          if (videoIdMatch && videoIdMatch[1]) {
            const videoUrl = `https://www.youtube.com/watch?v=${videoIdMatch[1]}`;
            this.cacheVideoUrl(videoUrl);
            return videoUrl;
          }
        } catch (error) {
          console.error('Error parsing channel page:', error);
        }
        return null;
      }),
      catchError(error => {
        console.error('Error fetching channel page from first proxy:', error);
        // Try second proxy as fallback
        return this.http.get<any>(proxyUrls[1]).pipe(
          timeout(15000),
          map(response => {
            try {
              const html = response.contents || response || '';
              const videoIdMatch = html.match(/"videoId":"([a-zA-Z0-9_-]{11})"/) ||
                html.match(/watch\?v=([a-zA-Z0-9_-]{11})/);

              if (videoIdMatch && videoIdMatch[1]) {
                const videoUrl = `https://www.youtube.com/watch?v=${videoIdMatch[1]}`;
                this.cacheVideoUrl(videoUrl);
                return videoUrl;
              }
            } catch (err) {
              console.error('Error parsing from second proxy:', err);
            }
            return null;
          }),
          catchError(err => {
            console.error('Error fetching from second proxy:', err);
            return of(null);
          })
        );
      })
    );
  }

  /**
   * Extract video ID from YouTube link
   */
  private extractVideoIdFromLink(link: string): string | null {
    if (!link) return null;

    // Handle different YouTube URL formats
    const patterns = [
      /[?&]v=([a-zA-Z0-9_-]{11})/,  // ?v=VIDEO_ID or &v=VIDEO_ID
      /youtu\.be\/([a-zA-Z0-9_-]{11})/,  // youtu.be/VIDEO_ID
      /\/embed\/([a-zA-Z0-9_-]{11})/,   // /embed/VIDEO_ID
    ];

    for (const pattern of patterns) {
      const match = link.match(pattern);
      if (match && match[1]) {
        return match[1];
      }
    }

    return null;
  }

  /**
   * Get cached video URL if still valid
   */
  private getCachedVideoUrl(): string | null {
    try {
      const cachedUrl = localStorage.getItem(this.CACHE_KEY);
      const timestamp = localStorage.getItem(this.CACHE_TIMESTAMP_KEY);

      if (cachedUrl && timestamp) {
        const cacheTime = parseInt(timestamp, 10);
        const now = Date.now();

        // Check if cache is still valid
        if (now - cacheTime < this.CACHE_DURATION) {
          return cachedUrl;
        } else {
          // Cache expired, remove it
          localStorage.removeItem(this.CACHE_KEY);
          localStorage.removeItem(this.CACHE_TIMESTAMP_KEY);
        }
      }
    } catch (error) {
      console.warn('Error reading cache:', error);
    }

    return null;
  }

  /**
   * Cache the video URL
   */
  private cacheVideoUrl(url: string): void {
    try {
      localStorage.setItem(this.CACHE_KEY, url);
      localStorage.setItem(this.CACHE_TIMESTAMP_KEY, Date.now().toString());
    } catch (error) {
      console.warn('Error caching video URL:', error);
    }
  }

  /**
   * Get the channel URL (fallback)
   */
  getChannelUrl(): string {
    return `https://www.youtube.com/@${this.CHANNEL_HANDLE}`;
  }
}

