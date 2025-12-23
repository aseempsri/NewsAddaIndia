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
                <div class="p-5">
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

              <div class="p-5">
                <h3 class="font-display text-lg font-semibold leading-tight mb-2 group-hover:text-primary transition-colors line-clamp-2">
                  {{ news.title }}
                </h3>
                <p class="text-muted-foreground text-sm line-clamp-2 mb-4">
                  {{ news.excerpt }}
                </p>
                <div class="flex items-center justify-between">
                  <span class="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    {{ news.time }}
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

  openNewsModal(news: NewsArticle) {
    this.modalService.openModal(news, false);
  }

  closeModal() {
    this.modalService.closeModal();
  }
}

