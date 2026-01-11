import { Component, OnInit, OnDestroy, HostListener, ChangeDetectorRef } from '@angular/core';
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
      <!-- Spacer for fixed header on desktop - accounts for navigation bar only (~64px, reduced by 20%) -->
      <div class="lg:h-[64px]"></div>
      
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
          <!-- Sticky Image Header -->
          <div class="sticky top-0 z-40 w-full h-[50vh] sm:h-[60vh] overflow-hidden">
            @if (news.image && news.image.trim() !== '' && !imageError) {
              <img
                [src]="news.image"
                [alt]="news.title"
                (error)="handleImageError($event)"
                class="w-full h-full object-cover"
              />
            } @else {
              <div class="w-full h-full bg-gradient-to-br from-primary/20 via-secondary/30 to-primary/10 flex items-center justify-center">
                <div class="text-center">
                  <svg class="w-20 h-20 text-muted-foreground/50 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
              </div>
            }
            
            <!-- Floating Category Badge -->
            <div class="absolute top-2 left-2 sm:top-4 sm:left-4 z-10 flex gap-1 sm:gap-2 flex-wrap">
              @if (news.isTrending) {
                <span class="inline-flex items-center justify-center gap-1 sm:gap-1.5 px-2 py-1 sm:px-3 sm:py-1.5 text-[0.525rem] sm:text-xs font-black rounded-full bg-gradient-to-r from-purple-600 via-pink-500 to-fuchsia-600 text-white shadow-xl animate-pulse border border-white/50 sm:border-2 sm:border-white/50 uppercase tracking-wider" style="font-family: 'Arial Black', 'Helvetica Neue', sans-serif; text-shadow: 1px 1px 2px rgba(0,0,0,0.5), 0 0 4px rgba(255,255,255,0.3); letter-spacing: 0.07em;">
                  <svg class="w-2.5 h-2.5 sm:w-3.5 sm:h-3.5 text-white flex-shrink-0" fill="currentColor" viewBox="0 0 24 24" style="filter: drop-shadow(0 1px 1px rgba(0,0,0,0.4));">
                    <path d="M13 10V3L4 14h7v7l9-11h-7z"/>
                  </svg>
                  <span class="text-[0.5rem] sm:text-xs leading-none">🔥</span>
                  <span>TRENDING</span>
                  <span class="text-[0.5rem] sm:text-xs leading-none">🔥</span>
                </span>
              }
              @if (news.isBreaking || isBreaking) {
                <span class="inline-flex items-center justify-center gap-1 sm:gap-1.5 px-2 py-1 sm:px-3 sm:py-1.5 text-[0.525rem] sm:text-xs font-black rounded-full bg-gradient-to-r from-red-600 to-red-700 text-white shadow-xl animate-pulse border border-white/50 sm:border-2 sm:border-white/50 uppercase tracking-wider" style="font-family: 'Arial Black', 'Helvetica Neue', sans-serif; text-shadow: 1px 1px 2px rgba(0,0,0,0.5), 0 0 4px rgba(255,255,255,0.3); letter-spacing: 0.07em;">
                  <svg class="w-2.5 h-2.5 sm:w-3.5 sm:h-3.5 text-white flex-shrink-0" fill="currentColor" viewBox="0 0 24 24" style="filter: drop-shadow(0 1px 1px rgba(0,0,0,0.4));">
                    <path d="M13 10V3L4 14h7v7l9-11h-7z"/>
                  </svg>
                  <span>BREAKING</span>
                </span>
              }
              @if (news.isFeatured) {
                <span class="inline-flex items-center justify-center gap-1 sm:gap-1.5 px-2 py-1 sm:px-3 sm:py-1.5 text-[0.525rem] sm:text-xs font-black rounded-full bg-gradient-to-r from-yellow-500 to-amber-500 text-white shadow-xl border border-white/50 sm:border-2 sm:border-white/50 uppercase tracking-wider" style="font-family: 'Arial Black', 'Helvetica Neue', sans-serif; text-shadow: 1px 1px 2px rgba(0,0,0,0.5), 0 0 4px rgba(255,255,255,0.3); letter-spacing: 0.07em;">
                  <svg class="w-2.5 h-2.5 sm:w-3.5 sm:h-3.5 text-white flex-shrink-0" fill="currentColor" viewBox="0 0 24 24" style="filter: drop-shadow(0 1px 1px rgba(0,0,0,0.4));">
                    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                  </svg>
                  <span>FEATURED</span>
                </span>
              }
              <span [class]="'inline-flex items-center justify-center px-2 py-0.75 sm:px-3 sm:py-1 text-[0.525rem] sm:text-xs font-semibold rounded-full shadow-lg ' + getCategoryColor(news.category)">
                {{ getCategoryName(news.category) }}
              </span>
            </div>

            <!-- Back Button -->
            <button
              (click)="goBack()"
              class="absolute top-4 sm:top-6 right-4 sm:right-6 z-10 p-2.5 sm:p-3 rounded-full bg-background/90 hover:bg-background backdrop-blur-sm shadow-lg transition-all hover:scale-110">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <!-- Article Content -->
          <article class="container mx-auto px-4 lg:px-8 max-w-4xl bg-background">
            <!-- Title -->
            <h1 class="font-display text-2xl sm:text-3xl lg:text-5xl xl:text-6xl font-bold leading-relaxed text-foreground mb-6 sm:mb-8 pt-6 sm:pt-8">
              {{ getDisplayTitle(news) }}
            </h1>
            
            <!-- Meta Information -->
            <div class="flex flex-wrap items-center gap-4 sm:gap-6 text-sm mb-8 sm:mb-12 pb-6 border-b border-border/30">
              <span class="flex items-center gap-1.5 text-xs font-medium">
                <svg class="w-3.5 h-3.5 text-blue-500" viewBox="0 0 24 24" fill="currentColor"><path d="M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zM12 20c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm.5-13H11v6l5.25 3.15.75-1.23-4.5-2.67z"/></svg>
                <span class="text-blue-600 dark:text-blue-400 font-bold">{{ news.date || news.time }}</span>
              </span>
            </div>

            <!-- Excerpt/Subheading -->
            <div class="mb-8 sm:mb-12">
              <p class="text-xl sm:text-2xl lg:text-3xl text-muted-foreground leading-relaxed font-light italic border-l-4 border-primary pl-4 sm:pl-6">
                {{ getDisplayExcerpt() }}
              </p>
            </div>

            <!-- WhatsApp Share Button -->
            <div class="sticky top-20 mb-8 flex items-center justify-center">
              <button
                (click)="shareOnWhatsApp()"
                class="flex items-center gap-3 px-6 py-3 bg-[#25D366] hover:bg-[#20BA5A] text-white rounded-xl shadow-lg transition-all hover:scale-105 font-medium">
                <svg class="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
                </svg>
                <span>{{ t.share || 'Share on WhatsApp' }}</span>
              </button>
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
  translatedContent: string = '';
  translatedTitle: string = '';
  translatedExcerpt: string = '';
  isTranslating: boolean = false;
  t: any = {};
  readingProgress = 0;
  imageError = false;
  private apiUrl = environment.apiUrl || 'http://localhost:3000';
  private languageSubscription?: Subscription;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private newsService: NewsService,
    private http: HttpClient,
    private languageService: LanguageService,
    private cdr: ChangeDetectorRef
  ) {
    this.updateTranslations();
  }

  ngOnInit() {
    // Scroll to top when component initializes (detail page should start at top)
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;
    
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
    this.languageSubscription = this.languageService.currentLanguage$.subscribe(async (lang) => {
      console.log('[NewsDetailPage] Language changed to:', lang);
      // Reset translations to trigger re-translation
      this.translatedTitle = '';
      this.translatedExcerpt = '';
      this.translatedContent = '';
      // Trigger change detection to clear old content
      this.cdr.detectChanges();
      console.log('[NewsDetailPage] Starting translation...');
      await this.updateTranslations();
      console.log('[NewsDetailPage] Translation complete');
      // Trigger change detection after translation completes
      this.cdr.detectChanges();
    });
  }

  ngOnDestroy() {
    this.languageSubscription?.unsubscribe();
  }

  @HostListener('window:scroll', ['$event'])
  onScroll() {
    this.updateReadingProgress();
  }

  updateReadingProgress() {
    const windowHeight = window.innerHeight;
    const documentHeight = document.documentElement.scrollHeight;
    const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
    const scrollPercent = (scrollTop / (documentHeight - windowHeight)) * 100;
    this.readingProgress = Math.min(100, Math.max(0, scrollPercent));
  }

  async updateTranslations() {
    this.t = this.languageService.getTranslations();
    // Translate content when language changes
    if (this.news) {
      await this.translateContent();
    }
  }

  /**
   * Strip HTML tags from text for translation
   */
  private stripHtml(html: string): string {
    if (!html) return '';
    // Create a temporary div element to parse HTML
    const tmp = document.createElement('div');
    tmp.innerHTML = html;
    return tmp.textContent || tmp.innerText || '';
  }

  /**
   * Translate HTML content by translating text nodes while preserving structure
   */
  private async translateHtmlContent(htmlContent: string): Promise<string> {
    if (!htmlContent) return '';
    
    // Strip HTML to get plain text for translation
    const plainText = this.stripHtml(htmlContent);
    if (!plainText.trim()) return htmlContent;
    
    // Translate the plain text
    const translatedText = await this.languageService.translateToCurrentLanguage(plainText);
    
    // If translation didn't change (already in correct language), return original
    if (translatedText === plainText) {
      return htmlContent;
    }
    
    // Parse HTML and translate text nodes while preserving structure
    const tmp = document.createElement('div');
    tmp.innerHTML = htmlContent;
    
    // Extract all text nodes and translate them
    const walker = document.createTreeWalker(
      tmp,
      NodeFilter.SHOW_TEXT,
      null
    );
    
    const textNodes: Text[] = [];
    let node;
    while (node = walker.nextNode()) {
      if (node.textContent && node.textContent.trim()) {
        textNodes.push(node as Text);
      }
    }
    
    // Split translated text by paragraphs
    const translatedParagraphs = translatedText.split(/\n\n+/).filter(p => p.trim());
    
    // Replace text nodes with translated content
    textNodes.forEach((textNode, index) => {
      if (index < translatedParagraphs.length) {
        textNode.textContent = translatedParagraphs[index].trim();
      }
    });
    
    return tmp.innerHTML || htmlContent;
  }

  async translateContent() {
    console.log('[NewsDetailPage] translateContent called, news:', this.news ? 'exists' : 'null', 'isTranslating:', this.isTranslating);
    if (!this.news || this.isTranslating) {
      console.log('[NewsDetailPage] Skipping translation - no news or already translating');
      return;
    }
    
    this.isTranslating = true;
    
    try {
      // Translate title
      if (this.news.title) {
        console.log('[NewsDetailPage] Translating title:', this.news.title.substring(0, 30) + '...');
        this.translatedTitle = await this.languageService.translateToCurrentLanguage(this.news.title);
        console.log('[NewsDetailPage] Translated title:', this.translatedTitle.substring(0, 30) + '...');
      }
      
      // Translate excerpt
      if (this.news.excerpt) {
        console.log('[NewsDetailPage] Translating excerpt:', this.news.excerpt.substring(0, 30) + '...');
        this.translatedExcerpt = await this.languageService.translateToCurrentLanguage(this.news.excerpt);
        console.log('[NewsDetailPage] Translated excerpt:', this.translatedExcerpt.substring(0, 30) + '...');
      }
      
      // Translate content (handle HTML properly)
      const contentToTranslate = this.fullContent || this.news.excerpt || '';
      if (contentToTranslate) {
        console.log('[NewsDetailPage] Translating content:', contentToTranslate.substring(0, 30) + '...');
        // Check if content contains HTML
        if (contentToTranslate.includes('<') && contentToTranslate.includes('>')) {
          this.translatedContent = await this.translateHtmlContent(contentToTranslate);
        } else {
          this.translatedContent = await this.languageService.translateToCurrentLanguage(contentToTranslate);
        }
        console.log('[NewsDetailPage] Translated content:', this.translatedContent.substring(0, 30) + '...');
      }
    } catch (error) {
      console.error('[NewsDetailPage] Error translating content:', error);
      // Fallback to original content
      this.translatedTitle = this.news.title || '';
      this.translatedExcerpt = this.news.excerpt || '';
      this.translatedContent = this.fullContent || this.news.excerpt || '';
    } finally {
      this.isTranslating = false;
      console.log('[NewsDetailPage] Translation process complete');
      // Trigger change detection after translation completes
      this.cdr.detectChanges();
    }
  }

  getDisplayTitle(news: NewsArticle): string {
    if (!news) return '';
    // If translation is available and current, use it
    if (this.translatedTitle && news.id === this.news?.id) {
      return this.translatedTitle;
    }
    // Otherwise use the language service method
    return this.languageService.getDisplayTitle(news.title, news.titleEn);
  }

  getDisplayExcerpt(): string {
    if (!this.news) return '';
    // If translation is available and current, use it
    if (this.translatedExcerpt) {
      return this.translatedExcerpt;
    }
    // Otherwise fallback to original
    const lang = this.languageService.getCurrentLanguage();
    if (lang === 'en' && (this.news as any).excerptEn) {
      return (this.news as any).excerptEn;
    }
    return this.news.excerpt || '';
  }

  getDisplayContent(): string {
    if (!this.news) return '';
    const lang = this.languageService.getCurrentLanguage();
    
    // If translation is in progress, show loading or original
    if (this.isTranslating && !this.translatedContent) {
      return this.fullContent || this.news.excerpt || '';
    }
    
    // If translation is available, use it
    if (this.translatedContent) {
      return this.translatedContent;
    }
    
    // Otherwise fallback to original based on language
    if (lang === 'en') {
      return (this.news as any).contentEn || (this.news as any).excerptEn || this.fullContent || this.news.excerpt || '';
    }
    return this.fullContent || this.news.excerpt || '';
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

            // Format date the same way as home page
            const formattedDate = response.data.date 
              ? new Date(response.data.date).toLocaleDateString('en-IN', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })
              : response.data.createdAt 
                ? new Date(response.data.createdAt).toLocaleDateString('en-IN', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })
                : new Date().toLocaleDateString('en-IN', { 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                  });

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
              date: formattedDate,
              isTrending: response.data.isTrending || false,
              isBreaking: response.data.isBreaking || false,
              isFeatured: response.data.isFeatured || false
            };
            // Store Hindi content (default)
            this.fullContent = response.data.content || response.data.excerpt || '';
            // Store English content if available
            if (response.data.contentEn) {
              (this.news as any).contentEn = response.data.contentEn;
            }
            if (response.data.excerptEn) {
              (this.news as any).excerptEn = response.data.excerptEn;
            }
            this.tags = response.data.tags || [];
            this.isBreaking = response.data.isBreaking || false;
            this.imageError = false; // Reset image error flag
            this.isLoading = false;
            // Translate content after loading
            setTimeout(() => this.translateContent(), 100);
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
    const content = this.getDisplayContent();
    if (!content) {
      return '';
    }
    
    // Convert line breaks to paragraphs
    return content
      .split('\n\n')
      .map(paragraph => paragraph.trim())
      .filter(paragraph => paragraph.length > 0)
      .map(paragraph => `<p>${paragraph.replace(/\n/g, '<br>')}</p>`)
      .join('');
  }

  goBack() {
    // Navigate back to home page
    // Scroll position will be restored by index component
    this.router.navigate(['/']);
  }

  shareOnWhatsApp() {
    const title = this.news?.titleEn || this.news?.title || '';
    const url = window.location.href;
    const text = `${title}\n\n${url}`;
    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(text)}`;
    window.open(whatsappUrl, '_blank');
  }

  handleImageError(event: any) {
    // If image fails to load, show fallback
    this.imageError = true;
    console.warn('Image failed to load:', this.news?.image);
  }

  getCategoryColor(category: string): string {
    const colors: Record<string, string> = {
      'Health': 'bg-green-500 text-white',
      'Sports': 'bg-orange-500 text-white',
      'Business': 'bg-blue-500 text-white',
      'Entertainment': 'bg-pink-500 text-white',
      'International': 'bg-purple-500 text-white',
      'Technology': 'bg-cyan-500 text-white',
      'National': 'bg-blue-500 text-white',
      'Politics': 'bg-red-500 text-white',
      'Religious': 'bg-indigo-500 text-white',
    };
    return colors[category] || 'bg-primary text-white';
  }
}
