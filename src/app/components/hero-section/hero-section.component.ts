import { Component, OnInit, Output, EventEmitter, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ButtonComponent } from '../../ui/button/button.component';
import { NewsService, NewsArticle } from '../../services/news.service';
import { ModalService } from '../../services/modal.service';
import { NewsDetailModalComponent } from '../news-detail-modal/news-detail-modal.component';
import { ReadMoreTooltipComponent } from '../read-more-tooltip/read-more-tooltip.component';

interface SideNews {
  category: string;
  title: string;
  image: string;
  imageLoading?: boolean;
}

@Component({
  selector: 'app-hero-section',
  standalone: true,
  imports: [CommonModule, ButtonComponent, NewsDetailModalComponent, ReadMoreTooltipComponent],
  template: `
    <section class="relative py-8 lg:py-12">
      <!-- Background Glow -->
      <div class="absolute top-0 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl pointer-events-none"></div>
      <div class="absolute bottom-0 right-1/4 w-96 h-96 bg-accent/10 rounded-full blur-3xl pointer-events-none"></div>

      <div class="container mx-auto px-4 relative">
        <div class="grid lg:grid-cols-3 gap-6">
          <!-- Main Featured Article -->
          <div class="lg:col-span-2">
            <article class="news-card group h-full cursor-pointer touch-manipulation" (click)="openNewsModal(featuredNews)" (touchstart)="openNewsModal(featuredNews)">
              <div class="relative aspect-[16/10] lg:aspect-[16/9] overflow-hidden rounded-t-xl bg-secondary/20">
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
                    class="w-full h-full object-cover transition-all duration-500 group-hover:scale-105 animate-fade-in" />
                }
                <!-- Desktop: Gradient overlay for text readability -->
                <div class="absolute inset-0 bg-gradient-to-t from-background via-background/50 to-transparent hidden lg:block"></div>
                
                <!-- Category Badge - Top Left -->
                <div class="absolute top-4 left-4 z-20 flex gap-2">
                  <span class="px-3 py-1 text-xs font-semibold rounded-full bg-red-600 text-white animate-pulse">
                    BREAKING
                  </span>
                  <span class="px-3 py-1 text-xs font-semibold rounded-full bg-primary text-primary-foreground">
                    {{ featuredNews.category }}
                  </span>
                </div>
                
                <!-- Desktop: Content Overlay (hidden on mobile) -->
                <div class="absolute bottom-0 left-0 right-0 p-6 lg:p-8 hidden lg:block">
                  <h2 class="font-display text-2xl lg:text-4xl font-bold leading-tight mb-3 text-foreground">
                    {{ featuredNews.titleEn }}
                  </h2>
                  <p class="text-muted-foreground text-sm lg:text-base mb-4 line-clamp-2">
                    {{ featuredNews.excerpt }}
                  </p>
                  <div class="flex items-center gap-4 text-sm text-muted-foreground">
                    <span class="flex items-center gap-1.5">
                      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                      {{ featuredNews.author }}
                    </span>
                    <span class="flex items-center gap-1.5">
                      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      {{ featuredNews.date }}
                    </span>
                  </div>
                </div>
              </div>

              <!-- Mobile: Content below image (shown on mobile, hidden on desktop) -->
              <div class="p-5 lg:hidden">
                <h2 class="font-display text-lg font-semibold leading-tight mb-2 group-hover:text-primary transition-colors line-clamp-2">
                  {{ featuredNews.titleEn }}
                </h2>
                <p class="text-muted-foreground text-sm line-clamp-2 mb-4">
                  {{ featuredNews.excerpt }}
                </p>
                <div class="flex items-center justify-between">
                  <span class="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    {{ featuredNews.time }}
                  </span>
                  <svg 
                    class="w-7 h-7 sm:w-8 sm:h-8 text-primary opacity-80 sm:opacity-60 sm:group-hover:opacity-100 transition-all transform group-hover:translate-x-1 cursor-pointer touch-manipulation" 
                    fill="none" 
                    stroke="currentColor" 
                    viewBox="0 0 24 24" 
                    (click)="onArrowClick($event, featuredNews)" 
                    (touchend)="onArrowClick($event, featuredNews)">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                  </svg>
                </div>
              </div>

              <!-- Desktop: Read Full Story button (hidden on mobile) -->
              <div class="p-4 lg:p-6 border-t border-border/30 hidden lg:block" (click)="$event.stopPropagation()">
                <app-button variant="ghost" class="group/btn text-primary hover:text-primary" (click)="openNewsModal(featuredNews)">
                  Read Full Story
                  <svg class="w-4 h-4 ml-2 transition-transform group-hover/btn:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                  </svg>
                </app-button>
              </div>
            </article>
          </div>

          <!-- Side Articles -->
          <div class="flex flex-col gap-6">
            @for (news of sideNews; track $index; let i = $index) {
              <article
                class="news-card group flex-1 cursor-pointer touch-manipulation"
                [style.animation-delay]="i * 100 + 'ms'"
                (click)="openNewsModalFromSide(news, $index)"
                (touchstart)="openNewsModalFromSide(news, $index)">
                <div class="relative aspect-[16/10] overflow-hidden rounded-t-xl bg-secondary/20">
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
                      class="w-full h-full object-cover transition-all duration-500 group-hover:scale-105 animate-fade-in" />
                  }
                  <div class="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-transparent"></div>
                  
                  <div class="absolute bottom-0 left-0 right-0 p-4">
                    <span class="category-badge text-primary-foreground text-xs mb-2 inline-block">
                      {{ news.category }}
                    </span>
                    <h3 class="font-display text-lg font-semibold leading-tight text-foreground line-clamp-2">
                      {{ news.title }}
                    </h3>
                  </div>
                </div>

                <div class="p-4 flex items-center justify-between border-t border-border/30">
                  <span class="text-xs text-muted-foreground">2 hours ago</span>
                  <svg 
                    class="w-7 h-7 sm:w-8 sm:h-8 text-primary opacity-80 sm:opacity-60 sm:group-hover:opacity-100 transition-opacity cursor-pointer touch-manipulation" 
                    fill="none" 
                    stroke="currentColor" 
                    viewBox="0 0 24 24" 
                    (click)="onSideArrowClick($event, news, $index)" 
                    (touchend)="onSideArrowClick($event, news, $index)">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                  </svg>
                </div>
              </article>
            }
          </div>
        </div>
      </div>
    </section>

    <!-- Read More Tooltip -->
    <app-read-more-tooltip
      [isVisible]="showReadMoreTooltip"
      [positionX]="tooltipX"
      [positionY]="tooltipY"
      (readMoreClick)="onReadMoreClick()">
    </app-read-more-tooltip>

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
  showReadMoreTooltip = false;
  tooltipX = 0;
  tooltipY = 0;
  selectedNews: NewsArticle | null = null;
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

  onArrowClick(event: Event, news: NewsArticle) {
    event.stopPropagation();
    event.preventDefault();
    
    const arrowElement = event.target as HTMLElement;
    const rect = arrowElement.getBoundingClientRect();
    
    this.tooltipX = rect.right + 10;
    this.tooltipY = rect.top - 10;
    
    if (this.tooltipX + 150 > window.innerWidth) {
      this.tooltipX = rect.left - 160;
    }
    if (this.tooltipY < 10) {
      this.tooltipY = 10;
    }
    
    this.selectedNews = news;
    this.showReadMoreTooltip = true;
  }

  onSideArrowClick(event: Event, sideNews: SideNews, index: number) {
    event.stopPropagation();
    event.preventDefault();
    
    const arrowElement = event.target as HTMLElement;
    const rect = arrowElement.getBoundingClientRect();
    
    this.tooltipX = rect.right + 10;
    this.tooltipY = rect.top - 10;
    
    if (this.tooltipX + 150 > window.innerWidth) {
      this.tooltipX = rect.left - 160;
    }
    if (this.tooltipY < 10) {
      this.tooltipY = 10;
    }
    
    // Convert SideNews to NewsArticle
    const newsArticle: NewsArticle = {
      id: index + 1000,
      category: sideNews.category,
      title: sideNews.title,
      titleEn: sideNews.title,
      excerpt: sideNews.title,
      image: sideNews.image,
      imageLoading: sideNews.imageLoading || false,
      time: '2 hours ago',
      author: 'News Adda India',
      date: new Date().toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' })
    };
    
    this.selectedNews = newsArticle;
    this.showReadMoreTooltip = true;
  }

  onReadMoreClick() {
    this.showReadMoreTooltip = false;
    if (this.selectedNews) {
      this.openNewsModal(this.selectedNews);
      this.selectedNews = null;
    }
  }

  @HostListener('document:click', ['$event'])
  @HostListener('document:touchend', ['$event'])
  onDocumentClick(event: Event) {
    const target = event.target as HTMLElement;
    if (!target.closest('.read-more-tooltip') && !target.closest('svg')) {
      this.showReadMoreTooltip = false;
      this.selectedNews = null;
    }
  }
}

