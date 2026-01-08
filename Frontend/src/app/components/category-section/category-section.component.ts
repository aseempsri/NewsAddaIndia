import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NewsService, NewsArticle } from '../../services/news.service';
import { ModalService } from '../../services/modal.service';
import { LanguageService } from '../../services/language.service';
import { NewsDetailModalComponent } from '../news-detail-modal/news-detail-modal.component';
import { Subscription } from 'rxjs';

interface Article {
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
  imports: [CommonModule, NewsDetailModalComponent],
  template: `
    <section class="py-12 lg:py-16 bg-gradient-to-b from-transparent via-secondary/30 to-transparent">
      <div class="container mx-auto px-4">
        <div class="grid lg:grid-cols-2 gap-8 lg:gap-12">
          @for (category of categories; track category.title) {
            <div>
              <!-- Category Header -->
              <div class="flex items-center justify-between mb-6">
                <div class="flex items-center gap-3">
                  <div [class]="'w-1 h-8 rounded-full bg-gradient-to-b ' + category.accentColor"></div>
                  <h2 class="font-display text-xl lg:text-2xl font-bold leading-relaxed pt-2 pb-1">
                    {{ category.title }}
                  </h2>
                </div>
                <a
                  href="#"
                  class="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors">
                  {{ t.more }}
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                  </svg>
                </a>
              </div>

              <!-- Articles -->
              <div class="space-y-4">
                <!-- Featured Article -->
                @if (category.articles && category.articles.length > 0) {
                  <article class="news-card group hover:shadow-2xl hover:shadow-purple-500/20 transition-all duration-300">
                    <div class="relative aspect-video overflow-hidden rounded-t-xl bg-gradient-to-br from-purple-100/20 via-pink-100/20 to-orange-100/20 dark:from-purple-900/20 dark:via-pink-900/20 dark:to-orange-900/20 border-2 border-transparent hover:border-purple-300/50 dark:hover:border-purple-700/50 transition-all duration-300">
                      <!-- Loading Animation - Show while image is loading -->
                      @if (category.articles[0]?.imageLoading || !category.articles[0]?.image) {
                        <div class="absolute inset-0 flex items-center justify-center bg-secondary/50 z-10">
                          <div class="flex flex-col items-center gap-2">
                            <div class="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
                            <span class="text-xs text-muted-foreground">{{ t.loadingImage }}</span>
                          </div>
                        </div>
                      }
                      <!-- Image - Only show when loaded -->
                      @if (category.articles[0]?.image && !category.articles[0]?.imageLoading) {
                        <img
                          [src]="category.articles[0].image"
                          [alt]="category.articles[0].title"
                          class="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
                      }
                      @if (category.articles[0]?.hasVideo && category.articles[0]?.image && !category.articles[0]?.imageLoading) {
                        <div class="absolute inset-0 flex items-center justify-center z-20">
                          <div class="w-14 h-14 rounded-full bg-primary/90 flex items-center justify-center backdrop-blur-sm group-hover:scale-110 transition-transform cursor-pointer">
                            <svg class="w-6 h-6 text-primary-foreground ml-1" fill="currentColor" viewBox="0 0 24 24">
                              <path d="M8 5v14l11-7z" />
                            </svg>
                          </div>
                        </div>
                      }
                      <div class="absolute inset-0 bg-gradient-to-t from-background/80 to-transparent"></div>
                      <!-- Trending/Breaking/Featured Badges -->
                      @if (category.articles[0]) {
                        <div class="absolute top-4 left-4 z-20 flex gap-2 flex-wrap">
                          @if (category.articles[0].isTrending) {
                            <span class="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-black rounded-full bg-gradient-to-r from-purple-600 via-pink-500 to-fuchsia-600 text-white shadow-xl animate-pulse border-2 border-white/50 uppercase tracking-wider" style="font-family: 'Arial Black', 'Helvetica Neue', sans-serif; text-shadow: 2px 2px 4px rgba(0,0,0,0.5), 0 0 8px rgba(255,255,255,0.3); letter-spacing: 0.1em;">
                              <svg class="w-3.5 h-3.5 text-white flex-shrink-0" fill="currentColor" viewBox="0 0 24 24" style="filter: drop-shadow(0 1px 2px rgba(0,0,0,0.4));">
                                <path d="M13 10V3L4 14h7v7l9-11h-7z"/>
                              </svg>
                              <span class="text-xs leading-none">🔥</span>
                              <span>TRENDING</span>
                              <span class="text-xs leading-none">🔥</span>
                            </span>
                          }
                          @if (category.articles[0].isBreaking) {
                            <span class="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-black rounded-full bg-gradient-to-r from-red-600 to-red-700 text-white shadow-xl animate-pulse border-2 border-white/50 uppercase tracking-wider" style="font-family: 'Arial Black', 'Helvetica Neue', sans-serif; text-shadow: 2px 2px 4px rgba(0,0,0,0.5), 0 0 8px rgba(255,255,255,0.3); letter-spacing: 0.1em;">
                              <svg class="w-3.5 h-3.5 text-white flex-shrink-0" fill="currentColor" viewBox="0 0 24 24" style="filter: drop-shadow(0 1px 2px rgba(0,0,0,0.4));">
                                <path d="M13 10V3L4 14h7v7l9-11h-7z"/>
                              </svg>
                              <span>BREAKING</span>
                            </span>
                          }
                          @if (category.articles[0].isFeatured) {
                            <span class="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-black rounded-full bg-gradient-to-r from-yellow-500 to-amber-500 text-white shadow-xl border-2 border-white/50 uppercase tracking-wider" style="font-family: 'Arial Black', 'Helvetica Neue', sans-serif; text-shadow: 2px 2px 4px rgba(0,0,0,0.5), 0 0 8px rgba(255,255,255,0.3); letter-spacing: 0.1em;">
                              <svg class="w-3.5 h-3.5 text-white flex-shrink-0" fill="currentColor" viewBox="0 0 24 24" style="filter: drop-shadow(0 1px 2px rgba(0,0,0,0.4));">
                                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                              </svg>
                              <span>FEATURED</span>
                            </span>
                          }
                        </div>
                      }
                    </div>
                    <!-- Border Line with Gradient -->
                    <div class="h-[2px] bg-gradient-to-r from-purple-500 via-pink-500 to-orange-500"></div>
                    <div class="p-4 pt-5 pb-5 bg-gradient-to-br from-background via-purple-50/5 dark:via-purple-900/5 to-background rounded-b-xl border-t border-purple-200/20 dark:border-purple-800/20">
                      <div class="flex items-start justify-between gap-2">
                        <div class="flex-1">
                          <div class="flex items-start gap-3 mb-3">
                            <div class="flex-shrink-0" style="margin-top: 0.76rem; line-height: 1;">
                              @if (category.title === 'Sports') {
                                <svg class="w-6 h-6 text-orange-500 drop-shadow-lg" viewBox="0 0 24 24" fill="currentColor" style="filter: drop-shadow(0 2px 4px rgba(251,146,60,0.4)); vertical-align: baseline;"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1.41 16.09V20h-2.67v-1.93c-1.71-.36-3.16-1.46-3.27-3.4h1.96c.1 1.05.82 1.87 2.65 1.87 1.96 0 2.4-.98 2.4-1.59 0-.83-.44-1.61-2.67-2.14-2.48-.6-4.18-1.62-4.18-3.67 0-1.72 1.39-2.84 3.11-3.21V4h2.67v1.95c1.86.45 2.79 1.86 2.85 3.39H14.3c-.05-1.11-.64-1.87-2.22-1.87-1.5 0-2.4.68-2.4 1.64 0 .84.65 1.39 2.67 1.91s4.18 1.39 4.18 3.91c-.01 1.83-1.38 2.83-3.12 3.16z"/></svg>
                              } @else if (category.title === 'Entertainment') {
                                <svg class="w-6 h-6 text-pink-500 drop-shadow-lg" viewBox="0 0 24 24" fill="currentColor" style="filter: drop-shadow(0 2px 4px rgba(236,72,153,0.4)); vertical-align: baseline;"><path d="M8 5v14l11-7z"/></svg>
                              } @else if (category.title === 'Religious') {
                                <svg class="w-6 h-6 text-indigo-500 drop-shadow-lg" viewBox="0 0 24 24" fill="currentColor" style="filter: drop-shadow(0 2px 4px rgba(99,102,241,0.4)); vertical-align: baseline;"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/></svg>
                              } @else {
                                <svg class="w-6 h-6 text-purple-500 drop-shadow-lg" viewBox="0 0 24 24" fill="currentColor" style="filter: drop-shadow(0 2px 4px rgba(168,85,247,0.4)); vertical-align: baseline;"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
                              }
                            </div>
                            <h3 
                              [class]="'font-display text-lg font-bold dark:font-normal leading-tight group-hover:opacity-90 transition-all duration-300 pb-1 min-h-[4rem] cursor-pointer hover:opacity-80 hover:scale-[1.02] flex-1 ' + (category.articles[0]?.isTrending ? 'text-purple-700 dark:text-purple-300' : getHeadlineColor(category.title))"
                              (click)="openNewsModal(category.title, 0)"
                              (touchstart)="onTouchStart($event, category.title, 0)"
                              (touchend)="onTouchEnd($event, category.title, 0)"
                              (touchmove)="onTouchMove($event)"
                              style="touch-action: pan-y;">
                              @if (category.articles[0]?.isTrending) {
                                <span class="inline-block mr-2 text-lg leading-none">🔥</span>
                              }
                              {{ category.articles[0].title }}
                            </h3>
                          </div>
                          <span class="text-xs font-medium mt-3 inline-block flex items-center gap-1">
                            <svg class="w-3.5 h-3.5 text-blue-500" viewBox="0 0 24 24" fill="currentColor"><path d="M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zM12 20c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm.5-13H11v6l5.25 3.15.75-1.23-4.5-2.67z"/></svg>
                            <span class="text-blue-600 dark:text-blue-400 font-bold">{{ category.articles[0].date || category.articles[0].time }}</span>
                          </span>
                        </div>
                      </div>
                    </div>
                  </article>
                }

                <!-- List Articles -->
                @for (article of category.articles.slice(1); track $index) {
                  <article class="group flex gap-4 p-3 rounded-xl hover:bg-gradient-to-r hover:from-purple-50/50 hover:via-pink-50/50 hover:to-orange-50/50 dark:hover:from-purple-900/20 dark:hover:via-pink-900/20 dark:hover:to-orange-900/20 transition-all duration-300 border border-transparent hover:border-purple-200/50 dark:hover:border-purple-800/50">
                    <div class="relative w-24 h-20 rounded-lg overflow-hidden shrink-0 bg-gradient-to-br from-purple-100/20 via-pink-100/20 to-orange-100/20 dark:from-purple-900/20 dark:via-pink-900/20 dark:to-orange-900/20 border border-purple-200/30 dark:border-purple-800/30">
                      <!-- Loading Animation - Show while image is loading -->
                      @if (article.imageLoading || !article.image) {
                        <div class="absolute inset-0 flex items-center justify-center bg-secondary/50 z-10">
                          <div class="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                        </div>
                      }
                      <!-- Image - Only show when loaded -->
                      @if (article.image && !article.imageLoading) {
                        <img
                          [src]="article.image"
                          [alt]="article.title"
                          class="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                      }
                    </div>
                    <div class="flex-1 min-w-0">
                        <h4 
                          [class]="'font-bold dark:font-normal text-sm leading-tight group-hover:opacity-90 transition-all duration-300 line-clamp-3 pt-1 pb-1 min-h-[3.5rem] cursor-pointer hover:opacity-80 hover:scale-[1.01] ' + (article.isTrending ? 'text-purple-700 dark:text-purple-300' : getHeadlineColor(category.title))"
                          (click)="openNewsModal(category.title, $index + 1)"
                          (touchstart)="onTouchStart($event, category.title, $index + 1)"
                          (touchend)="onTouchEnd($event, category.title, $index + 1)"
                          (touchmove)="onTouchMove($event)"
                          style="touch-action: pan-y;">
                        @if (article.isTrending) {
                          <span class="inline-block mr-1.5 text-sm leading-none">🔥</span>
                        }
                        {{ article.title }}
                      </h4>
                      <span class="text-xs font-medium mt-1.5 inline-block flex items-center gap-1">
                        <svg class="w-3 h-3 text-blue-500" viewBox="0 0 24 24" fill="currentColor"><path d="M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zM12 20c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm.5-13H11v6l5.25 3.15.75-1.23-4.5-2.67z"/></svg>
                        <span class="text-blue-600 dark:text-blue-400 font-bold">{{ article.date || article.time }}</span>
                      </span>
                    </div>
                  </article>
                }
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
  styles: []
})
export class CategorySectionComponent implements OnInit, OnDestroy {
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
  ];

  isLoading = true;
  private originalNewsItems: { [key: string]: any[] } = {};
  t: any = {};
  private languageSubscription?: Subscription;

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
    this.updateTranslations();
    this.updateCategoryTitles();
    this.loadCategoryNews();

    // Subscribe to language changes
    this.languageSubscription = this.languageService.currentLanguage$.subscribe(async () => {
      this.updateTranslations();
      this.updateCategoryTitles();
      await this.updateArticleTitles();
    });
  }

  ngOnDestroy() {
    this.languageSubscription?.unsubscribe();
  }

  updateTranslations() {
    this.t = this.languageService.getTranslations();
  }

  updateCategoryTitles() {
    this.categories[0].title = this.languageService.translateCategory('Entertainment');
    this.categories[1].title = this.languageService.translateCategory('Sports');
  }

  async updateArticleTitles() {
    // Update article titles based on language with real-time translation
    for (const category of this.categories) {
      const catIndex = this.categories.indexOf(category);
      const categoryKey = catIndex === 0 ? 'Entertainment' : 'Sports';
      const originalNews = this.originalNewsItems[categoryKey];
      if (originalNews) {
        // Translate titles in parallel
        const translatedArticles = await Promise.all(originalNews.map(async (n, index) => {
          let translatedTitle = this.languageService.getDisplayTitle(n.title, n.titleEn);
          // If titleEn doesn't exist or we need real-time translation, use Google Translate
          if (!n.titleEn || this.languageService.getCurrentLanguage() === 'hi') {
            try {
              translatedTitle = await this.languageService.translateToCurrentLanguage(n.title);
            } catch (error) {
              console.warn('Failed to translate title:', error);
              translatedTitle = this.languageService.getDisplayTitle(n.title, n.titleEn);
            }
          }
          return {
            title: translatedTitle,
            image: n.image || '',
            time: n.time,
            date: n.date,
            hasVideo: index === 0,
            imageLoading: !n.image || n.image.trim() === '',
            isTrending: n.isTrending || false,
            isBreaking: n.isBreaking || false,
            isFeatured: n.isFeatured || false
          };
        }));
        category.articles = translatedArticles;
      }
    }
  }

  loadCategoryNews() {
    // Load Entertainment news - use fetchNewsByPage to respect "Pages to Display" field
    this.newsService.fetchNewsByPage('entertainment', 4).subscribe({
      next: async (news) => {
        this.originalNewsItems['Entertainment'] = news;
        // Translate titles after loading
        const translatedArticles = await Promise.all(news.map(async (n, index) => {
          let translatedTitle = this.languageService.getDisplayTitle(n.title, n.titleEn);
          try {
            translatedTitle = await this.languageService.translateToCurrentLanguage(n.title);
          } catch (error) {
            console.warn('Failed to translate title:', error);
          }
          return {
            title: translatedTitle,
            image: n.image || '',
            time: n.time,
            date: n.date,
            hasVideo: index === 0,
            imageLoading: !n.image || n.image.trim() === ''
          };
        }));
        this.categories[0].articles = translatedArticles;
        this.isLoading = false;
        // Fetch images for Entertainment articles
        this.fetchImagesForCategory(0, news);
      },
      error: (error) => {
        console.error('Error loading Entertainment news:', error);
        this.isLoading = false;
      }
    });

    // Load Sports news - use fetchNewsByPage to respect "Pages to Display" field
    this.newsService.fetchNewsByPage('sports', 4).subscribe({
      next: async (news) => {
        this.originalNewsItems['Sports'] = news;
        // Translate titles after loading
        const translatedArticles = await Promise.all(news.map(async (n, index) => {
          let translatedTitle = this.languageService.getDisplayTitle(n.title, n.titleEn);
          try {
            translatedTitle = await this.languageService.translateToCurrentLanguage(n.title);
          } catch (error) {
            console.warn('Failed to translate title:', error);
          }
          return {
            title: translatedTitle,
            image: n.image || '',
            time: n.time,
            date: n.date,
            hasVideo: index === 0,
            imageLoading: !n.image || n.image.trim() === '',
            isTrending: n.isTrending || false,
            isBreaking: n.isBreaking || false,
            isFeatured: n.isFeatured || false
          };
        }));
        this.categories[1].articles = translatedArticles;
        // Fetch images for Sports articles
        this.fetchImagesForCategory(1, news);
      },
      error: (error) => {
        console.error('Error loading Sports news:', error);
      }
    });
  }

  fetchImagesForCategory(categoryIndex: number, newsItems: any[]) {
    const category = this.categories[categoryIndex];
    if (!category || !category.articles || category.articles.length === 0 || !newsItems) {
      return;
    }

    category.articles.forEach((article, index) => {
      // Use image from database or placeholder (no external API calls)
      if (article.imageLoading || !article.image || article.image.trim() === '') {
        const newsItem = newsItems[index];
        if (newsItem) {
          if (newsItem.image && newsItem.image.trim() !== '') {
            // Use image from database
            const img = new Image();
            img.onload = () => {
              article.image = newsItem.image;
              article.imageLoading = false;
            };
            img.onerror = () => {
              // If image fails to load, use placeholder
              article.image = this.newsService.getPlaceholderImage(newsItem.title);
              article.imageLoading = false;
            };
            img.src = newsItem.image;
          } else {
            // No image in database - use placeholder
            article.image = this.newsService.getPlaceholderImage(newsItem.title);
            article.imageLoading = false;
          }
        }
      } else {
        // If image already exists, ensure it's not in loading state
        article.imageLoading = false;
      }
    });
  }


  // Touch handling to prevent accidental opens on mobile
  private touchStartTime: number = 0;
  private touchStartX: number = 0;
  private touchStartY: number = 0;
  private touchMoved: boolean = false;
  private touchTarget: { categoryTitle: string; articleIndex: number } | null = null;

  onTouchStart(event: TouchEvent, categoryTitle: string, articleIndex: number) {
    this.touchStartTime = Date.now();
    this.touchStartX = event.touches[0].clientX;
    this.touchStartY = event.touches[0].clientY;
    this.touchMoved = false;
    this.touchTarget = { categoryTitle, articleIndex };
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

  onTouchEnd(event: TouchEvent, categoryTitle: string, articleIndex: number) {
    const touchDuration = Date.now() - this.touchStartTime;
    const deltaX = Math.abs(event.changedTouches[0].clientX - this.touchStartX);
    const deltaY = Math.abs(event.changedTouches[0].clientY - this.touchStartY);
    
    // Only open modal if:
    // 1. Touch didn't move much (not a scroll) - less than 10px
    // 2. Touch was quick (less than 300ms) - deliberate tap
    // 3. Touch target matches
    if (!this.touchMoved && deltaX < 10 && deltaY < 10 && touchDuration < 300 && 
        this.touchTarget && this.touchTarget.categoryTitle === categoryTitle && this.touchTarget.articleIndex === articleIndex) {
      event.preventDefault();
      event.stopPropagation();
      this.openNewsModal(categoryTitle, articleIndex);
    }
    
    // Reset touch state
    this.touchStartTime = 0;
    this.touchMoved = false;
    this.touchTarget = null;
  }

  openNewsModal(categoryTitle: string, articleIndex: number) {
    const category = this.categories.find(c => c.title === categoryTitle);
    if (!category || !category.articles || articleIndex >= category.articles.length) {
      return;
    }

    const article = category.articles[articleIndex];
    const originalNews = this.originalNewsItems[categoryTitle];

    if (originalNews && originalNews[articleIndex]) {
      // Use the original NewsArticle from the service
      const newsArticle = originalNews[articleIndex];
      this.modalService.openModal(newsArticle, false);
    } else {
      // Fallback: create a NewsArticle from the Article interface
      const newsArticle: NewsArticle = {
        id: articleIndex + 10000, // Temporary ID
        category: categoryTitle,
        title: article.title,
        titleEn: article.title,
        excerpt: article.title, // Use title as excerpt
        image: article.image,
        imageLoading: article.imageLoading || false,
        time: article.time,
        author: 'News Adda India',
        date: new Date().toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' })
      };
      this.modalService.openModal(newsArticle, false);
    }
  }

  closeModal() {
    this.modalService.closeModal();
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
    };
    return colors[category] || 'bg-gradient-to-r from-primary to-primary/80 bg-clip-text text-transparent dark:bg-none dark:text-primary-foreground';
  }
}

