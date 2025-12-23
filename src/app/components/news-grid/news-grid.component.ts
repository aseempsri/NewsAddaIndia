import { Component, OnInit, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NewsService, NewsArticle } from '../../services/news.service';
import { ModalService } from '../../services/modal.service';
import { NewsDetailModalComponent } from '../news-detail-modal/news-detail-modal.component';

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
            <h2 class="font-display text-2xl lg:text-3xl font-bold">
              Latest <span class="gradient-text">Stories</span>
            </h2>
            <p class="text-muted-foreground mt-1">Stay updated with the latest news</p>
          </div>
          <a
            href="#"
            class="hidden sm:flex items-center gap-2 text-primary hover:text-primary/80 transition-colors font-medium">
            View All
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
                class="news-card group opacity-0 animate-fade-in"
                [style.animation-delay]="i * 100 + 'ms'">
              <div class="relative aspect-[16/10] overflow-hidden rounded-t-xl bg-secondary/20">
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
                <div class="absolute top-4 left-4 z-20">
                  <span [class]="'px-3 py-1 text-xs font-semibold rounded-full ' + getCategoryColor(news.category)">
                    {{ news.category }}
                  </span>
                </div>
              </div>

              <!-- Border Line -->
              <div class="h-[2px] bg-gray-300 dark:bg-gray-600"></div>

              <div class="p-5 bg-background rounded-b-xl">
                <div class="flex items-start gap-2 mb-2">
                  <div class="flex-shrink-0 mt-0.5">
                    @if (news.category === 'Sports') {
                      <svg class="w-5 h-5 text-orange-600" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1.41 16.09V20h-2.67v-1.93c-1.71-.36-3.16-1.46-3.27-3.4h1.96c.1 1.05.82 1.87 2.65 1.87 1.96 0 2.4-.98 2.4-1.59 0-.83-.44-1.61-2.67-2.14-2.48-.6-4.18-1.62-4.18-3.67 0-1.72 1.39-2.84 3.11-3.21V4h2.67v1.95c1.86.45 2.79 1.86 2.85 3.39H14.3c-.05-1.11-.64-1.87-2.22-1.87-1.5 0-2.4.68-2.4 1.64 0 .84.65 1.39 2.67 1.91s4.18 1.39 4.18 3.91c-.01 1.83-1.38 2.83-3.12 3.16z"/></svg>
                    } @else if (news.category === 'Business') {
                      <svg class="w-5 h-5 text-blue-600" viewBox="0 0 24 24" fill="currentColor"><path d="M11.8 10.9c-2.27-.59-3-1.2-3-2.15 0-1.09 1.01-1.85 2.7-1.85 1.78 0 2.44.85 2.5 2.1h2.21c-.07-1.72-1.12-3.3-3.21-3.81V3h-3v2.16c-1.94.42-3.5 1.68-3.5 3.61 0 2.31 1.91 3.46 4.7 4.13 2.5.6 3 1.48 3 2.41 0 .69-.49 1.79-2.7 1.79-2.06 0-2.87-.92-2.98-2.1h-2.2c.12 2.19 1.76 3.42 3.68 3.83V21h3v-2.15c1.95-.37 3.5-1.5 3.5-3.55 0-2.84-2.43-3.81-4.7-4.4z"/></svg>
                    } @else if (news.category === 'Entertainment') {
                      <svg class="w-5 h-5 text-pink-600" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>
                    } @else if (news.category === 'Health') {
                      <svg class="w-5 h-5 text-green-600" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/></svg>
                    } @else {
                      <svg class="w-5 h-5 text-primary" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
                    }
                  </div>
                  <h3 [class]="'font-display text-lg font-bold leading-tight group-hover:opacity-90 transition-colors line-clamp-2 ' + getHeadlineColor(news.category)">
                    {{ news.title }}
                  </h3>
                </div>
                <p class="text-muted-foreground text-sm line-clamp-2 mb-4">
                  {{ news.excerpt }}
                </p>
                <div class="flex items-center justify-between">
                  <span class="flex items-center gap-1.5 text-xs font-medium">
                    <svg class="w-3.5 h-3.5 text-blue-500" viewBox="0 0 24 24" fill="currentColor"><path d="M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zM12 20c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm.5-13H11v6l5.25 3.15.75-1.23-4.5-2.67z"/></svg>
                    <span class="text-blue-600 dark:text-blue-400 font-bold">{{ news.time }}</span>
                  </span>
                  <button 
                    class="text-primary opacity-80 sm:opacity-60 sm:group-hover:opacity-100 transition-all hover:underline font-medium text-sm cursor-pointer touch-manipulation min-h-[44px] px-2"
                    type="button"
                    (click)="openNewsModal(news)" 
                    (touchend)="openNewsModal(news)">
                    Read more
                  </button>
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
            View All Stories
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
export class NewsGridComponent implements OnInit {
  @Output() imagesLoaded = new EventEmitter<boolean>();
  newsItems: NewsArticle[] = [];
  isLoading = true;
  modalState: { isOpen: boolean; news: NewsArticle | null; isBreaking?: boolean } = {
    isOpen: false,
    news: null,
    isBreaking: false
  };

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
    this.loadNews();
  }

  loadNews() {
    // Try to fetch news specifically marked for 'home' page first
    this.newsService.fetchNewsByPage('home', 6).subscribe({
      next: (news) => {
        // If we got news from backend for home page, use it
        if (news.length > 0) {
          this.newsItems = news.slice(0, 6);
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
          next: (news) => {
            this.newsItems = news.slice(0, 6);
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
            // Image failed to load, try fetching from external source
            console.warn(`Image failed to load for "${item.title}", fetching alternative...`);
            item.imageLoading = true;
            item.image = '';
            this.newsService.fetchImageForHeadline(item.title, item.category).subscribe({
              next: (imageUrl) => {
                if (imageUrl && imageUrl.trim() !== '') {
                  const newImg = new Image();
                  newImg.onload = () => {
                    item.image = imageUrl;
                    item.imageLoading = false;
                    resolve();
                  };
                  newImg.onerror = () => {
                    item.image = this.newsService.getPlaceholderImage(item.title);
                    item.imageLoading = false;
                    resolve();
                  };
                  newImg.src = imageUrl;
                } else {
                  item.image = this.newsService.getPlaceholderImage(item.title);
                  item.imageLoading = false;
                  resolve();
                }
              },
              error: () => {
                item.image = this.newsService.getPlaceholderImage(item.title);
                item.imageLoading = false;
                resolve();
              }
            });
          };
          img.src = item.image;
        });
        imagePromises.push(imagePromise);
      } else if (item.imageLoading || !item.image || item.image.trim() === '') {
        // Fetch image based on headline using Pixabay/Pexels if loading or empty
        const imagePromise = new Promise<void>((resolve) => {
          this.newsService.fetchImageForHeadline(item.title, item.category).subscribe({
            next: (imageUrl) => {
              // Only update if we got a valid image URL
              if (imageUrl && imageUrl.trim() !== '') {
                // Preload image to ensure it's ready before showing
                const img = new Image();
                img.onload = () => {
                  item.image = imageUrl;
                  item.imageLoading = false;
                  resolve();
                };
                img.onerror = () => {
                  // If image fails to load, try placeholder as last resort
                  item.image = this.newsService.getPlaceholderImage(item.title);
                  item.imageLoading = false;
                  resolve();
                };
                img.src = imageUrl;
              } else {
                // Fallback to placeholder if no image found
                item.image = this.newsService.getPlaceholderImage(item.title);
                item.imageLoading = false;
                resolve();
              }
            },
            error: (error) => {
              console.error(`Error fetching image for "${item.title}":`, error);
              // Fallback to placeholder on error
              item.image = this.newsService.getPlaceholderImage(item.title);
              item.imageLoading = false;
              resolve();
            }
          });
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
    Health: 'bg-green-500/20 text-green-400',
    Sports: 'bg-orange-500/20 text-orange-400',
    Business: 'bg-blue-500/20 text-blue-400',
    Entertainment: 'bg-pink-500/20 text-pink-400',
    International: 'bg-purple-500/20 text-purple-400',
    Technology: 'bg-cyan-500/20 text-cyan-400',
  };

  getCategoryColor(category: string): string {
    return this.categoryColors[category] || 'bg-primary/20 text-primary';
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

  openNewsModal(news: NewsArticle) {
    this.modalService.openModal(news, false);
  }

  closeModal() {
    this.modalService.closeModal();
  }
}

