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
      
      <main>
        <section class="py-12 lg:py-16">
          <div class="container mx-auto px-4">
            <!-- Category Header -->
            <div class="mb-8">
              <div class="flex items-center gap-3 mb-4">
                <div [class]="'w-1 h-12 rounded-full bg-gradient-to-b ' + getCategoryAccentColor(categoryName)"></div>
                <div>
                  <h1 class="font-display text-3xl lg:text-4xl font-bold">
                    {{ getCategoryDisplayName() }} <span class="gradient-text">{{ t.news }}</span>
                  </h1>
                  <p class="text-muted-foreground mt-2">{{ t.latestUpdatesFrom }} {{ getCategoryDisplayName() }} {{ t.category }}</p>
                </div>
              </div>
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
                  class="news-card group opacity-0 animate-fade-in"
                  [style.animation-delay]="i * 100 + 'ms'">
                  <div class="relative aspect-[16/10] overflow-hidden rounded-t-xl bg-secondary/20">
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
                    <div class="absolute top-4 left-4 z-20">
                      <span [class]="'px-3 py-1 text-xs font-semibold rounded-full ' + getCategoryColor(news.category)">
                        {{ getCategoryName(news.category) }}
                      </span>
                    </div>
                  </div>

                  <!-- Border Line -->
                  <div class="h-[2px] bg-gray-300 dark:bg-gray-600"></div>

                  <div class="p-5 pt-6 bg-background rounded-b-xl">
                    <div class="flex items-start gap-2 mb-3">
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
                      <h3 
                        [class]="'font-display text-lg font-bold leading-tight group-hover:opacity-90 transition-colors line-clamp-2 pt-1 cursor-pointer hover:opacity-80 ' + getHeadlineColor(news.category)"
                        (click)="openNewsModal(news)"
                        (touchend)="openNewsModal(news)">
                        {{ getDisplayTitle(news) }}
                      </h3>
                    </div>
                    <p class="text-muted-foreground text-sm line-clamp-2 mb-4 mt-2">
                      {{ news.excerpt }}
                    </p>
                    <div class="flex items-center">
                      <span class="flex items-center gap-1.5 text-xs font-medium">
                        <svg class="w-3.5 h-3.5 text-blue-500" viewBox="0 0 24 24" fill="currentColor"><path d="M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zM12 20c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm.5-13H11v6l5.25 3.15.75-1.23-4.5-2.67z"/></svg>
                        <span class="text-blue-600 dark:text-blue-400 font-bold">{{ news.time }}</span>
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
    this.languageSubscription = this.languageService.currentLanguage$.subscribe(() => {
      this.updateTranslations();
    });
  }

  ngOnDestroy() {
    this.languageSubscription?.unsubscribe();
  }

  updateTranslations() {
    this.t = this.languageService.getTranslations();
  }

  getDisplayTitle(news: NewsArticle): string {
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
    this.newsService.fetchNewsByCategory(this.categoryName, 12).subscribe({
      next: (news) => {
        this.filteredNews = news;
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
    this.filteredNews.forEach((item) => {
      // Fetch image based on headline if loading
      if (item.imageLoading && !item.image) {
        this.newsService.fetchImageForHeadline(item.title, item.category).subscribe({
          next: (imageUrl) => {
            // Only update if we got a valid image URL
            if (imageUrl && imageUrl.trim() !== '') {
              // Preload image to ensure it's ready before showing
              const img = new Image();
              img.onload = () => {
                item.image = imageUrl;
                item.imageLoading = false;
              };
              img.onerror = () => {
                // If image fails to load, try placeholder as last resort
                item.image = this.newsService.getPlaceholderImage(item.title);
                item.imageLoading = false;
              };
              img.src = imageUrl;
            } else {
              // Fallback to placeholder if no image found
              item.image = this.newsService.getPlaceholderImage(item.title);
              item.imageLoading = false;
            }
          },
          error: (error) => {
            console.error(`Error fetching image for "${item.title}":`, error);
            // Fallback to placeholder on error
            item.image = this.newsService.getPlaceholderImage(item.title);
            item.imageLoading = false;
          }
        });
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
    National: 'bg-primary/20 text-primary',
    International: 'bg-purple-500/20 text-purple-400',
    Politics: 'bg-red-500/20 text-red-400',
    Health: 'bg-green-500/20 text-green-400',
    Sports: 'bg-orange-500/20 text-orange-400',
    Business: 'bg-blue-500/20 text-blue-400',
    Entertainment: 'bg-pink-500/20 text-pink-400',
    Technology: 'bg-cyan-500/20 text-cyan-400',
  };

  categoryAccentColors: Record<string, string> = {
    National: 'from-primary to-primary/80',
    International: 'from-purple-500 to-purple-600',
    Politics: 'from-red-500 to-red-600',
    Health: 'from-green-500 to-green-600',
    Sports: 'from-orange-500 to-amber-500',
    Business: 'from-blue-500 to-blue-600',
    Entertainment: 'from-pink-500 to-rose-500',
  };

  getCategoryColor(category: string): string {
    return this.categoryColors[category] || 'bg-primary/20 text-primary';
  }

  getCategoryAccentColor(category: string): string {
    return this.categoryAccentColors[category] || 'from-primary to-primary/80';
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
