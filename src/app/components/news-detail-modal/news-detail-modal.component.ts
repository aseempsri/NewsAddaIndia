import { Component, Input, Output, EventEmitter, OnInit, OnDestroy, HostListener, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NewsArticle } from '../../services/news.service';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-news-detail-modal',
  standalone: true,
  imports: [CommonModule],
  template: `
    @if (isOpen && news) {
      <!-- Backdrop -->
      <div 
        id="modal-backdrop"
        class="fixed inset-0 bg-black/60 backdrop-blur-sm z-[9998] animate-fade-in"
        (click)="close()"
        (touchend)="onBackdropTouch($event)"
        style="touch-action: none;">
      </div>

      <!-- Modal -->
      <div 
        class="fixed inset-0 z-[9999] flex items-center justify-center p-2 sm:p-4 pointer-events-none"
        (click)="close()">
        <div 
          class="glass-card max-w-4xl w-full max-h-[95vh] sm:max-h-[90vh] overflow-hidden flex flex-col pointer-events-auto animate-scale-in rounded-lg sm:rounded-xl"
          (click)="$event.stopPropagation()"
          (touchstart)="$event.stopPropagation()"
          (touchmove)="$event.stopPropagation()">
          
          <!-- Close Button -->
          <button
            (click)="close()"
            (touchend)="onCloseButtonTouch($event)"
            class="absolute top-2 right-2 sm:top-4 sm:right-4 z-10 p-2.5 sm:p-2 rounded-full bg-background/90 hover:bg-background active:bg-background/70 border border-border/50 transition-colors touch-manipulation min-w-[44px] min-h-[44px] flex items-center justify-center"
            aria-label="Close modal"
            type="button">
            <svg class="w-5 h-5 sm:w-5 sm:h-5 text-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>

          <!-- Image Header -->
          <div class="relative w-full aspect-[16/9] bg-secondary/20 overflow-hidden">
            @if (news.imageLoading || !news.image) {
              <div class="absolute inset-0 flex items-center justify-center bg-secondary/50">
                <div class="flex flex-col items-center gap-2">
                  <div class="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
                  <span class="text-sm text-muted-foreground">Loading image...</span>
                </div>
              </div>
            }
            @if (news.image && !news.imageLoading) {
              <img
                [src]="news.image"
                [alt]="news.title"
                class="w-full h-full object-cover" />
            }
            <div class="absolute inset-0 bg-gradient-to-t from-background via-background/50 to-transparent"></div>
            
            <!-- Category Badge -->
            <div class="absolute top-4 left-4 flex gap-2">
              @if (isBreaking) {
                <span class="px-3 py-1 text-xs font-semibold rounded-full bg-red-600 text-white animate-pulse">
                  BREAKING
                </span>
              }
              <span [class]="'px-3 py-1 text-xs font-semibold rounded-full ' + getCategoryColor(news.category)">
                {{ news.category }}
              </span>
            </div>
          </div>

          <!-- Content (Scrollable) -->
          <div class="flex-1 overflow-y-auto overscroll-contain -webkit-overflow-scrolling-touch" style="touch-action: pan-y;">
            <div class="p-4 sm:p-6 lg:p-8">
              <!-- Title -->
              <h1 class="font-display text-xl sm:text-2xl lg:text-4xl font-bold leading-tight mb-3 sm:mb-4 text-foreground">
                {{ news.titleEn || news.title }}
              </h1>

              <!-- Meta Information -->
              <div class="flex flex-wrap items-center gap-4 mb-6 text-sm text-muted-foreground border-b border-border/30 pb-4">
                <span class="flex items-center gap-1.5">
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  {{ news.author || 'News Adda India' }}
                </span>
                <span class="flex items-center gap-1.5">
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  {{ news.date || news.time }}
                </span>
              </div>

              <!-- Excerpt -->
              <p class="text-lg text-muted-foreground mb-6 leading-relaxed">
                {{ news.excerpt }}
              </p>

              <!-- Full Content -->
              <div class="prose prose-lg max-w-none text-foreground">
                <div [innerHTML]="getFormattedContent()" class="news-content"></div>
              </div>

              <!-- Tags (if available) -->
              @if (tags && tags.length > 0) {
                <div class="mt-8 pt-6 border-t border-border/30">
                  <div class="flex flex-wrap gap-2">
                    @for (tag of tags; track tag) {
                      <span class="px-3 py-1 text-xs bg-secondary rounded-md text-muted-foreground">
                        {{ tag }}
                      </span>
                    }
                  </div>
                </div>
              }
            </div>
          </div>

          <!-- Footer Actions -->
          <div class="p-4 sm:p-6 lg:p-8 border-t border-border/30 bg-secondary/20 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 sm:gap-0">
            <button
              (click)="close()"
              (touchend)="onCloseButtonTouch($event)"
              class="px-6 py-3 sm:py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 active:bg-primary/80 transition-colors font-medium touch-manipulation min-h-[44px] sm:min-h-0"
              type="button">
              Close
            </button>
            <button
              (click)="shareNews()"
              (touchend)="shareNews(); $event.stopPropagation()"
              class="px-6 py-3 sm:py-2 bg-secondary text-foreground rounded-lg hover:bg-secondary/80 active:bg-secondary/70 transition-colors font-medium flex items-center justify-center gap-2 touch-manipulation min-h-[44px] sm:min-h-0"
              type="button">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
              </svg>
              Share
            </button>
          </div>
        </div>
      </div>
    }
  `,
  styles: [`
    .news-content {
      line-height: 1.8;
    }
    .news-content p {
      margin-bottom: 1.5rem;
      color: hsl(var(--muted-foreground));
    }
    .news-content h2, .news-content h3 {
      margin-top: 2rem;
      margin-bottom: 1rem;
      font-weight: 700;
      color: hsl(var(--foreground));
    }
    .news-content img {
      max-width: 100%;
      height: auto;
      border-radius: 0.5rem;
      margin: 1.5rem 0;
    }
    @keyframes fade-in {
      from { opacity: 0; }
      to { opacity: 1; }
    }
    @keyframes scale-in {
      from { 
        opacity: 0;
        transform: scale(0.95);
      }
      to { 
        opacity: 1;
        transform: scale(1);
      }
    }
    .animate-fade-in {
      animation: fade-in 0.2s ease-out;
    }
    .animate-scale-in {
      animation: scale-in 0.3s ease-out;
    }
    .touch-manipulation {
      touch-action: manipulation;
      -webkit-tap-highlight-color: transparent;
    }
    /* Prevent scroll on backdrop */
    .fixed.inset-0 {
      touch-action: none;
    }
    /* Allow scroll in modal content */
    .overflow-y-auto {
      -webkit-overflow-scrolling: touch;
      touch-action: pan-y;
    }
    @media (max-width: 640px) {
      .news-content {
        font-size: 0.95rem;
        line-height: 1.7;
      }
      .news-content p {
        margin-bottom: 1.25rem;
      }
    }
  `]
})
export class NewsDetailModalComponent implements OnInit, OnDestroy, OnChanges {
  @Input() news: NewsArticle | null = null;
  @Input() isOpen: boolean = false;
  @Input() isBreaking: boolean = false;
  @Input() tags: string[] = [];
  @Output() closeModal = new EventEmitter<void>();

  fullContent: string = '';
  private apiUrl = environment.apiUrl || 'http://localhost:3000';
  private scrollPosition: number = 0;

  constructor(private http: HttpClient) {}

  ngOnInit() {
    if (this.news && this.isOpen) {
      this.loadFullContent();
    }
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['isOpen']) {
      if (this.isOpen) {
        this.preventBodyScroll();
        if (this.news) {
          this.loadFullContent();
        }
      } else {
        this.restoreBodyScroll();
      }
    }
    if (changes['news'] && this.news && this.isOpen) {
      this.loadFullContent();
    }
  }

  ngOnDestroy() {
    // Ensure body scroll is restored when component is destroyed
    this.restoreBodyScroll();
  }

  @HostListener('document:keydown.escape', ['$event'])
  handleEscapeKey(event: KeyboardEvent) {
    if (this.isOpen) {
      this.close();
    }
  }

  private preventBodyScroll() {
    // Save current scroll position
    this.scrollPosition = window.pageYOffset || document.documentElement.scrollTop || document.body.scrollTop || 0;
    
    // Prevent body scroll when modal is open
    // Use fixed position with negative top to maintain scroll position
    document.body.style.overflow = 'hidden';
    document.body.style.position = 'fixed';
    document.body.style.top = `-${this.scrollPosition}px`;
    document.body.style.width = '100%';
  }

  private restoreBodyScroll() {
    // Restore body scroll when modal is closed
    document.body.style.overflow = '';
    document.body.style.position = '';
    document.body.style.top = '';
    document.body.style.width = '';
    
    // Restore scroll position
    window.scrollTo(0, this.scrollPosition);
    
    // Reset scroll position variable
    this.scrollPosition = 0;
  }

  loadFullContent() {
    if (!this.news || !this.news.id) return;

    // Try to fetch full content from backend if news has an ID
    const newsId = typeof this.news.id === 'string' ? this.news.id : this.news.id.toString();
    
    // Check if it's a MongoDB ObjectId format
    if (newsId.length === 24 || newsId.match(/^[0-9a-fA-F]{24}$/)) {
      this.http.get<{ success: boolean; data: any }>(`${this.apiUrl}/api/news/${newsId}`).subscribe({
        next: (response) => {
          if (response.success && response.data) {
            this.fullContent = response.data.content || response.data.excerpt || this.news.excerpt;
            this.tags = response.data.tags || [];
          } else {
            this.fullContent = this.news.excerpt;
          }
        },
        error: () => {
          // Fallback to excerpt if API fails
          this.fullContent = this.news?.excerpt || '';
        }
      });
    } else {
      // Use excerpt as content for non-backend news
      this.fullContent = this.news.excerpt || '';
    }
  }

  getFormattedContent(): string {
    if (!this.fullContent) {
      return this.news?.excerpt || '';
    }
    
    // Convert line breaks to paragraphs
    return this.fullContent
      .split('\n\n')
      .map(paragraph => paragraph.trim())
      .filter(paragraph => paragraph.length > 0)
      .map(paragraph => `<p>${paragraph.replace(/\n/g, '<br>')}</p>`)
      .join('');
  }

  close() {
    this.restoreBodyScroll();
    this.closeModal.emit();
  }

  onBackdropTouch(event: TouchEvent) {
    // Only close if touching the backdrop directly (not modal content)
    const target = event.target as HTMLElement;
    if (target && (target.classList.contains('fixed') || target.id === 'modal-backdrop')) {
      // Check if touch is on backdrop, not modal content
      const modalContent = target.closest('.glass-card');
      if (!modalContent) {
        event.preventDefault();
        event.stopPropagation();
        this.close();
      }
    }
  }

  onCloseButtonTouch(event: TouchEvent) {
    event.preventDefault();
    event.stopPropagation();
    this.close();
  }

  shareNews() {
    if (navigator.share && this.news) {
      navigator.share({
        title: this.news.titleEn || this.news.title,
        text: this.news.excerpt,
        url: window.location.href
      }).catch(err => console.log('Error sharing:', err));
    } else {
      // Fallback: Copy to clipboard
      const text = `${this.news?.titleEn || this.news?.title}\n\n${this.news?.excerpt}\n\n${window.location.href}`;
      navigator.clipboard.writeText(text).then(() => {
        alert('News link copied to clipboard!');
      }).catch(err => console.log('Error copying:', err));
    }
  }

  getCategoryColor(category: string): string {
    const colors: Record<string, string> = {
      'National': 'bg-blue-500/20 text-blue-400',
      'International': 'bg-purple-500/20 text-purple-400',
      'Sports': 'bg-orange-500/20 text-orange-400',
      'Business': 'bg-yellow-500/20 text-yellow-400',
      'Entertainment': 'bg-pink-500/20 text-pink-400',
      'Health': 'bg-green-500/20 text-green-400',
      'Politics': 'bg-indigo-500/20 text-indigo-400'
    };
    return colors[category] || 'bg-primary/20 text-primary';
  }
}

