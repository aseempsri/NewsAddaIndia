import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { HeaderComponent } from '../../components/header/header.component';
import { FooterComponent } from '../../components/footer/footer.component';
import { NewsService, NewsArticle } from '../../services/news.service';
import { ModalService } from '../../services/modal.service';
import { LanguageService } from '../../services/language.service';
import { NewsDetailModalComponent } from '../../components/news-detail-modal/news-detail-modal.component';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-category',
  standalone: true,
  imports: [CommonModule, RouterLink, HeaderComponent, FooterComponent, NewsDetailModalComponent],
  template: `
    <div class="min-h-screen bg-background">
      <app-header />
      <!-- Spacer for fixed header on desktop - accounts for navigation bar only (~64px, reduced by 20%) -->
      <div class="lg:h-[64px]"></div>
      
      <main>
        <section class="py-6 lg:py-8">
          <div class="container mx-auto px-4">
            <!-- Category Header -->
            <div class="mb-8">
              <div class="flex items-center gap-3 mb-4">
                <div [class]="'w-1 h-12 rounded-full bg-gradient-to-b flex-shrink-0 ' + getCategoryAccentColor(categoryName)"></div>
                <div class="flex items-center h-12">
                  <h1 class="font-display text-3xl lg:text-4xl font-bold leading-tight">
                    {{ getCategoryDisplayName() }} <span class="gradient-text">{{ t.news }}</span>
                  </h1>
                </div>
              </div>
              <p class="text-muted-foreground mt-2 ml-4">{{ t.latestUpdatesFrom }} {{ getCategoryDisplayName() }} {{ t.category }}</p>
            </div>

            <!-- News Grid -->
            <div class="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              @if (isLoading) {
                @for (item of [1,2,3,4,5,6,7,8,9]; track $index) {
                  <article class="news-card group">
                    <div class="relative aspect-[16/10] overflow-hidden rounded-t-xl bg-secondary/20">
                      <div class="absolute inset-0 flex items-center justify-center bg-secondary/50">
                        <div class="flex flex-col items-center gap-2">
                          <div class="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
                          <span class="text-xs text-muted-foreground">{{ t.loadingImage }}</span>
                        </div>
                      </div>
                    </div>
                    <div class="p-5 bg-background rounded-b-xl">
                      <div class="h-4 bg-secondary/50 rounded mb-2 animate-pulse"></div>
                      <div class="h-3 bg-secondary/30 rounded mb-4 animate-pulse"></div>
                    </div>
                  </article>
                }
              }
              @if (!isLoading) {
                @for (news of filteredNews; track news.id || $index; let i = $index) {
                <article
                  class="news-card group opacity-0 animate-fade-in hover:shadow-2xl hover:shadow-purple-500/20 transition-all duration-300"
                  [style.animation-delay]="i * 100 + 'ms'">
                  <div class="relative aspect-[16/10] overflow-hidden rounded-t-xl bg-gradient-to-br from-purple-100/20 via-pink-100/20 to-orange-100/20 dark:from-purple-900/20 dark:via-pink-900/20 dark:to-orange-900/20 border-2 border-transparent hover:border-purple-300/50 dark:hover:border-purple-700/50 transition-all duration-300">
                    <!-- Loading Animation - Show while image is loading -->
                    @if (news.imageLoading || !news.image) {
                      <div class="absolute inset-0 flex items-center justify-center bg-secondary/50 z-10">
                        <div class="flex flex-col items-center gap-2">
                          <div class="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
                          <span class="text-xs text-muted-foreground">{{ t.loadingImage }}</span>
                        </div>
                      </div>
                    }
                    <!-- Image - Only show when loaded -->
                    @if (news.image && !news.imageLoading) {
                      <img
                        [src]="news.image"
                        [alt]="news.title"
                        class="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
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
                    <div class="flex items-center justify-between text-xs text-muted-foreground">
                      <span class="flex items-center gap-1.5">
                        <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                        <span>{{ news.author || 'News Adda India' }}</span>
                      </span>
                      <span class="flex items-center gap-1.5">
                        <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span>{{ news.date || news.time }}</span>
                      </span>
                    </div>
                  </div>
                </article>
                }
              }
            </div>
          </div>
        </section>
      </main>

      <app-footer />
    </div>

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
export class CategoryComponent implements OnInit, OnDestroy {
  categoryName: string = '';
  filteredNews: NewsArticle[] = [];
  isLoading = true;
  t: any = {};
  private languageSubscription?: Subscription;
  modalState: { isOpen: boolean; news: NewsArticle | null; isBreaking?: boolean } = {
    isOpen: false,
    news: null,
    isBreaking: false
  };

  constructor(
    private route: ActivatedRoute,
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
    this.route.params.subscribe(params => {
      const categoryParam = params['category'];
      // Capitalize first letter
      this.categoryName = categoryParam.charAt(0).toUpperCase() + categoryParam.slice(1);
      this.loadNews();
    });

    // Subscribe to language changes
    this.languageSubscription = this.languageService.currentLanguage$.subscribe(async () => {
      this.updateTranslations();
      // Re-translate news titles when language changes
      if (this.filteredNews && this.filteredNews.length > 0) {
        await this.translateNewsTitles();
      }
    });
  }

  ngOnDestroy() {
    this.languageSubscription?.unsubscribe();
  }

  updateTranslations() {
    this.t = this.languageService.getTranslations();
  }

  async translateNewsTitles() {
    if (!this.filteredNews || this.filteredNews.length === 0) return;
    
    // Translate titles in parallel (limited batch to avoid overwhelming API)
    const batchSize = 5;
    for (let i = 0; i < this.filteredNews.length; i += batchSize) {
      const batch = this.filteredNews.slice(i, i + batchSize);
      await Promise.all(batch.map(async (article) => {
        try {
          const translatedTitle = await this.languageService.translateToCurrentLanguage(article.title);
          // Store translated title temporarily
          (article as any).translatedTitle = translatedTitle;
        } catch (error) {
          console.warn('Failed to translate title:', error);
        }
      }));
    }
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

  getCategoryDisplayName(): string {
    return this.languageService.translateCategory(this.categoryName);
  }

  loadNews() {
    this.isLoading = true;
    // Use fetchNewsByPage to respect the "Pages to Display" field
    // Convert category name to lowercase page name (e.g., "National" -> "national")
    const pageName = this.categoryName.toLowerCase();
    this.newsService.fetchNewsByPage(pageName, 12).subscribe({
      next: async (news) => {
        this.filteredNews = news;
        // Translate titles after loading
        await this.translateNewsTitles();
        this.isLoading = false;
        // Fetch images for all news items
        this.fetchImagesForAllItems();
      },
      error: (error) => {
        console.error('Error loading news:', error);
        this.filteredNews = [];
        this.isLoading = false;
      }
    });
  }

  fetchImagesForAllItems() {
    // Images are now fetched from database only (no external API calls)
    // This method is kept for compatibility but doesn't fetch external images
    this.filteredNews.forEach((item) => {
      if (item.imageLoading && !item.image) {
        // No image in database - use placeholder
        item.image = this.newsService.getPlaceholderImage(item.title);
        item.imageLoading = false;
      }
    });
  }

  // Legacy code - keeping for reference but not used
  private allNews: NewsArticle[] = [
    // National
    {
      id: 1,
      category: 'National',
      title: 'Putin\'s India Visit: Five-Year Partnership Plan Finalized',
      excerpt: 'Russian President Vladimir Putin and PM Modi discuss strengthening trade and economic ties, finalizing a comprehensive five-year partnership plan during the state visit.',
      image: 'assets/videos/Putin_in_India_.webp',
      time: '2 hours ago',
    },
    {
      id: 5,
      category: 'National',
      title: 'IndiGo Cancels Over 170 Flights Due to Pilot Rest Regulations',
      excerpt: 'Major flight disruptions across India as IndiGo Airlines cancels flights nationwide due to stricter pilot-rest regulations.',
      image: 'https://images.unsplash.com/photo-1436491865332-7a61a109cc05?w=600&q=80',
      time: '6 hours ago',
    },
    {
      id: 7,
      category: 'National',
      title: 'BSF Marks 60 Years of Service to the Nation',
      excerpt: 'The Border Security Force commemorates its 60th anniversary, with Inspector General Shashank Anand highlighting its pivotal role in national border security.',
      image: 'https://images.unsplash.com/photo-1541339907198-e08756dedf3f?w=600&q=80',
      time: '8 hours ago',
    },
    {
      id: 8,
      category: 'National',
      title: 'Cyclone Ditwah Approaches Tamil Nadu and Andhra Pradesh Coasts',
      excerpt: 'Very heavy rain forecasts as Cyclone Ditwah approaches, placing Tamil Nadu and Andhra Pradesh on high alert with authorities taking precautionary safety measures.',
      image: 'https://images.unsplash.com/photo-1504608524841-42fe6f032b4b?w=600&q=80',
      time: '1 hour ago',
    },
    // International
    {
      id: 9,
      category: 'International',
      title: 'Pope Francis Visits Lebanon, Urges Leaders to Prioritize Peace',
      excerpt: 'Pope Francis embarks on his first overseas trip to Lebanon, urging political leaders to prioritize peace amid regional instability and conflicts.',
      image: 'https://images.unsplash.com/photo-1511632765486-a01980e01a18?w=600&q=80',
      time: '3 hours ago',
    },
    {
      id: 10,
      category: 'International',
      title: 'UN Observes International Day of Persons with Disabilities',
      excerpt: 'The United Nations observes the International Day of Persons with Disabilities, promoting awareness and inclusion globally.',
      image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=600&q=80',
      time: '5 hours ago',
    },
    {
      id: 11,
      category: 'International',
      title: 'India Strengthens Diplomatic Ties with Global Partners',
      excerpt: 'High-level diplomatic meetings focus on enhancing trade relations and strategic partnerships with key nations worldwide.',
      image: 'https://images.unsplash.com/photo-1556761175-5973dc0f32e7?w=600&q=80',
      time: '7 hours ago',
    },
    // Politics
    {
      id: 12,
      category: 'Politics',
      title: 'India Invited to Chair Global Election Body IDEA',
      excerpt: 'India has been invited to chair the International Institute for Democracy and Electoral Assistance, reflecting global recognition of its electoral standards.',
      image: 'https://images.unsplash.com/photo-1450101499163-c8848c66ca85?w=600&q=80',
      time: '2 hours ago',
    },
    {
      id: 13,
      category: 'Politics',
      title: 'Lok Sabha Adjourned Following Opposition Protests',
      excerpt: 'The Lok Sabha session was adjourned following opposition protests demanding a debate on the Special Intensive Revision (SIR) of electoral rolls.',
      image: 'https://images.unsplash.com/photo-1556761175-5973dc0f32e7?w=600&q=80',
      time: '4 hours ago',
    },
    {
      id: 14,
      category: 'Politics',
      title: 'Key Political Developments Shape National Discourse',
      excerpt: 'Recent political events and policy decisions are generating significant discussion across the political spectrum.',
      image: 'https://images.unsplash.com/photo-1521737604893-d14cc237f11d?w=600&q=80',
      time: '6 hours ago',
    },
    // Health
    {
      id: 15,
      category: 'Health',
      title: 'India Records Significant Drop in HIV Cases and AIDS Deaths',
      excerpt: 'Union Health Ministry data shows a significant decline in new HIV infections and AIDS-related deaths across the country.',
      image: 'https://images.unsplash.com/photo-1559757148-5c350d0d3c56?w=600&q=80',
      time: '1 hour ago',
    },
    {
      id: 16,
      category: 'Health',
      title: 'Delhi Air Quality Remains in Severe Category',
      excerpt: 'Delhi\'s air quality remains in the "severe" category, with the Air Quality Index (AQI) around 380–400, despite the easing of GRAP restrictions.',
      image: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600&q=80',
      time: '3 hours ago',
    },
    {
      id: 17,
      category: 'Health',
      title: 'New Healthcare Scheme Launched to Improve Rural Medical Services',
      excerpt: 'The government introduces a comprehensive healthcare initiative aimed at enhancing medical facilities in rural and remote areas.',
      image: 'https://images.unsplash.com/photo-1582719471384-894fbb16e074?w=600&q=80',
      time: '5 hours ago',
    },
    // Entertainment
    {
      id: 4,
      category: 'Entertainment',
      title: 'Real Kashmir Football Club Series Premieres on SonyLIV',
      excerpt: 'New sports drama series inspired by the real-life story of the football club from Jammu and Kashmir set to premiere on December 9.',
      image: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=600&q=80',
      time: '5 hours ago',
    },
    {
      id: 6,
      category: 'Entertainment',
      title: 'Netflix Releases India vs Pakistan Cricket Documentary',
      excerpt: 'Three-part documentary series exploring the cricketing rivalry between India and Pakistan, featuring archived match footage and player interviews.',
      image: 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=600&q=80',
      time: '7 hours ago',
    },
    {
      id: 18,
      category: 'Entertainment',
      title: 'Bollywood Stars Attend Major Film Festival in Mumbai',
      excerpt: 'The Indian film industry celebrates excellence as top actors and filmmakers gather for the annual awards ceremony.',
      image: 'https://images.unsplash.com/photo-1511578314322-379afb476865?w=600&q=80',
      time: '9 hours ago',
    },
    // Sports
    {
      id: 2,
      category: 'Sports',
      title: 'India Secures 3-2 T20 Series Victory Against New Zealand',
      excerpt: 'Thrilling cricket action as India wins the T20 series with standout performances from emerging players in the final match.',
      image: 'assets/videos/indianz.avif',
      time: '3 hours ago',
    },
    {
      id: 19,
      category: 'Sports',
      title: 'Virat Kohli Scores Back-to-Back ODI Centuries Against South Africa',
      excerpt: 'Kohli\'s back-to-back centuries spark massive fan interest, leading to sold-out tickets for the third ODI match in the series.',
      image: 'https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=600&q=80',
      time: '2 hours ago',
    },
    {
      id: 20,
      category: 'Sports',
      title: 'India\'s Junior Hockey Team Faces Belgium in World Cup Quarterfinals',
      excerpt: 'India\'s men\'s junior hockey team faces Belgium in the quarterfinals of the FIH Junior Hockey World Cup 2025 in Chennai.',
      image: 'https://images.unsplash.com/photo-1551698618-1dfe5d97d256?w=600&q=80',
      time: '4 hours ago',
    },
    {
      id: 21,
      category: 'Sports',
      title: 'Formula One: Abu Dhabi Grand Prix Set for Three-Way Title Showdown',
      excerpt: 'The Abu Dhabi Grand Prix is set for a rare three-way title showdown, with McLaren\'s Lando Norris leading Max Verstappen and teammate Oscar Piastri.',
      image: 'https://images.unsplash.com/photo-1551958219-acbc608c6377?w=600&q=80',
      time: '6 hours ago',
    },
    // Business
    {
      id: 3,
      category: 'Business',
      title: 'RBI Reduces Repo Rate to 5.25% Citing Low Inflation',
      excerpt: 'Reserve Bank of India cuts repo rate by 25 basis points, citing low inflation and strong economic growth indicators.',
      image: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=600&q=80',
      time: '4 hours ago',
    },
    {
      id: 22,
      category: 'Business',
      title: 'GST Collection Rises Above ₹1.70 Lakh Crore in November',
      excerpt: 'Gross GST collection in November surpasses ₹1.70 lakh crore, indicating marginal growth amid mixed market sentiment and economic indicators.',
      image: 'https://images.unsplash.com/photo-1553729459-efe14ef6055d?w=600&q=80',
      time: '3 hours ago',
    },
    {
      id: 23,
      category: 'Business',
      title: 'Jio Platforms IPO: Reliance Begins Drafting Prospectus',
      excerpt: 'Reliance Industries begins drafting a prospectus for the planned Jio Platforms IPO, signaling a significant move in India\'s telecom and digital services market.',
      image: 'https://images.unsplash.com/photo-1556761175-b413da4baf72?w=600&q=80',
      time: '5 hours ago',
    },
    {
      id: 24,
      category: 'Business',
      title: 'Indian Stock Markets Reach New Milestones Amid Economic Growth',
      excerpt: 'Sensex and Nifty hit record highs as investors show strong confidence in India\'s economic trajectory and corporate performance.',
      image: 'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=600&q=80',
      time: '7 hours ago',
    },
  ];

  categoryColors: Record<string, string> = {
    National: 'bg-blue-500 text-white',
    International: 'bg-purple-500 text-white',
    Politics: 'bg-red-500 text-white',
    Health: 'bg-green-500 text-white',
    Sports: 'bg-orange-500 text-white',
    Business: 'bg-blue-500 text-white',
    Entertainment: 'bg-pink-500 text-white',
    Technology: 'bg-cyan-500 text-white',
    Religious: 'bg-indigo-500 text-white',
  };

  categoryAccentColors: Record<string, string> = {
    National: 'from-primary to-primary/80',
    International: 'from-purple-500 to-purple-600',
    Politics: 'from-red-500 to-red-600',
    Health: 'from-green-500 to-green-600',
    Sports: 'from-orange-500 to-amber-500',
    Business: 'from-blue-500 to-blue-600',
    Entertainment: 'from-pink-500 to-rose-500',
    Religious: 'from-indigo-500 to-indigo-600',
  };

  getCategoryColor(category: string): string {
    return this.categoryColors[category] || 'bg-primary text-white';
  }

  getCategoryAccentColor(category: string): string {
    return this.categoryAccentColors[category] || 'from-primary to-primary/80';
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
