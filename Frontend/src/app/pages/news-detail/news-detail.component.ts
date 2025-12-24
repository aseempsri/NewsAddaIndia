import { Component, OnInit, OnDestroy, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { HeaderComponent } from '../../components/header/header.component';
import { FooterComponent } from '../../components/footer/footer.component';
import { NewsService, NewsArticle } from '../../services/news.service';
import { LanguageService } from '../../services/language.service';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-news-detail',
  standalone: true,
  imports: [CommonModule, RouterLink, HeaderComponent, FooterComponent],
  template: `
    <div class="min-h-screen bg-background">
      <app-header />
      
      <!-- Reading Progress Bar -->
      <div class="fixed top-0 left-0 w-full h-1 bg-secondary z-[10000]">
        <div 
          class="h-full bg-gradient-to-r from-primary via-primary/80 to-primary transition-all duration-150"
          [style.width.%]="readingProgress">
        </div>
      </div>
      
      <main>
        @if (isLoading) {
          <div class="container mx-auto px-4 py-12">
            <div class="flex flex-col items-center justify-center min-h-[60vh]">
              <div class="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mb-4"></div>
              <p class="text-muted-foreground">{{ t.loading || 'Loading...' }}</p>
            </div>
          </div>
        }
        
        @if (!isLoading && news) {
          <!-- Hero Section with Parallax Image -->
          <div class="relative w-full h-[60vh] min-h-[400px] overflow-hidden mb-8">
            @if (news.image && news.image.trim() !== '' && !imageError) {
              <img
                [src]="news.image"
                [alt]="news.title"
                (error)="handleImageError($event)"
                class="absolute inset-0 w-full h-full object-cover transition-transform duration-300"
                [style.transform]="'translateY(' + parallaxOffset + 'px)'"
              />
            } @else {
              <div class="absolute inset-0 bg-gradient-to-br from-primary/20 via-secondary/30 to-primary/10 flex items-center justify-center">
                <div class="text-center">
                  <svg class="w-20 h-20 text-muted-foreground/50 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
              </div>
            }
            <div class="absolute inset-0 bg-gradient-to-t from-background via-background/80 to-transparent"></div>
            
            <!-- Floating Category Badge -->
            <div class="absolute top-6 left-6 flex gap-2 z-10">
              @if (isBreaking) {
                <span class="px-4 py-2 text-sm font-semibold rounded-full bg-red-600 text-white animate-pulse shadow-lg backdrop-blur-sm">
                  {{ t.breaking || 'BREAKING' }}
                </span>
              }
              <span [class]="'px-4 py-2 text-sm font-semibold rounded-full shadow-lg backdrop-blur-sm ' + getCategoryColor(news.category)">
                {{ getCategoryName(news.category) }}
              </span>
            </div>

            <!-- Back Button -->
            <button
              (click)="goBack()"
              class="absolute top-6 right-6 z-10 p-3 rounded-full bg-background/90 hover:bg-background backdrop-blur-sm shadow-lg transition-all hover:scale-110">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            <!-- Title Overlay -->
            <div class="absolute bottom-0 left-0 right-0 p-8 lg:p-12">
              <h1 class="font-display text-3xl lg:text-5xl xl:text-6xl font-bold leading-tight text-foreground mb-4 drop-shadow-lg">
                {{ getDisplayTitle(news) }}
              </h1>
              
              <!-- Meta Information -->
              <div class="flex flex-wrap items-center gap-6 text-sm text-foreground/90">
                <span class="flex items-center gap-2 backdrop-blur-sm bg-background/50 px-3 py-1.5 rounded-full">
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  {{ news.author || 'News Adda India' }}
                </span>
                <span class="flex items-center gap-2 backdrop-blur-sm bg-background/50 px-3 py-1.5 rounded-full">
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  {{ news.date || news.time }}
                </span>
              </div>
            </div>
          </div>

          <!-- Article Content -->
          <article class="container mx-auto px-4 lg:px-8 max-w-4xl">
            <!-- Excerpt/Subheading -->
            <div class="mb-12">
              <p class="text-2xl lg:text-3xl text-muted-foreground leading-relaxed font-light italic border-l-4 border-primary pl-6">
                {{ news.excerpt }}
              </p>
            </div>

            <!-- Social Share Buttons -->
            <div class="sticky top-20 mb-8 flex items-center gap-4 p-4 bg-secondary/50 rounded-xl backdrop-blur-sm border border-border/50">
              <span class="text-sm font-medium text-muted-foreground">{{ t.share || 'Share' }}:</span>
              <div class="flex gap-3">
                <button
                  (click)="shareOnTwitter()"
                  class="p-2 rounded-lg bg-blue-500/10 hover:bg-blue-500/20 text-blue-500 transition-colors">
                  <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M23 3a10.9 10.9 0 01-3.14 1.53 4.48 4.48 0 00-7.86 3v1A10.66 10.66 0 013 4s-4 9 5 13a11.64 11.64 0 01-7 2c9 5 20 0 20-11.5a4.5 4.5 0 00-.08-.83A7.72 7.72 0 0023 3z"/>
                  </svg>
                </button>
                <button
                  (click)="shareOnFacebook()"
                  class="p-2 rounded-lg bg-blue-600/10 hover:bg-blue-600/20 text-blue-600 transition-colors">
                  <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M18 2h-3a5 5 0 00-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 011-1h3z"/>
                  </svg>
                </button>
                <button
                  (click)="shareNews()"
                  class="p-2 rounded-lg bg-primary/10 hover:bg-primary/20 text-primary transition-colors">
                  <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                  </svg>
                </button>
              </div>
            </div>

            <!-- Full Content -->
            <div class="prose prose-lg prose-headings:font-bold prose-headings:text-foreground prose-p:text-muted-foreground prose-p:leading-relaxed prose-p:mb-6 prose-a:text-primary prose-a:no-underline hover:prose-a:underline prose-strong:text-foreground prose-strong:font-semibold max-w-none mb-12">
              <div [innerHTML]="getFormattedContent()" class="news-content"></div>
            </div>

            <!-- Tags Section -->
            @if (tags && tags.length > 0) {
              <div class="mb-12 p-6 bg-gradient-to-r from-secondary/50 to-secondary/30 rounded-2xl border border-border/50">
                <h3 class="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                  <svg class="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                  </svg>
                  {{ t.tags || 'Tags' }}
                </h3>
                <div class="flex flex-wrap gap-2">
                  @for (tag of tags; track tag) {
                    <span class="px-4 py-2 text-sm bg-background rounded-full text-muted-foreground border border-border/50 hover:border-primary/50 transition-colors cursor-pointer">
                      #{{ tag }}
                    </span>
                  }
                </div>
              </div>
            }

            <!-- Author Card -->
            <div class="mb-12 p-6 bg-gradient-to-br from-primary/5 to-primary/10 rounded-2xl border border-primary/20">
              <div class="flex items-center gap-4">
                <div class="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center">
                  <svg class="w-8 h-8 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
                <div>
                  <h4 class="font-semibold text-foreground">{{ news.author || 'News Adda India' }}</h4>
                  <p class="text-sm text-muted-foreground">Published on {{ news.date || news.time }}</p>
                </div>
              </div>
            </div>
          </article>
        }

        @if (!isLoading && !news) {
          <div class="container mx-auto px-4 py-12">
            <div class="flex flex-col items-center justify-center min-h-[60vh]">
              <div class="w-24 h-24 rounded-full bg-secondary flex items-center justify-center mb-6">
                <svg class="w-12 h-12 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h2 class="text-3xl font-bold mb-4">{{ t.notFound || 'Article not found' }}</h2>
              <p class="text-muted-foreground mb-6">The article you're looking for doesn't exist or has been removed.</p>
              <button
                (click)="goBack()"
                class="px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors font-medium">
                {{ t.back || 'Go Back' }}
              </button>
            </div>
          </div>
        }
      </main>

      <app-footer />
    </div>
  `,
  styles: [`
    .news-content {
      line-height: 1.9;
      font-size: 1.125rem;
    }
    .news-content p {
      margin-bottom: 1.75rem;
      color: hsl(var(--muted-foreground));
    }
    .news-content h2 {
      margin-top: 3rem;
      margin-bottom: 1.5rem;
      font-size: 2rem;
      font-weight: 700;
      color: hsl(var(--foreground));
      line-height: 1.2;
    }
    .news-content h3 {
      margin-top: 2.5rem;
      margin-bottom: 1.25rem;
      font-size: 1.5rem;
      font-weight: 600;
      color: hsl(var(--foreground));
      line-height: 1.3;
    }
    .news-content img {
      max-width: 100%;
      height: auto;
      border-radius: 1rem;
      margin: 2rem 0;
      box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
    }
    .news-content blockquote {
      border-left: 4px solid hsl(var(--primary));
      padding-left: 1.5rem;
      margin: 2rem 0;
      font-style: italic;
      color: hsl(var(--muted-foreground));
    }
    .news-content ul, .news-content ol {
      margin: 1.5rem 0;
      padding-left: 2rem;
    }
    .news-content li {
      margin: 0.75rem 0;
      color: hsl(var(--muted-foreground));
    }
    @media (max-width: 768px) {
      .news-content {
        font-size: 1rem;
        line-height: 1.8;
      }
      .news-content h2 {
        font-size: 1.75rem;
      }
      .news-content h3 {
        font-size: 1.25rem;
      }
    }
  `]
})
export class NewsDetailComponent implements OnInit, OnDestroy {
  news: NewsArticle | null = null;
  isLoading = true;
  isBreaking = false;
  tags: string[] = [];
  fullContent: string = '';
  t: any = {};
  readingProgress = 0;
  parallaxOffset = 0;
  imageError = false;
  private apiUrl = environment.apiUrl || 'http://localhost:3000';
  private languageSubscription?: Subscription;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private newsService: NewsService,
    private http: HttpClient,
    private languageService: LanguageService
  ) {
    this.updateTranslations();
  }

  ngOnInit() {
    this.updateTranslations();
    this.route.params.subscribe(params => {
      const newsId = params['id'];
      if (newsId) {
        this.loadNews(newsId);
      } else {
        this.isLoading = false;
      }
    });

    // Subscribe to language changes
    this.languageSubscription = this.languageService.currentLanguage$.subscribe(() => {
      this.updateTranslations();
    });
  }

  ngOnDestroy() {
    this.languageSubscription?.unsubscribe();
  }

  @HostListener('window:scroll', ['$event'])
  onScroll() {
    this.updateReadingProgress();
    this.updateParallax();
  }

  updateReadingProgress() {
    const windowHeight = window.innerHeight;
    const documentHeight = document.documentElement.scrollHeight;
    const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
    const scrollPercent = (scrollTop / (documentHeight - windowHeight)) * 100;
    this.readingProgress = Math.min(100, Math.max(0, scrollPercent));
  }

  updateParallax() {
    const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
    this.parallaxOffset = scrollTop * 0.5;
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

  loadNews(newsId: string) {
    this.isLoading = true;
    
    // Try to fetch from backend first
    if (newsId.length === 24 || newsId.match(/^[0-9a-fA-F]{24}$/)) {
      this.http.get<{ success: boolean; data: any }>(`${this.apiUrl}/api/news/${newsId}`).subscribe({
        next: (response) => {
          if (response.success && response.data) {
            // Construct full image URL if it's a relative path
            let imageUrl = response.data.image || '';
            if (imageUrl) {
              // If it's a relative path starting with /uploads, prepend API URL
              if (imageUrl.startsWith('/uploads') || imageUrl.startsWith('/')) {
                imageUrl = `${this.apiUrl}${imageUrl}`;
              }
              // If it's already a full URL (http/https), use as is
              // Otherwise, use the image as provided
            }

            this.news = {
              id: response.data._id || response.data.id,
              title: response.data.title,
              titleEn: response.data.titleEn || response.data.title,
              excerpt: response.data.excerpt,
              content: response.data.content || response.data.excerpt,
              category: response.data.category,
              image: imageUrl,
              time: response.data.time || response.data.createdAt,
              author: response.data.author,
              date: response.data.date
            };
            this.fullContent = response.data.content || response.data.excerpt || '';
            this.tags = response.data.tags || [];
            this.isBreaking = response.data.isBreaking || false;
            this.imageError = false; // Reset image error flag
            this.isLoading = false;
          } else {
            this.isLoading = false;
          }
        },
        error: () => {
          // Fallback: try to find in cached news
          this.findNewsInCache(newsId);
        }
      });
    } else {
      // Try to find in cached news
      this.findNewsInCache(newsId);
    }
  }

  private findNewsInCache(newsId: string) {
    // This is a fallback - in a real app, you might want to store news in a service
    this.isLoading = false;
    // For now, show not found
  }

  getFormattedContent(): string {
    if (!this.fullContent && this.news) {
      return this.news.excerpt || '';
    }
    
    if (!this.fullContent) {
      return '';
    }
    
    // Convert line breaks to paragraphs
    return this.fullContent
      .split('\n\n')
      .map(paragraph => paragraph.trim())
      .filter(paragraph => paragraph.length > 0)
      .map(paragraph => `<p>${paragraph.replace(/\n/g, '<br>')}</p>`)
      .join('');
  }

  goBack() {
    this.router.navigate(['/']);
  }

  shareNews() {
    if (navigator.share && this.news) {
      navigator.share({
        title: this.news.titleEn || this.news.title,
        text: this.news.excerpt,
        url: window.location.href
      }).catch(err => console.log('Error sharing:', err));
    } else {
      // Fallback: Copy to clipboard
      const text = `${this.news?.titleEn || this.news?.title}\n\n${this.news?.excerpt}\n\n${window.location.href}`;
      navigator.clipboard.writeText(text).then(() => {
        alert('News link copied to clipboard!');
      }).catch(err => console.log('Error copying:', err));
    }
  }

  shareOnTwitter() {
    const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(this.news?.titleEn || this.news?.title || '')}&url=${encodeURIComponent(window.location.href)}`;
    window.open(url, '_blank', 'width=550,height=420');
  }

  shareOnFacebook() {
    const url = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(window.location.href)}`;
    window.open(url, '_blank', 'width=550,height=420');
  }

  handleImageError(event: any) {
    // If image fails to load, show fallback
    this.imageError = true;
    console.warn('Image failed to load:', this.news?.image);
  }

  getCategoryColor(category: string): string {
    const colors: Record<string, string> = {
      'National': 'bg-blue-500/20 text-blue-400',
      'International': 'bg-purple-500/20 text-purple-400',
      'Sports': 'bg-orange-500/20 text-orange-400',
      'Business': 'bg-yellow-500/20 text-yellow-400',
      'Entertainment': 'bg-pink-500/20 text-pink-400',
      'Health': 'bg-green-500/20 text-green-400',
      'Politics': 'bg-red-500/20 text-red-400'
    };
    return colors[category] || 'bg-primary/20 text-primary';
  }
}
