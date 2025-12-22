import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { NewsArticle } from './news.service';

@Injectable({
  providedIn: 'root'
})
export class ModalService {
  private modalState$ = new BehaviorSubject<{ isOpen: boolean; news: NewsArticle | null; isBreaking?: boolean }>({
    isOpen: false,
    news: null,
    isBreaking: false
  });

  openModal(news: NewsArticle, isBreaking: boolean = false): void {
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
}

