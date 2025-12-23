import { Component, OnInit, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ButtonComponent } from '../../ui/button/button.component';
import { NewsService, NewsArticle } from '../../services/news.service';
import { ModalService } from '../../services/modal.service';
import { NewsDetailModalComponent } from '../news-detail-modal/news-detail-modal.component';

interface SideNews {
  category: string;
  title: string;
  image: string;
  imageLoading?: boolean;
}

@Component({
  selector: 'app-hero-section',
  standalone: true,
  imports: [CommonModule, ButtonComponent, NewsDetailModalComponent],
  template: `
    <section class="relative py-8 lg:py-12">
      <!-- Background Glow -->
      <div class="absolute top-0 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl pointer-events-none"></div>
      <div class="absolute bottom-0 right-1/4 w-96 h-96 bg-accent/10 rounded-full blur-3xl pointer-events-none"></div>

      <div class="container mx-auto px-4 relative">
        <div class="grid lg:grid-cols-3 gap-6">
          <!-- Main Featured Article -->
          <div class="lg:col-span-2">
            <article class="group h-full relative overflow-hidden rounded-2xl bg-background shadow-lg hover:shadow-2xl transition-all duration-500 border border-border/50">
              <div class="relative aspect-[16/10] lg:aspect-[16/9] overflow-hidden">
                <!-- Loading Animation - Show while image is loading -->
                @if (featuredNews.imageLoading || !featuredNews.image) {
                  <div class="absolute inset-0 flex items-center justify-center bg-secondary/50 z-10">
                    <div class="flex flex-col items-center gap-3">
                      <div class="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
                      <span class="text-sm text-muted-foreground">Loading image...</span>
                    </div>
                  </div>
                }
                <!-- Image - Only show when loaded -->
                @if (featuredNews.image && !featuredNews.imageLoading) {
                  <img
                    [src]="featuredNews.image"
                    [alt]="featuredNews.title"
                    class="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                }
                <!-- Category Badge - Top Left -->
                <div class="absolute top-5 left-5 z-20 flex gap-2">
                  <span class="px-4 py-1.5 text-xs font-bold rounded-full bg-red-600 text-white shadow-lg backdrop-blur-sm">
                    BREAKING
                  </span>
                  <span class="px-4 py-1.5 text-xs font-bold rounded-full bg-primary/90 text-primary-foreground shadow-lg backdrop-blur-sm">
                    {{ featuredNews.category }}
                  </span>
                </div>
              </div>

              <!-- Bottom Section with Headline and Read More -->
              <div class="p-5 lg:p-6 bg-gradient-to-br from-background to-secondary/30 border-t border-border/50">
                <h2 class="font-display text-xl lg:text-3xl font-bold leading-tight mb-3 text-foreground">
                  {{ featuredNews.titleEn }}
                </h2>
                <p class="text-muted-foreground text-sm lg:text-base mb-4 line-clamp-2">
                  {{ featuredNews.excerpt }}
                </p>
                <div class="flex items-center justify-between">
                  <div class="flex items-center gap-3 text-sm text-muted-foreground">
                    <span class="flex items-center gap-1.5">
                      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      {{ featuredNews.time }}
                    </span>
                  </div>
                  <button 
                    class="px-6 py-2.5 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 transition-all duration-300 shadow-md hover:shadow-lg hover:scale-105 cursor-pointer touch-manipulation"
                    type="button"
                    (click)="openNewsModal(featuredNews)" 
                    (touchend)="openNewsModal(featuredNews)">
                    Read more
                  </button>
                </div>
              </div>
            </article>
          </div>

          <!-- Side Articles -->
          <div class="flex flex-col gap-6">
            @for (news of sideNews; track $index; let i = $index) {
              <article
                class="group flex-1 relative overflow-hidden rounded-2xl bg-background shadow-lg hover:shadow-2xl transition-all duration-500 border border-border/50 hover:-translate-y-1"
                [style.animation-delay]="i * 100 + 'ms'">
                <div class="relative aspect-[16/10] overflow-hidden">
                  <!-- Loading Animation - Show while image is loading -->
                  @if (news.imageLoading || !news.image) {
                    <div class="absolute inset-0 flex items-center justify-center bg-secondary/50 z-10">
                      <div class="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                    </div>
                  }
                  <!-- Image - Only show when loaded -->
                  @if (news.image && !news.imageLoading) {
                    <img
                      [src]="news.image"
                      [alt]="news.title"
                      class="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                  }
                  
                  <!-- Category Badge -->
                  <div class="absolute top-4 left-4 z-20">
                    <span class="px-3 py-1 text-xs font-bold rounded-full bg-primary/90 text-primary-foreground shadow-lg backdrop-blur-sm">
                      {{ news.category }}
                    </span>
                  </div>
                </div>

                <!-- Bottom Section with Headline -->
                <div class="p-4 bg-gradient-to-br from-background to-secondary/30 border-t border-border/50">
                  <h3 class="font-display text-lg font-bold leading-tight mb-3 text-foreground line-clamp-2">
                    {{ news.title }}
                  </h3>
                  <div class="flex items-center justify-between">
                    <span class="text-xs text-muted-foreground flex items-center gap-1.5">
                      <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      2 hours ago
                    </span>
                    <button 
                      class="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition-all duration-300 shadow-md hover:shadow-lg hover:scale-105 cursor-pointer touch-manipulation"
                      type="button"
                      (click)="openNewsModalFromSide(news, $index)" 
                      (touchend)="openNewsModalFromSide(news, $index)">
                      Read more
                    </button>
                  </div>
                </div>
              </article>
            }
          </div>
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
export class HeroSectionComponent implements OnInit {
  @Output() imagesLoaded = new EventEmitter<boolean>();
  modalState: { isOpen: boolean; news: NewsArticle | null; isBreaking?: boolean } = {
    isOpen: false,
    news: null,
    isBreaking: false
  };
  featuredNews: NewsArticle = {
    category: 'National',
    title: 'Loading latest news...',
    titleEn: 'Loading latest news...',
    excerpt: 'Please wait while we fetch the latest news.',
    author: 'News Adda India',
    date: new Date().toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' }),
    image: 'assets/videos/Putin_in_India_.webp',
    time: 'Just now'
  };

  sideNews: SideNews[] = [
    {
      category: 'Sports',
      title: 'Loading...',
      image: 'assets/videos/indianz.avif',
    },
    {
      category: 'Business',
      title: 'Loading...',
      image: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=600&q=80',
    },
  ];

  isLoading = true;

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
    const imagePromises: Promise<void>[] = [];

    // Load breaking news for hero section (falls back to featured if no breaking news)
    this.newsService.fetchBreakingNews().subscribe({
      next: (news) => {
        this.featuredNews = news;
        // Verify image loads, or fetch if missing/invalid
        if (news.image && news.image.trim() !== '' && !news.imageLoading) {
          // Image URL exists, verify it loads
          const featuredImagePromise = new Promise<void>((resolve) => {
            const img = new Image();
            img.onload = () => {
              this.featuredNews.imageLoading = false;
              resolve();
            };
            img.onerror = () => {
              // Image failed to load, fetch alternative
              console.warn(`Featured image failed to load, fetching alternative...`);
              this.featuredNews.imageLoading = true;
              this.featuredNews.image = '';
              this.newsService.fetchImageForHeadline(news.title, news.category).subscribe({
                next: (imageUrl) => {
                  if (imageUrl && imageUrl.trim() !== '') {
                    const newImg = new Image();
                    newImg.onload = () => {
                      this.featuredNews.image = imageUrl;
                      this.featuredNews.imageLoading = false;
                      resolve();
                    };
                    newImg.onerror = () => {
                      this.featuredNews.image = this.newsService.getPlaceholderImage(news.title);
                      this.featuredNews.imageLoading = false;
                      resolve();
                    };
                    newImg.src = imageUrl;
                  } else {
                    this.featuredNews.image = this.newsService.getPlaceholderImage(news.title);
                    this.featuredNews.imageLoading = false;
                    resolve();
                  }
                },
                error: () => {
                  this.featuredNews.image = this.newsService.getPlaceholderImage(news.title);
                  this.featuredNews.imageLoading = false;
                  resolve();
                }
              });
            };
            img.src = news.image;
          });
          imagePromises.push(featuredImagePromise);
        } else if (news.imageLoading || !news.image || news.image.trim() === '') {
          // Fetch image based on headline if loading or empty
          this.featuredNews.imageLoading = true;
          this.featuredNews.image = ''; // Clear any placeholder
          
          const featuredImagePromise = new Promise<void>((resolve) => {
            this.newsService.fetchImageForHeadline(news.title, news.category).subscribe({
              next: (imageUrl) => {
                if (imageUrl && imageUrl.trim() !== '') {
                  // Preload image
                  const img = new Image();
                  img.onload = () => {
                    this.featuredNews.image = imageUrl;
                    this.featuredNews.imageLoading = false;
                    resolve();
                  };
                  img.onerror = () => {
                    this.featuredNews.image = this.newsService.getPlaceholderImage(news.title);
                    this.featuredNews.imageLoading = false;
                    resolve();
                  };
                  img.src = imageUrl;
                } else {
                  this.featuredNews.image = this.newsService.getPlaceholderImage(news.title);
                  this.featuredNews.imageLoading = false;
                  resolve();
                }
              },
              error: () => {
                this.featuredNews.image = this.newsService.getPlaceholderImage(news.title);
                this.featuredNews.imageLoading = false;
                resolve();
              }
            });
          });
          imagePromises.push(featuredImagePromise);
        } else {
          imagePromises.push(Promise.resolve());
        }
      },
      error: (error) => {
        console.error('Error loading featured news:', error);
        imagePromises.push(Promise.resolve());
      }
    });

    // Load side news
    this.newsService.fetchSideNews(['Sports', 'Business']).subscribe({
      next: (news) => {
        this.sideNews = news.map((n, index) => {
          const sideNewsItem = {
            category: n.category,
            title: n.title,
            image: '',
            imageLoading: true
          };
          
          // Fetch image based on headline
          const sideImagePromise = new Promise<void>((resolve) => {
            this.newsService.fetchImageForHeadline(n.title, n.category).subscribe({
              next: (imageUrl) => {
                if (imageUrl && imageUrl.trim() !== '') {
                  // Preload image
                  const img = new Image();
                  img.onload = () => {
                    sideNewsItem.image = imageUrl;
                    sideNewsItem.imageLoading = false;
                    resolve();
                  };
                  img.onerror = () => {
                    sideNewsItem.image = this.newsService.getPlaceholderImage(n.title);
                    sideNewsItem.imageLoading = false;
                    resolve();
                  };
                  img.src = imageUrl;
                } else {
                  sideNewsItem.image = this.newsService.getPlaceholderImage(n.title);
                  sideNewsItem.imageLoading = false;
                  resolve();
                }
              },
              error: () => {
                sideNewsItem.image = this.newsService.getPlaceholderImage(n.title);
                sideNewsItem.imageLoading = false;
                resolve();
              }
            });
          });
          imagePromises.push(sideImagePromise);
          
          return sideNewsItem;
        });

        // Wait for all images to load before showing page
        // Add timeout to prevent infinite loading
        const timeoutPromise = new Promise<void>((resolve) => {
          setTimeout(() => {
            console.warn('Hero section image loading timeout - showing page anyway');
            resolve();
          }, 15000); // 15 second timeout
        });

        Promise.race([Promise.all(imagePromises), timeoutPromise]).then(() => {
          this.isLoading = false;
          this.imagesLoaded.emit(true);
          console.log('All hero section images loaded');
        });
      },
      error: (error) => {
        console.error('Error loading side news:', error);
        this.isLoading = false;
      }
    });
  }

  openNewsModal(news: NewsArticle) {
    // Check if this is breaking news (you might want to add a property to NewsArticle)
    const isBreaking = false; // You can determine this based on your data
    this.modalService.openModal(news, isBreaking);
  }

  openNewsModalFromSide(sideNews: SideNews, index: number) {
    // Convert SideNews to NewsArticle format
    const newsArticle: NewsArticle = {
      id: index + 1000, // Temporary ID
      category: sideNews.category,
      title: sideNews.title,
      titleEn: sideNews.title,
      excerpt: sideNews.title, // Use title as excerpt for side news
      image: sideNews.image,
      imageLoading: sideNews.imageLoading || false,
      time: '2 hours ago',
      author: 'News Adda India',
      date: new Date().toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' })
    };
    this.modalService.openModal(newsArticle, false);
  }

  closeModal() {
    this.modalService.closeModal();
  }

}

