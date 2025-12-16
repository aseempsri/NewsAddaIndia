import { Component, OnInit, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ButtonComponent } from '../../ui/button/button.component';
import { NewsService, NewsArticle } from '../../services/news.service';

interface SideNews {
  category: string;
  title: string;
  image: string;
  imageLoading?: boolean;
}

@Component({
  selector: 'app-hero-section',
  standalone: true,
  imports: [CommonModule, ButtonComponent],
  template: `
    <section class="relative py-8 lg:py-12">
      <!-- Background Glow -->
      <div class="absolute top-0 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl pointer-events-none"></div>
      <div class="absolute bottom-0 right-1/4 w-96 h-96 bg-accent/10 rounded-full blur-3xl pointer-events-none"></div>

      <div class="container mx-auto px-4 relative">
        <div class="grid lg:grid-cols-3 gap-6">
          <!-- Main Featured Article -->
          <div class="lg:col-span-2">
            <article class="news-card group h-full">
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
                <div class="absolute inset-0 bg-gradient-to-t from-background via-background/50 to-transparent"></div>
                
                <!-- Content Overlay -->
                <div class="absolute bottom-0 left-0 right-0 p-6 lg:p-8">
                  <span class="category-badge text-primary-foreground mb-4 inline-block">
                    {{ featuredNews.category }}
                  </span>
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

              <div class="p-4 lg:p-6 border-t border-border/30">
                <app-button variant="ghost" class="group/btn text-primary hover:text-primary">
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
                class="news-card group flex-1"
                [style.animation-delay]="i * 100 + 'ms'">
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
                  <svg class="w-4 h-4 text-primary opacity-0 group-hover:opacity-100 transition-opacity" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                  </svg>
                </div>
              </article>
            }
          </div>
        </div>
      </div>
    </section>
  `,
  styles: []
})
export class HeroSectionComponent implements OnInit {
  @Output() imagesLoaded = new EventEmitter<boolean>();
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

  constructor(private newsService: NewsService) { }

  ngOnInit() {
    this.loadNews();
  }

  loadNews() {
    const imagePromises: Promise<void>[] = [];

    // Load featured news
    this.newsService.fetchFeaturedNews('National').subscribe({
      next: (news) => {
        this.featuredNews = news;
        // Fetch image based on headline if loading
        if (news.imageLoading || !news.image) {
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
                    this.featuredNews.image = this.newsService['getPlaceholderImage'](news.title);
                    this.featuredNews.imageLoading = false;
                    resolve();
                  };
                  img.src = imageUrl;
                } else {
                  this.featuredNews.image = this.newsService['getPlaceholderImage'](news.title);
                  this.featuredNews.imageLoading = false;
                  resolve();
                }
              },
              error: () => {
                this.featuredNews.image = this.newsService['getPlaceholderImage'](news.title);
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
                    sideNewsItem.image = this.newsService['getPlaceholderImage'](n.title);
                    sideNewsItem.imageLoading = false;
                    resolve();
                  };
                  img.src = imageUrl;
                } else {
                  sideNewsItem.image = this.newsService['getPlaceholderImage'](n.title);
                  sideNewsItem.imageLoading = false;
                  resolve();
                }
              },
              error: () => {
                sideNewsItem.image = this.newsService['getPlaceholderImage'](n.title);
                sideNewsItem.imageLoading = false;
                resolve();
              }
            });
          });
          imagePromises.push(sideImagePromise);
          
          return sideNewsItem;
        });

        // Wait for all images to load before showing page
        Promise.all(imagePromises).then(() => {
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
}

