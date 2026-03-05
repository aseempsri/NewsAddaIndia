import { Component, OnInit, OnDestroy, HostListener, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { Meta, Title } from '@angular/platform-browser';
import { HeaderComponent } from '../../components/header/header.component';
import { FooterComponent } from '../../components/footer/footer.component';
import { NewsService, NewsArticle } from '../../services/news.service';
import { LanguageService } from '../../services/language.service';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { getNewsSharePath, getRouteParamForApi, slugify } from '../../utils/slug.utils';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-news-detail',
  standalone: true,
  imports: [CommonModule, HeaderComponent, FooterComponent],
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
          <!-- Sticky Image Header - Vertical Stack on Mobile, Horizontal on Desktop -->
          <div class="sticky top-0 z-40 w-full h-[50vh] sm:h-[60vh] overflow-x-auto overflow-y-auto lg:overflow-y-hidden bg-black">
            @if (getImagesArray().length > 0 && !imageError) {
              <!-- Mobile: Vertical Stack -->
              <div class="flex flex-col h-full lg:hidden">
                @for (img of getImagesArray(); track $index) {
                  <div class="flex-shrink-0 w-full flex items-center justify-center bg-black" style="min-height: 50vh;">
                    <img
                      [src]="img"
                      [alt]="news.title + ' - Image ' + ($index + 1)"
                      (error)="handleImageError($event)"
                      class="max-w-full max-h-full w-auto h-auto object-contain"
                      style="image-rendering: -webkit-optimize-contrast; image-rendering: crisp-edges; image-rendering: high-quality; filter: none; -webkit-filter: none;"
                    />
                  </div>
                }
              </div>
              
              <!-- Desktop: Horizontal Stack -->
              <div class="hidden lg:flex h-full w-max">
                @for (img of getImagesArray(); track $index) {
                  <div class="flex-shrink-0 h-full flex items-center justify-center bg-black" [style.width]="'calc(100vw / ' + getImagesArray().length + ')'">
                    <img
                      [src]="img"
                      [alt]="news.title + ' - Image ' + ($index + 1)"
                      (error)="handleImageError($event)"
                      class="max-w-full max-h-full w-auto h-auto object-contain"
                      style="image-rendering: -webkit-optimize-contrast; image-rendering: crisp-edges; image-rendering: high-quality; filter: none; -webkit-filter: none;"
                    />
                  </div>
                }
              </div>
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

            <!-- Share Button with Dropdown -->
            <div class="sticky top-20 mb-4 flex flex-col items-center justify-center gap-3">
              <div class="relative">
                <button
                  (click)="showShareMenu = !showShareMenu"
                  class="flex items-center gap-3 px-6 py-3 bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl shadow-lg transition-all hover:scale-105 font-medium">
                  <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                  </svg>
                  <span>{{ t.share || 'Share' }}</span>
                </button>
                @if (showShareMenu) {
                  <div class="absolute left-1/2 -translate-x-1/2 top-full mt-2 py-3 px-4 bg-background border border-border rounded-xl shadow-xl z-50 flex flex-row items-center justify-center gap-3">
                    <button type="button" (click)="openShareUrl(getWhatsAppShareUrl())" class="p-2.5 rounded-full hover:bg-secondary/50 text-[#25D366]" title="WhatsApp" aria-label="Share on WhatsApp">
                      <svg class="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/></svg>
                    </button>
                    <button type="button" (click)="openShareUrl(getTwitterShareUrl())" class="p-2.5 rounded-full hover:bg-secondary/50 text-foreground" title="Twitter" aria-label="Share on Twitter">
                      <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
                    </button>
                    <button type="button" (click)="openShareUrl(getFacebookShareUrl())" class="p-2.5 rounded-full hover:bg-secondary/50 text-[#1877F2]" title="Facebook" aria-label="Share on Facebook">
                      <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
                    </button>
                    <button (click)="copyShareLink(); showShareMenu = false" class="p-2.5 rounded-full hover:bg-secondary/50 text-foreground flex items-center gap-2 min-w-[4rem] justify-center" [title]="showCopied ? 'Copied!' : 'Copy link'" [attr.aria-label]="showCopied ? 'Copied!' : 'Copy link'">
                      @if (showCopied) {
                        <svg class="w-5 h-5 text-green-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/></svg>
                        <span class="text-sm font-medium text-green-500">Copied!</span>
                      } @else {
                        <svg class="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"/></svg>
                        <span class="text-sm font-medium whitespace-nowrap">Copy Link</span>
                      }
                    </button>
                  </div>
                }
              </div>
              <!-- Listen: reads the currently displayed content in the selected language (one button). Hidden for now. -->
              @if (showListenButton) {
              <button
                type="button"
                (click)="toggleListen()"
                [disabled]="isListenLoading"
                [class.bg-primary]="!isSpeaking && !isListenLoading"
                [class.bg-red-500]="isSpeaking"
                [class.opacity-70]="isListenLoading"
                class="flex items-center gap-2 px-5 py-2.5 text-primary-foreground rounded-xl shadow-lg transition-all hover:scale-105 font-medium hover:opacity-90 disabled:cursor-wait"
                [attr.aria-label]="isSpeaking ? 'Stop' : (isListenLoading ? 'Loading...' : 'Listen to article')"
                [title]="isListenLoading ? (t.loading || 'Loading...') : (isSpeaking ? (t.stopListen || 'Stop') : (t.listen || 'Listen'))">
                @if (isListenLoading) {
                  <span class="w-5 h-5 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin"></span>
                  <span>{{ t.loading || 'Loading...' }}</span>
                } @else if (isSpeaking) {
                  <svg class="w-5 h-5 flex-shrink-0" fill="currentColor" viewBox="0 0 24 24"><path d="M6 6h12v12H6z"/></svg>
                  <span>{{ t.stopListen || 'Stop' }}</span>
                } @else {
                  <svg class="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z"/></svg>
                  <span>{{ t.listen || 'Listen' }}</span>
                }
              </button>
              }
            </div>

            <!-- Full Content -->
            <div class="prose prose-lg prose-headings:font-bold prose-headings:text-foreground prose-p:text-muted-foreground prose-p:leading-relaxed prose-p:mb-6 prose-a:text-primary prose-a:no-underline hover:prose-a:underline prose-strong:text-foreground prose-strong:font-semibold max-w-none mb-12">
              <div [innerHTML]="getFormattedContent()" class="news-content"></div>
            </div>

            <!-- Tags (from admin) - just before signature -->
            @if (tags && tags.length > 0) {
              <div class="mb-6 flex flex-wrap gap-2">
                @for (tag of tags; track tag) {
                  <span class="px-3 py-1.5 text-sm bg-secondary rounded-md text-muted-foreground border border-border/50">
                    {{ tag }}
                  </span>
                }
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
  showShareMenu = false;
  showCopied = false;
  isSpeaking = false;
  isListenLoading = false;
  /** Set to true to show the Listen (TTS) button. Hidden for now. */
  showListenButton = false;
  private currentTTSAudio: HTMLAudioElement | null = null;
  // Same-origin when apiUrl is empty in production (see news.service.ts)
  private apiUrl = (environment.apiUrl !== undefined && environment.apiUrl !== null && String(environment.apiUrl).trim() !== '')
    ? environment.apiUrl
    : (environment.production ? '' : 'http://localhost:3000');
  private languageSubscription?: Subscription;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private newsService: NewsService,
    private http: HttpClient,
    private languageService: LanguageService,
    private cdr: ChangeDetectorRef,
    private meta: Meta,
    private title: Title
  ) {
    this.updateTranslations();
  }

  ngOnInit() {
    // Always scroll to top when component initializes (detail page should start at top)
    // Get current route and clear any saved scroll position
    const currentRoute = this.router.url;

    // Force scroll to top immediately - multiple methods to ensure it works
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;

    // Additional scroll to top after a short delay to override any restoration
    setTimeout(() => {
      window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
      document.documentElement.scrollTop = 0;
      document.body.scrollTop = 0;
    }, 0);

    // Force scroll to top after render
    requestAnimationFrame(() => {
      window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
      document.documentElement.scrollTop = 0;
      document.body.scrollTop = 0;
    });

    // Multiple additional scroll attempts to override any scroll restoration
    setTimeout(() => {
      window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
      document.documentElement.scrollTop = 0;
      document.body.scrollTop = 0;
    }, 50);

    setTimeout(() => {
      window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
      document.documentElement.scrollTop = 0;
      document.body.scrollTop = 0;
    }, 100);

    setTimeout(() => {
      window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
      document.documentElement.scrollTop = 0;
      document.body.scrollTop = 0;
    }, 200);

    this.updateTranslations();
    this.route.params.subscribe(params => {
      const param = getRouteParamForApi(params['id'] || '');
      if (param) {
        this.forceScrollToTop();
        console.log('[NewsDetail] Loading news with param:', param);
        this.loadNews(param);
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
    this.stopListen();
    this.languageSubscription?.unsubscribe();
  }

  @HostListener('window:scroll')
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

  /**
   * Force scroll to top - used when loading new articles
   */
  private forceScrollToTop() {
    const scrollToTop = () => {
      window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
      document.documentElement.scrollTop = 0;
      document.body.scrollTop = 0;
      // Also try scrolling the window itself
      if (window.scrollY !== 0) {
        window.scrollTo(0, 0);
      }
    };
    
    // Immediate scroll
    scrollToTop();
    
    // Multiple delayed scrolls
    setTimeout(scrollToTop, 0);
    setTimeout(scrollToTop, 50);
    setTimeout(scrollToTop, 100);
    setTimeout(scrollToTop, 200);
    setTimeout(scrollToTop, 300);
    setTimeout(scrollToTop, 500);
    
    // After render
    requestAnimationFrame(() => {
      scrollToTop();
      requestAnimationFrame(() => {
        scrollToTop();
      });
    });
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
    // Use language service to get correct excerpt based on current language
    return this.languageService.getDisplayExcerpt(
      this.news.excerpt || '',
      (this.news as any).excerptEn || ''
    );
  }

  getDisplayContent(): string {
    if (!this.news) return '';
    
    // Use language service to get correct content based on current language
    return this.languageService.getDisplayContent(
      this.news.content || this.news.excerpt || '',
      (this.news as any).contentEn || ''
    );
  }

  /** Plain text of detailed content only (for voice read). Strips HTML. */
  private getContentForSpeech(): string {
    const raw = this.getDisplayContent();
    if (!raw || !raw.trim()) return '';
    const div = typeof document !== 'undefined' ? document.createElement('div') : null;
    if (div) {
      div.innerHTML = raw;
      return (div.textContent || div.innerText || raw).replace(/\s+/g, ' ').trim();
    }
    return raw.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
  }

  /** Get plain text for speech by language: Hindi (content) or English (contentEn). */
  private getContentForSpeechByLang(lang: 'hi' | 'en'): string {
    if (!this.news) return '';
    const raw = lang === 'hi'
      ? (this.news.content || this.news.excerpt || '')
      : ((this.news as any).contentEn || this.news.excerpt || '');
    if (!raw || !raw.trim()) return '';
    const div = typeof document !== 'undefined' ? document.createElement('div') : null;
    if (div) {
      div.innerHTML = raw;
      return (div.textContent || div.innerText || raw).replace(/\s+/g, ' ').trim();
    }
    return raw.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
  }

  /**
   * Single Listen button: reads the content currently displayed (based on language toggle).
   * Tries Google Cloud TTS first; falls back to browser SpeechSynthesis if TTS is not configured.
   */
  toggleListen() {
    if (this.isSpeaking || this.isListenLoading) {
      this.stopListen();
      this.cdr.detectChanges();
      return;
    }
    const currentLang = this.languageService.getCurrentLanguage() === 'hi' ? 'hi' : 'en';
    const text = this.getContentForSpeech();
    if (!text) return;

    this.isListenLoading = true;
    this.cdr.detectChanges();
    const langCode = currentLang === 'hi' ? 'hi-IN' : 'en-IN';
    const apiBase = (this.apiUrl || '').replace(/\/$/, '') || (typeof window !== 'undefined' ? (window as any).__API_BASE__ || '' : '');
    const ttsUrl = apiBase ? `${apiBase}/api/tts` : '/api/tts';

    this.http.post<{ success: boolean; chunks?: string[]; error?: string; code?: string }>(ttsUrl, { text, lang: langCode }).subscribe({
      next: (res) => {
        this.isListenLoading = false;
        this.cdr.detectChanges();
        if (res.success && res.chunks && res.chunks.length > 0) {
          this.playTTSChunks(res.chunks);
          return;
        }
        this.fallbackSpeak(text, langCode);
      },
      error: () => {
        this.isListenLoading = false;
        this.cdr.detectChanges();
        this.fallbackSpeak(text, langCode);
      }
    });
  }

  private stopListen() {
    if (this.currentTTSAudio) {
      this.currentTTSAudio.pause();
      this.currentTTSAudio.src = '';
      this.currentTTSAudio = null;
    }
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
    this.isSpeaking = false;
    this.isListenLoading = false;
  }

  private playTTSChunks(chunks: string[]) {
    let index = 0;
    const playNext = () => {
      if (index >= chunks.length) {
        this.isSpeaking = false;
        this.currentTTSAudio = null;
        this.cdr.detectChanges();
        return;
      }
      const b64 = chunks[index];
      index += 1;
      const audio = new Audio('data:audio/mpeg;base64,' + b64);
      this.currentTTSAudio = audio;
      this.isSpeaking = true;
      this.cdr.detectChanges();
      audio.onended = () => playNext();
      audio.onerror = () => {
        this.isSpeaking = false;
        this.currentTTSAudio = null;
        this.cdr.detectChanges();
      };
      audio.play().catch(() => {
        this.isSpeaking = false;
        this.currentTTSAudio = null;
        this.cdr.detectChanges();
      });
    };
    playNext();
  }

  private fallbackSpeak(text: string, langCode: string) {
    if (typeof window === 'undefined' || !window.speechSynthesis) return;
    let spoken = false;
    const trySpeak = () => {
      if (spoken) return;
      const voices = window.speechSynthesis.getVoices();
      if (voices.length === 0) return;
      spoken = true;
      const voice = this.getFemaleVoiceForLang(langCode, voices);
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = langCode;
      if (voice) utterance.voice = voice;
      utterance.rate = 0.9;
      utterance.pitch = 1;
      utterance.onend = () => {
        this.isSpeaking = false;
        this.cdr.detectChanges();
      };
      utterance.onerror = () => {
        this.isSpeaking = false;
        this.cdr.detectChanges();
      };
      window.speechSynthesis.speak(utterance);
      this.isSpeaking = true;
      this.cdr.detectChanges();
    };
    if (window.speechSynthesis.getVoices().length > 0) {
      trySpeak();
    } else {
      window.speechSynthesis.addEventListener('voiceschanged', () => trySpeak(), { once: true });
    }
  }

  /** Prefer a female voice for the given language (hi-IN or en-IN). For Hindi, if no voice found return null so browser can use default/online voice. */
  private getFemaleVoiceForLang(lang: string, voices: SpeechSynthesisVoice[]): SpeechSynthesisVoice | null {
    const langPrefix = lang.split('-')[0];
    const forLang = voices.filter(v => v.lang.startsWith(langPrefix) || v.lang === lang || v.lang.startsWith(lang));
    const femaleKeywords = ['female', 'woman', 'priya', 'lekha', 'sangeeta', 'देवनागरी', 'hindi', 'हिन्दी'];
    const female = forLang.find(v => femaleKeywords.some(k => v.name.toLowerCase().includes(k)));
    if (female) return female;
    if (forLang.length > 0) return forLang[0];
    if (langPrefix === 'hi') return null;
    const anyFemale = voices.find(v => femaleKeywords.some(k => v.name.toLowerCase().includes(k)));
    if (anyFemale) return anyFemale;
    return voices.length > 0 ? voices[0] : null;
  }

  getCategoryName(category: string): string {
    return this.languageService.translateCategory(category);
  }

  loadNews(slugOrId: string) {
    this.isLoading = true;
    const cacheBuster = `?t=${Date.now()}`;
    this.http.get<{ success: boolean; data: any }>(`${this.apiUrl}/api/news/${encodeURIComponent(slugOrId)}${cacheBuster}`).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          let imageUrl = response.data.image || '';
          if (imageUrl && (imageUrl.startsWith('/uploads') || imageUrl.startsWith('/'))) {
            imageUrl = `${this.apiUrl}${imageUrl}`;
          }

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

          let imagesArray: string[] = [];
          if (response.data.images && Array.isArray(response.data.images) && response.data.images.length > 0) {
            imagesArray = response.data.images.map((img: string) => {
              if (img && img.trim() !== '' && !img.startsWith('http')) {
                const imgPath = img.startsWith('/') ? img : '/' + img;
                return `${this.apiUrl}${imgPath}`;
              }
              return img;
            });
          } else if (imageUrl) {
            imagesArray = [imageUrl];
          }

          this.news = {
            id: response.data._id || response.data.id,
            title: response.data.title,
            titleEn: response.data.titleEn || response.data.title,
            excerpt: response.data.excerpt,
            content: response.data.content || response.data.excerpt,
            category: response.data.category,
            image: imageUrl,
            images: imagesArray,
            time: response.data.time || response.data.createdAt,
            author: response.data.author,
            date: formattedDate,
            isTrending: response.data.isTrending || false,
            isBreaking: response.data.isBreaking || false,
            isFeatured: response.data.isFeatured || false,
            slug: response.data.slug
          };
          this.fullContent = response.data.content || response.data.excerpt || '';
          if (response.data.contentEn) (this.news as any).contentEn = response.data.contentEn;
          if (response.data.excerptEn) (this.news as any).excerptEn = response.data.excerptEn;
          if (response.data.tags) {
            if (Array.isArray(response.data.tags)) {
              this.tags = response.data.tags;
            } else if (typeof response.data.tags === 'string') {
              try {
                this.tags = JSON.parse(response.data.tags);
              } catch {
                this.tags = response.data.tags.split(',').map((t: string) => t.trim()).filter((t: string) => t.length > 0);
              }
            } else {
              this.tags = [];
            }
          } else {
            this.tags = [];
          }
          (this.news as any).tags = this.tags;
          this.isBreaking = response.data.isBreaking || false;
          this.imageError = false;
          this.isLoading = false;

          const apiSlug = response.data.slug || '';
          const badSlug = !apiSlug || apiSlug === 'article' || /^article-\d+$/.test(apiSlug);
          const slug = badSlug
            ? (slugify(response.data.titleEn || response.data.title || '') || 'news-' + (response.data._id || response.data.id || '').toString().slice(-8))
            : apiSlug;
          if (slug && badSlug) {
            (this.news as any).slug = slug;
          }
          const slugPath = getNewsSharePath(slug);
          if (slugPath !== '/news' && window.history.replaceState) {
            const fullUrl = window.location.origin + slugPath;
            window.history.replaceState({}, '', fullUrl);
          }
          this.updateMetaForShare();
          this.cdr.detectChanges();
          setTimeout(() => this.forceScrollToTop(), 0);
          setTimeout(() => this.translateContent(), 100);
        } else {
          this.isLoading = false;
        }
      },
      error: () => {
        this.isLoading = false;
        this.news = null;
        this.cdr.detectChanges();
      }
    });
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
    // Use browser back if available (preserves scroll position better)
    if (window.history.length > 1) {
      window.history.back();
    } else {
      // Fallback to router navigation if no history
      this.router.navigate(['/']).then(() => {
        // Give the page time to render, then restore scroll position
        setTimeout(() => {
          // The scroll restoration service should handle this automatically
          if (typeof window !== 'undefined') {
            requestAnimationFrame(() => {
              // Scroll restoration service will handle this via NavigationEnd event
            });
          }
        }, 100);
      });
    }
  }

  shareOnWhatsApp() {
    const url = this.getShareUrl();
    const headlineHindi = this.news?.title || this.news?.titleEn || '';
    const text = `${headlineHindi}\n\n${url}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
  }

  getShareUrl(): string {
    if (!this.news?.id) return window.location.href;
    let slug = this.news.slug || slugify(this.news.titleEn || this.news.title || '');
    if (!slug || slug === 'article' || /^article-\d+$/.test(slug)) {
      slug = slugify(this.news.titleEn || this.news.title || '') || 'news-' + (this.news.id || '').toString().slice(-8);
    }
    const path = getNewsSharePath(slug);
    if (path === '/news') return `${window.location.origin}/news/${this.news.id}`;
    return `${window.location.origin}${path}`;
  }

  getWhatsAppShareUrl(): string {
    const url = this.getShareUrl();
    const headlineHindi = this.news?.title || this.news?.titleEn || '';
    return `https://wa.me/?text=${encodeURIComponent(`${headlineHindi}\n\n${url}`)}`;
  }

  getTwitterShareUrl(): string {
    const url = this.getShareUrl();
    const headlineHindi = this.news?.title || this.news?.titleEn || '';
    return `https://twitter.com/intent/tweet?text=${encodeURIComponent(headlineHindi)}&url=${encodeURIComponent(url)}`;
  }

  getFacebookShareUrl(): string {
    const url = this.getShareUrl();
    return `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`;
  }

  /**
   * Open share URL in new tab (desktop) or let OS open app (mobile). Called from share icon clicks so navigation isn't lost when menu closes.
   */
  openShareUrl(url: string) {
    if (url) {
      window.open(url, '_blank', 'noopener,noreferrer');
    }
    this.showShareMenu = false;
    this.cdr.detectChanges();
  }

  copyShareLink() {
    const url = this.getShareUrl();
    navigator.clipboard.writeText(url).then(() => {
      this.showCopied = true;
      setTimeout(() => { this.showCopied = false; this.cdr.detectChanges(); }, 2000);
      this.cdr.detectChanges();
    }).catch(() => {});
  }

  /**
   * Set document meta tags for social sharing (og:image, og:title, etc.)
   */
  private updateMetaForShare() {
    if (!this.news) return;
    const headlineHindi = this.news.title || this.news.titleEn || '';
    const description = (this.news.excerpt || '').slice(0, 200);
    let imageUrl = this.news.image || (this.news.images && this.news.images[0]) || '';
    if (imageUrl && !imageUrl.startsWith('http')) {
      imageUrl = imageUrl.startsWith('/') ? `${window.location.origin}${imageUrl}` : `${window.location.origin}/${imageUrl}`;
    }
    this.title.setTitle('News Adda India - Your Daily News');
    this.meta.updateTag({ name: 'description', content: description });
    this.meta.updateTag({ property: 'og:title', content: headlineHindi });
    this.meta.updateTag({ property: 'og:description', content: description });
    this.meta.updateTag({ property: 'og:type', content: 'article' });
    this.meta.updateTag({ property: 'og:url', content: this.getShareUrl() });
    if (imageUrl) {
      this.meta.updateTag({ property: 'og:image', content: imageUrl });
      this.meta.updateTag({ name: 'twitter:image', content: imageUrl });
    }
    this.meta.updateTag({ name: 'twitter:card', content: 'summary_large_image' });
    this.meta.updateTag({ name: 'twitter:title', content: headlineHindi });
    this.meta.updateTag({ name: 'twitter:description', content: description });
  }

  handleImageError(event: any) {
    // If image fails to load, show fallback
    this.imageError = true;
    console.warn('Image failed to load:', this.news?.image);
  }

  /**
   * Get images array - check multiple sources
   */
  getImagesArray(): string[] {
    if (!this.news) return [];

    // First check if images array exists in news object
    if (this.news.images && Array.isArray(this.news.images) && this.news.images.length > 0) {
      return this.news.images.filter(img => img && img.trim().length > 0);
    }

    // Check if images array exists in news object (any type)
    if ((this.news as any).images && Array.isArray((this.news as any).images)) {
      return (this.news as any).images.filter((img: any) => img && typeof img === 'string' && img.trim().length > 0);
    }

    // Fallback to single image
    return this.news.image ? [this.news.image] : [];
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
