import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, of, forkJoin } from 'rxjs';
import { map, catchError, switchMap, tap, timeout } from 'rxjs/operators';
import { environment } from '../../environments/environment';
import { LanguageService } from './language.service';

export interface NewsArticle {
  id?: number | string;
  category: string;
  title: string;
  titleEn?: string;
  excerpt: string;
  excerptEn?: string;
  summary?: string; // 60-word summary in Hindi
  summaryEn?: string; // 60-word summary in English
  content?: string; // Full article content in Hindi
  contentEn?: string; // Full article content in English
  image: string;
  images?: string[]; // Array of images (max 3)
  time: string;
  author?: string;
  date?: string;
  imageLoading?: boolean; // Track if image is being loaded
  isTrending?: boolean;
  isBreaking?: boolean;
  isFeatured?: boolean;
  trendingTitle?: string;
  trendingTitleEn?: string;
  tags?: string[];
}

@Injectable({
  providedIn: 'root'
})
export class NewsService {
  private newsApiKey: string = ''; // NewsData.io API key
  private newsApiUrl = 'https://newsdata.io/api/1/news';
  private pexelsUrl = 'https://api.pexels.com/v1/search';
  private pexelsApiKey = ''; // Optional: Get from pexels.com/api
  private backendApiUrl = environment.apiUrl || 'http://localhost:3000';
  private readonly CACHE_PREFIX = 'news_cache_';
  private readonly CACHE_TIMESTAMP_PREFIX = 'news_cache_timestamp_';
  private readonly IMAGE_CACHE_PREFIX = 'image_cache_';

  // Category mapping for NewsData.io
  private categoryMap: Record<string, string> = {
    'National': 'top',
    'International': 'world',
    'Sports': 'sports',
    'Business': 'business',
    'Entertainment': 'entertainment',
    'Health': 'health',
    'Politics': 'politics'
  };

  constructor(
    private http: HttpClient,
    private languageService: LanguageService
  ) {
    // Note: External APIs (NewsAPI, Pexels) are disabled - using database only
    // Keeping API key variables for potential future use, but not actively using them
    this.newsApiKey = (environment.newsApiKey || localStorage.getItem('newsapi_key') || '').trim();
    this.pexelsApiKey = localStorage.getItem('pexels_api_key') || '';
    
    console.log('NewsService initialized - Using database only (no external APIs)');
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
   * DISABLED: Fetch latest REAL news from NewsData.io
   * This method is no longer used - application now uses database only
   * Kept for reference but not called anywhere
   */
  private fetchRealNewsFromAPI(category: string, count: number): Observable<NewsArticle[]> {
    const newsApiCategory = this.categoryMap[category] || 'top';

    // Try NewsData.io first if key is available
    if (this.newsApiKey && this.newsApiKey.trim() !== '') {
      // NewsData.io API format: apikey, country, category
      // URL encode the API key to handle special characters
      const encodedKey = encodeURIComponent(this.newsApiKey.trim());
      const url = `${this.newsApiUrl}?apikey=${encodedKey}&country=in&category=${newsApiCategory}&language=en&size=${count}`;

      console.log('Fetching news from NewsData.io for category:', category);

      return this.http.get<any>(url).pipe(
        switchMap(response => {
          // NewsData.io returns results in 'results' array
          if (response.results && response.results.length > 0) {
            const articles = response.results.slice(0, count);
            // Process articles - return news immediately, mark images as loading
            const articlesWithImages: NewsArticle[] = articles.map((article: any, index: number) => {
              const baseArticle: NewsArticle = {
                id: index + 1,
                category: category,
                title: article.title || 'Untitled',
                titleEn: article.title || 'Untitled',
                excerpt: this.filterPaidVersionText(this.stripHtml(article.description || article.content?.substring(0, 150) || 'No description available').trim()) || article.title || 'No description available',
                image: '', // Empty initially - will be set when image loads
                imageLoading: true, // Always mark as loading initially
                time: this.getTimeAgo(index),
                author: article.creator?.[0] || article.source_id || 'News Adda India',
                date: article.pubDate ? new Date(article.pubDate).toLocaleDateString('en-IN', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                }) : new Date().toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' }),
                isTrending: false,
                isBreaking: false,
                isFeatured: false
              };

              // Use existing image if valid, otherwise fetch based on headline
              // NewsData.io uses 'image_url' field
              if (article.image_url && this.isValidImageUrl(article.image_url)) {
                baseArticle.image = article.image_url;
                baseArticle.imageLoading = false;
              } else if (article.image && this.isValidImageUrl(article.image)) {
                baseArticle.image = article.image;
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
          console.error('NewsData.io API error:', error);
          if (error.status === 401) {
            console.error('401 Unauthorized - API key may be invalid or missing. Check GitHub secrets (NEWSAPI_KEY).');
            console.error('Current API key (first 10 chars):', this.newsApiKey ? this.newsApiKey.substring(0, 10) + '...' : 'EMPTY');
          }
          // Fallback to Google News RSS
          return this.fetchFromGoogleNewsRSS(category, count);
        })
      );
    }

    // Fallback to Google News RSS (no API key needed)
    return this.fetchFromGoogleNewsRSS(category, count);
  }

  /**
   * DISABLED: Fetch news from Google News RSS (free, no API key needed)
   * This method is no longer used - application now uses database only
   * Kept for reference but not called anywhere
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
            const cleanExcerpt = this.filterPaidVersionText(this.stripHtml(item.contentSnippet || item.description || 'No description available').trim());

            const existingImage = item.enclosure?.link || item.thumbnail;
            const baseItem: NewsArticle = {
              id: index + 1,
              category: category,
              title: title,
              titleEn: title,
              excerpt: cleanExcerpt || title || 'No description available',
              image: '', // Empty initially - will be set when image loads
              imageLoading: true, // Always mark as loading initially
              time: this.getTimeAgo(index),
              author: item.author || 'News Adda India',
              date: item.pubDate ? new Date(item.pubDate).toLocaleDateString('en-IN', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              }) : new Date().toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' }),
              isTrending: false,
              isBreaking: false,
              isFeatured: false
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
                const cleanExcerpt = this.filterPaidVersionText(this.stripHtml(item.contentSnippet || item.description || 'No description available').trim());
                const existingImage = item.enclosure?.link || item.thumbnail;
                return {
                  id: index + 1,
                  category: category,
                  title: title,
                  titleEn: title,
                  excerpt: cleanExcerpt || title || 'No description available',
                  image: existingImage && this.isValidImageUrl(existingImage) ? existingImage : '',
                  imageLoading: !existingImage || !this.isValidImageUrl(existingImage),
                  time: this.getTimeAgo(index),
                  author: item.author || 'News Adda India',
                  date: item.pubDate ? new Date(item.pubDate).toLocaleDateString('en-IN', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  }) : new Date().toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' }),
                  isTrending: false,
                  isBreaking: false,
                  isFeatured: false
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
   * Filter out paid/premium version text from excerpt
   * If excerpt contains paid/premium text, return empty string (will use headline instead)
   * @param excerpt - The excerpt text to filter
   * @returns Filtered excerpt or empty string if contains paid keywords
   */
  private filterPaidVersionText(excerpt: string): string {
    if (!excerpt) return '';
    const paidKeywords = [
      'only available in paid version',
      'paid version',
      'premium version',
      'subscription required',
      'subscribe to read',
      'premium content',
      'paid content',
      'members only'
    ];
    const lowerExcerpt = excerpt.toLowerCase();
    for (const keyword of paidKeywords) {
      if (lowerExcerpt.includes(keyword.toLowerCase())) {
        return ''; // Return empty to use headline instead
      }
    }
    return excerpt;
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
   * Fetch latest news for a specific category - Database only (no external APIs)
   * Includes breaking news since articles marked for a category should appear regardless of breaking status
   */
  fetchNewsByCategory(category: string, count: number = 5): Observable<NewsArticle[]> {
    console.log(`Fetching news for category: ${category}, count: ${count} from database only`);

    // Fetch from backend API (database) - include breaking news for consistency
    return this.fetchFromBackend(category, count, undefined, false).pipe(
      switchMap(news => {
        // Translate news if Hindi is selected
        return this.translateNewsIfNeeded(news);
      }),
      tap(news => {
        // Cache the news after successful fetch and translation
        if (news.length > 0) {
          this.cacheNews(`${category}_${count}`, news);
        }
      }),
      catchError(backendError => {
        console.error('Backend API unavailable:', backendError);
        // Try to return cached news from database as fallback
        const cachedNews = this.getCachedNews(`${category}_${count}`);
        if (cachedNews && cachedNews.length > 0) {
          console.log(`Returning cached news from database as fallback for ${category}`);
          return this.translateNewsIfNeeded(cachedNews);
        }
        console.warn(`No news available for ${category} in database, returning empty array`);
        return of([]);
      })
    );
  }

  /**
   * Translate news articles to Hindi if Hindi language is selected
   */
  private translateNewsIfNeeded(news: NewsArticle[]): Observable<NewsArticle[]> {
    const currentLang = this.languageService.getCurrentLanguage();
    
    // If English is selected, return as is
    if (currentLang === 'en') {
      return of(news);
    }

    // If Hindi is selected, translate titles and excerpts
    return new Observable(observer => {
      const translatePromises = news.map(async (article) => {
        // Store original English title if not already stored
        if (!article.titleEn) {
          article.titleEn = article.title;
        }

        // Translate title if it's in English
        if (!/[\u0900-\u097F]/.test(article.title)) {
          try {
            article.title = await this.languageService.translateToHindi(article.title);
          } catch (error) {
            console.warn('Failed to translate title:', error);
          }
        }

        // Translate excerpt if it's in English
        if (article.excerpt && !/[\u0900-\u097F]/.test(article.excerpt)) {
          try {
            article.excerpt = await this.languageService.translateToHindi(article.excerpt);
          } catch (error) {
            console.warn('Failed to translate excerpt:', error);
          }
        }

        return article;
      });

      Promise.all(translatePromises)
        .then(translatedNews => {
          observer.next(translatedNews);
          observer.complete();
        })
        .catch(error => {
          console.error('Error translating news:', error);
          // Return original news if translation fails
          observer.next(news);
          observer.complete();
        });
    });
  }

  /**
   * Fetch news from backend API
   */
  private fetchFromBackend(category: string, count: number, page?: string, excludeBreaking: boolean = false): Observable<NewsArticle[]> {
    let url = `${this.backendApiUrl}/api/news?limit=${count}&published=true`;
    
    // Add page filter if specified
    if (page) {
      url += `&page=${encodeURIComponent(page)}`;
    } else if (category) {
      // If no page specified, filter by category
      url += `&category=${encodeURIComponent(category)}`;
    }
    
    // Exclude breaking news if requested
    if (excludeBreaking) {
      url += `&excludeBreaking=true`;
    }
    
    return this.http.get<{ success: boolean; data: any[] }>(url).pipe(
      timeout(5000), // 5 second timeout
      switchMap(response => {
        if (response.success && response.data && response.data.length > 0) {
          // Transform backend news format to NewsArticle format
          const newsArticles = response.data.map((article: any, index: number) => {
            // Construct full image URL if it's a relative path
            let imageUrl = article.image || '';
            if (imageUrl && imageUrl.trim() !== '' && !imageUrl.startsWith('http')) {
              // Ensure the path starts with /
              if (!imageUrl.startsWith('/')) {
                imageUrl = '/' + imageUrl;
              }
              imageUrl = `${this.backendApiUrl}${imageUrl}`;
            } else if (!imageUrl || imageUrl.trim() === '') {
              // If no image from backend, mark as loading so it can fetch from external sources
              imageUrl = '';
            }

            // Get images array or fallback to single image
            let imagesArray: string[] = [];
            if (article.images && Array.isArray(article.images) && article.images.length > 0) {
              // Construct full URLs for images array
              imagesArray = article.images.map((img: string) => {
                if (img && img.trim() !== '' && !img.startsWith('http')) {
                  const imgPath = img.startsWith('/') ? img : '/' + img;
                  return `${this.backendApiUrl}${imgPath}`;
                }
                return img;
              });
            } else if (imageUrl) {
              // Fallback to single image
              imagesArray = [imageUrl];
            }

            // CRITICAL: Always use MongoDB _id, convert to string, never use numeric fallback
            const articleId = article._id 
              ? (typeof article._id === 'string' ? article._id : article._id.toString())
              : (article.id ? (typeof article.id === 'string' ? article.id : article.id.toString()) : null);

            const newsArticle = {
              id: articleId, // Always use MongoDB _id, never numeric fallback
              category: article.category,
              title: article.title,
              titleEn: article.titleEn || article.title,
              excerpt: this.filterPaidVersionText(article.excerpt) || article.title || 'No description available',
              excerptEn: article.excerptEn || '',
              summary: article.summary || '',
              summaryEn: article.summaryEn || '',
              content: article.content || article.excerpt || '',
              contentEn: article.contentEn || '',
              image: imageUrl, // First image for backward compatibility
              images: imagesArray, // All images array
              imageLoading: !imageUrl || imageUrl.trim() === '',
              time: this.getTimeAgo(index),
              author: article.author || 'News Adda India',
              date: article.date ? new Date(article.date).toLocaleDateString('en-IN', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              }) : new Date().toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' }),
              isTrending: article.isTrending || false,
              isBreaking: article.isBreaking || false,
              isFeatured: article.isFeatured || false,
              trendingTitle: article.trendingTitle || undefined,
              trendingTitleEn: article.trendingTitleEn || undefined,
              tags: article.tags || []
            } as NewsArticle;
            
            // Log trending news
            if (newsArticle.isTrending) {
              console.log('🔥 TRENDING NEWS FETCHED:', {
                id: newsArticle.id,
                title: newsArticle.title,
                trendingTitle: newsArticle.trendingTitle || 'N/A',
                category: newsArticle.category,
                isTrending: newsArticle.isTrending
              });
            }
            
            // Include tags if available - handle different formats
            if (article.tags) {
              if (Array.isArray(article.tags)) {
                (newsArticle as any).tags = article.tags.filter((t: any) => t && (typeof t === 'string' ? t.trim().length > 0 : true));
              } else if (typeof article.tags === 'string') {
                // Try to parse JSON string
                try {
                  const parsed = JSON.parse(article.tags);
                  if (Array.isArray(parsed)) {
                    (newsArticle as any).tags = parsed.filter((t: any) => t && (typeof t === 'string' ? t.trim().length > 0 : true));
                  } else {
                    (newsArticle as any).tags = [];
                  }
                } catch {
                  // Treat as comma-separated string
                  (newsArticle as any).tags = article.tags.split(',').map((t: string) => t.trim()).filter((t: string) => t.length > 0);
                }
              } else {
                (newsArticle as any).tags = [];
              }
            } else {
              (newsArticle as any).tags = [];
            }
            
            console.log(`[NewsService] Article ${article._id || article.title?.substring(0, 30)} tags:`, (newsArticle as any).tags);
            
            return newsArticle;
          });
          
          // Translate news if Hindi is selected
          return this.translateNewsIfNeeded(newsArticles);
        }
        throw new Error('No news from backend');
      }),
      catchError(error => {
        console.error('Backend API error:', error);
        throw error;
      })
    );
  }

  /**
   * Fetch news by page (e.g., 'home', 'national', etc.)
   * Includes breaking news since articles marked for a page should appear regardless of breaking status
   */
  fetchNewsByPage(page: string, count: number = 5): Observable<NewsArticle[]> {
    console.log(`Fetching news for page: ${page}, count: ${count}`);

    // Fetch from backend API - include breaking news since they're marked for this page
    return this.fetchFromBackend('', count, page, false).pipe(
      switchMap(news => {
        // Translate news if Hindi is selected
        return this.translateNewsIfNeeded(news);
      }),
      catchError(backendError => {
        console.error('Backend API unavailable for page:', backendError);
        // Try to return cached news from database as fallback
        const cachedNews = this.getCachedNews(`${page}_${count}`);
        if (cachedNews && cachedNews.length > 0) {
          console.log(`Returning cached news from database as fallback for page ${page}`);
          return this.translateNewsIfNeeded(cachedNews);
        }
        console.warn(`No news available for page ${page} in database, returning empty array`);
        return of([]);
      })
    );
  }

  /**
   * Fetch breaking news for hero section
   */
  fetchBreakingNews(): Observable<NewsArticle> {
    const url = `${this.backendApiUrl}/api/news?breaking=true&limit=1&published=true`;
    
    return this.http.get<{ success: boolean; data: any[] }>(url).pipe(
      timeout(5000),
      switchMap(response => {
        if (response.success && response.data && response.data.length > 0) {
          const article = response.data[0];
          let imageUrl = article.image || '';
          if (imageUrl && imageUrl.trim() !== '' && !imageUrl.startsWith('http')) {
            // Ensure the path starts with /
            if (!imageUrl.startsWith('/')) {
              imageUrl = '/' + imageUrl;
            }
            imageUrl = `${this.backendApiUrl}${imageUrl}`;
          } else if (!imageUrl || imageUrl.trim() === '') {
            // If no image from backend, mark as loading so it can fetch from external sources
            imageUrl = '';
          }
          
          // CRITICAL: Always use MongoDB _id, convert to string, never use numeric fallback
          const articleId = article._id
            ? (typeof article._id === 'string' ? article._id : article._id.toString())
            : (article.id ? (typeof article.id === 'string' ? article.id : article.id.toString()) : null);

          // Log if ID is not a MongoDB ObjectId (for debugging)
          if (articleId && (articleId.length !== 24 || !/^[0-9a-fA-F]{24}$/.test(articleId))) {
            console.warn('[NewsService] fetchBreakingNews: Non-ObjectId ID detected:', {
              id: articleId,
              idType: typeof articleId,
              idLength: articleId?.length,
              _id: article._id,
              articleId: article.id,
              title: article.title?.substring(0, 30)
            });
          }

          const newsArticle: NewsArticle = {
            id: articleId,
            category: article.category,
            title: article.title,
            titleEn: article.titleEn || article.title,
            excerpt: article.excerpt,
            image: imageUrl,
            imageLoading: !imageUrl || imageUrl.trim() === '',
            time: this.getTimeAgo(0),
            author: article.author || 'News Adda India',
            date: article.date ? new Date(article.date).toLocaleDateString('en-IN', {
              year: 'numeric',
              month: 'long',
              day: 'numeric'
            }) : new Date().toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' }),
            isTrending: article.isTrending || false,
            isBreaking: article.isBreaking || false,
            isFeatured: article.isFeatured || false,
            trendingTitle: article.trendingTitle || undefined,
            trendingTitleEn: article.trendingTitleEn || undefined
          } as NewsArticle;
          
          // Translate if Hindi is selected
          return this.translateNewsIfNeeded([newsArticle]).pipe(
            map(translatedNews => translatedNews[0])
          );
        }
        // No breaking news found - return default/empty news instead of falling back to featured
        console.warn('No breaking news found - returning default news');
        return of(this.getDefaultNews());
      }),
      catchError(error => {
        console.warn('Error fetching breaking news:', error);
        // Return default news instead of falling back to featured
        return of(this.getDefaultNews());
      })
    );
  }

  /**
   * Fetch trending news for ticker
   * Priority: Featured news > Breaking news > Recent news
   */
  fetchTrendingNews(limit: number = 10): Observable<NewsArticle[]> {
    // Try to fetch featured news first, then breaking, then recent
    const url = `${this.backendApiUrl}/api/news?limit=${limit}&published=true`;
    
    return this.http.get<{ success: boolean; data: any[] }>(url).pipe(
      timeout(5000),
      switchMap(response => {
        if (response.success && response.data && response.data.length > 0) {
          // Sort: trending first, then featured, then breaking, then by date
          const sortedNews = response.data.sort((a, b) => {
            // Trending news first
            if (a.isTrending && !b.isTrending) return -1;
            if (!a.isTrending && b.isTrending) return 1;
            // Featured news second
            if (a.isFeatured && !b.isFeatured) return -1;
            if (!a.isFeatured && b.isFeatured) return 1;
            // Breaking news third
            if (a.isBreaking && !b.isBreaking) return -1;
            if (!a.isBreaking && b.isBreaking) return 1;
            // Then by date (newest first)
            return new Date(b.createdAt || b.date).getTime() - new Date(a.createdAt || a.date).getTime();
          });

          const newsArticles: NewsArticle[] = sortedNews.slice(0, limit).map(article => {
            let imageUrl = article.image || '';
            if (imageUrl && imageUrl.trim() !== '' && !imageUrl.startsWith('http')) {
              if (!imageUrl.startsWith('/')) {
                imageUrl = '/' + imageUrl;
              }
              imageUrl = `${this.backendApiUrl}${imageUrl}`;
            }

            return {
              id: article._id || article.id,
              category: article.category,
              title: article.title,
              titleEn: article.titleEn || article.title,
              excerpt: article.excerpt,
              image: imageUrl,
              imageLoading: !imageUrl || imageUrl.trim() === '',
              time: this.getTimeAgo(new Date(article.createdAt || article.date).getTime()),
              author: article.author || 'News Adda India',
              date: article.date ? new Date(article.date).toLocaleDateString('en-IN', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              }) : new Date().toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' }),
              isTrending: article.isTrending || false,
              isBreaking: article.isBreaking || false,
              isFeatured: article.isFeatured || false,
              trendingTitle: article.trendingTitle || undefined,
            trendingTitleEn: article.trendingTitleEn || undefined
            } as NewsArticle;
          });

          // Log all trending news fetched
          const trendingNews = newsArticles.filter(n => n.isTrending);
          if (trendingNews.length > 0) {
            console.log('🔥 TRENDING NEWS GRID - Total Trending News:', trendingNews.length);
            trendingNews.forEach((news, index) => {
              console.log(`🔥 Trending News ${index + 1}:`, {
                id: news.id,
                title: news.title,
                trendingTitle: news.trendingTitle || 'N/A',
                category: news.category,
                isTrending: news.isTrending
              });
            });
          } else {
            console.log('📰 No trending news found in fetchTrendingNews');
          }

          // Translate if Hindi is selected
          return this.translateNewsIfNeeded(newsArticles);
        }
        return of([]);
      }),
      catchError(error => {
        console.error('Error fetching trending news:', error);
        return of([]);
      })
    );
  }

  /**
   * Fetch breaking news (top 3 latest)
   */
  fetchBreakingNewsList(limit: number = 3): Observable<NewsArticle[]> {
    const url = `${this.backendApiUrl}/api/news?breaking=true&limit=${limit}&published=true`;
    
    return this.http.get<{ success: boolean; data: any[] }>(url).pipe(
      timeout(10000), // 10 second timeout for breaking news
      switchMap(response => {
        if (response.success && response.data && response.data.length > 0) {
          // Sort by date (newest first)
          const sortedNews = response.data.sort((a, b) => {
            return new Date(b.createdAt || b.date).getTime() - new Date(a.createdAt || a.date).getTime();
          });

          const newsArticles: NewsArticle[] = sortedNews.slice(0, limit).map(article => {
            let imageUrl = article.image || '';
            if (imageUrl && imageUrl.trim() !== '' && !imageUrl.startsWith('http')) {
              if (!imageUrl.startsWith('/')) {
                imageUrl = '/' + imageUrl;
              }
              imageUrl = `${this.backendApiUrl}${imageUrl}`;
            }

            // CRITICAL: Always use MongoDB _id, convert to string, never use numeric fallback
            const articleId = article._id 
              ? (typeof article._id === 'string' ? article._id : article._id.toString())
              : (article.id ? (typeof article.id === 'string' ? article.id : article.id.toString()) : null);

            return {
              id: articleId,
              category: article.category,
              title: article.title,
              titleEn: article.titleEn || article.title,
              excerpt: article.excerpt,
              image: imageUrl,
              imageLoading: !imageUrl || imageUrl.trim() === '',
              time: this.getTimeAgo(new Date(article.createdAt || article.date).getTime()),
              author: article.author || 'News Adda India',
              date: article.date ? new Date(article.date).toLocaleDateString('en-IN', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              }) : new Date().toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' }),
              isTrending: article.isTrending || false,
              isBreaking: article.isBreaking || false,
              isFeatured: article.isFeatured || false,
              trendingTitle: article.trendingTitle || undefined,
            trendingTitleEn: article.trendingTitleEn || undefined
            } as NewsArticle;
          });

          // Translate if Hindi is selected
          return this.translateNewsIfNeeded(newsArticles);
        }
        return of([]);
      }),
      catchError(error => {
        console.error('Error fetching breaking news list:', error);
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
   * Excludes breaking news - breaking news should only appear in breaking news section
   */
  fetchSideNews(categories: string[] = ['Sports', 'Business']): Observable<NewsArticle[]> {
    const observables = categories.map(cat =>
      this.fetchFromBackend(cat, 1, undefined, true).pipe( // excludeBreaking = true
        map(articles => articles[0])
      )
    );
    return forkJoin(observables).pipe(
      map(articles => articles.filter(a => a !== undefined)),
      switchMap(news => {
        // Translate news if Hindi is selected
        return this.translateNewsIfNeeded(news);
      })
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
   * DISABLED: Fetch image based on headline using external APIs
   * This method is no longer used - application now uses database images only
   * Returns empty string to indicate no external image fetching
   */
  fetchImageForHeadline(headline: string, category: string): Observable<string> {
    // Image fetching from external APIs is disabled
    // All images should come from the database
    console.log(`Image fetching disabled - using database images only for: "${headline}"`);
    return of('');
  }

  /**
   * DISABLED: Intelligently fetch relevant image based on article title, category, and content
   * This method is no longer used - application now uses database images only
   */
  private fetchIntelligentImage(title: string, category: string, content: string): Observable<string> {
    // Image fetching from external APIs is disabled
    return of('');
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
   * DISABLED: Fetch image from Pexels API
   * This method is no longer used - application now uses database images only
   */
  private fetchFromPexels(query: string): Observable<string> {
    throw new Error('Pexels API is disabled - using database images only');
  }

  /**
   * DISABLED: Fetch image from Pixabay API
   * This method is no longer used - application now uses database images only
   */
  private fetchFromPixabay(query: string): Observable<string> {
    throw new Error('Pixabay API is disabled - using database images only');
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
      date: new Date().toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' }),
      isTrending: false,
      isBreaking: false,
      isFeatured: false
    };
  }
}
