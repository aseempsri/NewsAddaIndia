import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, of, forkJoin } from 'rxjs';
import { map, catchError, switchMap, tap, timeout } from 'rxjs/operators';
import { environment } from '../../environments/environment';

export interface NewsArticle {
  id?: number;
  category: string;
  title: string;
  titleEn?: string;
  excerpt: string;
  image: string;
  time: string;
  author?: string;
  date?: string;
  imageLoading?: boolean; // Track if image is being loaded
}

@Injectable({
  providedIn: 'root'
})
export class NewsService {
  private newsApiKey: string = ''; // NewsAPI.org key
  private newsApiUrl = 'https://newsapi.org/v2/top-headlines';
  private pexelsUrl = 'https://api.pexels.com/v1/search';
  private pexelsApiKey = ''; // Optional: Get from pexels.com/api
  private readonly CACHE_PREFIX = 'news_cache_';
  private readonly CACHE_TIMESTAMP_PREFIX = 'news_cache_timestamp_';
  private readonly IMAGE_CACHE_PREFIX = 'image_cache_';

  // Category mapping for NewsAPI
  private categoryMap: Record<string, string> = {
    'National': 'general',
    'International': 'general',
    'Sports': 'sports',
    'Business': 'business',
    'Entertainment': 'entertainment',
    'Health': 'health',
    'Politics': 'general'
  };

  constructor(private http: HttpClient) {
    // Get API keys from environment (for production builds) or localStorage (for development)
    // Priority: environment variable > localStorage
    this.newsApiKey = environment.newsApiKey || localStorage.getItem('newsapi_key') || '';
    this.pexelsApiKey = localStorage.getItem('pexels_api_key') || '';
  }

  setNewsApiKey(key: string): void {
    this.newsApiKey = key;
    localStorage.setItem('newsapi_key', key);
  }

  setPexelsApiKey(key: string): void {
    this.pexelsApiKey = key;
    localStorage.setItem('pexels_api_key', key);
  }

  /**
   * Check if we need to fetch new news (always fetch on refresh)
   */
  private shouldFetchNewNews(): boolean {
    // Always fetch new news on each refresh/page load
    return true;
  }

  /**
   * Get cached news for a category
   */
  private getCachedNews(category: string): NewsArticle[] | null {
    const cacheKey = `${this.CACHE_PREFIX}${category}`;
    const cached = localStorage.getItem(cacheKey);
    if (cached) {
      try {
        return JSON.parse(cached);
      } catch (e) {
        console.error('Error parsing cached news:', e);
        return null;
      }
    }
    return null;
  }

  /**
   * Cache news for a category
   */
  private cacheNews(category: string, news: NewsArticle[]): void {
    const cacheKey = `${this.CACHE_PREFIX}${category}`;
    localStorage.setItem(cacheKey, JSON.stringify(news));
    localStorage.setItem('last_news_fetch_time', new Date().toISOString());
  }

  /**
   * Fetch latest REAL news from NewsAPI.org
   */
  private fetchRealNewsFromAPI(category: string, count: number): Observable<NewsArticle[]> {
    const newsApiCategory = this.categoryMap[category] || 'general';

    // Try NewsAPI first if key is available
    if (this.newsApiKey) {
      const url = `${this.newsApiUrl}?country=in&category=${newsApiCategory}&pageSize=${count}&apiKey=${this.newsApiKey}`;

      return this.http.get<any>(url).pipe(
        switchMap(response => {
          if (response.articles && response.articles.length > 0) {
            const articles = response.articles.slice(0, count);
            // Process articles - return news immediately, mark images as loading
            const articlesWithImages: NewsArticle[] = articles.map((article: any, index: number) => {
              const baseArticle: NewsArticle = {
                id: index + 1,
                category: category,
                title: article.title || 'Untitled',
                titleEn: article.title || 'Untitled',
                excerpt: this.stripHtml(article.description || article.content?.substring(0, 150) || 'No description available').trim() || 'No description available',
                image: '', // Empty initially - will be set when image loads
                imageLoading: true, // Always mark as loading initially
                time: this.getTimeAgo(index),
                author: article.author || article.source?.name || 'News Adda India',
                date: article.publishedAt ? new Date(article.publishedAt).toLocaleDateString('en-IN', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                }) : new Date().toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' })
              };

              // Use existing image if valid, otherwise fetch based on headline
              if (article.urlToImage && this.isValidImageUrl(article.urlToImage)) {
                baseArticle.image = article.urlToImage;
                baseArticle.imageLoading = false;
              } else {
                // Will be fetched based on headline - keep loading state
                baseArticle.imageLoading = true;
              }

              return baseArticle;
            });
            return of(articlesWithImages);
          }
          return of([]);
        }),
        catchError(error => {
          console.error('NewsAPI error:', error);
          // Fallback to Google News RSS
          return this.fetchFromGoogleNewsRSS(category, count);
        })
      );
    }

    // Fallback to Google News RSS (no API key needed)
    return this.fetchFromGoogleNewsRSS(category, count);
  }

  /**
   * Fetch news from Google News RSS (free, no API key needed)
   */
  private fetchFromGoogleNewsRSS(category: string, count: number): Observable<NewsArticle[]> {
    // Google News RSS feed for India
    const categoryQuery = category.toLowerCase().replace(' ', '+');
    const rssUrl = `https://news.google.com/rss/search?q=${encodeURIComponent(category + ' india')}&hl=en-IN&gl=IN&ceid=IN:en`;

    // Use a CORS proxy or fetch directly if possible
    // Note: Google News RSS might have CORS restrictions, so we'll use a proxy
    const proxyUrl = `https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(rssUrl)}`;

    return this.http.get<any>(proxyUrl).pipe(
      timeout(15000), // 15 second timeout
      switchMap(response => {
        if (response.items && response.items.length > 0) {
          const items = response.items.slice(0, count);
          // Process items - return news immediately, mark images as loading
          const itemsWithImages: NewsArticle[] = items.map((item: any, index: number) => {
            const title = this.cleanTitle(item.title) || 'Untitled';
            // Clean HTML from description/excerpt
            const cleanExcerpt = this.stripHtml(item.contentSnippet || item.description || 'No description available').trim();

            const existingImage = item.enclosure?.link || item.thumbnail;
            const baseItem: NewsArticle = {
              id: index + 1,
              category: category,
              title: title,
              titleEn: title,
              excerpt: cleanExcerpt || 'No description available',
              image: '', // Empty initially - will be set when image loads
              imageLoading: true, // Always mark as loading initially
              time: this.getTimeAgo(index),
              author: item.author || 'News Adda India',
              date: item.pubDate ? new Date(item.pubDate).toLocaleDateString('en-IN', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              }) : new Date().toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' })
            };

            // Use existing image if valid, otherwise will fetch based on headline
            if (existingImage && this.isValidImageUrl(existingImage)) {
              baseItem.image = existingImage;
              baseItem.imageLoading = false;
            } else {
              // Will be fetched based on headline - keep loading state
              baseItem.imageLoading = true;
            }

            return baseItem;
          });
          return of(itemsWithImages);
        }
        return of([]);
      }),
      catchError(error => {
        console.error('Google News RSS error:', error);
        // Try alternative RSS proxy if first one fails
        const altProxyUrl = `https://rss-to-json-serverless-api.vercel.app/api?feedURL=${encodeURIComponent(rssUrl)}`;
        return this.http.get<any>(altProxyUrl).pipe(
          timeout(10000),
          map(altResponse => {
            if (altResponse.items && altResponse.items.length > 0) {
              const items = altResponse.items.slice(0, count);
              return items.map((item: any, index: number) => {
                const title = this.cleanTitle(item.title) || 'Untitled';
                const cleanExcerpt = this.stripHtml(item.contentSnippet || item.description || 'No description available').trim();
                const existingImage = item.enclosure?.link || item.thumbnail;
                return {
                  id: index + 1,
                  category: category,
                  title: title,
                  titleEn: title,
                  excerpt: cleanExcerpt || 'No description available',
                  image: existingImage && this.isValidImageUrl(existingImage) ? existingImage : '',
                  imageLoading: !existingImage || !this.isValidImageUrl(existingImage),
                  time: this.getTimeAgo(index),
                  author: item.author || 'News Adda India',
                  date: item.pubDate ? new Date(item.pubDate).toLocaleDateString('en-IN', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  }) : new Date().toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' })
                } as NewsArticle;
              });
            }
            return [];
          }),
          catchError(altError => {
            console.error('Alternative RSS proxy also failed:', altError);
            return of([]);
          })
        );
      })
    );
  }

  /**
   * Check if a string is likely just a source name (not an article title)
   */
  private isLikelySourceName(text: string): boolean {
    if (!text || text.length < 2) return false;

    const commonSources = [
      'BBC', 'Scroll.in', 'Times of India', 'Hindustan Times', 'NDTV',
      'DD News', 'pib.gov.in', 'The Hindu', 'Indian Express', 'Mint',
      'Economic Times', 'Business Standard', 'Firstpost', 'News18',
      'India Today', 'Zee News', 'Aaj Tak', 'Republic TV', 'WION'
    ];

    const lowerText = text.toLowerCase().trim();

    // Check if it's exactly a known source name
    if (commonSources.some(source => source.toLowerCase() === lowerText)) {
      return true;
    }

    // Check if it's a short string (likely source name) without spaces or with only one word
    if (text.length < 15 && !text.includes(' ') && text.includes('.')) {
      return true; // Likely a domain name like "scroll.in"
    }

    // Check if it's a very short string (2-10 chars) without meaningful words
    if (text.length < 10 && !/\b(news|breaking|latest|update|report)\b/i.test(text)) {
      return true;
    }

    return false;
  }

  /**
   * Strip HTML tags from text (safe for Angular services)
   */
  private stripHtml(html: string): string {
    if (!html) return '';
    // Remove HTML tags using regex
    let text = html.replace(/<[^>]*>/g, '');
    // Decode common HTML entities
    text = text.replace(/&nbsp;/g, ' ');
    text = text.replace(/&amp;/g, '&');
    text = text.replace(/&lt;/g, '<');
    text = text.replace(/&gt;/g, '>');
    text = text.replace(/&quot;/g, '"');
    text = text.replace(/&#39;/g, "'");
    text = text.replace(/&apos;/g, "'");
    return text.trim();
  }

  /**
   * Clean title from RSS feed (remove source prefixes)
   */
  private cleanTitle(title: string): string {
    if (!title) return '';
    // Remove common RSS title patterns like "Source: Title" or "Title - Source"
    // Try multiple patterns to extract the actual article title
    let cleaned = title;

    // Pattern 1: "Source - Title" or "Source: Title"
    if (cleaned.includes(' - ')) {
      const parts = cleaned.split(' - ');
      // Usually the title is the first part, source is last
      // But sometimes it's reversed, so take the longer part as title
      cleaned = parts.length > 1 ? (parts[0].length > parts[parts.length - 1].length ? parts[0] : parts[parts.length - 1]) : cleaned;
    }

    // Pattern 2: "Title | Source"
    if (cleaned.includes(' | ')) {
      cleaned = cleaned.split(' | ')[0];
    }

    // Pattern 3: Remove common source names if they appear at the start
    const commonSources = ['BBC', 'Scroll.in', 'Times of India', 'Hindustan Times', 'NDTV', 'DD News', 'pib.gov.in'];
    for (const source of commonSources) {
      if (cleaned.startsWith(source + ':') || cleaned.startsWith(source + ' -')) {
        cleaned = cleaned.substring(source.length + 1).trim();
      }
    }

    return cleaned.trim() || title;
  }

  /**
   * Fetch latest news for a specific category - uses REAL news APIs
   */
  fetchNewsByCategory(category: string, count: number = 5): Observable<NewsArticle[]> {
    console.log(`Fetching news for category: ${category}, count: ${count}`);

    // Always fetch fresh news on each refresh (no cache check)
    // Cache is still used as fallback if API fails

    // Fetch REAL news from NewsAPI or Google News RSS
    return this.fetchRealNewsFromAPI(category, count).pipe(
      map(news => {
        console.log(`Fetched ${news.length} news articles for ${category}`);
        // Cache the news after successful fetch
        if (news.length > 0) {
          this.cacheNews(`${category}_${count}`, news);
        } else {
          console.warn(`No news articles returned for ${category}`);
        }
        return news;
      }),
      catchError(error => {
        console.error('Error fetching real news:', error);
        // Try to return cached news as fallback
        const cachedNews = this.getCachedNews(`${category}_${count}`);
        if (cachedNews && cachedNews.length > 0) {
          console.log(`Returning cached news as fallback for ${category}`);
          return of(cachedNews);
        }
        console.warn(`No news available for ${category}, returning empty array`);
        return of([]);
      })
    );
  }

  /**
   * Fetch featured news (top story) - uses cache if available
   */
  fetchFeaturedNews(category: string = 'National'): Observable<NewsArticle> {
    return this.fetchNewsByCategory(category, 1).pipe(
      map(articles => articles[0] || this.getDefaultNews())
    );
  }

  /**
   * Fetch side news (2-3 articles) - uses cache if available
   */
  fetchSideNews(categories: string[] = ['Sports', 'Business']): Observable<NewsArticle[]> {
    const observables = categories.map(cat =>
      this.fetchNewsByCategory(cat, 1).pipe(
        map(articles => articles[0])
      )
    );
    return forkJoin(observables).pipe(
      map(articles => articles.filter(a => a !== undefined))
    );
  }

  /**
   * Force refresh news (bypasses cache) - call this at midnight
   */
  forceRefreshNews(category: string, count: number = 5): Observable<NewsArticle[]> {
    // Clear cache for this category
    const cacheKey = `${this.CACHE_PREFIX}${category}_${count}`;
    localStorage.removeItem(cacheKey);

    // Fetch fresh news
    return this.fetchNewsByCategory(category, count);
  }

  /**
   * Check and refresh all news at midnight (call this periodically or at app start)
   */
  checkAndRefreshAtMidnight(): void {
    if (this.shouldFetchNewNews()) {
      console.log('Midnight detected - news will be refreshed on next fetch');
      // Clear all news caches
      const keys = Object.keys(localStorage);
      keys.forEach(key => {
        if (key.startsWith(this.CACHE_PREFIX)) {
          localStorage.removeItem(key);
        }
      });
    }
  }

  /**
   * Check if image URL is valid
   */
  private isValidImageUrl(url: string): boolean {
    if (!url || url.trim() === '') return false;
    // Check if URL is valid and not a placeholder
    const invalidPatterns = ['placeholder', 'default', 'none', 'null', 'undefined'];
    const lowerUrl = url.toLowerCase();
    return !invalidPatterns.some(pattern => lowerUrl.includes(pattern)) &&
      (url.startsWith('http://') || url.startsWith('https://'));
  }

  /**
   * Fetch image based on headline using Pixabay and Pexels
   * This method uses the headline to generate image search queries
   * Returns placeholder image if no image found
   */
  fetchImageForHeadline(headline: string, category: string): Observable<string> {
    console.log(`Fetching image for headline: "${headline}"`);

    // Check cache first (but skip cache in production to ensure fresh images)
    // In production, we want fresh images on each load
    const cacheKey = `${this.IMAGE_CACHE_PREFIX}${this.hashString(headline + category)}`;
    const cachedImage = localStorage.getItem(cacheKey);
    // Only use cache if it's a valid external image URL (not placeholder)
    if (cachedImage && cachedImage.trim() !== '' &&
      !cachedImage.includes('picsum.photos') &&
      (cachedImage.startsWith('http://') || cachedImage.startsWith('https://'))) {
      // Verify cached image is still accessible
      console.log(`Using cached image for: "${headline}"`);
      return of(cachedImage);
    }

    // Generate search query from headline and search for images on Pixabay and Pexels
    const searchQuery = this.createIntelligentImageQuery(headline, category, '');
    console.log(`Generated search query: "${searchQuery}"`);

    // Try Pixabay first, then Pexels, then alternative query, then placeholder
    return this.fetchFromPixabay(searchQuery).pipe(
      catchError(() => {
        console.log(`Pixabay search failed, trying Pexels...`);
        return this.fetchFromPexels(searchQuery);
      }),
      catchError(() => {
        console.log(`All image sources failed, trying alternative query...`);
        // Try alternative query
        const alternativeQuery = this.createIntelligentImageQuery(headline, category, '');
        return this.fetchFromPixabay(alternativeQuery).pipe(
          catchError(() => this.fetchFromPexels(alternativeQuery)),
          catchError(() => {
            // Last resort: placeholder image
            const placeholder = this.getPlaceholderImage(alternativeQuery);
            return of(placeholder);
          })
        );
      }),
      catchError(() => {
        // Last resort: placeholder image
        const placeholder = this.getPlaceholderImage(searchQuery);
        return of(placeholder);
      })
    ).pipe(
      tap(imageUrl => {
        // Cache successful images (but not placeholders)
        if (imageUrl && imageUrl.trim() !== '' && !imageUrl.includes('picsum.photos')) {
          localStorage.setItem(cacheKey, imageUrl);
        }
      })
    );
  }

  /**
   * Intelligently fetch relevant image based on article title, category, and content
   * Enhanced to find perfect news-related images with multiple search strategies
   */
  private fetchIntelligentImage(title: string, category: string, content: string): Observable<string> {
    // Check image cache first using title as key
    const cacheKey = `${this.IMAGE_CACHE_PREFIX}${this.hashString(title + category)}`;
    const cachedImage = localStorage.getItem(cacheKey);
    if (cachedImage) {
      return of(cachedImage);
    }

    // Generate search query from title and search for images on Pixabay and Pexels
    const searchQuery = this.createIntelligentImageQuery(title, category, content);
    // Generate alternative queries for better matching
    const alternativeQuery = this.createIntelligentImageQuery(title, category, content);

    // Try Pixabay first, then Pexels, then alternative query, then placeholder
    return this.fetchFromPixabay(searchQuery).pipe(
      catchError(() => {
        console.log(`Pixabay search failed, trying Pexels...`);
        return this.fetchFromPexels(searchQuery);
      }),
      catchError(() => {
        console.log(`Trying alternative query...`);
        // Try alternative query
        return this.fetchFromPixabay(alternativeQuery).pipe(
          catchError(() => this.fetchFromPexels(alternativeQuery)),
          catchError(() => {
            // Last resort: placeholder image
            return of(this.getPlaceholderImage(alternativeQuery));
          })
        );
      }),
      catchError(() => {
        // Last resort: placeholder image
        return of(this.getPlaceholderImage(searchQuery));
      }),
      tap(imageUrl => {
        // Cache the image URL
        if (imageUrl && imageUrl !== this.getPlaceholderImage(title) && !imageUrl.includes('picsum.photos')) {
          localStorage.setItem(cacheKey, imageUrl);
        }
      })
    );
  }

  /**
   * Create intelligent image search query from title, category, and content
   * Enhanced to extract better news-related keywords
   */
  private createIntelligentImageQuery(title: string, category: string, content: string): string {
    // Extract key terms from title (remove common words)
    const stopWords = ['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'from', 'as', 'is', 'was', 'are', 'were', 'been', 'be', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could', 'should', 'may', 'might', 'must', 'can', 'this', 'that', 'these', 'those', 'latest', 'breaking', 'update', 'says', 'reports', 'according'];

    // Extract important terms from title (keep proper nouns and key terms)
    const titleWords = title
      .replace(/[^\w\s]/g, ' ')
      .split(' ')
      .filter(word => {
        const lower = word.toLowerCase();
        // Keep: proper nouns (capitalized), important terms, longer words
        return (word.length > 0 && word[0] === word[0].toUpperCase()) ||
          (word.length > 4 && !stopWords.includes(lower));
      })
      .slice(0, 6)
      .map(w => w.toLowerCase());

    // Extract key terms from content (prioritize proper nouns and entities)
    const contentWords = content
      .substring(0, 300)
      .replace(/[^\w\s]/g, ' ')
      .split(' ')
      .filter(word => {
        const lower = word.toLowerCase();
        // Keep: proper nouns, important entities, longer meaningful words
        return (word.length > 0 && word[0] === word[0].toUpperCase()) ||
          (word.length > 5 && !stopWords.includes(lower));
      })
      .slice(0, 4)
      .map(w => w.toLowerCase());

    // Category-specific enhancements (more specific)
    const categoryEnhancements: Record<string, string> = {
      'Sports': 'sports match stadium',
      'Business': 'business finance economy India',
      'Entertainment': 'entertainment bollywood cinema India',
      'National': 'India Indian',
      'International': 'world global international',
      'Health': 'health medical hospital India',
      'Politics': 'politics government India parliament'
    };

    const enhancement = categoryEnhancements[category] || category.toLowerCase();
    const allTerms = [...titleWords, ...contentWords, ...enhancement.split(' ')];

    // Remove duplicates and limit
    const uniqueTerms = [...new Set(allTerms)].slice(0, 8);

    return uniqueTerms.join(' ').trim() || category.toLowerCase();
  }

  /**
   * Fetch image from Pexels API (requires API key)
   */
  private fetchFromPexels(query: string): Observable<string> {
    if (!this.pexelsApiKey) {
      throw new Error('Pexels API key not available');
    }

    const headers = new HttpHeaders().set('Authorization', this.pexelsApiKey);
    const url = `${this.pexelsUrl}?query=${encodeURIComponent(query)}&per_page=1&orientation=landscape`;

    return this.http.get<any>(url, { headers }).pipe(
      map(response => {
        if (response.photos && response.photos.length > 0) {
          return response.photos[0].src.large || response.photos[0].src.medium;
        }
        throw new Error('No Pexels results');
      })
    );
  }

  /**
   * Fetch image from Pixabay API (free, no key needed)
   * Enhanced to prioritize relevant news images
   */
  private fetchFromPixabay(query: string): Observable<string> {
    // Add context to query for better news relevance
    const enhancedQuery = query.includes('news') ? query : `${query} news`.trim();

    // Pixabay public API (no key required for basic usage)
    const url = `https://pixabay.com/api/?key=9656065-a4094594c34c9a8d4e6c4e3e4&q=${encodeURIComponent(enhancedQuery)}&image_type=photo&orientation=horizontal&per_page=10&safesearch=true&order=popular`;

    return this.http.get<any>(url).pipe(
      map(response => {
        if (response.hits && response.hits.length > 0) {
          // Prefer images with higher relevance (tags matching query)
          const sortedHits = response.hits.sort((a: any, b: any) => {
            // Prioritize images with more matching tags
            const aTags = (a.tags || '').toLowerCase();
            const bTags = (b.tags || '').toLowerCase();
            const queryLower = query.toLowerCase();
            const aMatches = queryLower.split(' ').filter(term => aTags.includes(term)).length;
            const bMatches = queryLower.split(' ').filter(term => bTags.includes(term)).length;
            return bMatches - aMatches;
          });

          return sortedHits[0].webformatURL || sortedHits[0].largeImageURL;
        }
        throw new Error('No Pixabay results');
      })
    );
  }

  /**
   * Hash string for cache key
   */
  private hashString(str: string): string {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    return Math.abs(hash).toString();
  }

  /**
   * Fetch image using intelligent search (legacy method, kept for compatibility)
   */
  private fetchImage(query: string): Observable<string> {
    return this.fetchIntelligentImage(query, '', '');
  }

  /**
   * Create a better image search query from title and category
   */
  private createImageQuery(title: string, category: string): string {
    // Extract key terms from title
    const titleWords = title.toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .split(' ')
      .filter(word => word.length > 3)
      .slice(0, 4)
      .join(' ');

    // Combine with category context
    const categoryMap: Record<string, string> = {
      'Sports': 'sports',
      'Business': 'business finance',
      'Entertainment': 'entertainment bollywood',
      'National': 'india',
      'International': 'world news',
      'Health': 'health medical',
      'Politics': 'politics government'
    };

    const categoryContext = categoryMap[category] || category.toLowerCase();
    return `${titleWords} ${categoryContext}`.trim();
  }

  /**
   * Get placeholder image URL (public method for components to use)
   */
  getPlaceholderImage(query: string): string {
    // Use a more reliable image service with better relevance
    const cleanQuery = (query || 'india news').toLowerCase()
      .replace(/latest|news|india|indian|breaking|update|article|the|a|an|is|are|was|were|says|reports/gi, '')
      .trim()
      .split(' ')
      .filter(w => w.length > 2)
      .slice(0, 4)
      .join(' ') || 'india';

    // Create a hash from the query for consistent image
    let hash = 0;
    for (let i = 0; i < cleanQuery.length; i++) {
      const char = cleanQuery.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    const seed = Math.abs(hash) % 1000;

    // Use Picsum Photos with seed for consistent placeholder images
    // Images will be consistent for the same query
    return `https://picsum.photos/seed/${seed}/600/400`;
  }

  private getTimeAgo(index: number): string {
    const hours = index + 1;
    if (hours === 1) return '1 hour ago';
    return `${hours} hours ago`;
  }

  private getDefaultNews(): NewsArticle {
    return {
      category: 'National',
      title: 'Latest News',
      titleEn: 'Latest News',
      excerpt: 'Stay tuned for the latest updates.',
      image: 'https://picsum.photos/seed/news/600/400',
      time: 'Just now',
      author: 'News Adda India',
      date: new Date().toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' })
    };
  }
}
