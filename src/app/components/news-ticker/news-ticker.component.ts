import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-news-ticker',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="bg-gradient-to-r from-primary/20 via-transparent to-accent/20 border-y border-border/30 overflow-hidden">
      <div class="container mx-auto px-4">
        <div class="flex items-center py-3">
          <!-- Label -->
          <div class="flex items-center gap-2 pr-4 border-r border-border/50 shrink-0">
            <svg class="w-4 h-4 text-primary animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            <span class="text-sm font-semibold text-primary uppercase tracking-wider">
              Trending
            </span>
          </div>

          <!-- Scrolling News -->
          <div class="overflow-hidden flex-1 ml-4">
            <div class="ticker-scroll flex gap-12 whitespace-nowrap">
              @for (news of scrollingNews; track $index) {
                <a
                  href="#"
                  class="text-sm text-muted-foreground hover:text-foreground transition-colors inline-flex items-center gap-2">
                  <span class="w-1.5 h-1.5 rounded-full bg-accent shrink-0"></span>
                  {{ news }}
                </a>
              }
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: []
})
export class NewsTickerComponent {
  trendingNews = [
    'संचार साथी ऐप पर कांग्रेस का हमला: निजता बनाम निगरानी की जंग',
    'भू-भौ विवाद: रेणुका चौधरी की अजीबोगरीब प्रतीक्रिया',
    'विवाद के बाद सरकार ने बदला फैसला: संचार साथी ऐप अब वैकल्पिक',
    'राज्यसभा में \'लोक भवन\' पर हंगामा, डोला सेन ने साधा केंद्र पर निशाना',
    'Breaking: Major policy changes announced for digital infrastructure',
  ];

  scrollingNews = [...this.trendingNews, ...this.trendingNews];
}

