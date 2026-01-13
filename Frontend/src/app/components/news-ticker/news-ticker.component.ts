import { Component, OnInit, ViewEncapsulation, AfterViewInit, ElementRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { NewsService } from '../../services/news.service';
import { LanguageService } from '../../services/language.service';

@Component({
  selector: 'app-news-ticker',
  standalone: true,
  imports: [CommonModule, RouterModule],
  encapsulation: ViewEncapsulation.None,
  template: `
    <div class="bg-gradient-to-r from-purple-600/30 via-pink-500/20 to-orange-500/30 border-y-2 border-purple-500/50 overflow-hidden w-full max-w-full shadow-lg">
      <div class="w-full max-w-full overflow-hidden">
        <div class="flex items-center py-1.5 md:py-3 overflow-hidden">
          <!-- Label - Minimal width on mobile for fire icon only, auto on desktop -->
          <div class="flex items-center justify-center gap-0.5 md:gap-2 md:border-r-2 md:border-purple-400/60 shrink-0 md:bg-gradient-to-r md:from-purple-600 md:via-pink-500 md:to-fuchsia-600 px-1 md:pl-5 md:pr-6 py-0.5 md:py-2.5 md:rounded-r-lg md:rounded-r-xl md:shadow-xl w-auto md:w-auto overflow-hidden">
            <!-- Lightning Bolt Icon - Hidden on mobile -->
            <svg class="hidden md:block w-2.5 h-2.5 md:w-5 md:h-5 text-white drop-shadow-lg flex-shrink-0" fill="currentColor" viewBox="0 0 24 24" style="filter: drop-shadow(0 1px 2px rgba(0,0,0,0.4));">
              <path d="M13 10V3L4 14h7v7l9-11h-7z"/>
            </svg>
            <!-- Fire Emoji - Bigger on mobile, centered -->
            <span class="text-base md:text-lg leading-none flex-shrink-0 inline-flex items-center justify-center">🔥</span>
            <!-- TRENDING Text - Hidden on mobile -->
            <span class="hidden md:inline text-[9px] md:text-sm font-black text-white uppercase whitespace-nowrap drop-shadow-lg flex-shrink-0" style="font-family: 'Arial Black', 'Helvetica Neue', sans-serif; letter-spacing: 0.04em; text-shadow: 1px 1px 2px rgba(0,0,0,0.5);">
              TRENDING
            </span>
          </div>

          <!-- Scrolling News - 80% width on mobile -->
          <div class="overflow-hidden flex-1 min-w-0 py-0.5 md:py-1 md:ml-4 pr-4 md:pr-0 w-[80%] md:w-auto">
            @if (loading) {
              <div class="text-sm md:text-sm text-purple-600 font-semibold">Loading trending news...</div>
            } @else if (scrollingNews.length === 0) {
              <div class="text-sm md:text-sm text-purple-600 font-semibold">No trending news available</div>
            } @else {
              <div #tickerContainer class="ticker-scroll-container flex gap-3 md:gap-6 whitespace-nowrap items-center" style="will-change: transform;">
                @for (news of scrollingNews; track $index) {
                  <a
                    [routerLink]="['/news', news.id]"
                    class="trending-news-box group flex-shrink-0 transition-all duration-300 hover:scale-105">
                    <div class="flex items-center gap-2 md:gap-3 px-3 md:px-4 py-2 md:py-2.5 rounded-lg md:rounded-xl bg-gradient-to-r from-purple-500/20 via-pink-500/20 to-fuchsia-500/20 dark:from-purple-600/30 dark:via-pink-600/30 dark:to-fuchsia-600/30 border-2 border-purple-400/50 dark:border-purple-500/50 backdrop-blur-sm shadow-lg hover:shadow-xl hover:border-purple-500 dark:hover:border-purple-400 transition-all duration-300">
                      <!-- Animated dot indicator -->
                      <svg class="w-2.5 h-2.5 md:w-3 md:h-3 text-pink-500 dark:text-pink-400 shrink-0 animate-pulse group-hover:animate-none" fill="currentColor" viewBox="0 0 24 24" style="filter: drop-shadow(0 1px 2px rgba(236,72,153,0.5));">
                        <circle cx="12" cy="12" r="3"/>
                      </svg>
                      <!-- Trending title in box -->
                      <span class="font-semibold md:font-extrabold dark:font-normal leading-tight whitespace-nowrap text-purple-800 dark:text-purple-200 group-hover:text-pink-700 dark:group-hover:text-pink-300 transition-colors duration-300" style="font-family: 'Arial', 'Helvetica Neue', sans-serif; line-height: 1.4; display: inline-block; text-shadow: 0 1px 2px rgba(255,255,255,0.5);">
                        {{ getDisplayTitle(news) }}
                      </span>
                    </div>
                  </a>
                }
              </div>
            }
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .ticker-scroll-container {
      display: inline-flex;
      animation: ticker-scroll 60s linear infinite;
      will-change: transform;
      backface-visibility: hidden;
      perspective: 1000px;
      -webkit-font-smoothing: antialiased;
      transform: translateZ(0);
      -webkit-transform: translateZ(0);
    }
    
    @keyframes ticker-scroll {
      0% {
        transform: translateX(0) translateZ(0);
        -webkit-transform: translateX(0) translateZ(0);
      }
      100% {
        transform: translateX(-50%) translateZ(0);
        -webkit-transform: translateX(-50%) translateZ(0);
      }
    }
    
    /* Trending news box styling */
    .trending-news-box {
      display: inline-flex;
      min-width: fit-content;
    }
    
    .trending-news-box > div {
      position: relative;
      overflow: hidden;
    }
    
    /* Animated gradient border effect on hover */
    .trending-news-box > div::before {
      content: '';
      position: absolute;
      top: -2px;
      left: -2px;
      right: -2px;
      bottom: -2px;
      background: linear-gradient(45deg, #a855f7, #ec4899, #d946ef, #a855f7);
      background-size: 300% 300%;
      border-radius: inherit;
      z-index: -1;
      opacity: 0;
      transition: opacity 0.3s ease;
      animation: gradient-shift 3s ease infinite;
    }
    
    .trending-news-box:hover > div::before {
      opacity: 1;
    }
    
    @keyframes gradient-shift {
      0%, 100% {
        background-position: 0% 50%;
      }
      50% {
        background-position: 100% 50%;
      }
    }
    
    /* Glow effect on hover */
    .trending-news-box:hover > div {
      box-shadow: 0 0 20px rgba(168, 85, 247, 0.4), 0 0 40px rgba(236, 72, 153, 0.2);
    }
    
    /* Force hardware acceleration and ensure animation works */
    @media (max-width: 767px) {
      .ticker-scroll-container {
        animation: ticker-scroll 60s linear infinite !important;
        will-change: transform;
        transform: translateZ(0);
        -webkit-transform: translateZ(0);
      }
      
      .trending-news-box > div {
        padding: 0.375rem 0.75rem;
        font-size: 0.75rem;
      }
    }
    
    @media (min-width: 768px) {
      .ticker-scroll-container {
        animation: ticker-scroll 60s linear infinite !important;
        will-change: transform;
        transform: translateZ(0);
        -webkit-transform: translateZ(0);
      }
    }
    
    /* Ensure animation plays even if reduced motion is enabled */
    @media (prefers-reduced-motion: no-preference) {
      .ticker-scroll-container {
        animation: ticker-scroll 60s linear infinite;
      }
    }
  `]
})
export class NewsTickerComponent implements OnInit, AfterViewInit {
  @ViewChild('tickerContainer') tickerContainer!: ElementRef<HTMLDivElement>;
  trendingNews: any[] = [];
  scrollingNews: any[] = [];
  loading = true;

  constructor(
    private newsService: NewsService,
    private languageService: LanguageService
  ) { }

  ngOnInit() {
    this.loadTrendingNews();
    // Subscribe to language changes
    this.languageService.currentLanguage$.subscribe(async () => {
      // Re-translate trending news titles when language changes
      if (this.trendingNews && this.trendingNews.length > 0) {
        await this.translateTrendingTitles();
        // Update scrolling news with translated titles
        this.scrollingNews = [...this.trendingNews, ...this.trendingNews];
        // Restart animation after content update
        setTimeout(() => this.ensureAnimation(), 100);
      }
    });
  }

  ngAfterViewInit() {
    // Ensure animation starts after view initialization
    setTimeout(() => this.ensureAnimation(), 500);
  }

  ensureAnimation() {
    if (this.tickerContainer?.nativeElement) {
      const element = this.tickerContainer.nativeElement;
      // Force reflow to restart animation
      const currentAnimation = window.getComputedStyle(element).animation;
      if (!currentAnimation || currentAnimation === 'none') {
        // Restart animation by removing and re-adding the class
        element.classList.remove('ticker-scroll-container');
        element.offsetHeight; // Trigger reflow
        element.classList.add('ticker-scroll-container');
        // Also set inline style as backup
        element.style.animation = 'ticker-scroll 60s linear infinite';
        element.style.willChange = 'transform';
      }
    }
  }

  getDisplayTitle(news: any): string {
    // If trending and trendingTitle exists, use it; otherwise use regular title
    if (news.isTrending && news.trendingTitle) {
      return news.trendingTitle;
    }
    return news.title || '';
  }

  async translateTrendingTitles() {
    if (!this.trendingNews || this.trendingNews.length === 0) return;
    
    // Translate titles in parallel - translate the display title (trendingTitle if available, otherwise title)
    await Promise.all(this.trendingNews.map(async (article) => {
      try {
        const titleToTranslate = this.getDisplayTitle(article);
        if (titleToTranslate) {
          const translatedTitle = await this.languageService.translateToCurrentLanguage(titleToTranslate);
          // Update the appropriate field based on what was displayed
          if (article.isTrending && article.trendingTitle) {
            article.trendingTitle = translatedTitle;
          } else {
            article.title = translatedTitle;
          }
        }
      } catch (error) {
        console.warn('Failed to translate trending title:', error);
      }
    }));
  }

  loadTrendingNews() {
    // Fetch trending news: Featured news first, then most recent breaking news, then recent news
    this.newsService.fetchTrendingNews(10).subscribe({
      next: async (news) => {
        if (news && news.length > 0) {
          console.log('[NewsTicker] Fetched', news.length, 'trending news items');
          // Log display titles (trendingTitle if available, otherwise title)
          console.log('[NewsTicker] News display titles:', news.map(n => this.getDisplayTitle(n)).slice(0, 5));
          // Log trending titles specifically
          const trendingWithCustomTitle = news.filter(n => n.isTrending && n.trendingTitle);
          if (trendingWithCustomTitle.length > 0) {
            console.log('[NewsTicker] News with custom trending titles:', trendingWithCustomTitle.map(n => ({
              id: n.id,
              title: n.title,
              trendingTitle: n.trendingTitle,
              displayTitle: this.getDisplayTitle(n)
            })));
          }
          this.trendingNews = news;
          // Translate titles after loading
          await this.translateTrendingTitles();
          // Duplicate for seamless scrolling
          this.scrollingNews = [...this.trendingNews, ...this.trendingNews];
          console.log('[NewsTicker] Total scrolling items:', this.scrollingNews.length);
          console.log('[NewsTicker] Scrolling news display titles:', this.scrollingNews.map(n => this.getDisplayTitle(n)).slice(0, 10));
          // Ensure animation starts after content is loaded
          setTimeout(() => this.ensureAnimation(), 100);
        } else {
          // Fallback to hardcoded if no news found
          this.trendingNews = [
            { id: 1, title: 'संचार साथी ऐप पर कांग्रेस का हमला: निजता बनाम निगरानी की जंग' },
            { id: 2, title: 'भू-भौ विवाद: रेणुका चौधरी की अजीबोगरीब प्रतीक्रिया' },
            { id: 3, title: 'विवाद के बाद सरकार ने बदला फैसला: संचार साथी ऐप अब वैकल्पिक' },
            { id: 4, title: 'राज्यसभा में \'लोक भवन\' पर हंगामा, डोला सेन ने साधा केंद्र पर निशाना' },
            { id: 5, title: 'Breaking: Major policy changes announced for digital infrastructure' }
          ];
          this.scrollingNews = [...this.trendingNews, ...this.trendingNews];
          // Ensure animation starts after fallback content is loaded
          setTimeout(() => this.ensureAnimation(), 100);
        }
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading trending news:', error);
        // Fallback to hardcoded on error
        this.trendingNews = [
          { id: 1, title: 'संचार साथी ऐप पर कांग्रेस का हमला: निजता बनाम निगरानी की जंग' },
          { id: 2, title: 'भू-भौ विवाद: रेणुका चौधरी की अजीबोगरीब प्रतीक्रिया' },
          { id: 3, title: 'विवाद के बाद सरकार ने बदला फैसला: संचार साथी ऐप अब वैकल्पिक' },
          { id: 4, title: 'राज्यसभा में \'लोक भवन\' पर हंगामा, डोला सेन ने साधा केंद्र पर निशाना' },
          { id: 5, title: 'Breaking: Major policy changes announced for digital infrastructure' }
        ];
        this.scrollingNews = [...this.trendingNews, ...this.trendingNews];
        // Ensure animation starts after error fallback content is loaded
        setTimeout(() => this.ensureAnimation(), 100);
        this.loading = false;
      }
    });
  }
}

