import { Component, OnInit, OnDestroy, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, NavigationEnd } from '@angular/router';
import { NewsService, NewsArticle } from '../../services/news.service';
import { ModalService } from '../../services/modal.service';
import { LanguageService } from '../../services/language.service';
import { DisplayedNewsService } from '../../services/displayed-news.service';
import { NewsDetailModalComponent } from '../news-detail-modal/news-detail-modal.component';
import { Subscription } from 'rxjs';
import { filter } from 'rxjs/operators';

// Using NewsArticle from service

@Component({
  selector: 'app-news-grid',
  standalone: true,
  imports: [CommonModule, NewsDetailModalComponent],
  template: `
    <section [class]="'py-12 lg:py-16 news-grid-container ' + (isHomePage ? 'home-page' : '')">
      <div class="container mx-auto px-4">
        <!-- Section Header -->
        <div class="flex items-center justify-between mb-8">
          <div>
            <h2 class="font-display text-2xl lg:text-3xl font-bold leading-relaxed pt-2 pb-1">
              {{ t.latestStories }}
            </h2>
            <p class="text-muted-foreground mt-1">{{ t.stayUpdated }}</p>
          </div>
        </div>

        <!-- Loading State - Show while fetching news and images -->
        @if (isLoading) {
          <div class="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            @for (item of [1,2,3,4,5,6]; track $index) {
              <article class="news-card group">
                <div class="relative aspect-[16/10] overflow-hidden rounded-t-xl bg-secondary/20">
                  <div class="absolute inset-0 flex items-center justify-center bg-secondary/50">
                    <div class="flex flex-col items-center gap-2">
                      <div class="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
                      <span class="text-xs text-muted-foreground">Loading image...</span>
                    </div>
                  </div>
                </div>
                <div class="p-5 bg-background rounded-b-xl">
                  <div class="h-4 bg-secondary/50 rounded mb-2 animate-pulse"></div>
                  <div class="h-3 bg-secondary/30 rounded mb-4 animate-pulse"></div>
                </div>
              </article>
            }
          </div>
        }

        <!-- News Grid - Show when items are available (even if still loading images) -->
        @if (newsItems.length > 0) {
          <!-- Debug: Show item count -->
          <div class="text-xs text-muted-foreground mb-2">Loaded: {{ newsItems.length }} items, isLoading: {{ isLoading }}</div>
          <div [class]="'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 ' + (isHomePage ? 'gap-2 sm:gap-4 lg:gap-6' : 'gap-2 sm:gap-5 lg:gap-6')">
            @for (news of newsItems; track news.id; let i = $index) {
            <article
              [class]="'news-card group opacity-0 animate-fade-in hover:shadow-2xl hover:shadow-purple-500/20 transition-all duration-300 flex flex-col ' + (isHomePage ? 'home-page-card' : '')"
              [style.animation-delay]="i * 100 + 'ms'">
            <div [class]="'relative overflow-hidden rounded-t-xl bg-gradient-to-br from-purple-100/20 via-pink-100/20 to-orange-100/20 dark:from-purple-900/20 dark:via-pink-900/20 dark:to-orange-900/20 border-2 border-transparent hover:border-purple-300/50 dark:hover:border-purple-700/50 transition-all duration-300 ' + (isHomePage ? 'w-full sm:flex-none sm:aspect-[16/10]' : 'w-full sm:flex-none sm:aspect-[16/10]')">
                <!-- Loading Animation - Show while image is loading -->
                @if (news.imageLoading || !news.image) {
                  <div class="absolute inset-0 flex items-center justify-center bg-secondary/50 z-10">
                    <div class="flex flex-col items-center gap-2">
                      <div class="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
                      <span class="text-xs text-muted-foreground">Loading image...</span>
                    </div>
                  </div>
                }
                <!-- Image - Only show when loaded -->
                @if (news.image && !news.imageLoading) {
                  <img
                    [src]="news.image"
                    [alt]="news.title"
                    class="w-full h-full object-cover transition-all duration-500 group-hover:scale-110 animate-fade-in"
                    loading="lazy"
                    decoding="async"
                    style="filter: none !important; -webkit-filter: none !important; backdrop-filter: none !important; blur: none !important; image-rendering: auto !important; -webkit-font-smoothing: antialiased; -moz-osx-font-smoothing: grayscale; backface-visibility: hidden; transform: translateZ(0); will-change: transform;" />
                }
                @if (!isHomePage) {
                  <div class="absolute top-2 left-2 sm:top-4 sm:left-4 z-20 flex gap-1 sm:gap-2 flex-wrap">
                    @if (news.isTrending) {
                      <span class="inline-flex items-center justify-center gap-1 sm:gap-1.5 px-2 py-1 sm:px-3 sm:py-1.5 text-[0.525rem] sm:text-xs font-black rounded-full bg-gradient-to-r from-purple-600 via-pink-500 to-fuchsia-600 text-white shadow-xl animate-pulse border border-white/50 sm:border-2 sm:border-white/50 uppercase tracking-wider" style="font-family: 'Arial Black', 'Helvetica Neue', sans-serif; text-shadow: 1px 1px 2px rgba(0,0,0,0.5), 0 0 4px rgba(255,255,255,0.3); letter-spacing: 0.07em;">
                        <svg class="w-2.5 h-2.5 sm:w-3.5 sm:h-3.5 text-white flex-shrink-0" fill="currentColor" viewBox="0 0 24 24" style="filter: drop-shadow(0 1px 1px rgba(0,0,0,0.4));">
                          <path d="M13 10V3L4 14h7v7l9-11h-7z"/>
                        </svg>
                        <span class="text-[0.5rem] sm:text-xs leading-none">🔥</span>
                        <span>TRENDING</span>
                        <span class="text-[0.5rem] sm:text-xs leading-none">🔥</span>
                      </span>
                    }
                    @if (news.isBreaking) {
                      <span class="inline-flex items-center justify-center gap-1 sm:gap-1.5 px-2 py-1 sm:px-3 sm:py-1.5 text-[0.525rem] sm:text-xs font-black rounded-full bg-gradient-to-r from-red-600 to-red-700 text-white shadow-xl animate-pulse border border-white/50 sm:border-2 sm:border-white/50 uppercase tracking-wider" style="font-family: 'Arial Black', 'Helvetica Neue', sans-serif; text-shadow: 1px 1px 2px rgba(0,0,0,0.5), 0 0 4px rgba(255,255,255,0.3); letter-spacing: 0.07em;">
                        <svg class="w-2.5 h-2.5 sm:w-3.5 sm:h-3.5 text-white flex-shrink-0" fill="currentColor" viewBox="0 0 24 24" style="filter: drop-shadow(0 1px 1px rgba(0,0,0,0.4));">
                          <path d="M13 10V3L4 14h7v7l9-11h-7z"/>
                        </svg>
                        <span>BREAKING</span>
                      </span>
                    }
                    @if (news.isFeatured) {
                      <span class="inline-flex items-center justify-center gap-1 sm:gap-1.5 px-2 py-1 sm:px-3 sm:py-1.5 text-[0.525rem] sm:text-xs font-black rounded-full bg-gradient-to-r from-yellow-500 to-amber-500 text-white shadow-xl border border-white/50 sm:border-2 sm:border-white/50 uppercase tracking-wider" style="font-family: 'Arial Black', 'Helvetica Neue', sans-serif; text-shadow: 1px 1px 2px rgba(0,0,0,0.5), 0 0 4px rgba(255,255,255,0.3); letter-spacing: 0.07em;">
                        <svg class="w-2.5 h-2.5 sm:w-3.5 sm:h-3.5 text-white flex-shrink-0" fill="currentColor" viewBox="0 0 24 24" style="filter: drop-shadow(0 1px 1px rgba(0,0,0,0.4));">
                          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                        </svg>
                        <span>FEATURED</span>
                      </span>
                    }
                    <span [class]="'inline-flex items-center justify-center px-2 py-0.75 sm:px-3 sm:py-1 text-[0.525rem] sm:text-xs font-semibold rounded-full shadow-lg ' + getCategoryColor(news.category)">
                      {{ getCategoryName(news.category) }}
                    </span>
                  </div>
                }
              </div>

              <!-- Border Line with Gradient - Hidden on mobile home page -->
              <div [class]="'h-[2px] bg-gradient-to-r from-purple-500 via-pink-500 to-orange-500 ' + (isHomePage ? 'hidden lg:block' : '')"></div>

              <div [class]="'bg-gradient-to-br from-background via-purple-50/5 dark:via-purple-900/5 to-background rounded-b-xl border-t border-purple-200/20 dark:border-purple-800/20 flex flex-col ' + (isHomePage ? 'p-2 pt-2 pb-2 sm:p-3 sm:pt-3 sm:pb-3 lg:h-full lg:p-5 lg:pt-6 lg:pb-6' : 'h-full p-3 pt-3 pb-3 sm:p-4 sm:pt-4 sm:pb-4 lg:p-5 lg:pt-6 lg:pb-6')">
                <h3 
                  [class]="'font-display font-bold dark:font-normal leading-tight group-hover:opacity-90 transition-all duration-300 cursor-pointer hover:opacity-80 hover:scale-[1.02] ' + (isHomePage ? 'mobile-headline text-sm sm:text-base lg:text-lg lg:mb-1 lg:flex-grow' : 'text-sm sm:text-base lg:text-lg mb-1 sm:mb-2 lg:mb-4 flex-grow') + ' ' + (news.isTrending ? 'text-purple-700 dark:text-purple-300' : getHeadlineColorForLatestStories(news.category, i))"
                  (click)="openNewsModal(news)"
                  (touchstart)="onTouchStart($event, news)"
                  (touchend)="onTouchEnd($event, news)"
                  (touchmove)="onTouchMove($event)"
                  style="touch-action: pan-y;">
                  @if (news.isTrending && !isHomePage) {
                    <span class="inline-block mr-2 text-lg leading-none">🔥</span>
                  }
                  {{ getDisplayTitle(news) }}
                </h3>
                <div [class]="'flex items-center justify-between text-[0.65rem] sm:text-xs text-muted-foreground ' + (isHomePage ? 'mt-auto lg:mt-2' : 'mt-1.5 sm:mt-2')">
                  <span class="text-left truncate pr-2">{{ news.author || 'News Adda India' }}</span>
                  <span class="text-right flex-shrink-0">{{ news.date || news.time }}</span>
                </div>
              </div>
            </article>
          }
        </div>
        }

        <!-- News Detail Modal -->
        @if (modalState.isOpen && modalState.news) {
          <app-news-detail-modal
            [news]="modalState.news"
            [isOpen]="modalState.isOpen"
            [isBreaking]="modalState.isBreaking || false"
            (closeModal)="closeModal()">
          </app-news-detail-modal>
        }
      </div>
    </section>
  `,
  styles: [`
    /* Ensure loading and content states don't overlap */
    .news-grid-container {
      position: relative;
    }
    /* Mobile: Single column layout for Latest Stories */
    @media (max-width: 767px) {
      :host {
        display: block !important;
        width: 100% !important;
        max-width: 100% !important;
        margin: 0 !important;
        padding: 0 !important;
      }
      .grid {
        display: grid !important;
        grid-template-columns: 1fr !important;
        gap: 0.75rem !important;
        width: 100% !important;
        max-width: 100% !important;
        margin: 0 !important;
        padding: 0 !important;
      }
      
      /* Ensure proper spacing on mobile */
      .news-grid-container {
        padding-top: 1rem !important;
        padding-bottom: 1rem !important;
        width: 100% !important;
        max-width: 100% !important;
        margin: 0 !important;
      }
      
      .news-grid-container .container {
        padding-left: 0 !important;
        padding-right: 0 !important;
      }
      
      /* Better card spacing on mobile */
      .news-card {
        margin-bottom: 0 !important;
        width: 100% !important;
        max-width: 100% !important;
        min-width: 0 !important;
        box-sizing: border-box !important;
        padding: 0 !important;
        margin-left: 0 !important;
        margin-right: 0 !important;
      }
      
      /* Fix the image container - remove flex constraints */
      .news-card > div:first-child {
        width: 100% !important;
        max-width: 100% !important;
        min-width: 0 !important;
        flex: none !important;
        aspect-ratio: 16/10 !important;
      }
      
      /* Ensure cards don't overflow */
      .news-card > * {
        max-width: 100% !important;
        box-sizing: border-box !important;
      }
      
      /* Fix image sizing on mobile */
      .news-card img {
        width: 100% !important;
        height: 100% !important;
        max-width: 100% !important;
        object-fit: cover !important;
      }
      
      /* Fix card content padding on mobile */
      .news-card .bg-gradient-to-br {
        padding: 0.625rem !important;
      }
      
      /* Ensure text doesn't overflow */
      .news-card h3 {
        font-size: 0.8125rem !important;
        line-height: 1.3 !important;
        word-wrap: break-word !important;
        overflow-wrap: break-word !important;
        hyphens: auto !important;
        margin-bottom: 0.375rem !important;
      }
      
      .news-card .text-xs {
        font-size: 0.625rem !important;
      }
      
      /* Remove border width from total width calculation */
      .news-card .border-2 {
        border-width: 1px !important;
      }
    }
    
    /* Tablet: 2 columns for Latest Stories */
    @media (min-width: 768px) and (max-width: 1023px) {
      .grid {
        grid-template-columns: repeat(2, 1fr);
        gap: 1.5rem;
      }
    }
    /* Mobile home page: reduce card size and spacing */
    @media (max-width: 1023px) {
      .news-grid-container.home-page .news-card.home-page-card {
        min-height: auto !important;
        height: auto !important;
        max-height: none !important;
        margin: 0 !important;
        padding: 0 !important;
        gap: 0 !important;
        align-items: stretch !important;
      }
      .news-grid-container.home-page .news-card.home-page-card .relative {
        flex: 0 0 50% !important;
        border-radius: 0.5rem 0.5rem 0 0 !important;
        margin: 0 !important;
        padding: 0 !important;
        margin-bottom: 0.5rem !important;
      }
      .news-grid-container.home-page .news-card.home-page-card > div:last-child {
        padding: 0.25rem 0.375rem !important;
        border-radius: 0 0 0.5rem 0.5rem !important;
        margin: 0 !important;
        gap: 0 !important;
        height: auto !important;
        min-height: auto !important;
        max-height: none !important;
        display: flex !important;
        flex-direction: column !important;
        align-items: stretch !important;
        justify-content: space-between !important;
      }
      .news-grid-container.home-page .news-card.home-page-card > div:last-child > *:not(h3):not(div.flex.items-center.justify-between) {
        display: none !important;
      }
      .news-grid-container.home-page .news-card.home-page-card h3.mobile-headline {
        margin: 0 !important;
        padding: 0 !important;
        padding-top: 0.375rem !important;
        font-size: 1rem !important;
        line-height: 1.35 !important;
        min-height: auto !important;
        flex-grow: 1 !important;
        word-wrap: break-word !important;
        overflow-wrap: break-word !important;
        display: block !important;
        overflow: visible !important;
      }
      .news-grid-container.home-page .news-card.home-page-card .flex.items-center.justify-between {
        margin: 0 !important;
        padding: 0 !important;
        margin-top: 0.5rem !important;
        padding-top: 0.5rem !important;
        font-size: 0.7rem !important;
        flex-shrink: 0 !important;
        line-height: 1.2 !important;
        border-top: 1px solid rgba(0, 0, 0, 0.05) !important;
      }
      
      .dark .news-grid-container.home-page .news-card.home-page-card .flex.items-center.justify-between {
        border-top-color: rgba(255, 255, 255, 0.1) !important;
      }
      .news-grid-container.home-page .news-card.home-page-card .flex.items-center.justify-between span {
        font-size: 0.7rem !important;
        line-height: 1.2 !important;
      }
    }
  `]
})
export class NewsGridComponent implements OnInit, OnDestroy {
  // CRITICAL: Latest Stories must always show exactly 6 items - this rule should never change
  private static readonly LATEST_STORIES_COUNT = 6;
  
  @Output() imagesLoaded = new EventEmitter<boolean>();
  t: any = {};
  private languageSubscription?: Subscription;
  newsItems: NewsArticle[] = [];
  isLoading = true;
  isHomePage = false;
  modalState: { isOpen: boolean; news: NewsArticle | null; isBreaking?: boolean } = {
    isOpen: false,
    news: null,
    isBreaking: false
  };

  constructor(
    private newsService: NewsService,
    private modalService: ModalService,
    private languageService: LanguageService,
    private displayedNewsService: DisplayedNewsService,
    private router: Router
  ) {
    console.log('[NewsGrid] ⚡⚡⚡ CONSTRUCTOR CALLED - Component is being created');
    console.log('[NewsGrid] ⚡⚡⚡ newsService:', !!this.newsService);
    console.log('[NewsGrid] ⚡⚡⚡ languageService:', !!this.languageService);
    console.log('[NewsGrid] ⚡⚡⚡ displayedNewsService:', !!this.displayedNewsService);
    
    // Subscribe to modal state changes
    this.modalService.getModalState().subscribe(state => {
      this.modalState = state;
    });
  }

  ngOnInit() {
    console.log('[NewsGrid] ✅✅✅ ngOnInit CALLED - Component is initializing');
    console.log('[NewsGrid] ✅✅✅ newsItems.length:', this.newsItems.length);
    console.log('[NewsGrid] ✅✅✅ isLoading:', this.isLoading);
    this.updateTranslations();
    console.log('[NewsGrid] ✅✅✅ About to call loadNews()');
    this.loadNews();
    console.log('[NewsGrid] ✅✅✅ loadNews() called');

    // Safety timeout: If items don't load within 10 seconds, show whatever we have
    setTimeout(() => {
      if (this.isLoading && this.newsItems.length === 0) {
        console.warn('[NewsGrid] Safety timeout - forcing fallback fetch');
        // Try one more direct fetch
        this.newsService.fetchNewsByPage('home', 12).subscribe({
          next: (news) => {
            if (news && news.length > 0) {
              const uniqueNews = this.removeDuplicates(news);
              const filteredNews = this.displayedNewsService.filterDisplayed(uniqueNews);
              this.newsItems = filteredNews.slice(0, NewsGridComponent.LATEST_STORIES_COUNT);
              
              if (this.newsItems.length > 0) {
                this.newsItems.forEach(item => {
                  if (item.imageLoading === undefined) {
                    item.imageLoading = !item.image || item.image.trim() === '';
                  }
                  if (!item.image || item.image.trim() === '') {
                    item.image = this.newsService.getPlaceholderImage(item.title);
                    item.imageLoading = false;
                  }
                });
                this.isLoading = false;
                this.imagesLoaded.emit(true);
                console.log('[NewsGrid] Safety timeout - loaded', this.newsItems.length, 'items');
              }
            }
          },
          error: (err) => {
            console.error('[NewsGrid] Safety timeout fallback failed:', err);
            this.isLoading = false;
            this.imagesLoaded.emit(true);
          }
        });
      } else if (this.newsItems.length > 0 && this.isLoading) {
        // We have items but isLoading is still true - force it to false
        console.warn('[NewsGrid] Safety timeout - forcing isLoading to false');
        this.isLoading = false;
        this.imagesLoaded.emit(true);
      }
    }, 10000); // 10 second safety timeout

    // Check if we're on the home page
    this.checkIfHomePage();
    
    // Subscribe to route changes
    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe(() => {
      this.checkIfHomePage();
    });

    // Subscribe to language changes
    console.log('[NewsGrid] Subscribing to language changes...');
    this.languageSubscription = this.languageService.currentLanguage$.subscribe(async (lang) => {
      console.log('[NewsGrid] Language changed to:', lang);
      this.updateTranslations();
      // Re-translate all news titles when language changes
      if (this.newsItems && this.newsItems.length > 0) {
        console.log('[NewsGrid] Translating', this.newsItems.length, 'news titles...');
        await this.translateNewsTitles();
        console.log('[NewsGrid] Translation complete');
      } else {
        console.log('[NewsGrid] No news items to translate');
      }
    });
    console.log('[NewsGrid] Language subscription set up');
  }

  private checkIfHomePage() {
    const url = this.router.url;
    this.isHomePage = url === '/' || url === '' || url === '/home';
  }

  ngOnDestroy() {
    this.languageSubscription?.unsubscribe();
  }

  updateTranslations() {
    this.t = this.languageService.getTranslations();
  }

  async translateNewsTitles() {
    console.log('[NewsGrid] translateNewsTitles called, newsItems count:', this.newsItems?.length || 0);
    if (!this.newsItems || this.newsItems.length === 0) {
      console.log('[NewsGrid] No news items to translate');
      return;
    }

    // Translate titles in parallel (limited batch to avoid overwhelming API)
    const batchSize = 5;
    for (let i = 0; i < this.newsItems.length; i += batchSize) {
      const batch = this.newsItems.slice(i, i + batchSize);
      console.log('[NewsGrid] Translating batch', i / batchSize + 1, 'of', Math.ceil(this.newsItems.length / batchSize));
      await Promise.all(batch.map(async (article, index) => {
        try {
          console.log('[NewsGrid] Translating title', i + index + 1, ':', article.title.substring(0, 30) + '...');
          const translatedTitle = await this.languageService.translateToCurrentLanguage(article.title);
          console.log('[NewsGrid] Translated title', i + index + 1, ':', translatedTitle.substring(0, 30) + '...');
          // Store translated title temporarily
          (article as any).translatedTitle = translatedTitle;
        } catch (error) {
          console.error('[NewsGrid] Failed to translate title:', error);
        }
      }));
    }
    console.log('[NewsGrid] All titles translated');
  }

  getDisplayTitle(news: NewsArticle): string {
    // Always use regular headline for cards (trendingTitle is only for ticker)
    // If translated title exists, use it
    if ((news as any).translatedTitle) {
      return (news as any).translatedTitle;
    }
    // Otherwise use the language service method
    return this.languageService.getDisplayTitle(news.title, news.titleEn);
  }


  getCategoryName(category: string): string {
    return this.languageService.translateCategory(category);
  }

  loadNews() {
    // Reset news items to prevent duplicates
    this.newsItems = [];
    this.isLoading = true;
    
    console.log('[NewsGrid] Starting to load news...');
    console.log('[NewsGrid] Displayed IDs before fetch:', Array.from(this.displayedNewsService.getDisplayedIds()));
    
    // First, fetch breaking news (top 3 latest) and wait for it
    this.newsService.fetchBreakingNewsList(3).subscribe({
      next: async (breakingNews) => {
        console.log('[NewsGrid] Fetched breaking news:', breakingNews?.length || 0);
        if (breakingNews && breakingNews.length > 0) {
          console.log('[NewsGrid] Breaking news IDs:', breakingNews.map(n => ({ id: n.id, title: n.title?.substring(0, 30) })));
        }
        
        if (!breakingNews || breakingNews.length === 0) {
          console.warn('[NewsGrid] No breaking news found, fetching regular news...');
          // Skip breaking news and go straight to regular news
          this.newsService.fetchNewsByPage('home', 20).subscribe({
            next: async (news) => {
              console.log('[NewsGrid] Fetched home page news:', news?.length || 0);
              if (news && news.length > 0) {
                console.log('[NewsGrid] Home page news IDs before filtering:', news.map(n => ({ id: n.id, title: n.title?.substring(0, 30) })));
                const uniqueNews = this.removeDuplicates(news);
                console.log('[NewsGrid] After removeDuplicates:', uniqueNews.length, 'items');
                console.log('[NewsGrid] Unique news IDs:', uniqueNews.map(n => ({ id: n.id, title: n.title?.substring(0, 30) })));
                const filteredNews = this.displayedNewsService.filterDisplayed(uniqueNews);
                console.log('[NewsGrid] After filterDisplayed:', filteredNews.length, 'items');
                console.log('[NewsGrid] Filtered news IDs:', filteredNews.map(n => ({ id: n.id, title: n.title?.substring(0, 30) })));
                console.log('[NewsGrid] Displayed IDs at this point:', Array.from(this.displayedNewsService.getDisplayedIds()));
                
                if (filteredNews.length < NewsGridComponent.LATEST_STORIES_COUNT) {
                  console.warn('[NewsGrid] Not enough items after filtering, fetching additional news...');
                  await this.fetchAdditionalNews(filteredNews, NewsGridComponent.LATEST_STORIES_COUNT);
                } else {
                  const displayedIds = filteredNews.slice(0, NewsGridComponent.LATEST_STORIES_COUNT).map(n => n.id).filter(id => id !== undefined) as (string | number)[];
                  this.displayedNewsService.registerDisplayedMultiple(displayedIds);
                  this.newsItems = filteredNews.slice(0, NewsGridComponent.LATEST_STORIES_COUNT);
                  
                  this.newsItems.forEach(item => {
                    if (item.imageLoading === undefined) {
                      item.imageLoading = !item.image || item.image.trim() === '';
                    }
                    // Set placeholder if no image
                    if (!item.image || item.image.trim() === '') {
                      item.image = this.newsService.getPlaceholderImage(item.title);
                      item.imageLoading = false;
                    }
                  });
                  
                  console.log('[NewsGrid] ✅ Loaded', this.newsItems.length, 'items from home page');
                  console.log('[NewsGrid] ✅ newsItems array:', this.newsItems.map(n => ({ id: n.id, title: n.title?.substring(0, 30) })));
                  // IMPORTANT: Set isLoading to false IMMEDIATELY so items show
                  this.isLoading = false;
                  await this.translateNewsTitles();
                  // Load images in background without blocking display
                  this.fetchImagesForAllItemsAndWait();
                }
              } else {
                console.warn('[NewsGrid] No news from home page, fetching from categories...');
                await this.fetchAdditionalNews([], NewsGridComponent.LATEST_STORIES_COUNT);
              }
            },
            error: (err) => {
              console.error('[NewsGrid] Error fetching home page news:', err);
              this.fetchAdditionalNews([], NewsGridComponent.LATEST_STORIES_COUNT);
            }
          });
          return;
        }
        
        // Filter out already displayed breaking news
        console.log('[NewsGrid] Filtering breaking news...');
        console.log('[NewsGrid] Breaking news before filterDisplayed:', breakingNews.map(n => ({ id: n.id, title: n.title?.substring(0, 30) })));
        const filteredBreakingNews = this.displayedNewsService.filterDisplayed(breakingNews);
        console.log('[NewsGrid] Breaking news after filterDisplayed:', filteredBreakingNews.length, 'items');
        console.log('[NewsGrid] Filtered breaking news IDs:', filteredBreakingNews.map(n => ({ id: n.id, title: n.title?.substring(0, 30) })));
        
        // Register breaking news as displayed
        if (filteredBreakingNews.length > 0) {
          const breakingIds = filteredBreakingNews.map(n => n.id).filter(id => id !== undefined) as (string | number)[];
          console.log('[NewsGrid] Registering breaking news IDs:', breakingIds);
          this.displayedNewsService.registerDisplayedMultiple(breakingIds);
          console.log('[NewsGrid] Displayed IDs after registering breaking news:', Array.from(this.displayedNewsService.getDisplayedIds()));
        }
        
        // Now fetch other news to fill remaining slots
        // CRITICAL: Always ensure exactly LATEST_STORIES_COUNT (6) items are shown
        const remainingSlots = Math.max(0, NewsGridComponent.LATEST_STORIES_COUNT - filteredBreakingNews.length);
        console.log('[NewsGrid] Remaining slots needed:', remainingSlots);
        
        if (remainingSlots > 0) {
          // Fetch more articles initially to account for filtering (fetch 20 to ensure we get enough after filtering)
          // We need extra because filtering removes duplicates and already-displayed items
          this.newsService.fetchNewsByPage('home', 20).subscribe({
            next: async (news) => {
              console.log('[NewsGrid] Fetched home page news (after breaking):', news?.length || 0);
              // If we got news from backend for home page, use it
              if (news && news.length > 0) {
                console.log('[NewsGrid] Home page news IDs before processing:', news.map(n => ({ id: n.id, title: n.title?.substring(0, 30) })));
                // Remove duplicates by id and filter out already displayed articles
                const uniqueHomeNews = this.removeDuplicates(news);
                console.log('[NewsGrid] After removeDuplicates (home):', uniqueHomeNews.length, 'items');
                console.log('[NewsGrid] Unique home news IDs:', uniqueHomeNews.map(n => ({ id: n.id, title: n.title?.substring(0, 30) })));
                const filteredHomeNews = this.displayedNewsService.filterDisplayed(uniqueHomeNews);
                console.log('[NewsGrid] After filterDisplayed (home):', filteredHomeNews.length, 'items');
                console.log('[NewsGrid] Filtered home news IDs:', filteredHomeNews.map(n => ({ id: n.id, title: n.title?.substring(0, 30) })));
                console.log('[NewsGrid] Displayed IDs before combining:', Array.from(this.displayedNewsService.getDisplayedIds()));
                
                // Combine breaking news first, then other news
                const allNews = [...filteredBreakingNews, ...filteredHomeNews];
                console.log('[NewsGrid] Combined news (breaking + home):', allNews.length, 'items');
                console.log('[NewsGrid] Combined news IDs:', allNews.map(n => ({ id: n.id, title: n.title?.substring(0, 30) })));
                
                // SAFEGUARD: If filtering removed everything, use unfiltered news (but still remove duplicates)
                if (allNews.length === 0 && (filteredBreakingNews.length === 0 || filteredHomeNews.length === 0)) {
                  console.warn('[NewsGrid] ⚠️ All items filtered out! Using unfiltered news as fallback...');
                  const unfilteredBreaking = this.removeDuplicates(breakingNews);
                  const unfilteredHome = this.removeDuplicates(news);
                  const unfilteredAll = [...unfilteredBreaking, ...unfilteredHome];
                  const uniqueUnfiltered = this.removeDuplicates(unfilteredAll);
                  if (uniqueUnfiltered.length > 0) {
                    console.log('[NewsGrid] Using', uniqueUnfiltered.length, 'unfiltered items as fallback');
                    this.newsItems = uniqueUnfiltered.slice(0, NewsGridComponent.LATEST_STORIES_COUNT);
                    const displayedIds = this.newsItems.map(n => n.id).filter(id => id !== undefined) as (string | number)[];
                    this.displayedNewsService.registerDisplayedMultiple(displayedIds);
                    
                    this.newsItems.forEach(item => {
                      if (item.imageLoading === undefined) {
                        item.imageLoading = !item.image || item.image.trim() === '';
                      }
                      if (!item.image || item.image.trim() === '') {
                        item.image = this.newsService.getPlaceholderImage(item.title);
                        item.imageLoading = false;
                      }
                    });
                    
                    this.isLoading = false;
                    await this.translateNewsTitles();
                    this.fetchImagesForAllItemsAndWait();
                    return;
                  }
                }
                
                // If we don't have enough articles after filtering, fetch more from categories
                if (allNews.length < NewsGridComponent.LATEST_STORIES_COUNT) {
                  await this.fetchAdditionalNews(allNews, NewsGridComponent.LATEST_STORIES_COUNT);
                } else {
                  // Register displayed articles - CRITICAL: Always register exactly LATEST_STORIES_COUNT items
                  const displayedIds = allNews.slice(0, NewsGridComponent.LATEST_STORIES_COUNT).map(n => n.id).filter(id => id !== undefined) as (string | number)[];
                  console.log('[NewsGrid] 🔵 Registering Latest Stories IDs:', displayedIds);
                  console.log('[NewsGrid] 🔵 Latest Stories titles:', allNews.slice(0, NewsGridComponent.LATEST_STORIES_COUNT).map(n => ({ id: n.id, title: n.title?.substring(0, 40) })));
                  this.displayedNewsService.registerDisplayedMultiple(displayedIds);
                  console.log('[NewsGrid] 🔵 Displayed IDs after registration:', Array.from(this.displayedNewsService.getDisplayedIds()));
                  
                  // CRITICAL: Always show exactly LATEST_STORIES_COUNT (6) items - this rule should never change
                  this.newsItems = allNews.slice(0, NewsGridComponent.LATEST_STORIES_COUNT);
                  
                  // Ensure all items have imageLoading set
                  this.newsItems.forEach(item => {
                    if (item.imageLoading === undefined) {
                      item.imageLoading = !item.image || item.image.trim() === '';
                    }
                    // Set placeholder if no image
                    if (!item.image || item.image.trim() === '') {
                      item.image = this.newsService.getPlaceholderImage(item.title);
                      item.imageLoading = false;
                    }
                  });
                  
                  // Debug: Verify we have exactly 6 items
                  console.log('[NewsGrid] ✅ Latest Stories items loaded:', this.newsItems.length, 'out of', allNews.length, 'available');
                  console.log('[NewsGrid] ✅ newsItems array:', this.newsItems.map(n => ({ id: n.id, title: n.title?.substring(0, 30) })));
                  if (this.newsItems.length !== NewsGridComponent.LATEST_STORIES_COUNT) {
                    console.warn('[NewsGrid] WARNING: Expected', NewsGridComponent.LATEST_STORIES_COUNT, 'items but got', this.newsItems.length);
                  }
                  
                  // Log breaking news in news grid
                  const breakingNewsInGrid = this.newsItems.filter(n => n.isBreaking);
                  if (breakingNewsInGrid.length > 0) {
                    console.log('📢 NEWS GRID - Breaking News Found:', breakingNewsInGrid.length);
                    breakingNewsInGrid.forEach((item, index) => {
                      console.log(`📢 News Grid Breaking ${index + 1}:`, {
                        id: item.id,
                        title: item.title,
                        category: item.category,
                        displayTitle: this.getDisplayTitle(item)
                      });
                    });
                  }
                  
                  // Log trending news in news grid
                  const trendingNews = this.newsItems.filter(n => n.isTrending);
                  if (trendingNews.length > 0) {
                    console.log('🔥 NEWS GRID - Trending News Found:', trendingNews.length);
                    trendingNews.forEach((item, index) => {
                      console.log(`🔥 News Grid Trending ${index + 1}:`, {
                        id: item.id,
                        title: item.title,
                        trendingTitle: item.trendingTitle || 'N/A',
                        category: item.category,
                        displayTitle: this.getDisplayTitle(item)
                      });
                    });
                  }
                  
                  // IMPORTANT: Set isLoading to false IMMEDIATELY so items show, then load images in background
                  this.isLoading = false;
                  await this.translateNewsTitles();
                  // Load images in background without blocking display
                  this.fetchImagesForAllItemsAndWait();
                }
              } else {
                // Fallback to category-based fetch
                await this.fetchAdditionalNews(filteredBreakingNews, NewsGridComponent.LATEST_STORIES_COUNT);
              }
            },
            error: (error) => {
              console.error('Error loading home page news:', error);
              // Fallback to category-based fetch
              this.fetchAdditionalNews(filteredBreakingNews, NewsGridComponent.LATEST_STORIES_COUNT);
            }
          });
        } else {
          // We have enough breaking news, just use it
          // CRITICAL: Always show exactly LATEST_STORIES_COUNT (6) items - this rule should never change
          this.newsItems = filteredBreakingNews.slice(0, NewsGridComponent.LATEST_STORIES_COUNT);
          
          // Ensure all items have imageLoading set
          this.newsItems.forEach(item => {
            if (item.imageLoading === undefined) {
              item.imageLoading = !item.image || item.image.trim() === '';
            }
            // Set placeholder if no image
            if (!item.image || item.image.trim() === '') {
              item.image = this.newsService.getPlaceholderImage(item.title);
              item.imageLoading = false;
            }
          });
          
          // Debug: Verify we have exactly 6 items
          console.log('[NewsGrid] ✅ Latest Stories items loaded (breaking news only):', this.newsItems.length);
          console.log('[NewsGrid] ✅ newsItems array:', this.newsItems.map(n => ({ id: n.id, title: n.title?.substring(0, 30) })));
          if (this.newsItems.length !== NewsGridComponent.LATEST_STORIES_COUNT) {
            console.warn('[NewsGrid] WARNING: Expected', NewsGridComponent.LATEST_STORIES_COUNT, 'items but got', this.newsItems.length);
          }
          
          // Log breaking news
          console.log('📢 NEWS GRID - All Breaking News:', this.newsItems.length);
          
          // IMPORTANT: Set isLoading to false IMMEDIATELY so items show, then load images in background
          this.isLoading = false;
          await this.translateNewsTitles();
          // Load images in background without blocking display
          this.fetchImagesForAllItemsAndWait();
        }
      },
      error: (error) => {
        console.error('Error loading breaking news:', error);
        // Continue with regular news fetch even if breaking news fails
        this.newsService.fetchNewsByPage('home', 12).subscribe({
          next: async (news) => {
            if (news && news.length > 0) {
              const uniqueErrorNews = this.removeDuplicates(news);
              const filteredErrorNews = this.displayedNewsService.filterDisplayed(uniqueErrorNews);
              
              if (filteredErrorNews.length < NewsGridComponent.LATEST_STORIES_COUNT) {
                await this.fetchAdditionalNews(filteredErrorNews, NewsGridComponent.LATEST_STORIES_COUNT);
              } else {
                // CRITICAL: Always register and show exactly LATEST_STORIES_COUNT (6) items
                const displayedIds = filteredErrorNews.slice(0, NewsGridComponent.LATEST_STORIES_COUNT).map(n => n.id).filter(id => id !== undefined) as (string | number)[];
                this.displayedNewsService.registerDisplayedMultiple(displayedIds);
                
                this.newsItems = filteredErrorNews.slice(0, NewsGridComponent.LATEST_STORIES_COUNT);
                
                // Ensure all items have imageLoading set and placeholders
                this.newsItems.forEach(item => {
                  if (item.imageLoading === undefined) {
                    item.imageLoading = !item.image || item.image.trim() === '';
                  }
                  if (!item.image || item.image.trim() === '') {
                    item.image = this.newsService.getPlaceholderImage(item.title);
                    item.imageLoading = false;
                  }
                });
                
                // Debug: Verify we have exactly 6 items
                console.log('[NewsGrid] ✅ Latest Stories items loaded (fallback):', this.newsItems.length);
                console.log('[NewsGrid] ✅ newsItems array:', this.newsItems.map(n => ({ id: n.id, title: n.title?.substring(0, 30) })));
                if (this.newsItems.length !== NewsGridComponent.LATEST_STORIES_COUNT) {
                  console.warn('[NewsGrid] WARNING: Expected', NewsGridComponent.LATEST_STORIES_COUNT, 'items but got', this.newsItems.length);
                }
                
                // IMPORTANT: Set isLoading to false IMMEDIATELY so items show
                this.isLoading = false;
                await this.translateNewsTitles();
                // Load images in background without blocking display
                this.fetchImagesForAllItemsAndWait();
              }
            } else {
              await this.fetchAdditionalNews([], NewsGridComponent.LATEST_STORIES_COUNT);
            }
          },
          error: (error2) => {
            console.error('Error loading home page news:', error2);
            // Ensure isLoading is set before fetching additional news
            this.isLoading = true;
            this.fetchAdditionalNews([], NewsGridComponent.LATEST_STORIES_COUNT);
          }
        });
      }
    });
  }

  /**
   * Fetch additional news from categories to ensure we have enough articles
   * CRITICAL: This method must always return exactly targetCount items after filtering
   */
  private async fetchAdditionalNews(existingNews: NewsArticle[], targetCount: number): Promise<void> {
    console.log('[NewsGrid] fetchAdditionalNews called with', existingNews.length, 'existing items, target:', targetCount);
    console.log('[NewsGrid] Existing news IDs:', existingNews.map(n => ({ id: n.id, title: n.title?.substring(0, 30) })));
    const categories = ['National', 'Sports', 'Business', 'International', 'Entertainment', 'Health', 'Politics', 'Technology', 'Religious'];
    let allNews = [...existingNews];
    let categoryIndex = 0;
    
    const fetchNextCategory = (): void => {
      // Check filtered count to ensure we have enough AFTER filtering
      const uniqueAllNews = this.removeDuplicates(allNews);
      console.log('[NewsGrid] fetchNextCategory - after removeDuplicates:', uniqueAllNews.length, 'items');
      const filteredAllNews = this.displayedNewsService.filterDisplayed(uniqueAllNews);
      console.log('[NewsGrid] fetchNextCategory - after filterDisplayed:', filteredAllNews.length, 'items');
      console.log('[NewsGrid] fetchNextCategory - displayed IDs:', Array.from(this.displayedNewsService.getDisplayedIds()));
      
      // Continue fetching if we don't have enough items AFTER filtering, or if we've exhausted categories
      if (filteredAllNews.length >= targetCount || categoryIndex >= categories.length) {
        // We have enough articles after filtering, or ran out of categories
        // Sort: breaking news first, then by date
        const sortedNews = filteredAllNews.sort((a, b) => {
          // Breaking news first
          if (a.isBreaking && !b.isBreaking) return -1;
          if (!a.isBreaking && b.isBreaking) return 1;
          // Then by date (newest first)
          const dateA = a.date ? new Date(a.date).getTime() : 0;
          const dateB = b.date ? new Date(b.date).getTime() : 0;
          return dateB - dateA;
        });
        
        // Register displayed articles - CRITICAL: Always register exactly targetCount items
        const itemsToRegister = sortedNews.slice(0, targetCount);
        const displayedIds = itemsToRegister.map(n => n.id).filter(id => id !== undefined) as (string | number)[];
        this.displayedNewsService.registerDisplayedMultiple(displayedIds);
        
        // CRITICAL: Always show exactly targetCount (6) items - this rule should never change
        this.newsItems = itemsToRegister;
        
        // Ensure all items have imageLoading set
        this.newsItems.forEach(item => {
          if (item.imageLoading === undefined) {
            item.imageLoading = !item.image || item.image.trim() === '';
          }
          // Set placeholder if no image
          if (!item.image || item.image.trim() === '') {
            item.image = this.newsService.getPlaceholderImage(item.title);
            item.imageLoading = false;
          }
        });
        
        // Debug: Verify we have exactly the target count
        console.log('[NewsGrid] ✅ Latest Stories items loaded (fetchAdditionalNews):', this.newsItems.length, 'target was:', targetCount, 'available after filtering:', sortedNews.length);
        console.log('[NewsGrid] ✅ newsItems array:', this.newsItems.map(n => ({ id: n.id, title: n.title?.substring(0, 30) })));
        if (this.newsItems.length !== targetCount) {
          console.warn('[NewsGrid] WARNING: Expected', targetCount, 'items but got', this.newsItems.length, '- available:', sortedNews.length);
          
          // FINAL SAFEGUARD: If we still have 0 items after fetching from all categories, try one more direct fetch
          if (this.newsItems.length === 0 && categoryIndex >= categories.length) {
            console.warn('[NewsGrid] ⚠️ Still 0 items after all categories! Trying final direct fetch...');
            this.newsService.fetchNewsByPage('home', 12).subscribe({
              next: (finalNews) => {
                if (finalNews && finalNews.length > 0) {
                  const uniqueFinal = this.removeDuplicates(finalNews);
                  // Don't filter by displayed - just show the first 6 items
                  this.newsItems = uniqueFinal.slice(0, NewsGridComponent.LATEST_STORIES_COUNT);
                  
                  this.newsItems.forEach(item => {
                    if (item.imageLoading === undefined) {
                      item.imageLoading = !item.image || item.image.trim() === '';
                    }
                    if (!item.image || item.image.trim() === '') {
                      item.image = this.newsService.getPlaceholderImage(item.title);
                      item.imageLoading = false;
                    }
                  });
                  
                  const displayedIds = this.newsItems.map(n => n.id).filter(id => id !== undefined) as (string | number)[];
                  this.displayedNewsService.registerDisplayedMultiple(displayedIds);
                  
                  console.log('[NewsGrid] ✅ Final fallback loaded', this.newsItems.length, 'items');
                  this.isLoading = false;
                  this.translateNewsTitles().then(() => {
                    this.fetchImagesForAllItemsAndWait();
                  });
                } else {
                  console.error('[NewsGrid] ❌ Final fallback also returned 0 items');
                  this.isLoading = false;
                  this.imagesLoaded.emit(true);
                }
              },
              error: (err) => {
                console.error('[NewsGrid] ❌ Final fallback fetch failed:', err);
                this.isLoading = false;
                this.imagesLoaded.emit(true);
              }
            });
            return;
          }
        }
        
        // Log breaking news in news grid
        const breakingNewsInGrid = this.newsItems.filter(n => n.isBreaking);
        if (breakingNewsInGrid.length > 0) {
          console.log('📢 NEWS GRID - Breaking News Found:', breakingNewsInGrid.length);
          breakingNewsInGrid.forEach((item, index) => {
            console.log(`📢 News Grid Breaking ${index + 1}:`, {
              id: item.id,
              title: item.title,
              category: item.category,
              displayTitle: this.getDisplayTitle(item)
            });
          });
        }
        
        // Log trending news in news grid
        const trendingNews = this.newsItems.filter(n => n.isTrending);
        if (trendingNews.length > 0) {
          console.log('🔥 NEWS GRID - Trending News Found:', trendingNews.length);
          trendingNews.forEach((item, index) => {
            console.log(`🔥 News Grid Trending ${index + 1}:`, {
              id: item.id,
              title: item.title,
              trendingTitle: item.trendingTitle || 'N/A',
              category: item.category,
              displayTitle: this.getDisplayTitle(item)
            });
          });
        }
        
        // IMPORTANT: Set isLoading to false IMMEDIATELY so items show, then load images in background
        this.isLoading = false;
        this.translateNewsTitles().then(() => {
          // Load images in background without blocking display
          this.fetchImagesForAllItemsAndWait();
        });
        return;
      }
      
      const category = categories[categoryIndex];
      console.log('[NewsGrid] Fetching from category:', category, 'index:', categoryIndex);
      // Calculate how many more we need AFTER filtering
      const uniqueCurrentNews = this.removeDuplicates(allNews);
      const filteredCurrentNews = this.displayedNewsService.filterDisplayed(uniqueCurrentNews);
      const needed = Math.max(0, targetCount - filteredCurrentNews.length);
      // Fetch more than needed to account for filtering (fetch at least 5-10 extra)
      const fetchCount = Math.max(needed + 5, 10); // Fetch extra to account for filtering and duplicates
      console.log('[NewsGrid] Need', needed, 'more items, fetching', fetchCount, 'from', category);
      
      this.newsService.fetchNewsByCategory(category, fetchCount).subscribe({
        next: (categoryNews) => {
          console.log('[NewsGrid] Fetched', categoryNews?.length || 0, 'items from category', category);
          if (categoryNews && categoryNews.length > 0) {
            console.log('[NewsGrid] Category news IDs:', categoryNews.map(n => ({ id: n.id, title: n.title?.substring(0, 30) })));
          }
          const uniqueCategoryNews = this.removeDuplicates(categoryNews);
          console.log('[NewsGrid] After removeDuplicates (category):', uniqueCategoryNews.length, 'items');
          const filteredCategoryNews = this.displayedNewsService.filterDisplayed(uniqueCategoryNews);
          console.log('[NewsGrid] After filterDisplayed (category):', filteredCategoryNews.length, 'items');
          console.log('[NewsGrid] Filtered category news IDs:', filteredCategoryNews.map(n => ({ id: n.id, title: n.title?.substring(0, 30) })));
          
          // Add new articles to the collection
          allNews = [...allNews, ...filteredCategoryNews];
          allNews = this.removeDuplicates(allNews);
          console.log('[NewsGrid] Total news after adding', category, ':', allNews.length, 'items');
          
          categoryIndex++;
          fetchNextCategory();
        },
        error: (error) => {
          console.error(`Error loading news from ${category}:`, error);
          categoryIndex++;
          fetchNextCategory();
        }
      });
    };
    
    fetchNextCategory();
  }

  private removeDuplicates(news: NewsArticle[]): NewsArticle[] {
    const seen = new Set<string>();
    const result: NewsArticle[] = [];
    
    news.forEach(item => {
      // Normalize ID to string for consistent comparison
      let id: string;
      if (!item.id) {
        // Use title hash for consistent ID across components
        // This ensures the same article gets the same ID in both NewsGrid and CategorySection
        const titleHash = this.hashString((item.title || '').trim());
        id = `title_hash_${titleHash}`;
        item.id = id;
        console.warn('[NewsGrid] Article missing ID, assigned title-based ID:', id, 'Title:', item.title?.substring(0, 30));
      } else {
        // Normalize to string (same as DisplayedNewsService)
        id = typeof item.id === 'string' ? item.id : item.id.toString();
        item.id = id; // Update item.id to normalized string
      }
      
      if (!seen.has(id)) {
        seen.add(id);
        result.push(item);
      } else {
        console.log('[NewsGrid] Duplicate article filtered:', id, item.title?.substring(0, 30));
      }
    });
    
    return result;
  }

  /**
   * Hash a string to a number (for consistent ID generation)
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

  fetchImagesForAllItemsAndWait() {
    // Ensure we have items before trying to load images
    if (!this.newsItems || this.newsItems.length === 0) {
      console.warn('[NewsGrid] No items to load images for - this should not happen!');
      console.warn('[NewsGrid] Attempting to fetch news directly...');
      // Try to fetch news one more time as fallback
      this.newsService.fetchNewsByPage('home', 12).subscribe({
        next: (news) => {
          if (news && news.length > 0) {
            const uniqueNews = this.removeDuplicates(news);
            const filteredNews = this.displayedNewsService.filterDisplayed(uniqueNews);
            this.newsItems = filteredNews.slice(0, NewsGridComponent.LATEST_STORIES_COUNT);
            
            if (this.newsItems.length > 0) {
              this.newsItems.forEach(item => {
                if (item.imageLoading === undefined) {
                  item.imageLoading = !item.image || item.image.trim() === '';
                }
                if (!item.image || item.image.trim() === '') {
                  item.image = this.newsService.getPlaceholderImage(item.title);
                  item.imageLoading = false;
                }
              });
              console.log('[NewsGrid] ✅ Safety timeout fallback loaded', this.newsItems.length, 'items');
              // IMPORTANT: Set isLoading to false IMMEDIATELY
              this.isLoading = false;
              this.translateNewsTitles().then(() => {
                // Load images in background without blocking display
                this.fetchImagesForAllItemsAndWait();
              });
            } else {
              this.isLoading = false;
              this.imagesLoaded.emit(true);
            }
          } else {
            this.isLoading = false;
            this.imagesLoaded.emit(true);
          }
        },
        error: (err) => {
          console.error('[NewsGrid] Final fallback fetch failed:', err);
          this.isLoading = false;
          this.imagesLoaded.emit(true);
        }
      });
      return;
    }

    console.log(`[NewsGrid] Loading images for ${this.newsItems.length} items`);
    
    // Fetch all images first, then show page only when all are loaded
    const imagePromises: Promise<void>[] = [];

    this.newsItems.forEach((item, index) => {
      // Initialize imageLoading if not set
      if (item.imageLoading === undefined) {
        item.imageLoading = true;
      }

      // If image exists and is a valid URL, verify it loads
      if (item.image && item.image.trim() !== '' && item.imageLoading) {
        const imagePromise = new Promise<void>((resolve) => {
          const img = new Image();
          // Set timeout for individual image (2 seconds per image - faster)
          const imageTimeout = setTimeout(() => {
            console.warn(`[NewsGrid] Image timeout for item ${index + 1}, using placeholder...`);
            item.image = this.newsService.getPlaceholderImage(item.title);
            item.imageLoading = false;
            resolve();
          }, 2000); // Reduced from 3s to 2s
          
          img.onload = () => {
            clearTimeout(imageTimeout);
            // Image loaded successfully
            item.imageLoading = false;
            resolve();
          };
          img.onerror = () => {
            clearTimeout(imageTimeout);
            // Image failed to load - use placeholder (no external API calls)
            console.warn(`[NewsGrid] Image failed to load for item ${index + 1}, using placeholder...`);
            item.image = this.newsService.getPlaceholderImage(item.title);
            item.imageLoading = false;
            resolve();
          };
          // Start loading immediately
          img.src = item.image;
        });
        imagePromises.push(imagePromise);
      } else {
        // No image in database - use placeholder immediately (no external API calls)
        const imagePromise = new Promise<void>((resolve) => {
          if (!item.image || item.image.trim() === '') {
            item.image = this.newsService.getPlaceholderImage(item.title);
          }
          item.imageLoading = false;
          // Resolve immediately for placeholders
          setTimeout(() => resolve(), 10); // Small delay to ensure UI updates
        });
        imagePromises.push(imagePromise);
      }
    });

    // OPTIMIZATION: Reduced timeout from 5s to 4s - show content faster
    const timeoutPromise = new Promise<void>((resolve) => {
      setTimeout(() => {
        console.warn('[NewsGrid] Image loading timeout - showing page anyway');
        // Mark all remaining items as loaded
        this.newsItems.forEach(item => {
          if (item.imageLoading || !item.image || item.image.trim() === '') {
            item.image = this.newsService.getPlaceholderImage(item.title);
          }
          item.imageLoading = false;
        });
        resolve();
      }, 4000); // 4 second timeout (reduced from 5s)
    });

    // Wait for all images or timeout, whichever comes first
    Promise.race([Promise.all(imagePromises), timeoutPromise]).then(() => {
      this.isLoading = false;
      this.imagesLoaded.emit(true);
      console.log(`[NewsGrid] All ${this.newsItems.length} images loaded/completed`);
    });
  }

  categoryColors: Record<string, string> = {
    Health: 'bg-green-500 text-white',
    Sports: 'bg-orange-500 text-white',
    Business: 'bg-blue-500 text-white',
    Entertainment: 'bg-pink-500 text-white',
    International: 'bg-purple-500 text-white',
    Technology: 'bg-cyan-500 text-white',
    National: 'bg-blue-500 text-white',
    Politics: 'bg-red-500 text-white',
    Religious: 'bg-indigo-500 text-white',
  };

  getCategoryColor(category: string): string {
    return this.categoryColors[category] || 'bg-primary text-white';
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

  getHeadlineColorForLatestStories(category: string, index: number): string {
    // Array of varied color gradients for Latest Stories section
    const colorPalette = [
      'bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent dark:bg-none dark:text-blue-400',
      'bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent dark:bg-none dark:text-purple-400',
      'bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent dark:bg-none dark:text-orange-400',
      'bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent dark:bg-none dark:text-green-400',
      'bg-gradient-to-r from-cyan-600 to-blue-600 bg-clip-text text-transparent dark:bg-none dark:text-cyan-400',
      'bg-gradient-to-r from-violet-600 to-purple-600 bg-clip-text text-transparent dark:bg-none dark:text-violet-400',
      'bg-gradient-to-r from-rose-600 to-pink-600 bg-clip-text text-transparent dark:bg-none dark:text-rose-400',
      'bg-gradient-to-r from-amber-600 to-orange-600 bg-clip-text text-transparent dark:bg-none dark:text-amber-400',
      'bg-gradient-to-r from-teal-600 to-cyan-600 bg-clip-text text-transparent dark:bg-none dark:text-teal-400',
      'bg-gradient-to-r from-indigo-600 to-blue-600 bg-clip-text text-transparent dark:bg-none dark:text-indigo-400',
    ];
    
    // Cycle through colors based on index
    return colorPalette[index % colorPalette.length];
  }

  // Touch handling to prevent accidental opens on mobile
  private touchStartTime: number = 0;
  private touchStartX: number = 0;
  private touchStartY: number = 0;
  private touchMoved: boolean = false;
  private touchTargetNews: NewsArticle | null = null;

  onTouchStart(event: TouchEvent, news: NewsArticle) {
    this.touchStartTime = Date.now();
    this.touchStartX = event.touches[0].clientX;
    this.touchStartY = event.touches[0].clientY;
    this.touchMoved = false;
    this.touchTargetNews = news;
  }

  onTouchMove(event: TouchEvent) {
    if (this.touchStartTime > 0) {
      const deltaX = Math.abs(event.touches[0].clientX - this.touchStartX);
      const deltaY = Math.abs(event.touches[0].clientY - this.touchStartY);
      // If touch moved more than 10px, consider it a scroll
      if (deltaX > 10 || deltaY > 10) {
        this.touchMoved = true;
      }
    }
  }

  onTouchEnd(event: TouchEvent, news: NewsArticle) {
    const touchDuration = Date.now() - this.touchStartTime;
    const deltaX = Math.abs(event.changedTouches[0].clientX - this.touchStartX);
    const deltaY = Math.abs(event.changedTouches[0].clientY - this.touchStartY);

    // Only open modal if:
    // 1. Touch didn't move much (not a scroll) - less than 10px
    // 2. Touch was quick (less than 300ms) - deliberate tap
    // 3. Touch target matches
    if (!this.touchMoved && deltaX < 10 && deltaY < 10 && touchDuration < 300 && this.touchTargetNews === news) {
      event.preventDefault();
      event.stopPropagation();
      this.openNewsModal(news);
    }

    // Reset touch state
    this.touchStartTime = 0;
    this.touchMoved = false;
    this.touchTargetNews = null;
  }

  openNewsModal(news: NewsArticle) {
    this.modalService.openModal(news, false);
  }

  closeModal() {
    this.modalService.closeModal();
  }
}

