import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, forkJoin } from 'rxjs';
import { TranslationService } from './translation.service';

export type Language = 'en' | 'hi';

export interface Translations {
  // Header
  home: string;
  national: string;
  international: string;
  politics: string;
  health: string;
  entertainment: string;
  sports: string;
  business: string;
  religious: string;
  subscribe: string;
  readers: string;
  delhiIndia: string;
  
  // Common
  readMore: string;
  breaking: string;
  category: string;
  by: string;
  ago: string;
  hours: string;
  minutes: string;
  days: string;
  
  // Footer
  yourDailyNewsCompanion: string;
  categories: string;
  company: string;
  contactUs: string;
  newDelhiIndia: string;
  allRightsReserved: string;
  privacy: string;
  terms: string;
  cookies: string;
  
  // Sidebar
  subscribeToNewsletter: string;
  subscribeDescription: string;
  subscribeNow: string;
  
  // Admin
  adminLogin: string;
  username: string;
  password: string;
  login: string;
  logout: string;
  createPost: string;
  reviewPosts: string;
  reviewUnpublishedPosts: string;
  reviewLivePosts: string;
  
  // Other
  loading: string;
  noNewsFound: string;
  latestStories: string;
  stayUpdated: string;
  viewAll: string;
  viewAllStories: string;
  loadingImage: string;
  more: string;
  mostPopular: string;
  stayInformed: string;
  enterYourEmail: string;
  news: string;
  latestUpdatesFrom: string;
  back: string;
  tags: string;
  share: string;
  notFound: string;
}

const translations: Record<Language, Translations> = {
  en: {
    home: 'Home',
    national: 'National',
    international: 'International',
    politics: 'Politics',
    health: 'Health',
    entertainment: 'Entertainment',
    sports: 'Sports',
    business: 'Business',
    religious: 'Religious',
    subscribe: 'Subscribe',
    readers: 'Readers',
    delhiIndia: 'Delhi, India',
    readMore: 'Read more',
    breaking: 'BREAKING',
    category: 'Category',
    by: 'By',
    ago: 'ago',
    hours: 'hours',
    minutes: 'minutes',
    days: 'days',
    yourDailyNewsCompanion: 'Your Daily News Companion',
    categories: 'Categories',
    company: 'Company',
    contactUs: 'Contact Us',
    newDelhiIndia: 'New Delhi, India',
    allRightsReserved: 'All rights reserved.',
    privacy: 'Privacy',
    terms: 'Terms',
    cookies: 'Cookies',
    subscribeToNewsletter: 'Subscribe to Newsletter',
    subscribeDescription: 'Subscribe to our newsletter for daily news updates delivered to your inbox.',
    subscribeNow: 'Subscribe Now',
    adminLogin: 'Admin Login',
    username: 'Username',
    password: 'Password',
    login: 'Login',
    logout: 'Logout',
    createPost: 'Create Post',
    reviewPosts: 'Review Posts',
    reviewUnpublishedPosts: 'Review Unpublished Posts',
    reviewLivePosts: 'Review Live Posts',
    loading: 'Loading',
    noNewsFound: 'No news found',
    latestStories: 'Latest Stories',
    stayUpdated: 'Stay updated with the latest news',
    viewAll: 'View All',
    viewAllStories: 'View All Stories',
    loadingImage: 'Loading image...',
    more: 'More',
    mostPopular: 'Most Popular',
    stayInformed: 'Stay Informed',
    enterYourEmail: 'Enter your email',
    news: 'News',
    latestUpdatesFrom: 'Latest updates from',
    back: 'Back',
    tags: 'Tags',
    share: 'Share',
    notFound: 'Article not found'
  },
  hi: {
    home: 'होम',
    national: 'राष्ट्रीय',
    international: 'अंतर्राष्ट्रीय',
    politics: 'राजनीति',
    health: 'स्वास्थ्य',
    entertainment: 'मनोरंजन',
    sports: 'खेल',
    business: 'व्यापार',
    religious: 'धार्मिक',
    subscribe: 'सदस्यता लें',
    readers: 'पाठक',
    delhiIndia: 'दिल्ली, भारत',
    readMore: 'और पढ़ें',
    breaking: 'ताज़ा खबर',
    category: 'श्रेणी',
    by: 'द्वारा',
    ago: 'पहले',
    hours: 'घंटे',
    minutes: 'मिनट',
    days: 'दिन',
    yourDailyNewsCompanion: 'आपका दैनिक समाचार साथी',
    categories: 'श्रेणियां',
    company: 'कंपनी',
    contactUs: 'संपर्क करें',
    newDelhiIndia: 'नई दिल्ली, भारत',
    allRightsReserved: 'सभी अधिकार सुरक्षित।',
    privacy: 'गोपनीयता',
    terms: 'नियम',
    cookies: 'कुकीज़',
    subscribeToNewsletter: 'न्यूज़लेटर की सदस्यता लें',
    subscribeDescription: 'दैनिक समाचार अपडेट के लिए हमारे न्यूज़लेटर की सदस्यता लें।',
    subscribeNow: 'अभी सदस्यता लें',
    adminLogin: 'एडमिन लॉगिन',
    username: 'उपयोगकर्ता नाम',
    password: 'पासवर्ड',
    login: 'लॉगिन',
    logout: 'लॉगआउट',
    createPost: 'पोस्ट बनाएं',
    reviewPosts: 'पोस्ट समीक्षा करें',
    reviewUnpublishedPosts: 'अप्रकाशित पोस्ट समीक्षा करें',
    reviewLivePosts: 'लाइव पोस्ट समीक्षा करें',
    loading: 'लोड हो रहा है',
    noNewsFound: 'कोई समाचार नहीं मिला',
    latestStories: 'ताज़ा कहानियां',
    stayUpdated: 'नवीनतम समाचार के साथ अपडेट रहें',
    viewAll: 'सभी देखें',
    viewAllStories: 'सभी कहानियां देखें',
    loadingImage: 'छवि लोड हो रही है',
    more: 'अधिक',
    mostPopular: 'सबसे लोकप्रिय',
    stayInformed: 'सूचित रहें',
    enterYourEmail: 'अपना ईमेल दर्ज करें',
    news: 'समाचार',
    latestUpdatesFrom: 'से नवीनतम अपडेट',
    back: 'वापस',
    tags: 'टैग',
    share: 'साझा करें',
    notFound: 'लेख नहीं मिला'
  }
};

@Injectable({
  providedIn: 'root'
})
export class LanguageService {
  private currentLanguageSubject = new BehaviorSubject<Language>(
    (localStorage.getItem('language') as Language) || 'en'
  );
  public currentLanguage$: Observable<Language> = this.currentLanguageSubject.asObservable();

  constructor(private translationService: TranslationService) {
    // Initialize language from localStorage or default to English
    const savedLanguage = localStorage.getItem('language') as Language;
    if (savedLanguage && (savedLanguage === 'en' || savedLanguage === 'hi')) {
      this.currentLanguageSubject.next(savedLanguage);
    }
  }

  getCurrentLanguage(): Language {
    return this.currentLanguageSubject.value;
  }

  setLanguage(language: Language): void {
    console.log('[LanguageService] ===== setLanguage() CALLED =====');
    console.log('[LanguageService] Setting language to:', language);
    const previousLang = this.currentLanguageSubject.value;
    console.log('[LanguageService] Previous language was:', previousLang);
    
    try {
      localStorage.setItem('language', language);
      console.log('[LanguageService] Saved to localStorage');
      
      console.log('[LanguageService] Calling currentLanguageSubject.next(', language, ')');
      this.currentLanguageSubject.next(language);
      
      const newLang = this.currentLanguageSubject.value;
      console.log('[LanguageService] Language changed successfully. New value:', newLang);
      console.log('[LanguageService] BehaviorSubject value after change:', this.currentLanguageSubject.value);
      console.log('[LanguageService] ===== setLanguage() COMPLETE =====');
    } catch (error) {
      console.error('[LanguageService] ERROR in setLanguage:', error);
    }
  }

  translate(key: keyof Translations): string {
    const lang = this.currentLanguageSubject.value;
    return translations[lang][key] || translations.en[key] || key;
  }

  getTranslations(): Translations {
    return translations[this.currentLanguageSubject.value];
  }

  /**
   * Get the appropriate title based on current language
   * Returns titleEn for English, title (Hindi) for Hindi
   */
  getDisplayTitle(title: string, titleEn?: string): string {
    const lang = this.currentLanguageSubject.value;
    if (lang === 'hi') {
      return title; // Hindi title
    } else {
      return titleEn || title; // English title, fallback to title if titleEn doesn't exist
    }
  }

  /**
   * Get the appropriate summary based on current language
   * Returns summaryEn for English, summary (Hindi) for Hindi
   */
  getDisplaySummary(summary: string, summaryEn?: string): string {
    const lang = this.currentLanguageSubject.value;
    if (lang === 'hi') {
      return summary || ''; // Hindi summary
    } else {
      return summaryEn || summary || ''; // English summary, fallback to summary if summaryEn doesn't exist
    }
  }

  /**
   * Get the appropriate excerpt based on current language
   * Returns excerptEn for English, excerpt (Hindi) for Hindi
   */
  getDisplayExcerpt(excerpt: string, excerptEn?: string): string {
    const lang = this.currentLanguageSubject.value;
    if (lang === 'hi') {
      return excerpt || ''; // Hindi excerpt
    } else {
      return excerptEn || excerpt || ''; // English excerpt, fallback to excerpt if excerptEn doesn't exist
    }
  }

  /**
   * Get the appropriate trending title based on current language
   * Returns trendingTitleEn for English, trendingTitle (Hindi) for Hindi
   */
  getDisplayTrendingTitle(trendingTitle: string, trendingTitleEn?: string): string {
    const lang = this.currentLanguageSubject.value;
    if (lang === 'hi') {
      return trendingTitle || ''; // Hindi trending title
    } else {
      return trendingTitleEn || trendingTitle || ''; // English trending title, fallback to trendingTitle if trendingTitleEn doesn't exist
    }
  }

  /**
   * Get the appropriate content based on current language
   * Returns contentEn for English, content (Hindi) for Hindi
   */
  getDisplayContent(content: string, contentEn?: string): string {
    const lang = this.currentLanguageSubject.value;
    if (lang === 'hi') {
      return content || ''; // Hindi content
    } else {
      return contentEn || content || ''; // English content, fallback to content if contentEn doesn't exist
    }
  }

  /**
   * Translate category name based on current language
   */
  translateCategory(category: string): string {
    const t = this.getTranslations();
    const categoryMap: Record<string, keyof Translations> = {
      'National': 'national',
      'International': 'international',
      'Politics': 'politics',
      'Health': 'health',
      'Entertainment': 'entertainment',
      'Sports': 'sports',
      'Business': 'business',
      'Religious': 'religious',
    };
    const key = categoryMap[category];
    return key ? t[key] : category;
  }

  // Translation cache to avoid repeated API calls
  private translationCache: Map<string, string> = new Map();
  private readonly CACHE_PREFIX = 'translation_cache_';

  /**
   * Check if text contains Hindi/Devanagari script
   */
  private isHindi(text: string): boolean {
    return /[\u0900-\u097F]/.test(text);
  }

  /**
   * Generate cache key for translation
   */
  private getCacheKey(text: string, sourceLang: string, targetLang: string): string {
    return `${sourceLang}_${targetLang}_${text}`;
  }

  /**
   * Get cached translation or null
   */
  private getCachedTranslation(text: string, sourceLang: string, targetLang: string): string | null {
    const cacheKey = this.getCacheKey(text, sourceLang, targetLang);
    
    // Check in-memory cache
    if (this.translationCache.has(cacheKey)) {
      return this.translationCache.get(cacheKey) || null;
    }
    
    // Check localStorage cache
    try {
      const localStorageKey = `${this.CACHE_PREFIX}${this.hashString(cacheKey)}`;
      const cached = localStorage.getItem(localStorageKey);
      if (cached) {
        this.translationCache.set(cacheKey, cached);
        return cached;
      }
    } catch (e) {
      // localStorage might be full or unavailable
    }
    
    return null;
  }

  /**
   * Store translation in cache
   */
  private setCachedTranslation(text: string, translated: string, sourceLang: string, targetLang: string): void {
    const cacheKey = this.getCacheKey(text, sourceLang, targetLang);
    this.translationCache.set(cacheKey, translated);
    
    try {
      const localStorageKey = `${this.CACHE_PREFIX}${this.hashString(cacheKey)}`;
      localStorage.setItem(localStorageKey, translated);
    } catch (e) {
      // localStorage might be full, just use in-memory cache
    }
  }

  /**
   * Simple hash function for cache keys
   */
  private hashString(str: string): string {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash).toString(36);
  }

  /**
   * Translate text using Google Translate API
   */
  async translateText(text: string, sourceLang: 'en' | 'hi', targetLang: 'en' | 'hi'): Promise<string> {
    console.log('[LanguageService] translateText called:', { text: text.substring(0, 50) + '...', sourceLang, targetLang });
    if (!text || text.trim() === '') return text;
    
    // If source and target are the same, return original
    if (sourceLang === targetLang) {
      console.log('[LanguageService] Source and target languages are the same, returning original');
      return text;
    }
    
    // Check cache first
    const cached = this.getCachedTranslation(text, sourceLang, targetLang);
    if (cached) {
      console.log('[LanguageService] Using cached translation');
      return cached;
    }

    console.log('[LanguageService] Calling Google Translate API...');
    try {
      // Use Google Translate API (free tier)
      const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=${sourceLang}&tl=${targetLang}&dt=t&q=${encodeURIComponent(text)}`;
      console.log('[LanguageService] Translation URL:', url.substring(0, 100) + '...');
      const response = await fetch(url);
      
      console.log('[LanguageService] Translation response status:', response.status);
      if (response.ok) {
        const data = await response.json();
        console.log('[LanguageService] Translation response data:', data);
        if (data && data[0] && Array.isArray(data[0])) {
          // Google Translate returns an array of translation segments
          // Each segment is: [translatedText, originalText, ...]
          // We need to concatenate all segments
          const translatedSegments: string[] = [];
          for (const segment of data[0]) {
            if (segment && segment[0] && typeof segment[0] === 'string') {
              translatedSegments.push(segment[0]);
            }
          }
          
          if (translatedSegments.length > 0) {
            const translated = translatedSegments.join('');
            console.log('[LanguageService] Translated text:', translated.substring(0, 50) + '...');
            // Cache the translation
            this.setCachedTranslation(text, translated, sourceLang, targetLang);
            return translated;
          }
        }
      } else {
        console.error('[LanguageService] Translation API error - response not OK:', response.status, response.statusText);
      }
    } catch (error) {
      console.error('[LanguageService] Translation API error:', error);
    }

    // Fallback: Return original text if translation fails
    console.warn('[LanguageService] Returning original text as fallback');
    return text;
  }

  /**
   * Translate English text to Hindi
   * Uses Google Translate API or fallback translation
   */
  async translateToHindi(text: string): Promise<string> {
    if (!text || text.trim() === '') return text;
    
    // Check if already in Hindi
    if (this.isHindi(text)) {
      return text; // Already in Hindi
    }

    return this.translateText(text, 'en', 'hi');
  }

  /**
   * Translate Hindi text to English
   */
  async translateToEnglish(text: string): Promise<string> {
    if (!text || text.trim() === '') return text;
    
    // Check if already in English (not Hindi)
    if (!this.isHindi(text)) {
      return text; // Already in English
    }

    return this.translateText(text, 'hi', 'en');
  }

  /**
   * Translate text based on current language preference
   * If current language is Hindi and text is English, translate to Hindi
   * If current language is English and text is Hindi, translate to English
   */
  async translateToCurrentLanguage(text: string): Promise<string> {
    console.log('[LanguageService] translateToCurrentLanguage called:', { text: text.substring(0, 50) + '...' });
    if (!text || text.trim() === '') return text;
    
    const currentLang = this.getCurrentLanguage();
    const isTextHindi = this.isHindi(text);
    console.log('[LanguageService] Current language:', currentLang, 'Text is Hindi:', isTextHindi);
    
    if (currentLang === 'hi' && !isTextHindi) {
      // Current language is Hindi, text is English - translate to Hindi
      console.log('[LanguageService] Translating English to Hindi');
      return this.translateToHindi(text);
    } else if (currentLang === 'en' && isTextHindi) {
      // Current language is English, text is Hindi - translate to English
      console.log('[LanguageService] Translating Hindi to English');
      return this.translateToEnglish(text);
    }
    
    // Text is already in the correct language
    console.log('[LanguageService] Text is already in correct language, returning original');
    return text;
  }

  /**
   * Translate multiple texts in parallel
   */
  async translateMultiple(texts: string[], sourceLang: 'en' | 'hi', targetLang: 'en' | 'hi'): Promise<string[]> {
    const translationPromises = texts.map(text => this.translateText(text, sourceLang, targetLang));
    return Promise.all(translationPromises);
  }

  /**
   * Translate multiple texts to Hindi in parallel
   */
  async translateMultipleToHindi(texts: string[]): Promise<string[]> {
    return this.translateMultiple(texts, 'en', 'hi');
  }
}

