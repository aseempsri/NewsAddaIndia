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
  private displayedIds = new Set<string | number>();
  private displayedIdsSubject = new BehaviorSubject<Set<string | number>>(new Set());
  public displayedIds$: Observable<Set<string | number>> = this.displayedIdsSubject.asObservable();

  /**
   * Register an article as displayed
   */
  registerDisplayed(articleId: string | number): void {
    if (articleId) {
      this.displayedIds.add(articleId);
      this.displayedIdsSubject.next(new Set(this.displayedIds));
    }
  }

  /**
   * Register multiple articles as displayed
   */
  registerDisplayedMultiple(articleIds: (string | number)[]): void {
    articleIds.forEach(id => {
      if (id) {
        this.displayedIds.add(id);
      }
    });
    this.displayedIdsSubject.next(new Set(this.displayedIds));
  }

  /**
   * Check if an article has been displayed
   */
  isDisplayed(articleId: string | number): boolean {
    return this.displayedIds.has(articleId);
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
  getDisplayedIds(): Set<string | number> {
    return new Set(this.displayedIds);
  }
}

