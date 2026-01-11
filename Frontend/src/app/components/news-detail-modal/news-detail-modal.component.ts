import { Component, Input, Output, EventEmitter, OnInit, OnDestroy, HostListener, OnChanges, SimpleChanges, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { NewsArticle } from '../../services/news.service';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { ModalService } from '../../services/modal.service';
import { ScrollRestorationService } from '../../services/scroll-restoration.service';
import { LanguageService } from '../../services/language.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-news-detail-modal',
  standalone: true,
  imports: [CommonModule],
  template: `
    @if (isOpen && news) {
      <!-- Backdrop -->
      <div 
        id="modal-backdrop"
        class="fixed left-0 right-0 bottom-0 bg-black/60 backdrop-blur-sm z-[10000] animate-fade-in"
        [style.top.px]="getModalTop()"
        (click)="close()"
        (touchend)="onBackdropTouch($event)"
        style="touch-action: none;">
      </div>

      <!-- Modal -->
      <div 
        class="modal-container fixed left-0 right-0 bottom-0 z-[10000] flex items-center justify-center p-2 sm:p-4 pointer-events-none overflow-y-auto"
        [style.top.px]="getModalTop()"
        (click)="close()">
        <div 
          class="glass-card max-w-4xl w-full h-full sm:h-auto max-h-[calc(100vh-64px)] sm:max-h-[calc(90vh-64px)] overflow-hidden flex flex-col pointer-events-auto animate-scale-in rounded-lg sm:rounded-xl"
          (click)="$event.stopPropagation()"
          (touchstart)="$event.stopPropagation()"
          (touchmove)="$event.stopPropagation()">
          
          <!-- Close Button -->
          <button
            (click)="close()"
            (touchend)="onCloseButtonTouch($event)"
            class="absolute top-2 right-2 sm:top-4 sm:right-4 z-10 p-2.5 sm:p-2 rounded-full bg-white dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 active:bg-gray-200 dark:active:bg-gray-600 border-2 border-gray-300 dark:border-gray-600 shadow-lg transition-all touch-manipulation min-w-[44px] min-h-[44px] flex items-center justify-center close-button-glow"
            aria-label="Close modal"
            type="button">
            <svg class="w-6 h-6 sm:w-6 sm:h-6 text-gray-800 dark:text-white close-icon-glow" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>

          <!-- Image Header -->
          <div class="relative w-full aspect-[16/9] bg-secondary/20 overflow-hidden flex-shrink-0">
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
            <div class="absolute top-4 left-4 flex gap-2 z-10">
              @if (isBreaking) {
                <span class="inline-flex items-center justify-center px-3 py-1 text-xs font-semibold rounded-full bg-red-600 text-white animate-pulse">
                  BREAKING
                </span>
              }
              <span [class]="'inline-flex items-center justify-center px-3 py-1 text-xs font-semibold rounded-full ' + getCategoryColor(news.category)">
                {{ news.category }}
              </span>
            </div>
          </div>

          <!-- Content (Scrollable) -->
          <div class="flex-1 overflow-y-auto overscroll-contain -webkit-overflow-scrolling-touch min-h-0" style="touch-action: pan-y;">
            <div class="p-4 sm:p-6 lg:p-8">
              <!-- Title -->
              <h1 [class]="'font-display text-xl sm:text-2xl lg:text-4xl font-bold dark:font-normal leading-relaxed mb-4 sm:mb-5 pt-3 pb-2 ' + (news.isTrending ? 'text-purple-700 dark:text-purple-300' : getHeadlineColor(news.category))">
                {{ getDisplayTitle() }}
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

              <!-- Full Content -->
              <div class="prose prose-lg max-w-none text-foreground mb-6">
                <div [innerHTML]="getFormattedContent()" class="news-content"></div>
              </div>

              <!-- Tags (if available) -->
              @if (tagsArray.length > 0) {
                <div class="mt-8 pt-6 border-t border-border/30">
                  <div class="flex flex-wrap gap-2">
                    @for (tag of tagsArray; track tag) {
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
          <div class="p-4 sm:p-6 lg:p-8 border-t border-border/30 bg-secondary/20">
            @if (news.id) {
              <button
                (click)="navigateToFullArticle(); $event.stopPropagation()"
                (touchend)="navigateToFullArticle(); $event.stopPropagation(); $event.preventDefault()"
                type="button"
                class="w-full px-4 sm:px-6 py-3 sm:py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 active:bg-primary/80 transition-colors font-medium flex items-center justify-center gap-2 touch-manipulation min-h-[44px]">
                <span>{{ t.readMore }}</span>
                <svg class="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                </svg>
              </button>
            }
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
    /* Glow effect for close button */
    .close-button-glow {
      box-shadow: 0 0 15px rgba(255, 255, 255, 0.5), 0 0 30px rgba(255, 255, 255, 0.3), 0 4px 6px rgba(0, 0, 0, 0.1);
    }
    .dark .close-button-glow {
      box-shadow: 0 0 20px rgba(255, 255, 255, 0.6), 0 0 40px rgba(255, 255, 255, 0.4), 0 4px 6px rgba(0, 0, 0, 0.3);
    }
    .close-icon-glow {
      filter: drop-shadow(0 0 4px rgba(255, 255, 255, 0.8)) drop-shadow(0 0 8px rgba(255, 255, 255, 0.5));
    }
    .dark .close-icon-glow {
      filter: drop-shadow(0 0 6px rgba(255, 255, 255, 0.9)) drop-shadow(0 0 12px rgba(255, 255, 255, 0.6));
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
    /* Modal positioning - below navigation bar on desktop */
    @media (min-width: 1024px) {
      .modal-container {
        align-items: flex-start !important;
        padding-top: 1rem !important;
      }
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
  translatedContent: string = '';
  translatedTitle: string = '';
  translatedExcerpt: string = '';
  isTranslating: boolean = false;
  showFullContent: boolean = false;
  t: any = {};
  private apiUrl = environment.apiUrl || 'http://localhost:3000';
  private languageSubscription?: Subscription;
  private modalSubscription?: Subscription;
  
  // Initialize tags as empty array if not provided
  get tagsArray(): string[] {
    return this.tags || [];
  }

  constructor(
    private http: HttpClient,
    private modalService: ModalService,
    private scrollRestorationService: ScrollRestorationService,
    private languageService: LanguageService,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {
    this.updateTranslations();
  }

  ngOnInit() {
    this.updateTranslations();
    if (this.news && this.isOpen) {
      this.loadFullContent();
      // Translate after content is loaded
      setTimeout(() => this.translateContent(), 100);
    }
    // Subscribe to language changes
    console.log('[NewsDetailModal] Subscribing to language changes...');
    this.languageSubscription = this.languageService.currentLanguage$.subscribe(async (lang) => {
      console.log('[NewsDetailModal] Language changed to:', lang);
      this.updateTranslations();
      // Reset translations to trigger re-translation
      this.translatedTitle = '';
      this.translatedExcerpt = '';
      this.translatedContent = '';
      // Trigger change detection to clear old content
      this.cdr.detectChanges();
      console.log('[NewsDetailModal] Starting content translation...');
      await this.translateContent();
      console.log('[NewsDetailModal] Content translation complete');
      // Trigger change detection after translation completes
      this.cdr.detectChanges();
    });
    console.log('[NewsDetailModal] Language subscription set up');
    // Subscribe to modal service for programmatic modal opening
    this.modalSubscription = this.modalService.getModalState().subscribe(state => {
        this.isOpen = state.isOpen;
        this.news = state.news;
        this.isBreaking = state.isBreaking || false;
        if (this.isOpen && this.news) {
          this.preventBodyScroll();
          this.showFullContent = false;
          this.tags = []; // Reset tags, will be loaded from API
          // Reset translations
          this.translatedTitle = '';
          this.translatedExcerpt = '';
          this.translatedContent = '';
          this.loadFullContent();
          // Translate after content is loaded
          setTimeout(() => this.translateContent(), 100);
        } else if (!this.isOpen) {
          this.restoreBodyScroll();
          this.showFullContent = false;
        this.tags = []; // Reset tags when modal closes
      }
    });
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['isOpen']) {
      if (this.isOpen) {
        this.preventBodyScroll();
        this.showFullContent = false; // Reset when modal opens
        if (this.news) {
          this.loadFullContent();
        }
      } else {
        this.restoreBodyScroll();
        this.showFullContent = false; // Reset when modal closes
      }
    }
    if (changes['news'] && this.news && this.isOpen) {
      this.showFullContent = false; // Reset when news changes
      this.loadFullContent();
    }
  }

  ngOnDestroy() {
    // Ensure body scroll is restored when component is destroyed
    this.restoreBodyScroll();
    this.languageSubscription?.unsubscribe();
    this.modalSubscription?.unsubscribe();
  }

  updateTranslations() {
    this.t = this.languageService.getTranslations();
    // Translate content when language changes
    if (this.news && this.isOpen) {
      this.translateContent();
    }
  }

  /**
   * Strip HTML tags from text for translation
   */
  private stripHtml(html: string): string {
    if (!html) return '';
    // Create a temporary div element to parse HTML
    const tmp = document.createElement('div');
    tmp.innerHTML = html;
    return tmp.textContent || tmp.innerText || '';
  }

  /**
   * Translate HTML content by translating text nodes while preserving structure
   */
  private async translateHtmlContent(htmlContent: string): Promise<string> {
    if (!htmlContent) return '';
    
    // Strip HTML to get plain text for translation
    const plainText = this.stripHtml(htmlContent);
    if (!plainText.trim()) return htmlContent;
    
    // Translate the plain text
    const translatedText = await this.languageService.translateToCurrentLanguage(plainText);
    
    // If translation didn't change (already in correct language), return original
    if (translatedText === plainText) {
      return htmlContent;
    }
    
    // Parse HTML and translate text nodes while preserving structure
    const tmp = document.createElement('div');
    tmp.innerHTML = htmlContent;
    
    // Extract all text nodes and translate them
    const walker = document.createTreeWalker(
      tmp,
      NodeFilter.SHOW_TEXT,
      null
    );
    
    const textNodes: Text[] = [];
    let node;
    while (node = walker.nextNode()) {
      if (node.textContent && node.textContent.trim()) {
        textNodes.push(node as Text);
      }
    }
    
    // Split translated text by paragraphs
    const translatedParagraphs = translatedText.split(/\n\n+/).filter(p => p.trim());
    
    // Replace text nodes with translated content
    textNodes.forEach((textNode, index) => {
      if (index < translatedParagraphs.length) {
        textNode.textContent = translatedParagraphs[index].trim();
      }
    });
    
    return tmp.innerHTML || htmlContent;
  }

  async translateContent() {
    console.log('[NewsDetailModal] translateContent called, news:', this.news ? 'exists' : 'null', 'isTranslating:', this.isTranslating);
    if (!this.news || this.isTranslating) {
      console.log('[NewsDetailModal] Skipping translation - no news or already translating');
      return;
    }
    
    this.isTranslating = true;
    const currentLang = this.languageService.getCurrentLanguage();
    console.log('[NewsDetailModal] Current language:', currentLang);
    
    try {
      // Translate title
      if (this.news.title) {
        console.log('[NewsDetailModal] Translating title:', this.news.title.substring(0, 30) + '...');
        this.translatedTitle = await this.languageService.translateToCurrentLanguage(this.news.title);
        console.log('[NewsDetailModal] Translated title:', this.translatedTitle.substring(0, 30) + '...');
      }
      
      // Translate excerpt
      if (this.news.excerpt) {
        console.log('[NewsDetailModal] Translating excerpt:', this.news.excerpt.substring(0, 30) + '...');
        this.translatedExcerpt = await this.languageService.translateToCurrentLanguage(this.news.excerpt);
        console.log('[NewsDetailModal] Translated excerpt:', this.translatedExcerpt.substring(0, 30) + '...');
      }
      
      // Translate content (handle HTML properly)
      const contentToTranslate = this.fullContent || this.news.excerpt || '';
      if (contentToTranslate) {
        console.log('[NewsDetailModal] Translating content:', contentToTranslate.substring(0, 30) + '...');
        // Check if content contains HTML
        if (contentToTranslate.includes('<') && contentToTranslate.includes('>')) {
          this.translatedContent = await this.translateHtmlContent(contentToTranslate);
        } else {
          this.translatedContent = await this.languageService.translateToCurrentLanguage(contentToTranslate);
        }
        console.log('[NewsDetailModal] Translated content:', this.translatedContent.substring(0, 30) + '...');
      }
    } catch (error) {
      console.error('[NewsDetailModal] Error translating content:', error);
      // Fallback to original content
      this.translatedTitle = this.news.title || '';
      this.translatedExcerpt = this.news.excerpt || '';
      this.translatedContent = this.fullContent || this.news.excerpt || '';
    } finally {
      this.isTranslating = false;
      console.log('[NewsDetailModal] Translation process complete');
      // Trigger change detection after translation completes
      this.cdr.detectChanges();
    }
  }

  getDisplayTitle(): string {
    if (!this.news) return '';
    // If translation is available and current, use it
    if (this.translatedTitle) {
      return this.translatedTitle;
    }
    // Otherwise use the language service method
    return this.languageService.getDisplayTitle(this.news.title, this.news.titleEn);
  }

  getDisplayContent(): string {
    if (!this.news) return '';
    const lang = this.languageService.getCurrentLanguage();
    
    // If translation is in progress, show loading or original
    if (this.isTranslating && !this.translatedContent) {
      return this.fullContent || this.news.excerpt || '';
    }
    
    // If translation is available, use it
    if (this.translatedContent) {
      return this.translatedContent;
    }
    
    // Otherwise fallback to original based on language
    if (lang === 'en') {
      return (this.news as any).contentEn || (this.news as any).excerptEn || this.fullContent || this.news.excerpt || '';
    }
    return this.fullContent || this.news.excerpt || '';
  }

  getModalTop(): number {
    // On desktop/web view, account for navigation bar height
    if (typeof window !== 'undefined' && window.innerWidth >= 1024) {
      // Navigation bar height is approximately 64px (reduced by 20%)
      return 64;
    }
    // On mobile, start from top
    return 0;
  }

  @HostListener('document:keydown.escape', ['$event'])
  handleEscapeKey(event: KeyboardEvent) {
    if (this.isOpen) {
      this.close();
    }
  }

  private preventBodyScroll() {
    // Get scroll position from modal service (saved when modal was opened)
    const scrollPosition = this.modalService.getScrollPosition();

    // Prevent body scroll when modal is open
    // Use fixed position with negative top to maintain scroll position
    document.body.style.overflow = 'hidden';
    document.body.style.position = 'fixed';
    document.body.style.top = `-${scrollPosition}px`;
    document.body.style.width = '100%';
  }

  private restoreBodyScroll() {
    // Get scroll position from modal service
    const scrollPosition = this.modalService.getScrollPosition();

    // Restore body scroll when modal is closed
    document.body.style.overflow = '';
    document.body.style.position = '';
    document.body.style.top = '';
    document.body.style.width = '';

    // Use requestAnimationFrame to ensure DOM updates are complete before scrolling
    requestAnimationFrame(() => {
      // Restore scroll position using scroll restoration service
      this.scrollRestorationService.restoreScrollPosition();
      
      // Also restore directly as fallback
      window.scrollTo({
        top: scrollPosition,
        behavior: 'auto' // Use 'auto' instead of 'smooth' for instant restoration
      });

      // Reset scroll position after restoring
      this.modalService.resetScrollPosition();
    });
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
            // Store both Hindi and English content if available
            // Hindi content (default)
            this.fullContent = response.data.content || response.data.excerpt || this.news.excerpt;
            
            // Store English content if available
            if (response.data.contentEn) {
              (this.news as any).contentEn = response.data.contentEn;
            }
            if (response.data.excerptEn) {
              (this.news as any).excerptEn = response.data.excerptEn;
            }
            // Also store English content/excerpt in the news object for easy access
            if (response.data.content) {
              (this.news as any).contentHi = response.data.content;
            }
            if (response.data.excerpt) {
              (this.news as any).excerptHi = response.data.excerpt;
            }
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
    const content = this.getDisplayContent();
    if (!content) {
      return '';
    }

    // Convert line breaks to paragraphs
    return content
      .split('\n\n')
      .map(paragraph => paragraph.trim())
      .filter(paragraph => paragraph.length > 0)
      .map(paragraph => `<p>${paragraph.replace(/\n/g, '<br>')}</p>`)
      .join('');
  }

  close() {
    this.restoreBodyScroll();
    this.modalService.closeModal();
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

  navigateToFullArticle() {
    if (this.news && this.news.id) {
      const newsId = typeof this.news.id === 'string' ? this.news.id : this.news.id.toString();
      console.log('[NewsDetailModal] Navigating to news detail page:', newsId);
      
      // Save current scroll position before navigation using scroll restoration service
      this.scrollRestorationService.saveScrollPosition();
      console.log('[NewsDetailModal] Saved scroll position via scroll restoration service');
      
      // Close modal first
      this.close();
      
      // Use setTimeout to ensure modal closes before navigation
      setTimeout(() => {
        // Navigate to full article page
        this.router.navigate(['/news', newsId]).then(
          (success) => {
            console.log('[NewsDetailModal] Navigation successful:', success);
          },
          (error) => {
            console.error('[NewsDetailModal] Navigation error:', error);
            // Fallback: use window.location if router navigation fails
            window.location.href = `/news/${newsId}`;
          }
        );
      }, 100);
    } else {
      console.warn('[NewsDetailModal] Cannot navigate: news or news.id is missing', this.news);
    }
  }

  shareNews() {
    if (navigator.share && this.news) {
      const newsId = this.news.id ? (typeof this.news.id === 'string' ? this.news.id : this.news.id.toString()) : '';
      const shareUrl = newsId ? `${window.location.origin}/news/${newsId}` : window.location.href;

      navigator.share({
        title: this.news.titleEn || this.news.title,
        text: this.news.excerpt,
        url: shareUrl
      }).catch(err => console.log('Error sharing:', err));
    } else {
      // Fallback: Copy to clipboard
      const newsId = this.news?.id ? (typeof this.news.id === 'string' ? this.news.id : this.news.id.toString()) : '';
      const shareUrl = newsId ? `${window.location.origin}/news/${newsId}` : window.location.href;
      const text = `${this.news?.titleEn || this.news?.title}\n\n${this.news?.excerpt}\n\n${shareUrl}`;
      navigator.clipboard.writeText(text).then(() => {
        alert('News link copied to clipboard!');
      }).catch(err => console.log('Error copying:', err));
    }
  }

  getCategoryColor(category: string): string {
    const colors: Record<string, string> = {
      'National': 'bg-blue-500 text-white',
      'International': 'bg-purple-500 text-white',
      'Sports': 'bg-orange-500 text-white',
      'Business': 'bg-blue-500 text-white',
      'Entertainment': 'bg-pink-500 text-white',
      'Health': 'bg-green-500 text-white',
      'Politics': 'bg-red-500 text-white',
      'Technology': 'bg-cyan-500 text-white',
      'Religious': 'bg-indigo-500 text-white'
    };
    return colors[category] || 'bg-primary text-white';
  }

  getHeadlineColor(category: string): string {
    const colors: Record<string, string> = {
      'National': 'bg-gradient-to-r from-blue-600 to-blue-800 bg-clip-text text-transparent dark:bg-none dark:text-blue-300',
      'International': 'bg-gradient-to-r from-purple-600 to-purple-800 bg-clip-text text-transparent dark:bg-none dark:text-purple-300',
      'Politics': 'bg-gradient-to-r from-red-600 to-red-800 bg-clip-text text-transparent dark:bg-none dark:text-red-300',
      'Health': 'bg-gradient-to-r from-green-600 to-green-800 bg-clip-text text-transparent dark:bg-none dark:text-green-300',
      'Sports': 'bg-gradient-to-r from-orange-600 to-orange-800 bg-clip-text text-transparent dark:bg-none dark:text-orange-300',
      'Business': 'bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent dark:bg-none dark:text-cyan-300',
      'Entertainment': 'bg-gradient-to-r from-pink-600 to-rose-600 bg-clip-text text-transparent dark:bg-none dark:text-pink-300',
      'Technology': 'bg-gradient-to-r from-cyan-600 to-blue-600 bg-clip-text text-transparent dark:bg-none dark:text-cyan-300',
      'Religious': 'bg-gradient-to-r from-indigo-600 to-indigo-800 bg-clip-text text-transparent dark:bg-none dark:text-indigo-300',
    };
    return colors[category] || 'bg-gradient-to-r from-primary to-primary/80 bg-clip-text text-transparent dark:bg-none dark:text-primary-foreground';
  }
}

