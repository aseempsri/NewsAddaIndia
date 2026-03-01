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
          class="glass-card max-w-4xl lg:max-w-6xl xl:max-w-7xl w-full h-full sm:h-auto max-h-[calc(100vh-64px)] sm:max-h-[calc(95vh-64px)] overflow-hidden flex flex-col lg:flex-row pointer-events-auto animate-scale-in rounded-lg sm:rounded-xl"
          (click)="$event.stopPropagation()"
          (touchstart)="$event.stopPropagation()"
          (touchmove)="$event.stopPropagation()">
          
          <!-- Close Button -->
          <button
            (click)="close()"
            (touchend)="onCloseButtonTouch($event)"
            class="absolute top-2 right-2 sm:top-4 sm:right-4 lg:top-6 lg:right-6 z-10 p-2.5 sm:p-2 rounded-full bg-red-600 hover:bg-red-700 active:bg-red-800 border-2 border-red-500 shadow-lg transition-all touch-manipulation min-w-[44px] min-h-[44px] flex items-center justify-center close-button-glow"
            aria-label="Close modal"
            type="button">
            <svg class="w-6 h-6 sm:w-6 sm:h-6 text-white close-icon-glow" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>

          <!-- Image Section - Side by side on desktop -->
          <div class="relative w-full lg:w-2/5 xl:w-2/5 lg:h-[calc(95vh-64px)] lg:min-h-[calc(95vh-64px)] flex flex-col flex-shrink-0 lg:rounded-l-xl bg-gradient-to-br from-background via-secondary/20 to-background p-4 lg:p-6 xl:p-8 border-r border-border/30">
            <!-- Image Frame Container -->
            <div class="relative flex-1 bg-gradient-to-br from-primary/10 via-secondary/30 to-accent/10 rounded-2xl lg:rounded-3xl p-3 lg:p-4 xl:p-5 shadow-2xl border-2 border-primary/20 lg:border-4 lg:border-primary/30 overflow-hidden flex">
              <!-- Inner Image Container - Landscape Format -->
              <div class="relative w-full rounded-xl lg:rounded-2xl overflow-hidden bg-secondary/20 aspect-[16/10] lg:aspect-[16/9] flex items-center justify-center">
                @if (news.imageLoading || getImagesArray().length === 0) {
                  <div class="absolute inset-0 flex items-center justify-center bg-secondary/50 z-10">
                    <div class="flex flex-col items-center gap-2">
                      <div class="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
                      <span class="text-sm text-muted-foreground">Loading image...</span>
                    </div>
                  </div>
                }
                @if (getImagesArray().length > 0 && !news.imageLoading) {
                  @if (getImagesArray().length === 1) {
                    <!-- Single Image - Centered Vertically -->
                    <div class="w-full h-full flex items-center justify-center">
                      <img
                        [src]="getImagesArray()[0]"
                        [alt]="news.title"
                        class="max-w-full max-h-full w-auto h-auto object-contain"
                        style="image-rendering: -webkit-optimize-contrast; image-rendering: crisp-edges; image-rendering: high-quality; filter: none; -webkit-filter: none;" />
                    </div>
                  } @else if (getImagesArray().length === 2) {
                    <!-- Two Images - Stacked Vertically and Evenly Spaced -->
                    <div class="w-full h-full flex flex-col justify-between py-2 lg:py-4">
                      @for (img of getImagesArray(); track $index) {
                        <div class="flex-1 flex items-center justify-center min-h-0">
                          <img
                            [src]="img"
                            [alt]="news.title + ' - Image ' + ($index + 1)"
                            class="max-w-full max-h-full w-auto h-auto object-contain"
                            style="image-rendering: -webkit-optimize-contrast; image-rendering: crisp-edges; image-rendering: high-quality; filter: none; -webkit-filter: none;" />
                        </div>
                      }
                    </div>
                  } @else {
                    <!-- Multiple Images - Vertically Scrollable -->
                    <div 
                      #imageScrollContainer
                      class="w-full h-full overflow-y-auto overflow-x-hidden scrollbar-hide" 
                      style="scroll-snap-type: y mandatory; -webkit-overflow-scrolling: touch;"
                      (scroll)="onImageScroll($event)">
                      <div class="flex flex-col h-full">
                        @for (img of getImagesArray(); track $index) {
                          <div class="flex-shrink-0 w-full flex items-center justify-center py-2" style="scroll-snap-align: start; min-height: 50%;">
                            <img
                              [src]="img"
                              [alt]="news.title + ' - Image ' + ($index + 1)"
                              class="max-w-full max-h-[80%] w-auto h-auto object-contain"
                              style="image-rendering: -webkit-optimize-contrast; image-rendering: crisp-edges; image-rendering: high-quality; filter: none; -webkit-filter: none;" />
                          </div>
                        }
                      </div>
                    </div>
                  }
                }
                
                <!-- Category Badge -->
                <div class="absolute top-4 left-4 flex gap-2 z-10">
                  @if (isBreaking) {
                    <span class="inline-flex items-center justify-center px-3 py-1 text-xs font-semibold rounded-full bg-red-600 text-white animate-pulse shadow-lg">
                      BREAKING
                    </span>
                  }
                  <span [class]="'inline-flex items-center justify-center px-3 py-1 text-xs font-semibold rounded-full shadow-lg ' + getCategoryColor(news.category)">
                    {{ news.category }}
                  </span>
                </div>

                <!-- Scroll Indicator - Only show on desktop when more than 1 image -->
                @if (getImagesArray().length > 1 && showScrollIndicator) {
                  <div class="hidden lg:flex absolute bottom-6 left-1/2 transform -translate-x-1/2 z-20 flex-col items-center gap-2 pointer-events-none transition-opacity duration-300">
                    <div class="bg-black/70 dark:bg-white/70 backdrop-blur-sm rounded-full px-4 py-2 flex flex-col items-center gap-1 shadow-lg">
                      <span class="text-white dark:text-black text-xs font-semibold uppercase tracking-wider">SCROLL</span>
                      <svg class="w-5 h-5 text-white dark:text-black animate-bounce-scroll" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                      </svg>
                    </div>
                  </div>
                }
              </div>
            </div>

            <!-- Read More Button - Under Image (Hidden on mobile, shown on desktop) -->
            @if (hasId()) {
              <div class="hidden lg:block mt-4 lg:mt-6 xl:mt-8">
                <button
                  (click)="navigateToFullArticle(); $event.stopPropagation()"
                  (touchend)="navigateToFullArticle(); $event.stopPropagation(); $event.preventDefault()"
                  type="button"
                  class="w-full px-4 sm:px-6 py-3 lg:py-4 bg-primary text-primary-foreground rounded-xl lg:rounded-2xl hover:bg-primary/90 active:bg-primary/80 transition-all duration-300 font-semibold flex items-center justify-center gap-2 touch-manipulation min-h-[48px] lg:min-h-[52px] text-base lg:text-lg shadow-lg hover:shadow-xl transform hover:scale-[1.02]">
                  <span>{{ t.readMore }}</span>
                  <svg class="w-4 h-4 lg:w-5 lg:h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                  </svg>
                </button>
              </div>
            }
          </div>

          <!-- Content (Scrollable) -->
          <div class="flex-1 overflow-y-auto overscroll-contain -webkit-overflow-scrolling-touch min-h-0 lg:w-3/5 xl:w-3/5 flex flex-col" style="touch-action: pan-y;">
            <div class="p-4 sm:p-6 lg:p-8 xl:p-10 flex-1 flex flex-col">
              <!-- Title -->
              <h1 [class]="'font-display text-xl sm:text-2xl lg:text-3xl xl:text-4xl font-bold dark:font-normal leading-relaxed mb-4 sm:mb-5 lg:mb-6 pt-3 pb-2 ' + (news.isTrending ? 'text-purple-700 dark:text-purple-300' : getHeadlineColor(news.category))">
                {{ getDisplayTitle() }}
              </h1>

              <!-- Summary (60 words) -->
              <div class="mb-6 text-base sm:text-lg lg:text-xl text-muted-foreground leading-relaxed flex-1">
                {{ displaySummary }}
              </div>

              <!-- Author and Date - Bottom aligned -->
              <div class="flex items-center justify-between text-sm text-muted-foreground border-t border-border/30 pt-4 mt-auto">
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
            </div>
          </div>

          <!-- Footer Actions - Hidden on desktop, shown on mobile -->
          <div class="lg:hidden p-4 sm:p-6 border-t border-border/30 bg-secondary/20 flex-shrink-0">
            @if (hasId()) {
              <button
                (click)="navigateToFullArticle(); $event.stopPropagation()"
                (touchend)="navigateToFullArticle(); $event.stopPropagation(); $event.preventDefault()"
                type="button"
                class="w-full px-4 sm:px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 active:bg-primary/80 transition-colors font-medium flex items-center justify-center gap-2 touch-manipulation min-h-[44px]">
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
    @keyframes bounce-scroll {
      0%, 100% {
        transform: translateY(0);
      }
      50% {
        transform: translateY(-8px);
      }
    }
    .animate-fade-in {
      animation: fade-in 0.2s ease-out;
    }
    .animate-scale-in {
      animation: scale-in 0.3s ease-out;
    }
    .animate-bounce-scroll {
      animation: bounce-scroll 1.5s ease-in-out infinite;
    }
    .touch-manipulation {
      touch-action: manipulation;
      -webkit-tap-highlight-color: transparent;
    }
    /* Glow effect for close button - Red background with white cross glow */
    .close-button-glow {
      box-shadow: 0 0 20px rgba(220, 38, 38, 0.8), 0 0 40px rgba(220, 38, 38, 0.6), 0 0 60px rgba(220, 38, 38, 0.4), 0 4px 12px rgba(0, 0, 0, 0.3);
      transition: box-shadow 0.3s ease, transform 0.2s ease;
    }
    .close-button-glow:hover {
      box-shadow: 0 0 25px rgba(220, 38, 38, 0.9), 0 0 50px rgba(220, 38, 38, 0.7), 0 0 75px rgba(220, 38, 38, 0.5), 0 6px 16px rgba(0, 0, 0, 0.4);
      transform: scale(1.05);
    }
    .close-button-glow:active {
      box-shadow: 0 0 15px rgba(220, 38, 38, 0.7), 0 0 30px rgba(220, 38, 38, 0.5), 0 0 45px rgba(220, 38, 38, 0.3), 0 2px 8px rgba(0, 0, 0, 0.3);
      transform: scale(0.95);
    }
    .close-icon-glow {
      filter: drop-shadow(0 0 6px rgba(255, 255, 255, 1)) drop-shadow(0 0 12px rgba(255, 255, 255, 0.8)) drop-shadow(0 0 18px rgba(255, 255, 255, 0.6));
      transition: filter 0.3s ease;
    }
    .close-button-glow:hover .close-icon-glow {
      filter: drop-shadow(0 0 8px rgba(255, 255, 255, 1)) drop-shadow(0 0 16px rgba(255, 255, 255, 0.9)) drop-shadow(0 0 24px rgba(255, 255, 255, 0.7));
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
        padding-left: 1rem !important;
        padding-right: 1rem !important;
      }
      /* Improve readability on desktop */
      .news-content {
        font-size: 1.125rem;
        line-height: 1.9;
        max-width: 100%;
      }
      .news-content p {
        margin-bottom: 1.75rem;
        font-size: 1.125rem;
        line-height: 1.9;
        color: hsl(var(--foreground));
      }
      .news-content h2, .news-content h3 {
        margin-top: 2.5rem;
        margin-bottom: 1.5rem;
        font-size: 1.75rem;
        line-height: 1.3;
        font-weight: 700;
        color: hsl(var(--foreground));
      }
      /* Ensure image section is properly sized */
      .glass-card {
        max-height: calc(95vh - 64px);
      }
      /* Image frame styling */
      .glass-card .relative.flex.fflex-col {
        box-shadow: 0 20px 60px -15px rgba(0, 0, 0, 0.3);
      }
      /* Ensure image is crisp and clear - no blur */
      .glass-card img {
        image-rendering: -webkit-optimize-contrast;
        image-rendering: crisp-edges;
        image-rendering: high-quality;
        filter: none !important;
        -webkit-filter: none !important;
        -moz-filter: none !important;
        -ms-filter: none !important;
        -o-filter: none !important;
      }
      /* Ensure single image is vertically centered */
      .glass-card .aspect-\\[16\\/10\\] > div.absolute,
      .glass-card .aspect-\\[16\\/9\\] > div.absolute {
        display: flex !important;
        align-items: center !important;
        justify-content: center !important;
      }
      /* Ensure images are centered within their containers */
      .glass-card .aspect-\\[16\\/10\\] img,
      .glass-card .aspect-\\[16\\/9\\] img {
        vertical-align: middle;
      }
      /* Hide scrollbar but keep functionality */
      .scrollbar-hide {
        -ms-overflow-style: none;
        scrollbar-width: none;
        scroll-behavior: smooth;
      }
      .scrollbar-hide::-webkit-scrollbar {
        display: none;
      }
    }
    @media (min-width: 1280px) {
      .news-content {
        font-size: 1.25rem;
        line-height: 2;
      }
      .news-content p {
        font-size: 1.25rem;
        line-height: 2;
        margin-bottom: 2rem;
        color: hsl(var(--foreground));
      }
      .news-content h2, .news-content h3 {
        font-size: 2rem;
        margin-top: 3rem;
        margin-bottom: 1.75rem;
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
  displaySummary: string = '';
  isTranslating: boolean = false;
  showFullContent: boolean = false;
  showScrollIndicator: boolean = true;
  t: any = {};
  images: string[] = []; // Array to hold multiple images
  private apiUrl = environment.apiUrl || 'http://localhost:3000';
  private languageSubscription?: Subscription;
  private modalSubscription?: Subscription;
  private imageScrollContainer?: HTMLElement;
  
  // Initialize tags as empty array if not provided
  get tagsArray(): string[] {
    // Check multiple sources for tags
    if (this.tags && Array.isArray(this.tags) && this.tags.length > 0) {
      return this.tags;
    }
    // Also check if tags are in the news object
    if (this.news && (this.news as any).tags && Array.isArray((this.news as any).tags) && (this.news as any).tags.length > 0) {
      return (this.news as any).tags;
    }
    return [];
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
      setTimeout(async () => {
        await this.translateContent();
        await this.updateDisplaySummary();
      }, 100);
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
      await this.updateDisplaySummary();
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
          // Always start with empty tags - will be loaded fresh from API
          this.tags = [];
          // Initialize images from news object
          this.images = this.getImagesArray();
          console.log('[NewsDetailModal] Modal opened, news ID:', this.news.id);
          console.log('[NewsDetailModal] Modal opened, initial tags from news object:', (this.news as any).tags);
          console.log('[NewsDetailModal] Modal opened, initial images:', this.images);
          // Reset translations
          this.translatedTitle = '';
          this.translatedExcerpt = '';
          this.translatedContent = '';
          // Reset scroll indicator when modal opens (only show if more than 1 image)
          this.showScrollIndicator = this.getImagesArray().length > 1;
          // Always fetch fresh data from API to get latest tags
          this.loadFullContent();
          // Translate after content is loaded
          setTimeout(async () => {
            await this.translateContent();
            await this.updateDisplaySummary();
          }, 100);
        } else if (!this.isOpen) {
          this.restoreBodyScroll();
          this.showFullContent = false;
        this.tags = []; // Reset tags when modal closes
        this.images = []; // Reset images when modal closes
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
          setTimeout(async () => {
            await this.updateDisplaySummary();
          }, 100);
        }
      } else {
        this.restoreBodyScroll();
        this.showFullContent = false; // Reset when modal closes
      }
    }
    if (changes['news'] && this.news && this.isOpen) {
      this.showFullContent = false; // Reset when news changes
      this.loadFullContent();
      setTimeout(async () => {
        await this.updateDisplaySummary();
      }, 100);
    }
  }

  ngOnDestroy() {
    // Ensure body scroll is restored when component is destroyed
    this.restoreBodyScroll();
    this.languageSubscription?.unsubscribe();
    this.modalSubscription?.unsubscribe();
  }

  async updateTranslations() {
    this.t = this.languageService.getTranslations();
    // Translate content when language changes
    if (this.news && this.isOpen) {
      await this.translateContent();
      await this.updateDisplaySummary();
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

  async updateDisplaySummary() {
    if (!this.news) {
      this.displaySummary = '';
      return;
    }
    
    const currentLang = this.languageService.getCurrentLanguage();
    const hindiSummary = (this.news as any).summary || this.news.excerpt || '';
    const englishSummary = (this.news as any).summaryEn || '';
    
    if (currentLang === 'hi') {
      this.displaySummary = hindiSummary;
    } else {
      // If English summary exists and is not empty, use it
      if (englishSummary && englishSummary.trim()) {
        this.displaySummary = englishSummary;
      } else if (hindiSummary && hindiSummary.trim()) {
        // If English summary is missing but Hindi summary exists, translate it
        try {
          const translated = await this.languageService.translateText(hindiSummary, 'hi', 'en');
          this.displaySummary = translated;
        } catch (error) {
          console.error('[NewsDetailModal] Error translating summary:', error);
          // Fallback to Hindi if translation fails
          this.displaySummary = hindiSummary;
        }
      } else {
        this.displaySummary = '';
      }
    }
    this.cdr.detectChanges();
  }

  getDisplayContent(): string {
    if (!this.news) return '';
    
    // Use language service to get correct content based on current language
    return this.languageService.getDisplayContent(
      this.news.content || this.news.excerpt || '',
      (this.news as any).contentEn || ''
    );
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
    document.body.style.left = '0';
    document.body.style.right = '0';
  }

  private restoreBodyScroll() {
    // Get scroll position from multiple sources BEFORE restoring body styles
    let scrollPosition = this.modalService.getScrollPosition();
    const bodyTop = document.body.style.top;
    
    // Try to get from sessionStorage as backup
    try {
      if (typeof window !== 'undefined' && window.sessionStorage) {
        const storedPos = sessionStorage.getItem('modal_scroll_position');
        const storedRoute = sessionStorage.getItem('modal_scroll_route');
        const currentRoute = this.router.url || '/';
        
        if (storedPos && storedRoute === currentRoute) {
          const parsedPos = parseInt(storedPos, 10);
          if (!isNaN(parsedPos) && parsedPos > 0) {
            scrollPosition = parsedPos;
            console.log('[NewsDetailModal] Using scroll position from sessionStorage:', scrollPosition);
          }
        }
      }
    } catch (e) {
      console.warn('[NewsDetailModal] Could not read from sessionStorage:', e);
    }
    
    // Extract scroll position from the negative top value if available
    let savedScrollPos = scrollPosition;
    if (bodyTop && bodyTop.startsWith('-')) {
      const extractedPos = parseInt(bodyTop.replace('-', '').replace('px', ''), 10);
      if (!isNaN(extractedPos) && extractedPos > 0) {
        savedScrollPos = extractedPos;
        console.log('[NewsDetailModal] Extracted scroll position from body.top:', savedScrollPos);
      }
    }

    console.log('[NewsDetailModal] Restoring scroll position:', savedScrollPos);

    // Restore body scroll when modal is closed
    document.body.style.overflow = '';
    document.body.style.position = '';
    document.body.style.top = '';
    document.body.style.width = '';
    document.body.style.left = '';
    document.body.style.right = '';

    // Use multiple delays to ensure DOM updates are complete before scrolling
    // First restore immediately
    requestAnimationFrame(() => {
      // Restore scroll position using scroll restoration service (for route-based restoration)
      const currentRoute = this.router.url || '/';
      this.scrollRestorationService.restoreScrollPosition(currentRoute);
      
      // Also restore directly as fallback with the saved position from modal
      if (savedScrollPos > 0) {
        console.log('[NewsDetailModal] Restoring to position:', savedScrollPos);
        window.scrollTo({
          top: savedScrollPos,
          left: 0,
          behavior: 'auto' // Use 'auto' instead of 'smooth' for instant restoration
        });
        
        // Set directly as additional fallback
        document.documentElement.scrollTop = savedScrollPos;
        document.body.scrollTop = savedScrollPos;
      }

      // Additional restore after a short delay to handle any layout shifts
      setTimeout(() => {
        if (savedScrollPos > 0) {
          window.scrollTo({
            top: savedScrollPos,
            left: 0,
            behavior: 'auto'
          });
          document.documentElement.scrollTop = savedScrollPos;
          document.body.scrollTop = savedScrollPos;
        }
      }, 50);
      
      // Final restore after longer delay
      setTimeout(() => {
        if (savedScrollPos > 0) {
          window.scrollTo({
            top: savedScrollPos,
            left: 0,
            behavior: 'auto'
          });
          document.documentElement.scrollTop = savedScrollPos;
          document.body.scrollTop = savedScrollPos;
        }
        
        // Clear sessionStorage after restoring
        try {
          if (typeof window !== 'undefined' && window.sessionStorage) {
            sessionStorage.removeItem('modal_scroll_position');
            sessionStorage.removeItem('modal_scroll_route');
          }
        } catch (e) {
          // Ignore errors
        }
        
        // Reset scroll position after restoring (but keep it in scroll restoration service)
        this.modalService.resetScrollPosition();
      }, 200);
    });
  }

  /**
   * Parse images from various formats (string, array, comma-separated)
   */
  private parseImages(imageData: any): string[] {
    if (!imageData) return [];
    
    // If it's already an array
    if (Array.isArray(imageData)) {
      return imageData.filter(img => img && img.trim().length > 0);
    }
    
    // If it's a string, check if it's comma-separated
    if (typeof imageData === 'string') {
      const images = imageData.split(',').map(img => img.trim()).filter(img => img.length > 0);
      return images.length > 0 ? images : [imageData]; // Return single image if not comma-separated
    }
    
    return [];
  }

  /**
   * Get images array - check multiple sources
   */
  getImagesArray(): string[] {
    if (!this.news) return [];
    
    // First check if images array exists in news object
    if (this.news.images && Array.isArray(this.news.images) && this.news.images.length > 0) {
      return this.news.images.filter(img => img && img.trim().length > 0);
    }
    
    // Check if images array exists in news object (any type)
    if ((this.news as any).images && Array.isArray((this.news as any).images)) {
      return this.parseImages((this.news as any).images);
    }
    
    // Check if image field contains multiple images (comma-separated)
    if (this.news.image) {
      const parsed = this.parseImages(this.news.image);
      if (parsed.length > 0) {
        return parsed;
      }
    }
    
    // Fallback to single image
    return this.news.image ? [this.news.image] : [];
  }

  loadFullContent() {
    if (!this.news || !this.news.id) {
      console.log('[NewsDetailModal] loadFullContent: No news or news.id');
      // Still try to parse images from news object
      this.images = this.getImagesArray();
      // Update display summary even without API call
      this.updateDisplaySummary();
      return;
    }

    // Try to fetch full content from backend if news has an ID
    const newsId = typeof this.news.id === 'string' ? this.news.id : this.news.id.toString();
    console.log('[NewsDetailModal] loadFullContent: Fetching news ID:', newsId);

    // Check if it's a MongoDB ObjectId format (24 hex characters)
    const isMongoId = newsId.length === 24 && newsId.match(/^[0-9a-fA-F]{24}$/);
    console.log('[NewsDetailModal] loadFullContent: Is MongoDB ID?', isMongoId, 'ID length:', newsId.length);
    
    if (isMongoId) {
      console.log('[NewsDetailModal] loadFullContent: Making API call to fetch full content');
      // Add cache-busting parameter to ensure fresh data
      const cacheBuster = `?t=${Date.now()}`;
      this.http.get<{ success: boolean; data: any }>(`${this.apiUrl}/api/news/${newsId}${cacheBuster}`).subscribe({
        next: async (response) => {
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
            if (response.data.summaryEn) {
              (this.news as any).summaryEn = response.data.summaryEn;
            }
            if (response.data.summary) {
              (this.news as any).summary = response.data.summary;
            }
            // Also store English content/excerpt in the news object for easy access
            if (response.data.content) {
              (this.news as any).contentHi = response.data.content;
            }
            if (response.data.excerpt) {
              (this.news as any).excerptHi = response.data.excerpt;
            }
            // Update tags from API response - handle both array and string formats
            console.log('[NewsDetailModal] API response data:', response.data);
            console.log('[NewsDetailModal] API response tags:', response.data.tags, 'Type:', typeof response.data.tags);
            
            if (response.data.tags) {
              if (Array.isArray(response.data.tags)) {
                this.tags = response.data.tags.filter((t: any) => t && t.trim && t.trim().length > 0);
              } else if (typeof response.data.tags === 'string') {
                // Try to parse if it's a JSON string
                try {
                  const parsed = JSON.parse(response.data.tags);
                  this.tags = Array.isArray(parsed) ? parsed.filter((t: any) => t && t.trim && t.trim().length > 0) : [];
                } catch {
                  // If not JSON, treat as comma-separated string
                  this.tags = response.data.tags.split(',').map((t: string) => t.trim()).filter((t: string) => t.length > 0);
                }
              } else {
                this.tags = [];
              }
            } else {
              this.tags = [];
            }
            console.log('[NewsDetailModal] Tags loaded from API:', this.tags);
            // Also update tags in news object for consistency
            (this.news as any).tags = this.tags;
            
            // Parse images from API response
            if (response.data.images && Array.isArray(response.data.images) && response.data.images.length > 0) {
              // Construct full URLs for images array
              this.images = response.data.images.map((img: string) => {
                if (img && img.trim() !== '' && !img.startsWith('http')) {
                  const imgPath = img.startsWith('/') ? img : '/' + img;
                  return `${this.apiUrl}${imgPath}`;
                }
                return img;
              }).filter((img: string) => img && img.trim().length > 0);
            } else if (response.data.image) {
              this.images = this.parseImages(response.data.image);
            } else {
              this.images = this.getImagesArray();
            }
            // Also update news object with images
            (this.news as any).images = this.images;
            console.log('[NewsDetailModal] Images loaded from API:', this.images);
            
            // Update display summary based on current language
            await this.updateDisplaySummary();
            
            // Trigger change detection to update UI
            this.cdr.detectChanges();
          } else {
            this.fullContent = this.news.excerpt;
            console.log('[NewsDetailModal] API response not successful or no data');
            // Update display summary even if API fails
            await this.updateDisplaySummary();
          }
        },
        error: (error) => {
          console.error('[NewsDetailModal] Error loading full content:', error);
          // Fallback to excerpt if API fails
          this.fullContent = this.news?.excerpt || '';
          // Try to get tags from news object if API fails
          if ((this.news as any).tags) {
            if (Array.isArray((this.news as any).tags)) {
              this.tags = (this.news as any).tags;
            } else if (typeof (this.news as any).tags === 'string') {
              try {
                this.tags = JSON.parse((this.news as any).tags);
              } catch {
                this.tags = (this.news as any).tags.split(',').map((t: string) => t.trim()).filter((t: string) => t.length > 0);
              }
            }
            console.log('[NewsDetailModal] Tags from news object (after API error):', this.tags);
            this.cdr.detectChanges();
          }
          // Update display summary even if API fails
          this.updateDisplaySummary();
        }
      });
    } else {
      // Use excerpt as content for non-backend news
      this.fullContent = this.news.excerpt || '';
      // Parse images from news object
      this.images = this.getImagesArray();
      // For non-MongoDB IDs, try to get tags from the news object itself
      console.log('[NewsDetailModal] Non-MongoDB ID, checking news object for tags:', (this.news as any).tags);
      if ((this.news as any).tags) {
        if (Array.isArray((this.news as any).tags)) {
          this.tags = (this.news as any).tags.filter((t: any) => t && (typeof t === 'string' ? t.trim().length > 0 : true));
        } else if (typeof (this.news as any).tags === 'string') {
          try {
            const parsed = JSON.parse((this.news as any).tags);
            this.tags = Array.isArray(parsed) ? parsed.filter((t: any) => t && (typeof t === 'string' ? t.trim().length > 0 : true)) : [];
          } catch {
            this.tags = (this.news as any).tags.split(',').map((t: string) => t.trim()).filter((t: string) => t.length > 0);
          }
        }
        console.log('[NewsDetailModal] Tags from news object (non-MongoDB):', this.tags);
        this.cdr.detectChanges();
      } else {
        console.log('[NewsDetailModal] No tags found in news object');
      }
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

  /**
   * Check if news article has an ID (for showing Read more button)
   * Show button for all articles with IDs - let backend handle validation
   */
  hasId(): boolean {
    return !!(this.news && this.news.id);
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
      // Ensure ID is a clean string, trim whitespace, and remove any invalid characters
      let newsId = typeof this.news.id === 'string' ? this.news.id : this.news.id.toString();
      newsId = newsId.trim().replace(/[\s\u00A0]/g, ''); // Remove all whitespace including non-breaking spaces
      
      // Validate MongoDB ObjectId format (24 hex characters)
      if (!/^[0-9a-fA-F]{24}$/.test(newsId)) {
        console.error('[NewsDetailModal] Invalid news ID format:', newsId, 'Original:', this.news.id);
        alert('Invalid article ID. Please try again.');
        return;
      }
      
      console.log('[NewsDetailModal] Navigating to news detail page:', newsId, 'Original ID:', this.news.id);
      
      // IMMEDIATELY scroll to top before navigation to ensure clean state
      window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
      document.documentElement.scrollTop = 0;
      document.body.scrollTop = 0;
      
      // Get the scroll position from modal service (saved when modal was opened)
      const scrollPosition = this.modalService.getScrollPosition();
      
      // Save current scroll position for home route ('/') before navigation
      // This ensures when user comes back from /news/:id, scroll position is restored
      this.scrollRestorationService.saveScrollPosition('/');
      
      // Clear any saved scroll position for the detail route to ensure it always starts at top
      const detailRoute = `/news/${newsId}`;
      this.scrollRestorationService.clearScrollPosition(detailRoute);
      console.log('[NewsDetailModal] Saved scroll position for home route and cleared detail route');
      
      // Close modal first (this will restore body scroll)
      this.close();
      
      // Use setTimeout to ensure modal closes and scroll is restored before navigation
      setTimeout(() => {
        // Navigate to full article page using Angular router (SPA navigation, no reload)
        this.router.navigate(['/news', newsId]).then(
          (success) => {
            console.log('[NewsDetailModal] Navigation successful:', success);
            
            // AGGRESSIVE scroll to top - multiple attempts to ensure it works
            // This overrides any scroll restoration that might happen
            const forceScrollToTop = () => {
              window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
              document.documentElement.scrollTop = 0;
              document.body.scrollTop = 0;
              // Also try scrolling the window itself
              if (window.scrollY !== 0) {
                window.scrollTo(0, 0);
              }
            };
            
            // Immediate scroll
            forceScrollToTop();
            
            // Multiple delayed scrolls to catch any late rendering
            setTimeout(forceScrollToTop, 0);
            setTimeout(forceScrollToTop, 50);
            setTimeout(forceScrollToTop, 100);
            setTimeout(forceScrollToTop, 200);
            setTimeout(forceScrollToTop, 300);
            setTimeout(forceScrollToTop, 500);
            
            // Also use requestAnimationFrame for after render
            requestAnimationFrame(() => {
              forceScrollToTop();
              requestAnimationFrame(() => {
                forceScrollToTop();
              });
            });
          },
          (error) => {
            console.error('[NewsDetailModal] Navigation error:', error);
            // Retry navigation once more before giving up
            setTimeout(() => {
              this.router.navigate(['/news', newsId]).catch(err => {
                console.error('[NewsDetailModal] Retry navigation also failed:', err);
                // Only use window.location as last resort - this will cause full reload
                // But it's better than nothing
                window.location.href = `/news/${newsId}`;
              });
            }, 100);
          }
        );
      }, 150);
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

  onImageScroll(event: Event) {
    const target = event.target as HTMLElement;
    if (target) {
      const scrollTop = target.scrollTop;
      const scrollHeight = target.scrollHeight;
      const clientHeight = target.clientHeight;
      
      // Hide scroll indicator when user scrolls down (more than 10% scrolled)
      if (scrollTop > scrollHeight * 0.1) {
        this.showScrollIndicator = false;
      } else {
        // Show again if scrolled back to top
        this.showScrollIndicator = true;
      }
      
      // Also hide if near bottom (less than 10% remaining)
      if (scrollTop + clientHeight >= scrollHeight * 0.9) {
        this.showScrollIndicator = false;
      }
    }
  }
}

