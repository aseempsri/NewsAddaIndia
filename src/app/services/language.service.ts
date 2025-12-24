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
    latestUpdatesFrom: 'Latest updates from'
  },
  hi: {
    stayUpdated: 'नवीनतम समाचार के साथ अपडेट रहें',
    viewAll: 'सभी देखें',
    viewAllStories: 'सभी कहानियां देखें',
    loadingImage: 'छवि लोड हो रही है'
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
    latestUpdatesFrom: 'से नवीनतम अपडेट'
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
    localStorage.setItem('language', language);
    this.currentLanguageSubject.next(language);
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
    };
    const key = categoryMap[category];
    return key ? t[key] : category;
  }

  /**
   * Translate English text to Hindi
   * Uses Google Translate API or fallback translation
   */
  async translateToHindi(text: string): Promise<string> {
    if (!text || text.trim() === '') return text;
    
    // Check if already in Hindi (contains Devanagari script)
    if (/[\u0900-\u097F]/.test(text)) {
      return text; // Already in Hindi
    }

    try {
      // Try using Google Translate API (free tier available)
      const response = await fetch(
        `https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl=hi&dt=t&q=${encodeURIComponent(text)}`
      );
      
      if (response.ok) {
        const data = await response.json();
        if (data && data[0] && data[0][0] && data[0][0][0]) {
          return data[0][0][0];
        }
      }
    } catch (error) {
      console.warn('Translation API error, using fallback:', error);
    }

    // Fallback: Return original text if translation fails
    return text;
  }

  /**
   * Translate multiple texts to Hindi in parallel
   */
  async translateMultipleToHindi(texts: string[]): Promise<string[]> {
    const translationPromises = texts.map(text => this.translateToHindi(text));
    return Promise.all(translationPromises);
  }
}

