import { Component, OnInit, OnDestroy, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, NavigationEnd } from '@angular/router';
import { NewsService, NewsArticle } from '../../services/news.service';
import { ModalService } from '../../services/modal.service';
import { LanguageService } from '../../services/language.service';
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
          <a
            href="#"
            class="hidden sm:flex items-center gap-2 text-primary hover:text-primary/80 transition-colors font-medium">
            {{ t.viewAll }}
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14 5l7 7m0 0l-7 7m7-7H3" />
            </svg>
          </a>
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

        <!-- News Grid - Only show when all images are loaded -->
        @if (!isLoading && newsItems.length > 0) {
          <div [class]="'grid sm:grid-cols-2 lg:grid-cols-3 ' + (isHomePage ? 'gap-2 lg:gap-6' : 'gap-6')">
            @for (news of newsItems; track news.id; let i = $index) {
            <article
              [class]="'news-card group opacity-0 animate-fade-in hover:shadow-2xl hover:shadow-purple-500/20 transition-all duration-300 flex flex-col ' + (isHomePage ? 'home-page-card' : '')"
              [style.animation-delay]="i * 100 + 'ms'">
            <div [class]="'relative overflow-hidden rounded-t-xl bg-gradient-to-br from-purple-100/20 via-pink-100/20 to-orange-100/20 dark:from-purple-900/20 dark:via-pink-900/20 dark:to-orange-900/20 border-2 border-transparent hover:border-purple-300/50 dark:hover:border-purple-700/50 transition-all duration-300 ' + (isHomePage ? 'flex-[0_0_45%] sm:flex-none sm:aspect-[16/10]' : 'flex-[0_0_40%] sm:flex-none sm:aspect-[16/10]')">
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
                    class="w-full h-full object-cover transition-all duration-500 group-hover:scale-110 animate-fade-in" />
                }
                <div [class]="'absolute top-2 left-2 sm:top-4 sm:left-4 z-20 flex gap-1 sm:gap-2 flex-wrap ' + (isHomePage ? 'hidden lg:flex' : '')">
                  @if (news.isTrending) {
                    <span class="inline-flex items-center justify-center gap-1 sm:gap-1.5 px-2 py-1 sm:px-3 sm:py-1.5 text-[0.525rem] sm:text-xs font-black rounded-full bg-gradient-to-r from-purple-600 via-pink-500 to-fuchsia-600 text-white shadow-xl animate-pulse border border-white/50 sm:border-2 sm:border-white/50 uppercase tracking-wider" style="font-family: 'Arial Black', 'Helvetica Neue', sans-serif; text-shadow: 1px 1px 2px rgba(0,0,0,0.5), 0 0 4px rgba(255,255,255,0.3); letter-spacing: 0.07em;">
                      @if (!isHomePage) {
                        <svg class="w-2.5 h-2.5 sm:w-3.5 sm:h-3.5 text-white flex-shrink-0" fill="currentColor" viewBox="0 0 24 24" style="filter: drop-shadow(0 1px 1px rgba(0,0,0,0.4));">
                          <path d="M13 10V3L4 14h7v7l9-11h-7z"/>
                        </svg>
                        <span class="text-[0.5rem] sm:text-xs leading-none">🔥</span>
                      }
                      <span>TRENDING</span>
                      @if (!isHomePage) {
                        <span class="text-[0.5rem] sm:text-xs leading-none">🔥</span>
                      }
                    </span>
                  }
                  @if (news.isBreaking) {
                    <span class="inline-flex items-center justify-center gap-1 sm:gap-1.5 px-2 py-1 sm:px-3 sm:py-1.5 text-[0.525rem] sm:text-xs font-black rounded-full bg-gradient-to-r from-red-600 to-red-700 text-white shadow-xl animate-pulse border border-white/50 sm:border-2 sm:border-white/50 uppercase tracking-wider" style="font-family: 'Arial Black', 'Helvetica Neue', sans-serif; text-shadow: 1px 1px 2px rgba(0,0,0,0.5), 0 0 4px rgba(255,255,255,0.3); letter-spacing: 0.07em;">
                      @if (!isHomePage) {
                        <svg class="w-2.5 h-2.5 sm:w-3.5 sm:h-3.5 text-white flex-shrink-0" fill="currentColor" viewBox="0 0 24 24" style="filter: drop-shadow(0 1px 1px rgba(0,0,0,0.4));">
                          <path d="M13 10V3L4 14h7v7l9-11h-7z"/>
                        </svg>
                      }
                      <span>BREAKING</span>
                    </span>
                  }
                  @if (news.isFeatured) {
                    <span class="inline-flex items-center justify-center gap-1 sm:gap-1.5 px-2 py-1 sm:px-3 sm:py-1.5 text-[0.525rem] sm:text-xs font-black rounded-full bg-gradient-to-r from-yellow-500 to-amber-500 text-white shadow-xl border border-white/50 sm:border-2 sm:border-white/50 uppercase tracking-wider" style="font-family: 'Arial Black', 'Helvetica Neue', sans-serif; text-shadow: 1px 1px 2px rgba(0,0,0,0.5), 0 0 4px rgba(255,255,255,0.3); letter-spacing: 0.07em;">
                      @if (!isHomePage) {
                        <svg class="w-2.5 h-2.5 sm:w-3.5 sm:h-3.5 text-white flex-shrink-0" fill="currentColor" viewBox="0 0 24 24" style="filter: drop-shadow(0 1px 1px rgba(0,0,0,0.4));">
                          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                        </svg>
                      }
                      <span>FEATURED</span>
                    </span>
                  }
                  <span [class]="'inline-flex items-center justify-center px-2 py-0.75 sm:px-3 sm:py-1 text-[0.525rem] sm:text-xs font-semibold rounded-full shadow-lg ' + getCategoryColor(news.category)">
                    {{ getCategoryName(news.category) }}
                  </span>
                </div>
              </div>

              <!-- Border Line with Gradient - Hidden on mobile home page -->
              <div [class]="'h-[2px] bg-gradient-to-r from-purple-500 via-pink-500 to-orange-500 ' + (isHomePage ? 'hidden lg:block' : '')"></div>

              <div [class]="'bg-gradient-to-br from-background via-purple-50/5 dark:via-purple-900/5 to-background rounded-b-xl border-t border-purple-200/20 dark:border-purple-800/20 flex flex-col ' + (isHomePage ? 'p-1 pt-1 pb-1 lg:h-full lg:p-5 lg:pt-6 lg:pb-6' : 'h-full p-5 pt-6 pb-6')">
                <h3 
                  [class]="'font-display font-bold dark:font-normal leading-tight group-hover:opacity-90 transition-all duration-300 cursor-pointer hover:opacity-80 hover:scale-[1.02] ' + (isHomePage ? 'text-base lg:text-lg lg:mb-1 lg:flex-grow' : 'text-base sm:text-lg mb-1 sm:mb-4 flex-grow') + ' ' + (news.isTrending ? 'text-purple-700 dark:text-purple-300' : getHeadlineColorForLatestStories(news.category, i))"
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
                <div [class]="'flex items-center justify-between text-xs text-muted-foreground ' + (isHomePage ? 'mt-0 lg:mt-2' : 'mt-2')">
                  <span [class]="'flex items-center ' + (isHomePage ? 'gap-1 lg:gap-1.5' : 'gap-1.5')">
                    <svg [class]="'fill-none stroke-currentColor ' + (isHomePage ? 'w-3 h-3 lg:w-3.5 lg:h-3.5' : 'w-3.5 h-3.5')" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                    <span>{{ news.author || 'News Adda India' }}</span>
                  </span>
                  <span [class]="'flex items-center ' + (isHomePage ? 'gap-1 lg:gap-1.5' : 'gap-1.5')">
                    <svg [class]="'fill-none stroke-currentColor ' + (isHomePage ? 'w-3 h-3 lg:w-3.5 lg:h-3.5' : 'w-3.5 h-3.5')" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span>{{ news.date || news.time }}</span>
                  </span>
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

        <!-- Mobile View All -->
        <div class="sm:hidden mt-8 text-center">
          <a
            href="#"
            class="inline-flex items-center gap-2 text-primary hover:text-primary/80 transition-colors font-medium">
            {{ t.viewAllStories }}
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14 5l7 7m0 0l-7 7m7-7H3" />
            </svg>
          </a>
        </div>
      </div>
    </section>
  `,
  styles: [`
    /* Ensure loading and content states don't overlap */
    .news-grid-container {
      position: relative;
    }
    /* Prevent duplicate rendering on mobile */
    @media (max-width: 767px) {
      .grid {
        display: grid;
        grid-template-columns: 1fr;
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
        flex: 0 0 45% !important;
        border-radius: 0.5rem 0.5rem 0 0 !important;
        margin: 0 !important;
        padding: 0 !important;
      }
      .news-grid-container.home-page .news-card.home-page-card > div:last-child {
        padding: 0.125rem 0.375rem !important;
        border-radius: 0 0 0.5rem 0.5rem !important;
        margin: 0 !important;
        gap: 0 !important;
        height: auto !important;
        min-height: auto !important;
        max-height: none !important;
        display: flex !important;
        flex-direction: column !important;
        align-items: stretch !important;
        justify-content: flex-start !important;
      }
      .news-grid-container.home-page .news-card.home-page-card > div:last-child > *:not(h3):not(.flex.items-center) {
        display: none !important;
      }
      .news-grid-container.home-page .news-card.home-page-card h3 {
        margin: 0 !important;
        line-height: 1.15 !important;
        font-size: 1rem !important;
        min-height: auto !important;
        padding: 0 !important;
        flex-grow: 0 !important;
      }
      .news-grid-container.home-page .news-card.home-page-card .flex.items-center {
        margin: 0 !important;
        padding: 0 !important;
        gap: 0 !important;
      }
      .news-grid-container.home-page .news-card.home-page-card .flex.items-center span {
        font-size: 0.7rem !important;
      }
      .news-grid-container.home-page .news-card.home-page-card .flex.items-center svg {
        width: 0.7rem !important;
        height: 0.7rem !important;
      }
      .news-grid-container.home-page .news-card.home-page-card .flex.items-center span {
        gap: 0.25rem !important;
      }
      .news-grid-container.home-page .news-card.home-page-card .flex.items-center span svg {
        flex-shrink: 0 !important;
      }
    }
  `]
})
export class NewsGridComponent implements OnInit, OnDestroy {
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
    private router: Router
  ) {
    // Subscribe to modal state changes
    this.modalService.getModalState().subscribe(state => {
      this.modalState = state;
    });
  }

  ngOnInit() {
    console.log('[NewsGrid] Component initialized');
    this.updateTranslations();
    this.loadNews();

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
    
    // Try to fetch news specifically marked for 'home' page first
    this.newsService.fetchNewsByPage('home', 6).subscribe({
      next: async (news) => {
        // If we got news from backend for home page, use it
        if (news && news.length > 0) {
          // Remove duplicates by id
          const uniqueNews = this.removeDuplicates(news);
          this.newsItems = uniqueNews.slice(0, 6);
          await this.translateNewsTitles();
          this.fetchImagesForAllItemsAndWait();
        } else {
          // Fallback to category-based fetch
          this.newsService.fetchNewsByCategory('National', 6).subscribe({
            next: (categoryNews) => {
              // Remove duplicates
              const uniqueCategoryNews = this.removeDuplicates(categoryNews);
              // Ensure we have enough news items
              if (uniqueCategoryNews.length < 6) {
                // Fetch more from other categories
                this.newsService.fetchNewsByCategory('Sports', 2).subscribe({
                  next: (sportsNews) => {
                    const uniqueSportsNews = this.removeDuplicates(sportsNews);
                    // Combine and remove any duplicates
                    const combined = [...uniqueCategoryNews, ...uniqueSportsNews];
                    this.newsItems = this.removeDuplicates(combined).slice(0, 6);
                    this.fetchImagesForAllItemsAndWait();
                  }
                });
              } else {
                this.newsItems = uniqueCategoryNews.slice(0, 6);
                this.fetchImagesForAllItemsAndWait();
              }
            },
            error: (error) => {
              console.error('Error loading news:', error);
              this.isLoading = false;
            }
          });
        }
      },
      error: (error) => {
        console.error('Error loading home page news:', error);
        // Fallback to category-based fetch
        this.newsService.fetchNewsByCategory('National', 6).subscribe({
          next: async (news) => {
            const uniqueNews = this.removeDuplicates(news);
            this.newsItems = uniqueNews.slice(0, 6);
            await this.translateNewsTitles();
            this.fetchImagesForAllItemsAndWait();
          },
          error: (err) => {
            console.error('Error loading news:', err);
            this.isLoading = false;
          }
        });
      }
    });
  }

  private removeDuplicates(news: NewsArticle[]): NewsArticle[] {
    const seen = new Set<string | number>();
    return news.filter(item => {
      if (!item.id) return false;
      const id = typeof item.id === 'string' ? item.id : item.id.toString();
      if (seen.has(id)) {
        return false;
      }
      seen.add(id);
      return true;
    });
  }

  fetchImagesForAllItemsAndWait() {
    // Fetch all images first, then show page only when all are loaded
    const imagePromises: Promise<void>[] = [];

    this.newsItems.forEach((item, index) => {
      // If image exists and is a valid URL, verify it loads
      if (item.image && item.image.trim() !== '' && !item.imageLoading) {
        const imagePromise = new Promise<void>((resolve) => {
          const img = new Image();
          img.onload = () => {
            // Image loaded successfully
            item.imageLoading = false;
            resolve();
          };
          img.onerror = () => {
            // Image failed to load - use placeholder (no external API calls)
            console.warn(`Image failed to load for "${item.title}", using placeholder...`);
            item.image = this.newsService.getPlaceholderImage(item.title);
            item.imageLoading = false;
            resolve();
          };
          img.src = item.image;
        });
        imagePromises.push(imagePromise);
      } else if (item.imageLoading || !item.image || item.image.trim() === '') {
        // No image in database - use placeholder (no external API calls)
        const imagePromise = new Promise<void>((resolve) => {
          item.image = this.newsService.getPlaceholderImage(item.title);
          item.imageLoading = false;
          resolve();
        });
        imagePromises.push(imagePromise);
      } else {
        // Image already loaded and valid, create resolved promise
        imagePromises.push(Promise.resolve());
      }
    });

    // Wait for all images to load before showing the page
    // Add timeout to prevent infinite loading
    const timeoutPromise = new Promise<void>((resolve) => {
      setTimeout(() => {
        console.warn('Image loading timeout - showing page anyway');
        resolve();
      }, 15000); // 15 second timeout
    });

    Promise.race([Promise.all(imagePromises), timeoutPromise]).then(() => {
      this.isLoading = false;
      this.imagesLoaded.emit(true);
      console.log('All news grid images loaded');
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

