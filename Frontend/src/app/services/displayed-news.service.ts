import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

/**
 * Service to track which news articles have been displayed on the home page
 * to prevent duplicates across different sections (Breaking News, Latest Stories, Category sections)
 */
@Injectable({
  providedIn: 'root'
})
export class DisplayedNewsService {
  // Store IDs as strings for consistent comparison (normalize numbers to strings)
  private displayedIds = new Set<string>();
  private displayedIdsSubject = new BehaviorSubject<Set<string>>(new Set());
  public displayedIds$: Observable<Set<string>> = this.displayedIdsSubject.asObservable();

  /**
   * Normalize ID to string for consistent comparison
   * This ensures "123" and 123 are treated as the same ID
   */
  private normalizeId(id: string | number): string {
    return typeof id === 'string' ? id : id.toString();
  }

  /**
   * Register an article as displayed
   */
  registerDisplayed(articleId: string | number): void {
    if (articleId) {
      const normalizedId = this.normalizeId(articleId);
      this.displayedIds.add(normalizedId);
      this.displayedIdsSubject.next(new Set(this.displayedIds));
    }
  }

  /**
   * Register multiple articles as displayed
   */
  registerDisplayedMultiple(articleIds: (string | number)[]): void {
    articleIds.forEach(id => {
      if (id) {
        const normalizedId = this.normalizeId(id);
        this.displayedIds.add(normalizedId);
      }
    });
    this.displayedIdsSubject.next(new Set(this.displayedIds));
  }

  /**
   * Check if an article has been displayed
   */
  isDisplayed(articleId: string | number): boolean {
    const normalizedId = this.normalizeId(articleId);
    return this.displayedIds.has(normalizedId);
  }

  /**
   * Filter out already displayed articles from an array
   */
  filterDisplayed<T extends { id?: string | number }>(articles: T[]): T[] {
    return articles.filter(article => {
      if (!article.id) return true; // Include articles without IDs
      return !this.isDisplayed(article.id);
    });
  }

  /**
   * Clear all displayed articles (useful when navigating away from home page)
   */
  clear(): void {
    this.displayedIds.clear();
    this.displayedIdsSubject.next(new Set());
  }

  /**
   * Get all displayed article IDs
   */
  getDisplayedIds(): Set<string> {
    return new Set(this.displayedIds);
  }
}

