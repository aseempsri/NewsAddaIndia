import { Component, OnInit, OnDestroy, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, NavigationEnd } from '@angular/router';
import { ButtonComponent } from '../../ui/button/button.component';
import { NewsService, NewsArticle } from '../../services/news.service';
import { ModalService } from '../../services/modal.service';
import { LanguageService } from '../../services/language.service';
import { DisplayedNewsService } from '../../services/displayed-news.service';
import { NewsDetailModalComponent } from '../news-detail-modal/news-detail-modal.component';
import { Subscription } from 'rxjs';
import { filter } from 'rxjs/operators';

interface SideNews {
  category: string;
  title: string;
  image: string;
  date?: string;
  time?: string;
  author?: string;
  imageLoading?: boolean;
  isTrending?: boolean;
  isBreaking?: boolean;
  isFeatured?: boolean;
  trendingTitle?: string;
  tags?: string[];
  id?: string | number;
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
                @if (!isHomePage) {
                  <div class="absolute top-5 left-5 z-20 flex gap-2 flex-wrap">
                    @if (featuredNews.isTrending) {
                      <span class="inline-flex items-center justify-center gap-1.5 px-4 py-2 text-xs font-black rounded-full bg-gradient-to-r from-purple-600 via-pink-500 to-fuchsia-600 text-white shadow-xl animate-pulse border-2 border-white/50 uppercase tracking-wider backdrop-blur-sm" style="font-family: 'Arial Black', 'Helvetica Neue', sans-serif; text-shadow: 2px 2px 4px rgba(0,0,0,0.5), 0 0 8px rgba(255,255,255,0.3); letter-spacing: 0.1em;">
                        <svg class="w-4 h-4 text-white flex-shrink-0" fill="currentColor" viewBox="0 0 24 24" style="filter: drop-shadow(0 2px 3px rgba(0,0,0,0.4));">
                          <path d="M13 10V3L4 14h7v7l9-11h-7z"/>
                        </svg>
                        <span class="text-sm leading-none">🔥</span>
                        <span>TRENDING</span>
                        <span class="text-sm leading-none">🔥</span>
                      </span>
                    }
                    @if (featuredNews.isBreaking) {
                      <span class="inline-flex items-center justify-center gap-1.5 px-4 py-2 text-xs font-black rounded-full bg-gradient-to-r from-red-600 to-red-700 text-white shadow-xl animate-pulse border-2 border-white/50 uppercase tracking-wider backdrop-blur-sm" style="font-family: 'Arial Black', 'Helvetica Neue', sans-serif; text-shadow: 2px 2px 4px rgba(0,0,0,0.5), 0 0 8px rgba(255,255,255,0.3); letter-spacing: 0.1em;">
                        <svg class="w-4 h-4 text-white flex-shrink-0" fill="currentColor" viewBox="0 0 24 24" style="filter: drop-shadow(0 2px 3px rgba(0,0,0,0.4));">
                          <path d="M13 10V3L4 14h7v7l9-11h-7z"/>
                        </svg>
                        <span>{{ t.breaking }}</span>
                      </span>
                    }
                    @if (featuredNews.isFeatured) {
                      <span class="inline-flex items-center justify-center gap-1.5 px-4 py-2 text-xs font-black rounded-full bg-gradient-to-r from-yellow-500 to-amber-500 text-white shadow-xl border-2 border-white/50 uppercase tracking-wider backdrop-blur-sm" style="font-family: 'Arial Black', 'Helvetica Neue', sans-serif; text-shadow: 2px 2px 4px rgba(0,0,0,0.5), 0 0 8px rgba(255,255,255,0.3); letter-spacing: 0.1em;">
                        <svg class="w-4 h-4 text-white flex-shrink-0" fill="currentColor" viewBox="0 0 24 24" style="filter: drop-shadow(0 2px 3px rgba(0,0,0,0.4));">
                          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                        </svg>
                        <span>FEATURED</span>
                      </span>
                    }
                    <span [class]="'inline-flex items-center justify-center px-4 py-1.5 text-xs font-bold rounded-full shadow-lg text-white ' + getCategoryColor(featuredNews.category)">
                      {{ getCategoryName(featuredNews.category) }}
                    </span>
                  </div>
                }
              </div>

              <!-- Bottom Section with Headline and Read More -->
              <div class="p-5 lg:p-6 pt-6 lg:pt-7 pb-6 lg:pb-7 bg-gradient-to-br from-background to-secondary/30 border-t border-border/50 flex flex-col h-full">
                <div class="flex items-start gap-3 mb-4">
                  <h2
                    [class]="'font-display text-xl lg:text-3xl font-bold dark:font-normal leading-tight pb-1 min-h-[3.5rem] lg:min-h-[5rem] cursor-pointer hover:opacity-80 transition-all duration-300 hover:scale-[1.01] flex-1 ' + (featuredNews.isTrending ? 'text-purple-700 dark:text-purple-300' : getHeadlineColor(featuredNews.category))"
                    (click)="openNewsModal(featuredNews)"
                    (touchstart)="onTouchStart($event, featuredNews)"
                    (touchend)="onTouchEnd($event, featuredNews)"
                    (touchmove)="onTouchMove($event)"
                    style="touch-action: pan-y;">
                    @if (featuredNews.isTrending && !isHomePage) {
                      <span class="inline-block mr-2 text-xl leading-none">🔥</span>
                    }
                    {{ getDisplayTitle(featuredNews) }}
                  </h2>
                </div>
                <p class="text-muted-foreground text-sm lg:text-base mb-4 mt-3 pt-1 line-clamp-3 min-h-[4rem] leading-relaxed">
                  {{ featuredNews.excerpt }}
                </p>
                <div class="flex items-center justify-between text-xs text-muted-foreground mt-4 pt-2 border-t border-border/20" style="min-height: 24px;">
                  <span class="text-left font-medium" style="color: rgb(113, 113, 122);">{{ featuredNews.author || 'News Adda India' }}</span>
                  <span class="text-right font-medium" style="color: rgb(113, 113, 122);">{{ featuredNews.date || featuredNews.time || 'Just now' }}</span>
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
                  @if (!isHomePage) {
                    <div class="absolute top-4 left-4 z-20 flex gap-2 flex-wrap">
                      @if (news.isTrending) {
                        <span class="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-black rounded-full bg-gradient-to-r from-purple-600 via-pink-500 to-fuchsia-600 text-white shadow-xl animate-pulse border-2 border-white/50 uppercase tracking-wider backdrop-blur-sm" style="font-family: 'Arial Black', 'Helvetica Neue', sans-serif; text-shadow: 2px 2px 4px rgba(0,0,0,0.5), 0 0 8px rgba(255,255,255,0.3); letter-spacing: 0.1em;">
                          <svg class="w-3.5 h-3.5 text-white flex-shrink-0" fill="currentColor" viewBox="0 0 24 24" style="filter: drop-shadow(0 1px 2px rgba(0,0,0,0.4));">
                            <path d="M13 10V3L4 14h7v7l9-11h-7z"/>
                          </svg>
                          <span class="text-xs leading-none">🔥</span>
                          <span>TRENDING</span>
                          <span class="text-xs leading-none">🔥</span>
                        </span>
                      }
                      @if (news.isBreaking) {
                        <span class="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-black rounded-full bg-gradient-to-r from-red-600 to-red-700 text-white shadow-xl animate-pulse border-2 border-white/50 uppercase tracking-wider backdrop-blur-sm" style="font-family: 'Arial Black', 'Helvetica Neue', sans-serif; text-shadow: 2px 2px 4px rgba(0,0,0,0.5), 0 0 8px rgba(255,255,255,0.3); letter-spacing: 0.1em;">
                          <svg class="w-3.5 h-3.5 text-white flex-shrink-0" fill="currentColor" viewBox="0 0 24 24" style="filter: drop-shadow(0 1px 2px rgba(0,0,0,0.4));">
                            <path d="M13 10V3L4 14h7v7l9-11h-7z"/>
                          </svg>
                          <span>BREAKING</span>
                        </span>
                      }
                      @if (news.isFeatured) {
                        <span class="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-black rounded-full bg-gradient-to-r from-yellow-500 to-amber-500 text-white shadow-xl border-2 border-white/50 uppercase tracking-wider backdrop-blur-sm" style="font-family: 'Arial Black', 'Helvetica Neue', sans-serif; text-shadow: 2px 2px 4px rgba(0,0,0,0.5), 0 0 8px rgba(255,255,255,0.3); letter-spacing: 0.1em;">
                          <svg class="w-3.5 h-3.5 text-white flex-shrink-0" fill="currentColor" viewBox="0 0 24 24" style="filter: drop-shadow(0 1px 2px rgba(0,0,0,0.4));">
                            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                          </svg>
                          <span>FEATURED</span>
                        </span>
                      }
                      <span [class]="'inline-flex items-center justify-center px-3 py-1 text-xs font-bold rounded-full shadow-lg text-white ' + getCategoryColor(news.category)">
                        {{ getCategoryName(news.category) }}
                      </span>
                    </div>
                  }
                </div>

                <!-- Bottom Section with Headline -->
                <div class="p-4 pt-5 pb-5 bg-gradient-to-br from-background to-secondary/30 border-t border-border/50 flex flex-col">
                  <div class="flex items-start gap-3 mb-3">
                    <h3 
                      [class]="'font-display text-lg font-bold dark:font-normal leading-tight line-clamp-3 pb-1 min-h-[4rem] cursor-pointer hover:opacity-80 transition-all duration-300 hover:scale-[1.01] flex-1 ' + (news.isTrending ? 'text-purple-700 dark:text-purple-300' : getHeadlineColor(news.category))"
                      (click)="openNewsModalFromSide(news, $index)"
                      (touchstart)="onTouchStartSide($event, news, $index)"
                      (touchend)="onTouchEndSide($event, news, $index)"
                      (touchmove)="onTouchMove($event)"
                      style="touch-action: pan-y;">
                      @if (news.isTrending && !isHomePage) {
                        <span class="inline-block mr-2 text-lg leading-none">🔥</span>
                      }
                      {{ getDisplayTitleForSide(news) }}
                    </h3>
                  </div>
                  <div class="flex items-center justify-between text-xs text-muted-foreground mt-auto pt-2 border-t border-border/20" style="min-height: 24px; display: flex !important;">
                    <span class="text-left font-medium" style="color: rgb(113, 113, 122); display: inline-block !important;">{{ news.author || 'News Adda India' }}</span>
                    <span class="text-right font-medium" style="color: rgb(113, 113, 122); display: inline-block !important;">{{ news.date || news.time || 'Just now' }}</span>
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
export class HeroSectionComponent implements OnInit, OnDestroy {
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
      author: 'News Adda India',
      date: new Date().toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' }),
      time: 'Just now'
    },
    {
      category: 'Business',
      title: 'Loading...',
      image: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=600&q=80',
      author: 'News Adda India',
      date: new Date().toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' }),
      time: 'Just now'
    },
  ];

  isLoading = true;
  t: any = {};
  isHomePage = false;
  private languageSubscription?: Subscription;

  constructor(
    private newsService: NewsService,
    private modalService: ModalService,
    private languageService: LanguageService,
    private displayedNewsService: DisplayedNewsService,
    private router: Router
  ) {
    // Subscribe to modal state changes
    this.modalService.getModalState().subscribe(state => {
      this.modalState = state;
    });
  }

  ngOnInit() {
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
    console.log('[HeroSection] Subscribing to language changes...');
    this.languageSubscription = this.languageService.currentLanguage$.subscribe(async (lang) => {
      console.log('[HeroSection] Language changed to:', lang);
      this.updateTranslations();
      // Re-translate featured and side news titles when language changes
      console.log('[HeroSection] Starting translation...');
      await this.translateNewsContent();
      console.log('[HeroSection] Translation complete');
    });
    console.log('[HeroSection] Language subscription set up');
  }

  ngOnDestroy() {
    this.languageSubscription?.unsubscribe();
  }

  private checkIfHomePage() {
    const url = this.router.url;
    this.isHomePage = url === '/' || url === '' || url === '/home';
  }

  updateTranslations() {
    this.t = this.languageService.getTranslations();
  }

  async translateNewsContent() {
    console.log('[HeroSection] translateNewsContent called');
    try {
      // Translate featured news title
      if (this.featuredNews && this.featuredNews.title) {
        console.log('[HeroSection] Translating featured news title:', this.featuredNews.title.substring(0, 30) + '...');
        this.featuredNews.title = await this.languageService.translateToCurrentLanguage(this.featuredNews.title);
        console.log('[HeroSection] Translated featured news title:', this.featuredNews.title.substring(0, 30) + '...');
      }
      
      // Translate side news titles
      if (this.sideNews && this.sideNews.length > 0) {
        console.log('[HeroSection] Translating', this.sideNews.length, 'side news titles...');
        for (const news of this.sideNews) {
          if (news.title) {
            news.title = await this.languageService.translateToCurrentLanguage(news.title);
          }
        }
        console.log('[HeroSection] Side news titles translated');
      }
    } catch (error) {
      console.error('[HeroSection] Error translating news content:', error);
    }
  }

  getDisplayTitle(news: NewsArticle): string {
    // Always use regular headline for cards (trendingTitle is only for ticker)
    return this.languageService.getDisplayTitle(news.title, news.titleEn);
  }

  getDisplayTitleForSide(news: SideNews): string {
    // Always use regular headline for cards (trendingTitle is only for ticker)
    // For side news, we only have title, so just return it
    // In a real scenario, you'd want to store both title and titleEn
    return news.title;
  }

  getCategoryName(category: string): string {
    return this.languageService.translateCategory(category);
  }

  getCategoryColor(category: string): string {
    const colors: Record<string, string> = {
      'Health': 'bg-green-500',
      'Sports': 'bg-orange-500',
      'Business': 'bg-blue-500',
      'Entertainment': 'bg-pink-500',
      'International': 'bg-purple-500',
      'Technology': 'bg-cyan-500',
      'National': 'bg-blue-500',
      'Politics': 'bg-red-500',
      'Religious': 'bg-indigo-500',
    };
    return colors[category] || 'bg-primary';
  }

  loadNews() {
    const imagePromises: Promise<void>[] = [];

    // Load breaking news for hero section (falls back to featured if no breaking news)
    this.newsService.fetchBreakingNews().subscribe({
      next: (news) => {
        // Ensure titleEn is set (for translation)
        if (!news.titleEn) {
          news.titleEn = news.title;
        }

        // News is already translated by the service, so use it directly
        this.featuredNews = news;
        
        // Register this article as displayed to prevent duplicates
        if (news.id) {
          this.displayedNewsService.registerDisplayed(news.id);
        }
        
        // Log trending news in featured section
        if (news.isTrending) {
          console.log('🔥 HERO SECTION - Featured News is Trending:', {
            id: news.id,
            title: news.title,
            trendingTitle: news.trendingTitle || 'N/A',
            category: news.category,
            displayTitle: this.getDisplayTitle(news),
            isTrending: news.isTrending
          });
        }

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
              // Image failed to load - use placeholder (no external API calls)
              console.warn(`Featured image failed to load, using placeholder...`);
              this.featuredNews.image = this.newsService.getPlaceholderImage(news.title);
              this.featuredNews.imageLoading = false;
              resolve();
            };
            img.src = news.image;
          });
          imagePromises.push(featuredImagePromise);
        } else if (news.imageLoading || !news.image || news.image.trim() === '') {
          // No image in database - use placeholder (no external API calls)
          this.featuredNews.imageLoading = true;
          const featuredImagePromise = new Promise<void>((resolve) => {
            this.featuredNews.image = this.newsService.getPlaceholderImage(news.title);
            this.featuredNews.imageLoading = false;
            resolve();
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
        // Filter out already displayed articles
        const filteredNews = this.displayedNewsService.filterDisplayed(news);
        
        // Register side news articles as displayed
        const sideNewsIds = filteredNews.map(n => n.id).filter(id => id !== undefined) as (string | number)[];
        this.displayedNewsService.registerDisplayedMultiple(sideNewsIds);
        
        this.sideNews = filteredNews.map((n, index) => {
          const sideNewsItem = {
            category: n.category,
            title: n.title,
            image: '',
            tags: (n as any).tags || [],
            id: n.id,
            date: n.date,
            time: n.time,
            author: n.author,
            imageLoading: true,
            isTrending: n.isTrending || false,
            isBreaking: n.isBreaking || false,
            isFeatured: n.isFeatured || false,
            trendingTitle: (n as any).trendingTitle || undefined
          };
          
          // Log trending news in side news
          if (sideNewsItem.isTrending) {
            console.log('🔥 HERO SECTION - Side News is Trending:', {
              id: sideNewsItem.id,
              title: sideNewsItem.title,
              trendingTitle: sideNewsItem.trendingTitle || 'N/A',
              category: sideNewsItem.category,
              displayTitle: this.getDisplayTitleForSide(sideNewsItem),
              isTrending: sideNewsItem.isTrending
            });
          }

          // Use image from database or placeholder (no external API calls)
          const sideImagePromise = new Promise<void>((resolve) => {
            if (n.image && n.image.trim() !== '') {
              // Use image from database
              const img = new Image();
              img.onload = () => {
                sideNewsItem.image = n.image;
                sideNewsItem.imageLoading = false;
                resolve();
              };
              img.onerror = () => {
                sideNewsItem.image = this.newsService.getPlaceholderImage(n.title);
                sideNewsItem.imageLoading = false;
                resolve();
              };
              img.src = n.image;
            } else {
              // No image in database - use placeholder
              sideNewsItem.image = this.newsService.getPlaceholderImage(n.title);
              sideNewsItem.imageLoading = false;
              resolve();
            }
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
    const isBreaking = news.isBreaking || false;
    console.log('[HeroSection] Opening modal with featured news:', news);
    console.log('[HeroSection] Tags in featured news:', (news as any).tags);
    this.modalService.openModal(news, isBreaking);
  }

  openNewsModalFromSide(sideNews: SideNews, index: number) {
    // Convert SideNews to NewsArticle format
    const newsArticle: NewsArticle = {
      id: sideNews.id || (index + 1000), // Use actual ID if available, otherwise temporary ID
      category: sideNews.category,
      title: sideNews.title,
      titleEn: sideNews.title,
      excerpt: sideNews.title, // Use title as excerpt for side news
      image: sideNews.image,
      imageLoading: sideNews.imageLoading || false,
      time: sideNews.time || '2 hours ago',
      author: sideNews.author || 'News Adda India',
      date: sideNews.date || new Date().toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' }),
      isTrending: sideNews.isTrending,
      isBreaking: sideNews.isBreaking,
      isFeatured: sideNews.isFeatured,
      trendingTitle: sideNews.trendingTitle
    };
    // Include tags if available
    if (sideNews.tags && sideNews.tags.length > 0) {
      (newsArticle as any).tags = sideNews.tags;
    }
    console.log('[HeroSection] Opening modal with newsArticle:', newsArticle);
    console.log('[HeroSection] Tags in newsArticle:', (newsArticle as any).tags);
    this.modalService.openModal(newsArticle, sideNews.isBreaking || false);
  }

  // Touch handling to prevent accidental opens on mobile
  private touchStartTime: number = 0;
  private touchStartX: number = 0;
  private touchStartY: number = 0;
  private touchMoved: boolean = false;
  private touchTargetNews: NewsArticle | null = null;
  private touchTargetSideNews: { news: SideNews; index: number } | null = null;

  onTouchStart(event: TouchEvent, news: NewsArticle) {
    this.touchStartTime = Date.now();
    this.touchStartX = event.touches[0].clientX;
    this.touchStartY = event.touches[0].clientY;
    this.touchMoved = false;
    this.touchTargetNews = news;
    this.touchTargetSideNews = null;
  }

  onTouchStartSide(event: TouchEvent, news: SideNews, index: number) {
    this.touchStartTime = Date.now();
    this.touchStartX = event.touches[0].clientX;
    this.touchStartY = event.touches[0].clientY;
    this.touchMoved = false;
    this.touchTargetNews = null;
    this.touchTargetSideNews = { news, index };
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
    this.touchTargetSideNews = null;
  }

  onTouchEndSide(event: TouchEvent, news: SideNews, index: number) {
    const touchDuration = Date.now() - this.touchStartTime;
    const deltaX = Math.abs(event.changedTouches[0].clientX - this.touchStartX);
    const deltaY = Math.abs(event.changedTouches[0].clientY - this.touchStartY);
    
    // Only open modal if:
    // 1. Touch didn't move much (not a scroll) - less than 10px
    // 2. Touch was quick (less than 300ms) - deliberate tap
    // 3. Touch target matches
    if (!this.touchMoved && deltaX < 10 && deltaY < 10 && touchDuration < 300 && 
        this.touchTargetSideNews && this.touchTargetSideNews.news === news && this.touchTargetSideNews.index === index) {
      event.preventDefault();
      event.stopPropagation();
      this.openNewsModalFromSide(news, index);
    }
    
    // Reset touch state
    this.touchStartTime = 0;
    this.touchMoved = false;
    this.touchTargetNews = null;
    this.touchTargetSideNews = null;
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

  getCategoryIconColor(category: string): string {
    const colors: Record<string, string> = {
      'National': 'text-blue-600',
      'International': 'text-purple-600',
      'Politics': 'text-red-600',
      'Health': 'text-green-600',
      'Sports': 'text-orange-600',
      'Business': 'text-blue-600',
      'Entertainment': 'text-pink-600',
      'Technology': 'text-cyan-600',
    };
    return colors[category] || 'text-primary';
  }

}

