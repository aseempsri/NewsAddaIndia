import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { NewsService } from '../../services/news.service';
import { LanguageService } from '../../services/language.service';

@Component({
  selector: 'app-news-ticker',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="bg-gradient-to-r from-purple-600/30 via-pink-500/20 to-orange-500/30 border-y-2 border-purple-500/50 overflow-hidden w-full max-w-full shadow-lg">
      <div class="w-full max-w-full overflow-hidden">
        <div class="flex items-center py-2 md:py-3 overflow-hidden">
          <!-- Label - 20% width on mobile, auto on desktop, touches left edge on mobile -->
          <div class="flex items-center justify-center gap-0.5 md:gap-2 border-r-2 border-purple-400/60 shrink-0 bg-gradient-to-r from-purple-600 via-pink-500 to-fuchsia-600 pl-1 md:pl-5 pr-1.5 md:pr-6 py-1.5 md:py-2.5 rounded-r-lg md:rounded-r-xl shadow-xl w-[20%] md:w-auto overflow-hidden">
            <!-- Lightning Bolt Icon -->
            <svg class="w-2.5 h-2.5 md:w-5 md:h-5 text-white drop-shadow-lg flex-shrink-0" fill="currentColor" viewBox="0 0 24 24" style="filter: drop-shadow(0 1px 2px rgba(0,0,0,0.4));">
              <path d="M13 10V3L4 14h7v7l9-11h-7z"/>
            </svg>
            <!-- Fire Emoji -->
            <span class="text-[9px] md:text-lg leading-none flex-shrink-0 inline-block">🔥</span>
            <!-- TRENDING Text -->
            <span class="text-[9px] md:text-sm font-black text-white uppercase whitespace-nowrap drop-shadow-lg flex-shrink-0" style="font-family: 'Arial Black', 'Helvetica Neue', sans-serif; letter-spacing: 0.04em; text-shadow: 1px 1px 2px rgba(0,0,0,0.5);">
              TRENDING
            </span>
          </div>

          <!-- Scrolling News - 80% width on mobile -->
          <div class="overflow-hidden flex-1 min-w-0 py-1 md:py-1 ml-2 md:ml-4 pr-4 md:pr-0 w-[80%] md:w-auto">
            @if (loading) {
              <div class="text-sm md:text-sm text-purple-600 font-semibold">Loading trending news...</div>
            } @else if (scrollingNews.length === 0) {
              <div class="text-sm md:text-sm text-purple-600 font-semibold">No trending news available</div>
            } @else {
              <div class="ticker-scroll-container flex gap-4 md:gap-12 whitespace-nowrap items-center" style="will-change: transform; width: max-content;">
                @for (news of scrollingNews; track $index) {
                  <a
                    [routerLink]="['/news', news.id]"
                    class="text-sm md:text-base font-semibold md:font-bold dark:font-normal text-purple-700 dark:text-purple-300 hover:text-pink-600 dark:hover:text-pink-400 transition-all duration-300 inline-flex items-center gap-2 md:gap-3 hover:scale-105 py-0.5 md:py-1 flex-shrink-0" style="text-shadow: 1px 1px 2px rgba(255,255,255,0.8); line-height: 1.5; max-width: none;">
                    <svg class="w-2.5 h-2.5 md:w-3 md:h-3 text-pink-500 shrink-0 animate-pulse" fill="currentColor" viewBox="0 0 24 24" style="filter: drop-shadow(0 1px 2px rgba(236,72,153,0.5));">
                      <circle cx="12" cy="12" r="3"/>
                    </svg>
                    <span class="font-semibold md:font-extrabold dark:font-normal leading-tight whitespace-nowrap" style="font-family: 'Arial', 'Helvetica Neue', sans-serif; line-height: 1.5; display: inline-block;">{{ news.title }}</span>
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
      animation: ticker-scroll 60s linear infinite;
      will-change: transform;
      backface-visibility: hidden;
      perspective: 1000px;
      -webkit-font-smoothing: antialiased;
    }
    @keyframes ticker-scroll {
      0% {
        transform: translateX(0);
      }
      100% {
        transform: translateX(-50%);
      }
    }
    /* Force hardware acceleration and ensure animation works */
    @media (max-width: 767px) {
      .ticker-scroll-container {
        animation: ticker-scroll 60s linear infinite !important;
        will-change: transform;
      }
    }
    @media (min-width: 768px) {
      .ticker-scroll-container {
        animation: ticker-scroll 60s linear infinite !important;
        will-change: transform;
      }
    }
  `]
})
export class NewsTickerComponent implements OnInit {
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
      }
    });
  }

  async translateTrendingTitles() {
    if (!this.trendingNews || this.trendingNews.length === 0) return;
    
    // Translate titles in parallel
    await Promise.all(this.trendingNews.map(async (article) => {
      try {
        if (article.title) {
          article.title = await this.languageService.translateToCurrentLanguage(article.title);
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
          console.log('[NewsTicker] News titles:', news.map(n => n.title).slice(0, 5));
          this.trendingNews = news;
          // Translate titles after loading
          await this.translateTrendingTitles();
          // Duplicate for seamless scrolling
          this.scrollingNews = [...this.trendingNews, ...this.trendingNews];
          console.log('[NewsTicker] Total scrolling items:', this.scrollingNews.length);
          console.log('[NewsTicker] Scrolling news titles:', this.scrollingNews.map(n => n.title).slice(0, 10));
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
        this.loading = false;
      }
    });
  }
}

