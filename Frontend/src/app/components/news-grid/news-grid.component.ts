import { Component, OnInit, OnDestroy, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NewsService, NewsArticle } from '../../services/news.service';
import { ModalService } from '../../services/modal.service';
import { LanguageService } from '../../services/language.service';
import { NewsDetailModalComponent } from '../news-detail-modal/news-detail-modal.component';
import { Subscription } from 'rxjs';

// Using NewsArticle from service

@Component({
  selector: 'app-news-grid',
  standalone: true,
  imports: [CommonModule, NewsDetailModalComponent],
  template: `
    <section class="py-12 lg:py-16">
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
        @if (!isLoading) {
          <div class="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            @for (news of newsItems; track news.id; let i = $index) {
              <article
                class="news-card group opacity-0 animate-fade-in hover:shadow-2xl hover:shadow-purple-500/20 transition-all duration-300"
                [style.animation-delay]="i * 100 + 'ms'">
              <div class="relative aspect-[16/10] overflow-hidden rounded-t-xl bg-gradient-to-br from-purple-100/20 via-pink-100/20 to-orange-100/20 dark:from-purple-900/20 dark:via-pink-900/20 dark:to-orange-900/20 border-2 border-transparent hover:border-purple-300/50 dark:hover:border-purple-700/50 transition-all duration-300">
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
                <div class="absolute top-4 left-4 z-20 flex gap-2 flex-wrap">
                  @if (news.isTrending) {
                    <span class="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-black rounded-full bg-gradient-to-r from-purple-600 via-pink-500 to-fuchsia-600 text-white shadow-xl animate-pulse border-2 border-white/50 uppercase tracking-wider" style="font-family: 'Arial Black', 'Helvetica Neue', sans-serif; text-shadow: 2px 2px 4px rgba(0,0,0,0.5), 0 0 8px rgba(255,255,255,0.3); letter-spacing: 0.1em;">
                      <svg class="w-3.5 h-3.5 text-white flex-shrink-0" fill="currentColor" viewBox="0 0 24 24" style="filter: drop-shadow(0 1px 2px rgba(0,0,0,0.4));">
                        <path d="M13 10V3L4 14h7v7l9-11h-7z"/>
                      </svg>
                      <span class="text-xs leading-none">🔥</span>
                      <span>TRENDING</span>
                      <span class="text-xs leading-none">🔥</span>
                    </span>
                  }
                  @if (news.isBreaking) {
                    <span class="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-black rounded-full bg-gradient-to-r from-red-600 to-red-700 text-white shadow-xl animate-pulse border-2 border-white/50 uppercase tracking-wider" style="font-family: 'Arial Black', 'Helvetica Neue', sans-serif; text-shadow: 2px 2px 4px rgba(0,0,0,0.5), 0 0 8px rgba(255,255,255,0.3); letter-spacing: 0.1em;">
                      <svg class="w-3.5 h-3.5 text-white flex-shrink-0" fill="currentColor" viewBox="0 0 24 24" style="filter: drop-shadow(0 1px 2px rgba(0,0,0,0.4));">
                        <path d="M13 10V3L4 14h7v7l9-11h-7z"/>
                      </svg>
                      <span>BREAKING</span>
                    </span>
                  }
                  @if (news.isFeatured) {
                    <span class="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-black rounded-full bg-gradient-to-r from-yellow-500 to-amber-500 text-white shadow-xl border-2 border-white/50 uppercase tracking-wider" style="font-family: 'Arial Black', 'Helvetica Neue', sans-serif; text-shadow: 2px 2px 4px rgba(0,0,0,0.5), 0 0 8px rgba(255,255,255,0.3); letter-spacing: 0.1em;">
                      <svg class="w-3.5 h-3.5 text-white flex-shrink-0" fill="currentColor" viewBox="0 0 24 24" style="filter: drop-shadow(0 1px 2px rgba(0,0,0,0.4));">
                        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                      </svg>
                      <span>FEATURED</span>
                    </span>
                  }
                  <span [class]="'inline-flex items-center justify-center px-3 py-1 text-xs font-semibold rounded-full shadow-lg ' + getCategoryColor(news.category)">
                    {{ getCategoryName(news.category) }}
                  </span>
                </div>
              </div>

              <!-- Border Line with Gradient -->
              <div class="h-[2px] bg-gradient-to-r from-purple-500 via-pink-500 to-orange-500"></div>

              <div class="p-5 pt-6 pb-6 bg-gradient-to-br from-background via-purple-50/5 dark:via-purple-900/5 to-background rounded-b-xl border-t border-purple-200/20 dark:border-purple-800/20">
                <div class="flex items-start gap-3 mb-3">
                  <div class="flex-shrink-0" style="margin-top: 0.76rem; line-height: 1;">
                    @if (news.category === 'Sports') {
                      <svg class="w-6 h-6 text-orange-500 drop-shadow-lg" viewBox="0 0 24 24" fill="currentColor" style="filter: drop-shadow(0 2px 4px rgba(251,146,60,0.4)); vertical-align: baseline;"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1.41 16.09V20h-2.67v-1.93c-1.71-.36-3.16-1.46-3.27-3.4h1.96c.1 1.05.82 1.87 2.65 1.87 1.96 0 2.4-.98 2.4-1.59 0-.83-.44-1.61-2.67-2.14-2.48-.6-4.18-1.62-4.18-3.67 0-1.72 1.39-2.84 3.11-3.21V4h2.67v1.95c1.86.45 2.79 1.86 2.85 3.39H14.3c-.05-1.11-.64-1.87-2.22-1.87-1.5 0-2.4.68-2.4 1.64 0 .84.65 1.39 2.67 1.91s4.18 1.39 4.18 3.91c-.01 1.83-1.38 2.83-3.12 3.16z"/></svg>
                    } @else if (news.category === 'Business') {
                      <svg class="w-6 h-6 text-blue-500 drop-shadow-lg" viewBox="0 0 24 24" fill="currentColor" style="filter: drop-shadow(0 2px 4px rgba(59,130,246,0.4)); vertical-align: baseline;"><path d="M11.8 10.9c-2.27-.59-3-1.2-3-2.15 0-1.09 1.01-1.85 2.7-1.85 1.78 0 2.44.85 2.5 2.1h2.21c-.07-1.72-1.12-3.3-3.21-3.81V3h-3v2.16c-1.94.42-3.5 1.68-3.5 3.61 0 2.31 1.91 3.46 4.7 4.13 2.5.6 3 1.48 3 2.41 0 .69-.49 1.79-2.7 1.79-2.06 0-2.87-.92-2.98-2.1h-2.2c.12 2.19 1.76 3.42 3.68 3.83V21h3v-2.15c1.95-.37 3.5-1.5 3.5-3.55 0-2.84-2.43-3.81-4.7-4.4z"/></svg>
                    } @else if (news.category === 'Entertainment') {
                      <svg class="w-6 h-6 text-pink-500 drop-shadow-lg" viewBox="0 0 24 24" fill="currentColor" style="filter: drop-shadow(0 2px 4px rgba(236,72,153,0.4)); vertical-align: baseline;"><path d="M8 5v14l11-7z"/></svg>
                    } @else if (news.category === 'Health') {
                      <svg class="w-6 h-6 text-green-500 drop-shadow-lg" viewBox="0 0 24 24" fill="currentColor" style="filter: drop-shadow(0 2px 4px rgba(34,197,94,0.4)); vertical-align: baseline;"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/></svg>
                    } @else if (news.category === 'Religious') {
                      <svg class="w-6 h-6 text-indigo-500 drop-shadow-lg" viewBox="0 0 24 24" fill="currentColor" style="filter: drop-shadow(0 2px 4px rgba(99,102,241,0.4)); vertical-align: baseline;"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/></svg>
                    } @else {
                      <svg class="w-6 h-6 text-purple-500 drop-shadow-lg" viewBox="0 0 24 24" fill="currentColor" style="filter: drop-shadow(0 2px 4px rgba(168,85,247,0.4)); vertical-align: baseline;"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
                    }
                  </div>
                  <h3 
                    [class]="'font-display text-lg font-bold dark:font-normal leading-tight group-hover:opacity-90 transition-all duration-300 line-clamp-3 pb-1 min-h-[4rem] cursor-pointer hover:opacity-80 hover:scale-[1.02] flex-1 ' + (news.isTrending ? 'text-purple-700 dark:text-purple-300' : getHeadlineColor(news.category))"
                    (click)="openNewsModal(news)"
                    (touchstart)="onTouchStart($event, news)"
                    (touchend)="onTouchEnd($event, news)"
                    (touchmove)="onTouchMove($event)"
                    style="touch-action: pan-y;">
                    @if (news.isTrending) {
                      <span class="inline-block mr-2 text-lg leading-none">🔥</span>
                    }
                    {{ getDisplayTitle(news) }}
                  </h3>
                </div>
                <p class="text-muted-foreground text-sm line-clamp-3 mb-4 mt-3 pt-1 min-h-[3.5rem] leading-relaxed">
                  {{ news.excerpt }}
                </p>
                <div class="flex items-center">
                  <span class="flex items-center gap-1.5 text-xs font-medium">
                    <svg class="w-3.5 h-3.5 text-blue-500" viewBox="0 0 24 24" fill="currentColor"><path d="M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zM12 20c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm.5-13H11v6l5.25 3.15.75-1.23-4.5-2.67z"/></svg>
                    <span class="text-blue-600 dark:text-blue-400 font-bold">{{ news.date || news.time }}</span>
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
  styles: []
})
export class NewsGridComponent implements OnInit, OnDestroy {
  @Output() imagesLoaded = new EventEmitter<boolean>();
  t: any = {};
  private languageSubscription?: Subscription;
  newsItems: NewsArticle[] = [];
  isLoading = true;
  modalState: { isOpen: boolean; news: NewsArticle | null; isBreaking?: boolean } = {
    isOpen: false,
    news: null,
    isBreaking: false
  };

  constructor(
    private newsService: NewsService,
    private modalService: ModalService,
    private languageService: LanguageService
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
    // Try to fetch news specifically marked for 'home' page first
    this.newsService.fetchNewsByPage('home', 6).subscribe({
      next: async (news) => {
        // If we got news from backend for home page, use it
        if (news.length > 0) {
          this.newsItems = news.slice(0, 6);
          await this.translateNewsTitles();
          this.fetchImagesForAllItemsAndWait();
        } else {
          // Fallback to category-based fetch
          this.newsService.fetchNewsByCategory('National', 6).subscribe({
            next: (categoryNews) => {
              // Ensure we have enough news items
              if (categoryNews.length < 6) {
                // Fetch more from other categories
                this.newsService.fetchNewsByCategory('Sports', 2).subscribe({
                  next: (sportsNews) => {
                    this.newsItems = [...categoryNews, ...sportsNews].slice(0, 6);
                    this.fetchImagesForAllItemsAndWait();
                  }
                });
              } else {
                this.newsItems = categoryNews.slice(0, 6);
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
            this.newsItems = news.slice(0, 6);
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

