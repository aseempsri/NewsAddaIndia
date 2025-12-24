import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';

@Injectable({
    providedIn: 'root'
})
export class InstagramService {
    private instagramProfileUrl = 'https://www.instagram.com/newsaddaindialive/';

    // Note: Instagram's public API is very limited
    // This service provides a structure for fetching the latest reel
    // You'll need to implement a backend service or use Instagram Graph API

    constructor(private http: HttpClient) { }

    // Backend API endpoint - Update this to your backend service URL
    // Example: 'https://your-backend.com/api/instagram/latest-reel'
    private backendApiUrl = '/api/instagram/latest-reel'; // Update this path

    /**
     * Fetches the latest reel video URL from Instagram
     * 
     * Implementation Options:
     * 1. Backend Service (Recommended): Create a backend API that fetches the latest reel
     *    - Use Instagram Graph API with proper authentication
     *    - Or use web scraping (be aware of Instagram's ToS)
     * 
     * 2. Manual Configuration: Update the videoUrl manually when you post a new reel
     * 
     * 3. Instagram Graph API: Requires Facebook Developer account and app approval
     */
    getLatestReelVideoUrl(): Observable<string | null> {
        // Option 1: Use your backend service
        // Uncomment and update the URL when you have a backend endpoint
        /*
        return this.http.get<{videoUrl: string}>(this.backendApiUrl).pipe(
            map(response => response.videoUrl),
            catchError(() => {
                console.warn('Failed to fetch latest reel from backend, using fallback');
                return of(null);
            })
        );
        */

        // Option 2: For now, return null to use fallback video
        // You can manually update this method to return a specific reel URL
        return of(null);
    }

    /**
     * Get Instagram profile URL
     */
    getInstagramProfileUrl(): string {
        return this.instagramProfileUrl;
    }

    /**
     * Alternative: Use Instagram oEmbed API with a specific post URL
     * This requires you to know the specific post/reel URL
     */
    getReelFromUrl(postUrl: string): Observable<any> {
        const oEmbedUrl = `https://api.instagram.com/oembed/?url=${encodeURIComponent(postUrl)}`;

        return this.http.jsonp(oEmbedUrl, 'callback').pipe(
            map((response: any) => {
                // oEmbed returns HTML embed code, not direct video URL
                // You'd need to extract video URL from the HTML or use a different approach
                return response;
            }),
            catchError(() => {
                console.warn('Failed to fetch Instagram oEmbed');
                return of(null);
            })
        );
    }
}

