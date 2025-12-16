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
  private apiKey: string = '';
  private newsApiKey: string = ''; // NewsAPI.org key
  private openaiUrl = 'https://api.openai.com/v1/chat/completions';
  private newsApiUrl = 'https://newsapi.org/v2/top-headlines';
  private pexelsUrl = 'https://api.pexels.com/v1/search';
  private pexelsApiKey = ''; // Optional: Get from pexels.com/api
  private bingImageSearchUrl = 'https://api.bing.microsoft.com/v7.0/images/search';
  private bingApiKey = ''; // Optional: Get from Azure Cognitive Services
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
    this.apiKey = environment.openaiApiKey || localStorage.getItem('openai_api_key') || '';
    this.newsApiKey = localStorage.getItem('newsapi_key') || '';
    this.pexelsApiKey = localStorage.getItem('pexels_api_key') || '';
    this.bingApiKey = localStorage.getItem('bing_api_key') || '';
  }

  setApiKey(key: string): void {
    this.apiKey = key;
    localStorage.setItem('openai_api_key', key);
  }

  setNewsApiKey(key: string): void {
    this.newsApiKey = key;
    localStorage.setItem('newsapi_key', key);
  }

  setPexelsApiKey(key: string): void {
    this.pexelsApiKey = key;
    localStorage.setItem('pexels_api_key', key);
  }

  setBingApiKey(key: string): void {
    this.bingApiKey = key;
    localStorage.setItem('bing_api_key', key);
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
   * Fetch image using OpenAI/ChatGPT based on headline only
   * This method uses the headline to generate perfect image search queries
   * Returns empty string if no image found (to show loading instead of placeholder)
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

    // Use OpenAI to generate search query from headline
    return this.generateImageSearchQueryWithOpenAI(headline, category, '').pipe(
      switchMap(searchQuery => {
        console.log(`Generated search query: "${searchQuery}"`);
        // Try multiple image sources in order of preference
        return this.fetchFromBingImageSearch(searchQuery).pipe(
          catchError(() => {
            console.log(`Bing search failed, trying Pixabay...`);
            return this.fetchFromPixabay(searchQuery);
          }),
          catchError(() => {
            console.log(`Pixabay search failed, trying Pexels...`);
            return this.fetchFromPexels(searchQuery);
          }),
          catchError(() => {
            console.log(`All image sources failed for: "${searchQuery}"`);
            // Return placeholder image as last resort to ensure images always show
            const placeholder = this.getPlaceholderImage(searchQuery);
            return of(placeholder);
          }),
          tap(imageUrl => {
            // Cache successful images (but not placeholders)
            if (imageUrl && imageUrl.trim() !== '' && !imageUrl.includes('picsum.photos')) {
              localStorage.setItem(cacheKey, imageUrl);
            }
          })
        );
      }),
      catchError(() => {
        console.log(`OpenAI query generation failed, using basic query...`);
        // Fallback to basic query if OpenAI fails
        const basicQuery = this.createIntelligentImageQuery(headline, category, '');
        return this.fetchFromBingImageSearch(basicQuery).pipe(
          catchError(() => this.fetchFromPixabay(basicQuery)),
          catchError(() => this.fetchFromPexels(basicQuery)),
          catchError(() => {
            // Always return a placeholder image as last resort
            const placeholder = this.getPlaceholderImage(basicQuery);
            return of(placeholder);
          })
        );
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

    // Use OpenAI to generate intelligent image search query
    return this.generateImageSearchQueryWithOpenAI(title, category, content).pipe(
      switchMap(searchQuery => {
        // Generate alternative queries for better matching
        const alternativeQuery = this.createIntelligentImageQuery(title, category, content);

        // Try multiple search strategies in order of preference
        // Priority: Bing (news images) > Pixabay > Pexels > Alternative query > Placeholder
        return this.fetchFromBingImageSearch(searchQuery).pipe(
          catchError(() => this.fetchFromPixabay(searchQuery)),
          catchError(() => this.fetchFromPexels(searchQuery)),
          catchError(() => this.fetchFromBingImageSearch(alternativeQuery)),
          catchError(() => this.fetchFromPixabay(alternativeQuery)),
          catchError(() => of(this.getPlaceholderImage(searchQuery))),
          tap(imageUrl => {
            // Cache the image URL
            if (imageUrl && imageUrl !== this.getPlaceholderImage(searchQuery)) {
              localStorage.setItem(cacheKey, imageUrl);
            }
          })
        );
      }),
      catchError(() => {
        // Fallback to basic query if OpenAI fails
        const basicQuery = this.createIntelligentImageQuery(title, category, content);
        return this.fetchFromBingImageSearch(basicQuery).pipe(
          catchError(() => this.fetchFromPixabay(basicQuery)),
          catchError(() => this.fetchFromPexels(basicQuery)),
          catchError(() => of(this.getPlaceholderImage(basicQuery)))
        );
      })
    );
  }

  /**
   * Use OpenAI to generate intelligent image search query from news article
   * Enhanced to find perfect news-related images
   */
  private generateImageSearchQueryWithOpenAI(title: string, category: string, content: string): Observable<string> {
    if (!this.apiKey) {
      // Fallback to basic query generation if OpenAI key not available
      return of(this.createIntelligentImageQuery(title, category, content));
    }

    // If content is empty, focus only on headline
    const isHeadlineOnly = !content || content.trim().length === 0;

    const prompt = isHeadlineOnly
      ? `You are analyzing a news headline to find the perfect related image. Be VERY SPECIFIC and extract key visual elements.

News Headline: "${title}"
Category: ${category}

Your task: Generate 3 different image search queries (one per line) that would find the most relevant, high-quality news images for this EXACT headline. 

CRITICAL: Extract the MAIN SUBJECT, KEY ENTITIES, and VISUAL ELEMENTS directly from the headline. Be specific about:
- People mentioned (names, titles, roles)
- Places mentioned (cities, countries, buildings, landmarks)
- Events mentioned (what happened, where, when)
- Organizations mentioned (companies, institutions, teams)

Each query should:
1. Extract the MAIN SUBJECT/ENTITY from the headline (person, place, event, organization)
2. Include SPECIFIC VISUAL ELEMENTS that would represent this EXACT news story
3. Be NEWS-SPECIFIC (prefer actual news photos over generic stock photos)
4. Include relevant context (location, event type, key people/organizations)

Priority order:
- Query 1: Most specific - main subject + key visual element + location/context (EXACT match to headline)
- Query 2: Alternative - different angle but still related to headline
- Query 3: Broader - category + main subject from headline

Examples:
Headline: "Supreme Court upholds women's reservation bill"
Queries:
Supreme Court of India building Delhi
Supreme Court judges India
women reservation India parliament

Headline: "India wins cricket World Cup final"
Queries:
India cricket team celebration World Cup
cricket stadium India match
Indian cricket players trophy

Headline: "PM Modi inaugurates new metro line in Mumbai"
Queries:
PM Modi Mumbai metro inauguration
Mumbai metro station opening
Narendra Modi metro launch India

Return ONLY the 3 queries, one per line, nothing else. No numbering, no explanations.`
      : `You are analyzing a news article to find the perfect related image. 

News Article Details:
Title: ${title}
Category: ${category}
Content: ${content.substring(0, 500)}

Your task: Generate 3 different image search queries (one per line) that would find the most relevant, high-quality news images for this article. Each query should:
1. Focus on the MAIN SUBJECT/ENTITY (person, place, event, organization)
2. Include SPECIFIC VISUAL ELEMENTS (buildings, people, locations, objects)
3. Be NEWS-SPECIFIC (prefer actual news photos over generic stock photos)
4. Include relevant context (location, event type, key people/organizations)

Priority order:
- Query 1: Most specific - main subject + key visual element + location/context
- Query 2: Alternative - different angle or related visual
- Query 3: Broader - category + main subject

Examples:
Article: "Supreme Court upholds women's reservation bill"
Queries:
Supreme Court of India building Delhi
Supreme Court judges India
women reservation India parliament

Article: "India wins cricket World Cup final"
Queries:
India cricket team celebration World Cup
cricket stadium India match
Indian cricket players trophy

Return ONLY the 3 queries, one per line, nothing else. No numbering, no explanations.`;

    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${this.apiKey}`
    });

    const body = {
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: 'You are an expert at analyzing news articles and generating precise image search queries. You return only search queries, one per line, nothing else.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      max_tokens: 150,
      temperature: 0.5
    };

    return this.http.post<any>(this.openaiUrl, body, { headers }).pipe(
      map(response => {
        const queriesText = response.choices?.[0]?.message?.content?.trim() || '';
        // Extract queries (one per line)
        const queries = queriesText
          .split('\n')
          .map(q => q.replace(/^\d+[\.\)]\s*/, '').replace(/["']/g, '').trim())
          .filter(q => q.length > 0)
          .slice(0, 3);

        // Return the first (most specific) query, or fallback
        return queries.length > 0 ? queries[0] : this.createIntelligentImageQuery(title, category, content);
      }),
      catchError(error => {
        console.error('OpenAI image query generation error:', error);
        // Fallback to basic query
        return of(this.createIntelligentImageQuery(title, category, content));
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
   * Fetch image from Bing Image Search API (similar to what ChatGPT uses)
   * Enhanced to prioritize news-related images
   */
  private fetchFromBingImageSearch(query: string): Observable<string> {
    if (!this.bingApiKey) {
      throw new Error('Bing API key not available');
    }

    // Add "news" to query to prioritize news images
    const newsQuery = `${query} news`.trim();
    const headers = new HttpHeaders().set('Ocp-Apim-Subscription-Key', this.bingApiKey);
    const url = `${this.bingImageSearchUrl}?q=${encodeURIComponent(newsQuery)}&count=10&imageType=Photo&size=Large&aspect=Wide&safeSearch=Moderate&freshness=Month`;

    return this.http.get<any>(url, { headers }).pipe(
      map(response => {
        if (response.value && response.value.length > 0) {
          // Priority 1: Images from known news sources
          const newsSources = ['news', 'times', 'indian', 'hindu', 'ndtv', 'bbc', 'reuters', 'ap', 'getty', 'afp'];
          const newsImage = response.value.find((img: any) => {
            const url = (img.hostPageDisplayUrl || '').toLowerCase();
            return newsSources.some(source => url.includes(source));
          });

          if (newsImage) {
            return newsImage.contentUrl;
          }

          // Priority 2: Images with news-related keywords in title/description
          const contextualImage = response.value.find((img: any) => {
            const title = (img.name || '').toLowerCase();
            const desc = (img.contentUrl || '').toLowerCase();
            return title.includes('news') || title.includes('breaking') ||
              desc.includes('news') || desc.includes('report');
          });

          if (contextualImage) {
            return contextualImage.contentUrl;
          }

          // Priority 3: First result (already filtered for news)
          return response.value[0].contentUrl;
        }
        throw new Error('No Bing Image Search results');
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
