import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { BehaviorSubject, Observable } from 'rxjs';
import { NewsArticle } from './news.service';
import { ScrollRestorationService } from './scroll-restoration.service';

@Injectable({
  providedIn: 'root'
})
export class ModalService {
  private modalState$ = new BehaviorSubject<{ isOpen: boolean; news: NewsArticle | null; isBreaking?: boolean }>({
    isOpen: false,
    news: null,
    isBreaking: false
  });
  private scrollPosition: number = 0;

  constructor(
    private scrollRestorationService: ScrollRestorationService,
    private router: Router
  ) {}

  openModal(news: NewsArticle, isBreaking: boolean = false): void {
    // Save scroll position BEFORE opening modal
    this.scrollPosition = window.pageYOffset || document.documentElement.scrollTop || document.body.scrollTop || 0;
    
    // Also save to scroll restoration service for route-based restoration (save for current route)
    const currentRoute = this.router.url || '/';
    if (this.scrollPosition > 0) {
      this.scrollRestorationService.saveScrollPosition(currentRoute);
      // Also save to sessionStorage as backup
      try {
        if (typeof window !== 'undefined' && window.sessionStorage) {
          sessionStorage.setItem('modal_scroll_position', this.scrollPosition.toString());
          sessionStorage.setItem('modal_scroll_route', currentRoute);
        }
      } catch (e) {
        console.warn('[ModalService] Could not save to sessionStorage:', e);
      }
    }
    console.log('[ModalService] Saved scroll position:', this.scrollPosition, 'for route:', currentRoute);
    
    this.modalState$.next({
      isOpen: true,
      news,
      isBreaking
    });
    // Prevent body scroll when modal is open (handled by component for better mobile support)
  }

  closeModal(): void {
    this.modalState$.next({
      isOpen: false,
      news: null,
      isBreaking: false
    });
    // Restore body scroll (handled by component for better mobile support)
  }

  getModalState(): Observable<{ isOpen: boolean; news: NewsArticle | null; isBreaking?: boolean }> {
    return this.modalState$.asObservable();
  }

  getScrollPosition(): number {
    return this.scrollPosition;
  }

  resetScrollPosition(): void {
    this.scrollPosition = 0;
  }
}

