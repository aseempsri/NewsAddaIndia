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
  hasVideo?: boolean;
  imageLoading?: boolean;
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
                  <h2 class="font-display text-xl lg:text-2xl font-bold">
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
                  <article class="news-card group">
                    <div class="relative aspect-video overflow-hidden rounded-t-xl bg-secondary/20">
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
                    </div>
                    <!-- Border Line -->
                    <div class="h-[2px] bg-gray-300 dark:bg-gray-600"></div>
                    <div class="p-4 bg-background rounded-b-xl">
                      <div class="flex items-start justify-between gap-2">
                        <div class="flex-1">
                          <div class="flex items-start gap-2 mb-2">
                            <div class="flex-shrink-0 mt-0.5">
                              @if (category.title === 'Sports') {
                                <svg class="w-5 h-5 text-orange-600" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1.41 16.09V20h-2.67v-1.93c-1.71-.36-3.16-1.46-3.27-3.4h1.96c.1 1.05.82 1.87 2.65 1.87 1.96 0 2.4-.98 2.4-1.59 0-.83-.44-1.61-2.67-2.14-2.48-.6-4.18-1.62-4.18-3.67 0-1.72 1.39-2.84 3.11-3.21V4h2.67v1.95c1.86.45 2.79 1.86 2.85 3.39H14.3c-.05-1.11-.64-1.87-2.22-1.87-1.5 0-2.4.68-2.4 1.64 0 .84.65 1.39 2.67 1.91s4.18 1.39 4.18 3.91c-.01 1.83-1.38 2.83-3.12 3.16z"/></svg>
                              } @else if (category.title === 'Entertainment') {
                                <svg class="w-5 h-5 text-pink-600" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>
                              } @else {
                                <svg class="w-5 h-5 text-primary" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
                              }
                            </div>
                            <h3 [class]="'font-display text-lg font-bold leading-tight group-hover:opacity-90 transition-colors ' + getHeadlineColor(category.title)">
                              {{ category.articles[0].title }}
                            </h3>
                          </div>
                          <span class="text-xs font-medium mt-2 inline-block flex items-center gap-1">
                            <svg class="w-3.5 h-3.5 text-blue-500" viewBox="0 0 24 24" fill="currentColor"><path d="M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zM12 20c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm.5-13H11v6l5.25 3.15.75-1.23-4.5-2.67z"/></svg>
                            <span class="text-blue-600 dark:text-blue-400 font-bold">{{ category.articles[0].time }}</span>
                          </span>
                        </div>
                        <button 
                          class="text-primary opacity-80 sm:opacity-60 sm:group-hover:opacity-100 transition-all hover:underline font-medium text-sm cursor-pointer touch-manipulation min-h-[44px] px-2 flex-shrink-0"
                          type="button"
                          (click)="openNewsModal(category.title, 0)" 
                          (touchend)="openNewsModal(category.title, 0)">
                          {{ t.readMore }}
                        </button>
                      </div>
                    </div>
                  </article>
                }

                <!-- List Articles -->
                @for (article of category.articles.slice(1); track $index) {
                  <article class="group flex gap-4 p-3 rounded-xl hover:bg-secondary/50 transition-colors">
                    <div class="relative w-24 h-20 rounded-lg overflow-hidden shrink-0 bg-secondary/20">
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
                      <h4 [class]="'font-bold text-sm leading-tight group-hover:opacity-90 transition-colors line-clamp-2 ' + getHeadlineColor(category.title)">
                        {{ article.title }}
                      </h4>
                      <span class="text-xs font-medium mt-1.5 inline-block flex items-center gap-1">
                        <svg class="w-3 h-3 text-blue-500" viewBox="0 0 24 24" fill="currentColor"><path d="M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zM12 20c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm.5-13H11v6l5.25 3.15.75-1.23-4.5-2.67z"/></svg>
                        <span class="text-blue-600 dark:text-blue-400 font-bold">{{ article.time }}</span>
                      </span>
                    </div>
                    <button 
                      class="text-primary opacity-80 sm:opacity-60 sm:group-hover:opacity-100 transition-all hover:underline font-medium text-sm cursor-pointer touch-manipulation min-h-[44px] px-2 flex-shrink-0"
                      type="button"
                      (click)="openNewsModal(category.title, $index + 1)" 
                      (touchend)="openNewsModal(category.title, $index + 1)">
                      {{ t.readMore }}
                    </button>
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
export class CategorySectionComponent implements OnInit {
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

  constructor(
    private newsService: NewsService,
    private modalService: ModalService
  ) {
    // Subscribe to modal state changes
    this.modalService.getModalState().subscribe(state => {
      this.modalState = state;
    });
  }

  ngOnInit() {
    this.loadCategoryNews();
  }

  loadCategoryNews() {
    // Load Entertainment news
    this.newsService.fetchNewsByCategory('Entertainment', 4).subscribe({
      next: (news) => {
        this.originalNewsItems['Entertainment'] = news;
        this.categories[0].articles = news.map((n, index) => ({
          title: this.languageService.getDisplayTitle(n.title, n.titleEn),
          image: n.image || '',
          time: n.time,
          hasVideo: index === 0,
          imageLoading: !n.image || n.image.trim() === ''
        }));
        this.isLoading = false;
        // Fetch images for Entertainment articles
        this.fetchImagesForCategory(0, news);
      },
      error: (error) => {
        console.error('Error loading Entertainment news:', error);
        this.isLoading = false;
      }
    });

    // Load Sports news
    this.newsService.fetchNewsByCategory('Sports', 4).subscribe({
      next: (news) => {
        this.originalNewsItems['Sports'] = news;
        this.categories[1].articles = news.map((n, index) => ({
          title: this.languageService.getDisplayTitle(n.title, n.titleEn),
          image: n.image || '',
          time: n.time,
          hasVideo: index === 0,
          imageLoading: !n.image || n.image.trim() === ''
        }));
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
      // Fetch image based on headline if loading or empty
      if (article.imageLoading || !article.image || article.image.trim() === '') {
        const newsItem = newsItems[index];
        if (newsItem) {
          this.newsService.fetchImageForHeadline(newsItem.title, category.title).subscribe({
            next: (imageUrl) => {
              if (imageUrl && imageUrl.trim() !== '') {
                // Preload image to ensure it's ready before showing
                const img = new Image();
                img.onload = () => {
                  article.image = imageUrl;
                  article.imageLoading = false;
                };
                img.onerror = () => {
                  // If image fails to load, try placeholder as last resort
                  article.image = this.newsService.getPlaceholderImage(newsItem.title);
                  article.imageLoading = false;
                };
                img.src = imageUrl;
              } else {
                // Fallback to placeholder if no image found
                article.image = this.newsService.getPlaceholderImage(newsItem.title);
                article.imageLoading = false;
              }
            },
            error: (error) => {
              console.error(`Error fetching image for "${newsItem.title}":`, error);
              // Fallback to placeholder on error
              article.image = this.newsService.getPlaceholderImage(newsItem.title);
              article.imageLoading = false;
            }
          });
        }
      } else {
        // If image already exists, ensure it's not in loading state
        article.imageLoading = false;
      }
    });
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
      'National': 'bg-gradient-to-r from-blue-600 to-blue-800 bg-clip-text text-transparent',
      'International': 'bg-gradient-to-r from-purple-600 to-purple-800 bg-clip-text text-transparent',
      'Politics': 'bg-gradient-to-r from-red-600 to-red-800 bg-clip-text text-transparent',
      'Health': 'bg-gradient-to-r from-green-600 to-green-800 bg-clip-text text-transparent',
      'Sports': 'bg-gradient-to-r from-orange-600 to-orange-800 bg-clip-text text-transparent',
      'Business': 'bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent',
      'Entertainment': 'bg-gradient-to-r from-pink-600 to-rose-600 bg-clip-text text-transparent',
      'Technology': 'bg-gradient-to-r from-cyan-600 to-blue-600 bg-clip-text text-transparent',
    };
    return colors[category] || 'bg-gradient-to-r from-primary to-primary/80 bg-clip-text text-transparent';
  }
}

