import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { map, catchError, timeout } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class TranslationService {
  // Using LibreTranslate API (free, no API key required for basic usage)
  // Alternative: MyMemory Translation API
  private translateApiUrl = 'https://libretranslate.de/translate';
  
  // Cache for translations to avoid repeated API calls
  private translationCache: Map<string, string> = new Map();
  private readonly CACHE_PREFIX = 'translation_cache_';

  constructor(private http: HttpClient) {
    // Load translation cache from localStorage
    this.loadCache();
  }

  /**
   * Translate text from English to Hindi
   */
  translateToHindi(text: string): Observable<string> {
    if (!text || text.trim() === '') {
      return of('');
    }

    // Check cache first
    const cacheKey = `en_hi_${text}`;
    const cached = this.translationCache.get(cacheKey);
    if (cached) {
      return of(cached);
    }

    // Check localStorage cache
    const localStorageKey = `${this.CACHE_PREFIX}${this.hashString(cacheKey)}`;
    const cachedTranslation = localStorage.getItem(localStorageKey);
    if (cachedTranslation) {
      this.translationCache.set(cacheKey, cachedTranslation);
      return of(cachedTranslation);
    }

    // Use LibreTranslate API
    return this.http.post<any>(this.translateApiUrl, {
      q: text,
      source: 'en',
      target: 'hi',
      format: 'text'
    }).pipe(
      timeout(5000), // 5 second timeout
      map(response => {
        const translatedText = response.translatedText || text;
        // Cache the translation
        this.translationCache.set(cacheKey, translatedText);
        localStorage.setItem(localStorageKey, translatedText);
        return translatedText;
      }),
      catchError(error => {
        console.warn('Translation API error, using fallback:', error);
        // Fallback: Try MyMemory API
        return this.translateWithMyMemory(text).pipe(
          catchError(() => {
            // If both fail, return original text
            console.warn('All translation APIs failed, returning original text');
            return of(text);
          })
        );
      })
    );
  }

  /**
   * Fallback translation using MyMemory API
   */
  private translateWithMyMemory(text: string): Observable<string> {
    const cacheKey = `en_hi_${text}`;
    const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=en|hi`;
    
    return this.http.get<any>(url).pipe(
      timeout(5000),
      map(response => {
        const translatedText = response.responseData?.translatedText || text;
        // Cache the translation
        this.translationCache.set(cacheKey, translatedText);
        const localStorageKey = `${this.CACHE_PREFIX}${this.hashString(cacheKey)}`;
        localStorage.setItem(localStorageKey, translatedText);
        return translatedText;
      })
    );
  }

  /**
   * Translate multiple texts in batch
   */
  translateBatchToHindi(texts: string[]): Observable<string[]> {
    if (!texts || texts.length === 0) {
      return of([]);
    }

    // Translate each text (with some delay to avoid rate limiting)
    const translations: Observable<string>[] = texts.map((text, index) => {
      return new Observable<string>(observer => {
        setTimeout(() => {
          this.translateToHindi(text).subscribe({
            next: (translated) => {
              observer.next(translated);
              observer.complete();
            },
            error: (err) => {
              observer.next(text); // Return original on error
              observer.complete();
            }
          });
        }, index * 100); // 100ms delay between requests
      });
    });

    // Use forkJoin to wait for all translations
    return new Observable(observer => {
      let completed = 0;
      const results: string[] = [];
      
      translations.forEach((obs, index) => {
        obs.subscribe({
          next: (translated) => {
            results[index] = translated;
            completed++;
            if (completed === texts.length) {
              observer.next(results);
              observer.complete();
            }
          },
          error: () => {
            results[index] = texts[index]; // Use original on error
            completed++;
            if (completed === texts.length) {
              observer.next(results);
              observer.complete();
            }
          }
        });
      });
    });
  }

  /**
   * Simple hash function for cache keys
   */
  private hashString(str: string): string {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    return Math.abs(hash).toString(36);
  }

  /**
   * Load cache from localStorage
   */
  private loadCache(): void {
    try {
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith(this.CACHE_PREFIX)) {
          const value = localStorage.getItem(key);
          if (value) {
            // Extract original text from hash (we'll store it differently)
            // For now, just load what we can
          }
        }
      }
    } catch (error) {
      console.warn('Error loading translation cache:', error);
    }
  }

  /**
   * Clear translation cache
   */
  clearCache(): void {
    this.translationCache.clear();
    try {
      const keysToRemove: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith(this.CACHE_PREFIX)) {
          keysToRemove.push(key);
        }
      }
      keysToRemove.forEach(key => localStorage.removeItem(key));
    } catch (error) {
      console.warn('Error clearing translation cache:', error);
    }
  }
}

