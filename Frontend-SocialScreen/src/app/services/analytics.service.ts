import { Injectable } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';

declare let gtag: Function;

@Injectable({
  providedIn: 'root'
})
export class AnalyticsService {
  // Google Analytics Measurement ID
  private measurementId: string = 'G-FFVXQ7ZP5G';

  constructor(private router: Router) {
    // Track page views on route changes
    this.router.events
      .pipe(filter(event => event instanceof NavigationEnd))
      .subscribe((event: NavigationEnd) => {
        this.trackPageView(event.urlAfterRedirects);
      });
  }

  /**
   * Initialize Google Analytics
   */
  initialize(): void {
    if (typeof gtag !== 'undefined') {
      gtag('config', this.measurementId, {
        page_path: window.location.pathname,
        page_title: document.title,
        page_location: window.location.href
      });
    }
  }

  /**
   * Track page view
   */
  trackPageView(url: string): void {
    if (typeof gtag !== 'undefined') {
      gtag('config', this.measurementId, {
        page_path: url,
        page_title: document.title,
        page_location: window.location.origin + url
      });
    }
  }

  /**
   * Track custom event
   */
  trackEvent(eventName: string, eventParams?: any): void {
    if (typeof gtag !== 'undefined') {
      gtag('event', eventName, eventParams);
    }
  }

  /**
   * Track news article view
   */
  trackNewsView(articleId: string, articleTitle: string, category: string): void {
    this.trackEvent('view_article', {
      article_id: articleId,
      article_title: articleTitle,
      category: category,
      content_type: 'news_article'
    });
  }

  /**
   * Track news share
   */
  trackNewsShare(articleId: string, shareMethod: string): void {
    this.trackEvent('share_article', {
      article_id: articleId,
      method: shareMethod // 'whatsapp', 'facebook', 'twitter', etc.
    });
  }

  /**
   * Track category view
   */
  trackCategoryView(category: string): void {
    this.trackEvent('view_category', {
      category: category
    });
  }

  /**
   * Track search
   */
  trackSearch(searchTerm: string, resultsCount?: number): void {
    this.trackEvent('search', {
      search_term: searchTerm,
      results_count: resultsCount
    });
  }

  /**
   * Track language change
   */
  trackLanguageChange(language: string): void {
    this.trackEvent('language_change', {
      language: language
    });
  }

  /**
   * Track video play
   */
  trackVideoPlay(videoId: string, videoTitle: string): void {
    this.trackEvent('video_play', {
      video_id: videoId,
      video_title: videoTitle
    });
  }

  /**
   * Track ad click
   */
  trackAdClick(adId: string, adPosition: string): void {
    this.trackEvent('ad_click', {
      ad_id: adId,
      ad_position: adPosition
    });
  }

  /**
   * Track newsletter subscription
   */
  trackNewsletterSubscribe(email: string): void {
    this.trackEvent('newsletter_subscribe', {
      email: email // Note: Consider hashing email for privacy
    });
  }

  /**
   * Track breaking news view
   */
  trackBreakingNewsView(articleId: string): void {
    this.trackEvent('view_breaking_news', {
      article_id: articleId,
      content_type: 'breaking_news'
    });
  }
}
