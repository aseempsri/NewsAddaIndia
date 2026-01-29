import { Component, OnInit, OnDestroy, AfterViewInit, ViewChild, ElementRef, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink, NavigationEnd } from '@angular/router';
import { NewsService, NewsArticle } from '../../services/news.service';
import { ModalService } from '../../services/modal.service';
import { LanguageService } from '../../services/language.service';
import { DisplayedNewsService } from '../../services/displayed-news.service';
import { NewsDetailModalComponent } from '../news-detail-modal/news-detail-modal.component';
import { Subscription } from 'rxjs';
import { filter } from 'rxjs/operators';

interface Article {
  id?: string | number; // Add ID field to preserve MongoDB _id
  title: string;
  image: string;
  time: string;
  date?: string;
  hasVideo?: boolean;
  imageLoading?: boolean;
  isTrending?: boolean;
  isBreaking?: boolean;
  isFeatured?: boolean;
}

interface Category {
  title: string;
  accentColor: string;
  articles: Article[];
}

@Component({
  selector: 'app-category-section',
  standalone: true,
  imports: [CommonModule, RouterLink, NewsDetailModalComponent],
  template: `
    <section class="py-12 lg:py-16 bg-gradient-to-b from-transparent via-secondary/30 to-transparent overflow-y-hidden">
      <div class="container mx-auto px-4 overflow-y-hidden">
        <div class="space-y-12 overflow-y-hidden">
          @for (category of categories; track category.title; let catIndex = $index) {
            <div class="overflow-y-hidden">
              <!-- Category Header -->
              <div class="flex items-center justify-between mb-6">
                <div class="flex items-center gap-3">
                  <div [class]="'w-1 h-8 rounded-full bg-gradient-to-b ' + category.accentColor"></div>
                  <h2 class="font-display text-xl lg:text-2xl font-bold leading-relaxed pt-2 pb-1">
                    {{ category.title }}
                  </h2>
                </div>
                <a
                  [routerLink]="'/category/' + getCategorySlug(category.title)"
                  class="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors">
                  {{ t.more }}
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                  </svg>
                </a>
              </div>

              <!-- Horizontal Scrollable Articles Container -->
              <div class="relative group/category overflow-y-hidden">
                <!-- Left Arrow - Show only when scrolled right, hidden on mobile -->
                <button
                  (click)="scrollLeft(getCategoryKeyByIndex(catIndex))"
                  [class.opacity-0]="!canScrollLeft(getCategoryKeyByIndex(catIndex))"
                  [class.pointer-events-none]="!canScrollLeft(getCategoryKeyByIndex(catIndex))"
                  [class.invisible]="!canScrollLeft(getCategoryKeyByIndex(catIndex))"
                  class="scroll-arrow-left hidden lg:flex absolute left-1 top-1/2 -translate-y-1/2 z-30 rounded-full bg-gradient-to-r from-primary/90 via-primary/80 to-primary/70 backdrop-blur-lg border-2 border-primary/50 shadow-xl sm:shadow-2xl items-center justify-center transition-all duration-300 hover:scale-110 sm:hover:scale-125 hover:shadow-[0_0_20px_rgba(168,85,247,0.6)] sm:hover:shadow-[0_0_30px_rgba(168,85,247,0.8)] hover:border-primary/80 active:scale-90 sm:active:scale-95 group/arrow touch-manipulation"
                  aria-label="Scroll left">
                  <div class="absolute inset-0 rounded-full bg-gradient-to-r from-purple-500/20 to-pink-500/20"></div>
                  <svg class="arrow-icon text-white relative z-10 drop-shadow-lg group-hover/arrow:translate-x-[-2px] transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M15 19l-7-7 7-7" />
                  </svg>
                </button>

                <!-- Scrollable Articles -->
                <div 
                  #scrollContainer
                  [attr.data-category]="getCategoryKeyByIndex(catIndex)"
                  class="flex gap-4 md:gap-5 lg:gap-6 overflow-x-auto overflow-y-hidden scrollbar-hide scroll-smooth pb-4 pl-2 pr-2 sm:pl-2 sm:pr-2 items-stretch"
                  style="scroll-behavior: smooth; -webkit-overflow-scrolling: touch; scroll-padding: 0 16px; overflow-y: hidden !important; overflow-x: auto; scrollbar-width: none !important; -ms-overflow-style: none !important; touch-action: pan-x pan-y; overscroll-behavior-x: contain; overscroll-behavior-y: auto;"
                  (scroll)="onScroll(getCategoryKeyByIndex(catIndex), $event)">
                  @for (article of category.articles; track $index; let i = $index) {
                    <article class="news-card group flex-shrink-0 w-[280px] sm:w-[320px] lg:w-[360px] hover:shadow-2xl hover:shadow-purple-500/20 transition-all duration-300 flex flex-col">
                      <div class="relative aspect-video overflow-hidden rounded-t-xl bg-gradient-to-br from-purple-100/20 via-pink-100/20 to-orange-100/20 dark:from-purple-900/20 dark:via-pink-900/20 dark:to-orange-900/20 border-2 border-transparent hover:border-purple-300/50 dark:hover:border-purple-700/50 transition-all duration-300 flex-shrink-0">
                        <!-- Loading Animation - Show while image is loading -->
                        @if (article?.imageLoading || !article?.image) {
                          <div class="absolute inset-0 flex items-center justify-center bg-secondary/50 z-10">
                            <div class="flex flex-col items-center gap-2">
                              <div class="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
                              <span class="text-xs text-muted-foreground">{{ t.loadingImage }}</span>
                            </div>
                          </div>
                        }
                        <!-- Image - Only show when loaded -->
                        @if (article?.image && !article?.imageLoading) {
                          <img
                            [src]="article.image"
                            [alt]="article.title"
                            class="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                            loading="lazy"
                            decoding="async"
                            style="filter: none !important; -webkit-filter: none !important; backdrop-filter: none !important; blur: none !important; image-rendering: auto !important; -webkit-font-smoothing: antialiased; -moz-osx-font-smoothing: grayscale; backface-visibility: hidden; transform: translateZ(0); will-change: transform;" />
                        }
                        <!-- Trending/Breaking/Featured Badges -->
                        @if (article && !isHomePage) {
                          <div class="absolute top-2 left-2 z-20 flex gap-1 flex-wrap">
                            @if (article.isTrending) {
                              <span class="inline-flex items-center justify-center gap-1 px-2 py-1 text-[0.5rem] sm:text-xs font-black rounded-full bg-gradient-to-r from-purple-600 via-pink-500 to-fuchsia-600 text-white shadow-xl animate-pulse border border-white/50 uppercase tracking-wider" style="font-family: 'Arial Black', 'Helvetica Neue', sans-serif; text-shadow: 1px 1px 2px rgba(0,0,0,0.5); letter-spacing: 0.05em;">
                                <span class="text-[0.5rem] leading-none">🔥</span>
                                <span>TRENDING</span>
                              </span>
                            }
                            @if (article.isBreaking) {
                              <span class="inline-flex items-center justify-center gap-1 px-2 py-1 text-[0.5rem] sm:text-xs font-black rounded-full bg-gradient-to-r from-red-600 to-red-700 text-white shadow-xl animate-pulse border border-white/50 uppercase tracking-wider" style="font-family: 'Arial Black', 'Helvetica Neue', sans-serif; text-shadow: 1px 1px 2px rgba(0,0,0,0.5); letter-spacing: 0.05em;">
                                <span>BREAKING</span>
                              </span>
                            }
                            @if (article.isFeatured) {
                              <span class="inline-flex items-center justify-center gap-1 px-2 py-1 text-[0.5rem] sm:text-xs font-black rounded-full bg-gradient-to-r from-yellow-500 to-amber-500 text-white shadow-xl border border-white/50 uppercase tracking-wider" style="font-family: 'Arial Black', 'Helvetica Neue', sans-serif; text-shadow: 1px 1px 2px rgba(0,0,0,0.5); letter-spacing: 0.05em;">
                                <span>FEATURED</span>
                              </span>
                            }
                          </div>
                        }
                      </div>
                      <!-- Border Line with Gradient -->
                      <div class="h-[2px] bg-gradient-to-r from-purple-500 via-pink-500 to-orange-500"></div>
                      <div class="p-3 pt-4 pb-4 bg-gradient-to-br from-background via-purple-50/5 dark:via-purple-900/5 to-background rounded-b-xl border-t border-purple-200/20 dark:border-purple-800/20 flex flex-col flex-1 min-h-0">
                        <div class="flex-1 min-w-0 mb-3 min-h-0">
                          <h3 
                            [class]="'font-display text-sm sm:text-base font-bold dark:font-normal leading-tight group-hover:opacity-90 transition-all duration-300 pb-1 cursor-pointer hover:opacity-80 hover:scale-[1.02] break-words ' + (article?.isTrending ? 'text-purple-700 dark:text-purple-300' : getHeadlineColor(category.title))"
                            (click)="openNewsModal(getCategoryKeyByIndex(catIndex), i)"
                            (touchstart)="onTouchStart($event, getCategoryKeyByIndex(catIndex), i)"
                            (touchend)="onTouchEnd($event, getCategoryKeyByIndex(catIndex), i)"
                            (touchmove)="onTouchMove($event)"
                            style="touch-action: manipulation !important; -webkit-touch-callout: none; word-wrap: break-word; overflow-wrap: break-word; hyphens: auto; -webkit-user-select: none; user-select: none; -webkit-tap-highlight-color: transparent;">
                            {{ article?.title }}
                          </h3>
                        </div>
                        <!-- Author and Date - Bottom aligned -->
                        <div class="flex items-center justify-between text-[0.65rem] sm:text-xs text-muted-foreground mt-auto pt-2 border-t border-border/30">
                          <span class="flex items-center gap-1">
                            <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                            </svg>
                            <span class="text-left">{{ getArticleAuthor(article, category.title, i) }}</span>
                          </span>
                          <span class="flex items-center gap-1">
                            <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <span>{{ article?.date || article?.time }}</span>
                          </span>
                        </div>
                      </div>
                    </article>
                  }
                </div>

                <!-- Right Arrow - Hide when scrolled all the way to the right (at the end), hidden on mobile -->
                <button
                  (click)="scrollRight(getCategoryKeyByIndex(catIndex))"
                  [class.opacity-0]="!canScrollRight(getCategoryKeyByIndex(catIndex))"
                  [class.pointer-events-none]="!canScrollRight(getCategoryKeyByIndex(catIndex))"
                  [class.invisible]="!canScrollRight(getCategoryKeyByIndex(catIndex))"
                  class="scroll-arrow-right hidden lg:flex absolute right-1 top-1/2 -translate-y-1/2 z-30 rounded-full bg-gradient-to-l from-primary/90 via-primary/80 to-primary/70 backdrop-blur-lg border-2 border-primary/50 shadow-xl sm:shadow-2xl items-center justify-center transition-all duration-300 hover:scale-110 sm:hover:scale-125 hover:shadow-[0_0_20px_rgba(168,85,247,0.6)] sm:hover:shadow-[0_0_30px_rgba(168,85,247,0.8)] hover:border-primary/80 active:scale-90 sm:active:scale-95 group/arrow touch-manipulation"
                  aria-label="Scroll right">
                  <div class="absolute inset-0 rounded-full bg-gradient-to-l from-purple-500/20 to-pink-500/20"></div>
                  <svg class="arrow-icon text-white relative z-10 drop-shadow-lg group-hover/arrow:translate-x-[2px] transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </div>
            </div>
          }
        </div>
      </div>
    </section>

    <!-- News Detail Modal -->
    @if (modalState.isOpen && modalState.news) {
      <app-news-detail-modal
        [news]="modalState.news"
        [isOpen]="modalState.isOpen"
        [isBreaking]="modalState.isBreaking || false"
        (closeModal)="closeModal()">
      </app-news-detail-modal>
    }
  `,
  styles: [`
    .scrollbar-hide {
      -ms-overflow-style: none !important;
      scrollbar-width: none !important;
      overflow-y: hidden !important;
      overflow-x: auto !important;
    }
    .scrollbar-hide::-webkit-scrollbar {
      display: none !important;
      width: 0 !important;
      height: 0 !important;
    }
    .scrollbar-hide::-webkit-scrollbar-track {
      display: none !important;
    }
    .scrollbar-hide::-webkit-scrollbar-thumb {
      display: none !important;
    }
    .scrollbar-hide::-webkit-scrollbar-vertical {
      display: none !important;
      width: 0 !important;
    }
    .scrollbar-hide::-webkit-scrollbar-horizontal {
      display: none !important;
      height: 0 !important;
    }
    /* Force hide all scrollbars for all browsers */
    [data-category] {
      overflow-y: hidden !important;
      scrollbar-width: none !important;
      -ms-overflow-style: none !important;
    }
    [data-category]::-webkit-scrollbar {
      display: none !important;
      width: 0 !important;
      height: 0 !important;
    }
    [data-category]::-webkit-scrollbar:vertical {
      display: none !important;
      width: 0 !important;
    }
    [data-category]::-webkit-scrollbar:horizontal {
      display: none !important;
      height: 0 !important;
    }
    [data-category]::-webkit-scrollbar-track {
      display: none !important;
    }
    [data-category]::-webkit-scrollbar-thumb {
      display: none !important;
    }
    [data-category]::-webkit-scrollbar-corner {
      display: none !important;
    }
    /* Hide scrollbar on hover and focus states */
    [data-category]:hover::-webkit-scrollbar,
    [data-category]:focus::-webkit-scrollbar,
    [data-category]:active::-webkit-scrollbar {
      display: none !important;
      width: 0 !important;
      height: 0 !important;
    }
    [data-category]:hover::-webkit-scrollbar-track,
    [data-category]:focus::-webkit-scrollbar-track,
    [data-category]:active::-webkit-scrollbar-track {
      display: none !important;
    }
    [data-category]:hover::-webkit-scrollbar-thumb,
    [data-category]:focus::-webkit-scrollbar-thumb,
    [data-category]:active::-webkit-scrollbar-thumb {
      display: none !important;
    }
    /* Hide scrollbar when arrow buttons are hovered - use attribute selector to avoid CSS syntax issues */
    .relative:hover [data-category]::-webkit-scrollbar,
    .relative:focus [data-category]::-webkit-scrollbar,
    .relative:active [data-category]::-webkit-scrollbar {
      display: none !important;
      width: 0 !important;
      height: 0 !important;
    }
    .relative:hover [data-category]::-webkit-scrollbar-track,
    .relative:focus [data-category]::-webkit-scrollbar-track,
    .relative:active [data-category]::-webkit-scrollbar-track {
      display: none !important;
    }
    .relative:hover [data-category]::-webkit-scrollbar-thumb,
    .relative:focus [data-category]::-webkit-scrollbar-thumb,
    .relative:active [data-category]::-webkit-scrollbar-thumb {
      display: none !important;
    }
    /* Ensure scrollbar-hide class works on hover */
    .scrollbar-hide:hover::-webkit-scrollbar,
    .scrollbar-hide:focus::-webkit-scrollbar,
    .scrollbar-hide:active::-webkit-scrollbar {
      display: none !important;
      width: 0 !important;
      height: 0 !important;
    }
    .scrollbar-hide:hover::-webkit-scrollbar-track,
    .scrollbar-hide:focus::-webkit-scrollbar-track,
    .scrollbar-hide:active::-webkit-scrollbar-track {
      display: none !important;
    }
    .scrollbar-hide:hover::-webkit-scrollbar-thumb,
    .scrollbar-hide:focus::-webkit-scrollbar-thumb,
    .scrollbar-hide:active::-webkit-scrollbar-thumb {
      display: none !important;
    }
    
    .news-card {
      scroll-snap-align: start;
      height: auto !important;
      min-height: auto !important;
    }
    
    /* Allow cards to expand dynamically based on content */
    .news-card > div:last-child {
      height: auto !important;
      min-height: auto !important;
    }
    
    /* Ensure headline can expand to show all text */
    .news-card h3 {
      white-space: normal !important;
      overflow: visible !important;
      text-overflow: clip !important;
      display: block !important;
      -webkit-line-clamp: unset !important;
      -webkit-box-orient: unset !important;
      line-height: 1.5 !important;
      word-wrap: break-word !important;
      overflow-wrap: break-word !important;
      hyphens: auto !important;
    }
    
    /* Smooth scroll snap */
    .scroll-smooth {
      scroll-snap-type: x mandatory;
    }
    
    /* Default arrow button sizes for desktop/tablet */
    .scroll-arrow-left,
    .scroll-arrow-right {
      width: 36px;
      height: 36px;
    }
    
    .scroll-arrow-left .arrow-icon,
    .scroll-arrow-right .arrow-icon {
      width: 16px;
      height: 16px;
    }
    
    @media (min-width: 640px) {
      .scroll-arrow-left,
      .scroll-arrow-right {
        width: 40px;
        height: 40px;
      }
      .scroll-arrow-left .arrow-icon,
      .scroll-arrow-right .arrow-icon {
        width: 20px;
        height: 20px;
      }
    }
    
    @media (min-width: 768px) {
      .scroll-arrow-left,
      .scroll-arrow-right {
        width: 48px;
        height: 48px;
      }
      .scroll-arrow-left .arrow-icon,
      .scroll-arrow-right .arrow-icon {
        width: 24px;
        height: 24px;
      }
    }
    
    @media (min-width: 1024px) {
      .scroll-arrow-left,
      .scroll-arrow-right {
        width: 56px;
        height: 56px;
      }
      .scroll-arrow-left .arrow-icon,
      .scroll-arrow-right .arrow-icon {
        width: 28px;
        height: 28px;
      }
    }
    
    /* Mobile-specific adjustments */
    @media (max-width: 1023px) {
      /* Hide navigation arrows on mobile and tablet */
      .scroll-arrow-left,
      .scroll-arrow-right {
        display: none !important;
        visibility: hidden !important;
        opacity: 0 !important;
        pointer-events: none !important;
      }
    }
    
    @media (max-width: 640px) {
      /* Reduce padding on mobile */
      section {
        padding-top: 2rem !important;
        padding-bottom: 2rem !important;
      }
      
      /* Ensure category headers are properly sized on mobile */
      h2 {
        font-size: 1.25rem !important;
        line-height: 1.5 !important;
      }
      
      /* Better spacing for category sections on mobile */
      .space-y-12 > div {
        margin-bottom: 2rem !important;
      }
      
      /* Ensure scrollable container has proper touch scrolling on mobile */
      [data-category] {
        -webkit-overflow-scrolling: touch !important;
        scroll-snap-type: x mandatory !important;
        overscroll-behavior-x: contain !important;
        padding-left: 0.5rem !important;
        padding-right: 0.5rem !important;
      }
      
      /* Ensure cards are properly sized on mobile */
      .news-card {
        width: 280px !important;
        min-width: 280px !important;
        flex-shrink: 0 !important;
        height: auto !important;
        min-height: auto !important;
        /* CRITICAL: Allow vertical page scrolling when touching anywhere on the card */
        touch-action: pan-x pan-y !important;
        -webkit-overflow-scrolling: touch !important;
        pointer-events: auto !important;
      }
      
      /* Allow headline to expand fully on mobile */
      .news-card h3 {
        white-space: normal !important;
        overflow: visible !important;
        text-overflow: clip !important;
        display: block !important;
        -webkit-line-clamp: unset !important;
        line-height: 1.5 !important;
        word-wrap: break-word !important;
        overflow-wrap: break-word !important;
        /* CRITICAL: Use manipulation for tap detection, but allow parent scrolling */
        touch-action: manipulation !important;
        -webkit-tap-highlight-color: transparent !important;
        pointer-events: auto !important;
        position: relative !important;
        z-index: 10 !important;
      }
      
      /* Ensure card container allows scrolling, but headline uses manipulation */
      .news-card > div:first-child {
        touch-action: pan-x pan-y !important;
      }
    }
    
    /* Tablet adjustments */
    @media (min-width: 641px) and (max-width: 1024px) {
      /* Medium-sized arrows for tablet */
      .relative.group\\/category button {
        width: 2.5rem !important;
        height: 2.5rem !important;
      }
    }
    
    /* Ensure proper touch targets on mobile */
    @media (max-width: 1024px) {
      button[aria-label*="Scroll"] {
        min-width: 44px !important;
        min-height: 44px !important;
      }
    }
    
    
    /* Tablet adjustments */
    @media (min-width: 641px) and (max-width: 1023px) {
      /* Adjust arrow button size for tablet */
      .relative button {
        width: 3rem !important;
        height: 3rem !important;
      }
      
      /* Ensure proper spacing on tablet */
      [data-category] {
        padding-left: 3.5rem !important;
        padding-right: 3.5rem !important;
      }
    }
    
    /* Ensure touch scrolling works smoothly on mobile */
    @media (max-width: 1023px) {
      [data-category] {
        -webkit-overflow-scrolling: touch !important;
        scroll-behavior: smooth !important;
        /* CRITICAL: Allow vertical scrolling to pass through to page, but contain horizontal scrolling */
        overscroll-behavior-x: contain !important;
        overscroll-behavior-y: auto !important;
        touch-action: pan-x pan-y !important;
      }
    }
  `]
})
export class CategorySectionComponent implements OnInit, OnDestroy, AfterViewInit {
  @Output() dataLoaded = new EventEmitter<boolean>();
  modalState: { isOpen: boolean; news: NewsArticle | null; isBreaking?: boolean } = {
    isOpen: false,
    news: null,
    isBreaking: false
  };
  categories: Category[] = [
    {
      title: 'Entertainment',
      accentColor: 'from-pink-500 to-rose-500',
      articles: [],
    },
    {
      title: 'Sports',
      accentColor: 'from-orange-500 to-amber-500',
      articles: [],
    },
    {
      title: 'National',
      accentColor: 'from-blue-500 to-blue-600',
      articles: [],
    },
    {
      title: 'International',
      accentColor: 'from-purple-500 to-purple-600',
      articles: [],
    },
    {
      title: 'Politics',
      accentColor: 'from-red-500 to-red-600',
      articles: [],
    },
    {
      title: 'Health',
      accentColor: 'from-green-500 to-green-600',
      articles: [],
    },
    {
      title: 'Business',
      accentColor: 'from-cyan-500 to-blue-500',
      articles: [],
    },
    {
      title: 'Technology',
      accentColor: 'from-indigo-500 to-purple-500',
      articles: [],
    },
    {
      title: 'Religious',
      accentColor: 'from-violet-500 to-indigo-500',
      articles: [],
    },
  ];

  isLoading = true;
  isHomePage = false;
  private originalNewsItems: { [key: string]: any[] } = {};
  t: any = {};
  private languageSubscription?: Subscription;
  scrollStates: { [key: string]: { canScrollLeft: boolean; canScrollRight: boolean } } = {};

  constructor(
    private newsService: NewsService,
    private modalService: ModalService,
    private languageService: LanguageService,
    private displayedNewsService: DisplayedNewsService,
    private router: Router
  ) {
    // Subscribe to modal state changes
    this.modalService.getModalState().subscribe(state => {
      this.modalState = state;
    });
  }

  ngOnInit() {
    this.checkIfHomePage();
    this.updateTranslations();
    this.updateCategoryTitles();
    
    // CRITICAL: Wait longer for NewsGrid to register its items first
    // Increased delay to ensure NewsGridComponent finishes registering all IDs
    // Then load category news to ensure proper duplicate filtering
    setTimeout(() => {
      this.loadCategoryNews();
    }, 500); // Increased from 100ms to 500ms to give NewsGridComponent more time
    
    this.initializeScrollStates();

    // Subscribe to displayed IDs changes - re-filter when NewsGrid registers new items
    // Use debounce to avoid excessive re-filtering
    let reFilterTimeout: any;
    this.displayedNewsService.displayedIds$.subscribe(() => {
      // Debounce re-filtering to avoid excessive calls
      if (reFilterTimeout) {
        clearTimeout(reFilterTimeout);
      }
      reFilterTimeout = setTimeout(() => {
        // Re-filter all categories when displayed IDs change
        this.reFilterAllCategories();
      }, 200); // Wait 200ms after IDs change to ensure all registrations are complete
    });

    // Subscribe to language changes
    this.languageSubscription = this.languageService.currentLanguage$.subscribe(async () => {
      this.updateTranslations();
      this.updateCategoryTitles();
      await this.updateArticleTitles();
      setTimeout(() => this.updateScrollStates(), 100);
    });

    // Subscribe to route changes
    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe(() => {
      this.checkIfHomePage();
    });
  }

  ngAfterViewInit() {
    setTimeout(() => {
      this.updateScrollStates();
    }, 500);
  }

  initializeScrollStates() {
    const categoryKeys = ['Entertainment', 'Sports', 'National', 'International', 'Politics', 'Health', 'Business', 'Technology', 'Religious'];
    categoryKeys.forEach(key => {
      // Initially assume we can scroll right if there are articles
      this.scrollStates[key] = { canScrollLeft: false, canScrollRight: true };
    });
  }

  getScrollContainer(categoryTitle: string): HTMLElement | null {
    // Try to find container by translated title first
    let containers = document.querySelectorAll(`[data-category="${categoryTitle}"]`);
    if (containers.length === 0) {
      // If not found, try to find by original category key
      const categoryKey = this.getCategoryKey(categoryTitle);
      containers = document.querySelectorAll(`[data-category="${categoryKey}"]`);
    }
    return containers.length > 0 ? containers[0] as HTMLElement : null;
  }

  updateScrollStates() {
    const categoryKeys = ['Entertainment', 'Sports', 'National', 'International', 'Politics', 'Health', 'Business', 'Technology', 'Religious'];
    categoryKeys.forEach(key => {
      const container = this.getScrollContainer(key);
      if (container) {
        const scrollLeft = container.scrollLeft;
        const scrollWidth = container.scrollWidth;
        const clientWidth = container.clientWidth;
        const canScrollLeft = scrollLeft > 5; // Small threshold for better UX
        const canScrollRight = scrollLeft < (scrollWidth - clientWidth - 5); // Small threshold
        this.scrollStates[key] = { canScrollLeft, canScrollRight };
      } else {
        // If container not found, check if category has articles
        const category = this.categories.find(c => c.title === key || this.getCategoryKey(c.title) === key);
        if (category && category.articles && category.articles.length > 3) {
          // If we have more than 3 articles, assume we can scroll right
          this.scrollStates[key] = { canScrollLeft: false, canScrollRight: true };
        }
      }
    });
  }

  getCategoryKey(translatedTitle: string): string {
    const categoryKeys = ['Entertainment', 'Sports', 'National', 'International', 'Politics', 'Health', 'Business', 'Technology', 'Religious'];
    const categoryIndex = this.categories.findIndex(c => c.title === translatedTitle);
    if (categoryIndex >= 0 && categoryIndex < categoryKeys.length) {
      return categoryKeys[categoryIndex];
    }
    return translatedTitle;
  }

  getCategoryKeyByIndex(index: number): string {
    const categoryKeys = ['Entertainment', 'Sports', 'National', 'International', 'Politics', 'Health', 'Business', 'Technology', 'Religious'];
    return categoryKeys[index] || '';
  }

  onScroll(categoryTitle: string, event: Event) {
    const target = event.target as HTMLElement;
    const scrollLeft = target.scrollLeft;
    const scrollWidth = target.scrollWidth;
    const clientWidth = target.clientWidth;
    const canScrollLeft = scrollLeft > 5;
    const canScrollRight = scrollLeft < (scrollWidth - clientWidth - 5);
    // Use both translated title and original key for state management
    const categoryKey = this.getCategoryKey(categoryTitle);
    this.scrollStates[categoryTitle] = { canScrollLeft, canScrollRight };
    if (categoryKey !== categoryTitle) {
      this.scrollStates[categoryKey] = { canScrollLeft, canScrollRight };
    }
  }

  canScrollLeft(categoryTitle: string): boolean {
    // Check both translated title and original key
    const categoryKey = this.getCategoryKey(categoryTitle);
    return this.scrollStates[categoryTitle]?.canScrollLeft || this.scrollStates[categoryKey]?.canScrollLeft || false;
  }

  canScrollRight(categoryTitle: string): boolean {
    // Check both translated title and original key
    const categoryKey = this.getCategoryKey(categoryTitle);
    const state = this.scrollStates[categoryTitle] || this.scrollStates[categoryKey];
    // Default to true if state doesn't exist (for initial load)
    if (!state) {
      const category = this.categories.find(c => c.title === categoryTitle || this.getCategoryKey(c.title) === categoryKey);
      return category && category.articles && category.articles.length > 3;
    }
    return state.canScrollRight !== false;
  }

  scrollLeft(categoryTitle: string) {
    const container = this.getScrollContainer(categoryTitle);
    if (container) {
      // Calculate card width based on viewport
      const isMobile = window.innerWidth < 640;
      const isTablet = window.innerWidth >= 640 && window.innerWidth < 1024;
      const cardWidth = isMobile ? 280 : (isTablet ? 320 : 360);
      const gap = isMobile ? 16 : 24; // gap-4 = 16px, gap-6 = 24px
      const scrollAmount = cardWidth + gap;
      container.scrollBy({ left: -scrollAmount, behavior: 'smooth' });
      setTimeout(() => this.updateScrollStates(), 300);
    }
  }

  scrollRight(categoryTitle: string) {
    const container = this.getScrollContainer(categoryTitle);
    if (container) {
      // Calculate card width based on viewport
      const isMobile = window.innerWidth < 640;
      const isTablet = window.innerWidth >= 640 && window.innerWidth < 1024;
      const cardWidth = isMobile ? 280 : (isTablet ? 320 : 360);
      const gap = isMobile ? 16 : 24; // gap-4 = 16px, gap-6 = 24px
      const scrollAmount = cardWidth + gap;
      container.scrollBy({ left: scrollAmount, behavior: 'smooth' });
      setTimeout(() => this.updateScrollStates(), 300);
    }
  }

  checkIfHomePage() {
    this.isHomePage = this.router.url === '/' || this.router.url === '';
  }

  ngOnDestroy() {
    this.languageSubscription?.unsubscribe();
  }

  updateTranslations() {
    this.t = this.languageService.getTranslations();
  }

  getCategorySlug(categoryTitle: string): string {
    // Map category titles to their route slugs
    const slugMap: Record<string, string> = {
      'Entertainment': 'entertainment',
      'Sports': 'sports',
      'National': 'national',
      'International': 'international',
      'Politics': 'politics',
      'Health': 'health',
      'Business': 'business',
      'Technology': 'technology',
      'Religious': 'religious',
    };
    // Try to find exact match first
    if (slugMap[categoryTitle]) {
      return slugMap[categoryTitle];
    }
    // Fallback: convert to lowercase
    return categoryTitle.toLowerCase();
  }

  updateCategoryTitles() {
    const categoryKeys = ['Entertainment', 'Sports', 'National', 'International', 'Politics', 'Health', 'Business', 'Technology', 'Religious'];
    this.categories.forEach((category, index) => {
      if (index < categoryKeys.length) {
        category.title = this.languageService.translateCategory(categoryKeys[index]);
      }
    });
  }

  async updateArticleTitles() {
    // Update article titles based on language with real-time translation
    const categoryKeys = ['Entertainment', 'Sports', 'National', 'International', 'Politics', 'Health', 'Business', 'Technology', 'Religious'];
    
    for (const category of this.categories) {
      const catIndex = this.categories.indexOf(category);
      if (catIndex < categoryKeys.length) {
        const categoryKey = categoryKeys[catIndex];
        const originalNews = this.originalNewsItems[categoryKey];
        if (originalNews && originalNews.length > 0) {
          // Process all articles (up to 3)
          const translatedArticles = await Promise.all(originalNews.map(async (newsItem) => {
            let translatedTitle = this.languageService.getDisplayTitle(newsItem.title, newsItem.titleEn);
            // If titleEn doesn't exist or we need real-time translation, use Google Translate
            if (!newsItem.titleEn || this.languageService.getCurrentLanguage() === 'hi') {
              try {
                translatedTitle = await this.languageService.translateToCurrentLanguage(newsItem.title);
              } catch (error) {
                console.warn(`Failed to translate title for ${categoryKey}:`, error);
                translatedTitle = this.languageService.getDisplayTitle(newsItem.title, newsItem.titleEn);
              }
            }
            return {
              id: newsItem.id, // Preserve MongoDB _id
              title: translatedTitle,
              image: newsItem.image || '',
              time: newsItem.time,
              date: newsItem.date,
              hasVideo: true,
              imageLoading: !newsItem.image || newsItem.image.trim() === '',
              isTrending: newsItem.isTrending || false,
              isBreaking: newsItem.isBreaking || false,
              isFeatured: newsItem.isFeatured || false
            };
          }));
          category.articles = translatedArticles; // Up to 3 articles
        }
      }
    }
  }

  loadCategoryNews() {
    const categoryConfigs = [
      { index: 0, key: 'Entertainment', slug: 'entertainment' },
      { index: 1, key: 'Sports', slug: 'sports' },
      { index: 2, key: 'National', slug: 'national' },
      { index: 3, key: 'International', slug: 'international' },
      { index: 4, key: 'Politics', slug: 'politics' },
      { index: 5, key: 'Health', slug: 'health' },
      { index: 6, key: 'Business', slug: 'business' },
      { index: 7, key: 'Technology', slug: 'technology' },
      { index: 8, key: 'Religious', slug: 'religious' },
    ];

    let loadedCount = 0;
    const totalCategories = categoryConfigs.length;
    const allImagePromises: Promise<void>[] = [];

    categoryConfigs.forEach((config) => {
      // Fetch minimum 50 articles for horizontal scrolling
      // Fetch 70 to account for filtering duplicates (which might remove some articles)
      const targetCount = 50;
      const fetchCount = 70;
      
      this.newsService.fetchNewsByPage(config.slug, fetchCount).subscribe({
        next: async (news) => {
          // CRITICAL: Ensure all articles use MongoDB _id from database
          // Only normalize existing IDs - don't assign fallback IDs for database articles
          const newsWithIds = news.map(item => {
            // Normalize ID to string for consistent comparison
            // Database articles should always have _id, so preserve it
            if (item.id) {
              item.id = typeof item.id === 'string' ? item.id : item.id.toString();
            }
            // Don't assign fallback IDs - articles without IDs are from external sources
            // and shouldn't have "Read more" buttons anyway
            return item;
          });
          
          console.log(`[CategorySection] ${config.key}: Fetched ${news.length} articles, ${newsWithIds.filter(n => n.id).length} have IDs`);
          console.log(`[CategorySection] ${config.key}: Article IDs:`, newsWithIds.map(n => ({ id: n.id, title: n.title?.substring(0, 30) })));
          
          // CRITICAL: Wait a bit more to ensure NewsGridComponent has finished registering all IDs
          // This prevents race conditions where CategorySection checks displayedIds before NewsGrid finishes
          await new Promise(resolve => setTimeout(resolve, 300)); // Wait 300ms before filtering
          
          const displayedIdsBeforeFilter = this.displayedNewsService.getDisplayedIds(); // This returns a Set<string>
          const displayedIdsArray = Array.from(displayedIdsBeforeFilter);
          console.log(`[CategorySection] ${config.key}: Displayed IDs before filtering:`, displayedIdsArray.length, 'IDs');
          console.log(`[CategorySection] ${config.key}: Displayed IDs list:`, displayedIdsArray.slice(0, 20), '...');
          
          // CRITICAL: Filter out already displayed articles (including the 6 Latest Stories items)
          // This ensures no duplicates between Latest Stories and Category Sections
          const filteredNews = this.displayedNewsService.filterDisplayed(newsWithIds);
          
          console.log(`[CategorySection] ${config.key}: After filtering displayed: ${filteredNews.length} articles remaining (out of ${newsWithIds.length})`);
          const filteredOutCount = newsWithIds.length - filteredNews.length;
          if (filteredOutCount > 0) {
            console.log(`[CategorySection] ${config.key}: ✅ Filtered out ${filteredOutCount} duplicate articles`);
            const filteredOutIds = newsWithIds
              .filter(n => !filteredNews.find(f => f.id === n.id))
              .map(n => ({ id: n.id, title: n.title?.substring(0, 30) }));
            console.log(`[CategorySection] ${config.key}: Filtered out IDs:`, filteredOutIds);
          } else {
            console.warn(`[CategorySection] ${config.key}: ⚠️ NO ARTICLES FILTERED OUT - Possible duplicate issue!`);
            console.warn(`[CategorySection] ${config.key}: Checking if any article IDs match displayed IDs...`);
            // Debug: Check if any IDs actually match
            const matchingIds = newsWithIds.filter(n => {
              if (!n.id) return false;
              const normalizedId = typeof n.id === 'string' ? n.id : n.id.toString();
              return displayedIdsBeforeFilter.has(normalizedId); // Now using Set.has() correctly
            });
            if (matchingIds.length > 0) {
              console.warn(`[CategorySection] ${config.key}: Found ${matchingIds.length} matching IDs that should have been filtered:`, matchingIds.map(n => ({ id: n.id, title: n.title?.substring(0, 30) })));
            } else {
              console.log(`[CategorySection] ${config.key}: No matching IDs found - articles are unique`);
            }
          }
          
          // Take minimum 50 articles (or all available if less than 50)
          const articlesToShow = filteredNews && filteredNews.length > 0 
            ? filteredNews.slice(0, Math.max(targetCount, filteredNews.length)) 
            : [];
          this.originalNewsItems[config.key] = articlesToShow;
          
          // Register displayed articles AFTER filtering to prevent duplicates
          if (articlesToShow.length > 0) {
            const displayedIds = articlesToShow.map(n => n.id).filter(id => id !== undefined) as (string | number)[];
            console.log(`[CategorySection] ${config.key}: Registering ${displayedIds.length} article IDs`);
            this.displayedNewsService.registerDisplayedMultiple(displayedIds);
          }
          
          // OPTIMIZATION: Load only first 20 visible cards per category initially
          // This dramatically speeds up initial page load
          const initialVisibleCards = 20;
          const initialArticles = articlesToShow.slice(0, initialVisibleCards);
          const remainingArticles = articlesToShow.slice(initialVisibleCards);
          
          // Translate titles for initial visible articles only
          if (initialArticles.length > 0) {
            const translatedArticles = await Promise.all(initialArticles.map(async (newsItem) => {
              let translatedTitle = this.languageService.getDisplayTitle(newsItem.title, newsItem.titleEn);
              try {
                translatedTitle = await this.languageService.translateToCurrentLanguage(newsItem.title);
              } catch (error) {
                console.warn(`Failed to translate title for ${config.key}:`, error);
              }
              return {
                id: newsItem.id, // Preserve MongoDB _id
                title: translatedTitle,
                image: newsItem.image || '',
                time: newsItem.time,
                date: newsItem.date,
                hasVideo: true,
                imageLoading: !newsItem.image || newsItem.image.trim() === '',
                isTrending: newsItem.isTrending || false,
                isBreaking: newsItem.isBreaking || false,
                isFeatured: newsItem.isFeatured || false
              };
            }));
            this.categories[config.index].articles = translatedArticles; // Only 20 articles initially
          } else {
            this.categories[config.index].articles = [];
          }
          
          // Fetch images for initial visible cards only
          const categoryImagePromises = this.fetchImagesForCategory(config.index, initialArticles, true);
          categoryImagePromises.forEach(promise => allImagePromises.push(promise));
          
          // Lazy load remaining cards in background (don't block page load)
          if (remainingArticles.length > 0) {
            setTimeout(() => {
              // Translate and add remaining articles
              Promise.all(remainingArticles.map(async (newsItem) => {
                let translatedTitle = this.languageService.getDisplayTitle(newsItem.title, newsItem.titleEn);
                try {
                  translatedTitle = await this.languageService.translateToCurrentLanguage(newsItem.title);
                } catch (error) {
                  console.warn(`Failed to translate title for ${config.key}:`, error);
                }
                return {
                  id: newsItem.id, // Preserve MongoDB _id
                  title: translatedTitle,
                  image: newsItem.image || '',
                  time: newsItem.time,
                  date: newsItem.date,
                  hasVideo: true,
                  imageLoading: !newsItem.image || newsItem.image.trim() === '',
                  isTrending: newsItem.isTrending || false,
                  isBreaking: newsItem.isBreaking || false,
                  isFeatured: newsItem.isFeatured || false
                };
              })).then(translatedRemaining => {
                // Add remaining articles to the category
                this.categories[config.index].articles = [...this.categories[config.index].articles, ...translatedRemaining];
                // Load images for remaining articles
                this.fetchImagesForCategory(config.index, remainingArticles, true);
              });
            }, 1000); // Start loading after 1 second
          }
          
          loadedCount++;
          if (loadedCount === totalCategories) {
            this.isLoading = false;
            // OPTIMIZATION: Reduced timeout from 20s to 10s - only wait for visible cards
            const timeoutPromise = new Promise<void>((resolve) => {
              setTimeout(() => {
                console.warn('Category section image loading timeout - showing page anyway');
                resolve();
              }, 10000); // 10 second timeout (reduced from 20s)
            });
            
            Promise.race([Promise.all(allImagePromises), timeoutPromise]).then(() => {
              setTimeout(() => this.updateScrollStates(), 300);
              this.dataLoaded.emit(true);
              console.log('All category section visible images loaded');
            });
          }
        },
        error: (error) => {
          console.error(`Error loading ${config.key} news:`, error);
          loadedCount++;
          if (loadedCount === totalCategories) {
            this.isLoading = false;
            // Even on error, emit dataLoaded after a short delay
            setTimeout(() => {
              this.dataLoaded.emit(true);
            }, 1000);
          }
        }
      });
    });
  }

  fetchImagesForCategory(categoryIndex: number, newsItems: any[], updateArticles: boolean = true): Promise<void>[] {
    const category = this.categories[categoryIndex];
    const imagePromises: Promise<void>[] = [];
    
    if (!category || !newsItems || newsItems.length === 0) {
      return imagePromises;
    }

    // OPTIMIZATION: For lazy loading (updateArticles=false), just preload images without updating articles
    if (!updateArticles) {
      newsItems.forEach((newsItem) => {
        if (newsItem.image && newsItem.image.trim() !== '') {
          const imagePromise = new Promise<void>((resolve) => {
            const img = new Image();
            img.onload = () => resolve();
            img.onerror = () => resolve(); // Don't block on errors
            img.src = newsItem.image;
          });
          imagePromises.push(imagePromise);
        }
      });
      return imagePromises;
    }

    // For initial load, update articles array
    if (!category.articles || category.articles.length === 0) {
      return imagePromises;
    }

    category.articles.forEach((article, index) => {
      if (index >= newsItems.length) return;
      
      const newsItem = newsItems[index];
      if (!newsItem) return;

      // Use image from database or placeholder (no external API calls)
      if (article.imageLoading || !article.image || article.image.trim() === '') {
        if (newsItem.image && newsItem.image.trim() !== '') {
          // Use image from database
          const imagePromise = new Promise<void>((resolve) => {
            const img = new Image();
            img.onload = () => {
              article.image = newsItem.image;
              article.imageLoading = false;
              resolve();
            };
            img.onerror = () => {
              // If image fails to load, use placeholder
              article.image = this.newsService.getPlaceholderImage(newsItem.title);
              article.imageLoading = false;
              resolve();
            };
            img.src = newsItem.image;
          });
          imagePromises.push(imagePromise);
        } else {
          // No image in database - use placeholder
          const imagePromise = new Promise<void>((resolve) => {
            article.image = this.newsService.getPlaceholderImage(newsItem.title);
            article.imageLoading = false;
            resolve();
          });
          imagePromises.push(imagePromise);
        }
      } else {
        // If image already exists, ensure it's not in loading state
        article.imageLoading = false;
        imagePromises.push(Promise.resolve());
      }
    });
    
    return imagePromises;
  }


  // Touch handling to prevent accidental opens on mobile
  private touchStartTime: number = 0;
  private touchStartX: number = 0;
  private touchStartY: number = 0;
  private touchMoved: boolean = false;
  private touchTarget: { categoryTitle: string; articleIndex: number } | null = null;

  onTouchStart(event: TouchEvent, categoryTitle: string, articleIndex: number) {
    // Store touch start info but don't prevent default - allow scrolling
    this.touchStartTime = Date.now();
    this.touchStartX = event.touches[0].clientX;
    this.touchStartY = event.touches[0].clientY;
    this.touchMoved = false;
    this.touchTarget = { categoryTitle, articleIndex };
  }

  onTouchMove(event: TouchEvent) {
    // Detect if touch moved significantly (indicating a scroll gesture)
    if (this.touchStartTime > 0) {
      const deltaX = Math.abs(event.touches[0].clientX - this.touchStartX);
      const deltaY = Math.abs(event.touches[0].clientY - this.touchStartY);
      // If touch moved more than 5px in any direction, consider it a scroll
      // Use smaller threshold for better tap detection
      if (deltaY > 5 || deltaX > 5) {
        this.touchMoved = true;
      }
    }
  }

  onTouchEnd(event: TouchEvent, categoryTitle: string, articleIndex: number) {
    // Only process if this touch matches our target
    if (!this.touchTarget || 
        this.touchTarget.categoryTitle !== categoryTitle || 
        this.touchTarget.articleIndex !== articleIndex) {
      this.resetTouchState();
      return;
    }

    const touchDuration = Date.now() - this.touchStartTime;
    const deltaX = Math.abs(event.changedTouches[0].clientX - this.touchStartX);
    const deltaY = Math.abs(event.changedTouches[0].clientY - this.touchStartY);
    
    // Open modal if it was a tap (not a scroll):
    // 1. Touch didn't move much (less than 8px) - more lenient threshold
    // 2. Touch was quick (less than 400ms) - more lenient for slower taps
    // 3. Touch target matches (already checked above)
    const isTap = !this.touchMoved && deltaX < 8 && deltaY < 8 && touchDuration < 400;
    
    if (isTap) {
      // Prevent default to avoid triggering click event twice
      // But ensure modal opens via touch handler
      event.preventDefault();
      event.stopPropagation();
      // Small delay to ensure touch event completes before opening modal
      setTimeout(() => {
        this.openNewsModal(categoryTitle, articleIndex);
      }, 10);
    }
    
    // Reset touch state
    this.resetTouchState();
  }

  private resetTouchState() {
    this.touchStartTime = 0;
    this.touchMoved = false;
    this.touchTarget = null;
  }

  getOriginalCategoryKey(translatedTitle: string): string {
    const categoryKeys = ['Entertainment', 'Sports', 'National', 'International', 'Politics', 'Health', 'Business', 'Technology', 'Religious'];
    const categoryIndex = this.categories.findIndex(c => c.title === translatedTitle);
    if (categoryIndex >= 0 && categoryIndex < categoryKeys.length) {
      return categoryKeys[categoryIndex];
    }
    return translatedTitle; // Fallback
  }

  openNewsModal(categoryTitle: string, articleIndex: number) {
    // Prevent multiple rapid clicks/taps
    if (this.modalState.isOpen) {
      return;
    }

    const category = this.categories.find(c => c.title === categoryTitle);
    if (!category || !category.articles || articleIndex >= category.articles.length) {
      console.warn(`[CategorySection] Cannot open modal: category=${categoryTitle}, index=${articleIndex}, articles=${category?.articles?.length || 0}`);
      return;
    }

    const article = category.articles[articleIndex];
    if (!article) {
      console.warn(`[CategorySection] Article not found at index ${articleIndex}`);
      return;
    }

    const originalCategoryKey = this.getOriginalCategoryKey(categoryTitle);
    const originalNews = this.originalNewsItems[originalCategoryKey];

    if (originalNews && originalNews[articleIndex]) {
      // Use the original NewsArticle from the service (has full data including MongoDB _id)
      const newsArticle = originalNews[articleIndex];
      this.modalService.openModal(newsArticle, false);
    } else if (article.id) {
      // Article has an ID - create NewsArticle with the actual ID from the article
      // This ensures we use the MongoDB _id even if originalNewsItems lookup fails
      const newsArticle: NewsArticle = {
        id: article.id, // Use the actual MongoDB _id from the article
        category: originalCategoryKey,
        title: article.title,
        titleEn: article.title,
        excerpt: article.title, // Use title as excerpt
        image: article.image,
        imageLoading: article.imageLoading || false,
        time: article.time,
        author: 'News Adda India',
        date: article.date || new Date().toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' }),
        isTrending: article.isTrending || false,
        isBreaking: article.isBreaking || false,
        isFeatured: article.isFeatured || false
      };
      this.modalService.openModal(newsArticle, false);
    } else {
      // No ID available - this shouldn't happen for database articles
      console.warn(`[CategorySection] Article at index ${articleIndex} in category ${categoryTitle} has no ID. Cannot open detail page.`);
      // Don't open modal if there's no valid ID
    }
  }

  closeModal() {
    this.modalService.closeModal();
  }

  getArticleAuthor(article: Article, categoryTitle?: string, articleIndex?: number): string {
    // Try to get author from original news items
    if (categoryTitle && articleIndex !== undefined) {
      const originalCategoryKey = this.getOriginalCategoryKey(categoryTitle);
      const originalNews = this.originalNewsItems[originalCategoryKey];
      if (originalNews && originalNews[articleIndex]) {
        return originalNews[articleIndex].author || 'News Adda India';
      }
    }
    // Fallback to default
    return 'News Adda India';
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
      'Religious': 'bg-gradient-to-r from-indigo-600 to-violet-600 bg-clip-text text-transparent dark:bg-none dark:text-indigo-300',
    };
    return colors[category] || 'bg-gradient-to-r from-primary to-primary/80 bg-clip-text text-transparent dark:bg-none dark:text-primary-foreground';
  }

  /**
   * Hash a string to a number (for consistent ID generation)
   * Same method as NewsGridComponent to ensure articles get the same ID
   */
  private hashString(str: string): number {
    let hash = 0;
    if (str.length === 0) return hash;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    return Math.abs(hash);
  }

  /**
   * Re-filter all categories when displayed IDs change
   * This ensures duplicates are removed when NewsGrid registers items
   */
  private async reFilterAllCategories(): Promise<void> {
    console.log('[CategorySection] Re-filtering categories due to displayed IDs change');
    const displayedIds = Array.from(this.displayedNewsService.getDisplayedIds());
    console.log('[CategorySection] Current displayed IDs count:', displayedIds.length);
    console.log('[CategorySection] Displayed IDs:', Array.from(displayedIds).slice(0, 20), '...');
    
    const categoryConfigs = [
      { index: 0, key: 'Entertainment', slug: 'entertainment' },
      { index: 1, key: 'Sports', slug: 'sports' },
      { index: 2, key: 'National', slug: 'national' },
      { index: 3, key: 'International', slug: 'international' },
      { index: 4, key: 'Politics', slug: 'politics' },
      { index: 5, key: 'Health', slug: 'health' },
      { index: 6, key: 'Business', slug: 'business' },
      { index: 7, key: 'Technology', slug: 'technology' },
      { index: 8, key: 'Religious', slug: 'religious' },
    ];

    // Use Promise.all to ensure all async operations complete
    await Promise.all(categoryConfigs.map(async (config) => {
      const originalNews = this.originalNewsItems[config.key];
      if (originalNews && originalNews.length > 0) {
        // Ensure IDs are consistent and normalized
        const newsWithIds = originalNews.map(item => {
          if (item.id) {
            item.id = typeof item.id === 'string' ? item.id : item.id.toString();
          } else if (item.title) {
            const titleHash = this.hashString(item.title.trim());
            item.id = `title_hash_${titleHash}`;
          }
          return item;
        });

        // Re-filter against displayed IDs
        const filteredNews = this.displayedNewsService.filterDisplayed(newsWithIds);
        
        // CRITICAL: Update originalNewsItems to the filtered list to prevent duplicates in future re-filters
        this.originalNewsItems[config.key] = filteredNews;
        
        // Update the displayed articles (only first 20 visible)
        const initialVisibleCards = 20;
        const articlesToShow = filteredNews.slice(0, initialVisibleCards);
        
        if (articlesToShow.length > 0) {
          // Translate titles if needed
          const translatedArticles = await Promise.all(articlesToShow.map(async (newsItem) => {
            let translatedTitle = this.languageService.getDisplayTitle(newsItem.title, newsItem.titleEn);
            try {
              translatedTitle = await this.languageService.translateToCurrentLanguage(newsItem.title);
            } catch (error) {
              console.warn(`Failed to translate title for ${config.key}:`, error);
            }
            return {
              id: newsItem.id, // Preserve MongoDB _id
              title: translatedTitle,
              image: newsItem.image || '',
              time: newsItem.time,
              date: newsItem.date,
              hasVideo: true,
              imageLoading: !newsItem.image || newsItem.image.trim() === '',
              isTrending: newsItem.isTrending || false,
              isBreaking: newsItem.isBreaking || false,
              isFeatured: newsItem.isFeatured || false
            };
          }));
          
          // Update the category articles
          this.categories[config.index].articles = translatedArticles;
          
          const removedCount = originalNews.length - filteredNews.length;
          console.log(`[CategorySection] Re-filtered ${config.key}: ${articlesToShow.length} visible articles (removed ${removedCount} duplicates from ${originalNews.length} total)`);
          if (removedCount > 0) {
            const removedIds = newsWithIds
              .filter(n => !filteredNews.find(f => f.id === n.id))
              .map(n => ({ id: n.id, title: n.title?.substring(0, 30) }));
            console.log(`[CategorySection] Removed duplicate IDs from ${config.key}:`, removedIds.slice(0, 10), removedIds.length > 10 ? '...' : '');
          } else {
            console.log(`[CategorySection] No duplicates found in ${config.key} (all ${filteredNews.length} articles are unique)`);
          }
        } else {
          console.warn(`[CategorySection] ${config.key}: No articles to show after re-filtering!`);
        }
      }
    }));
    
    console.log('[CategorySection] Finished re-filtering all categories');
  }
}

