import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

interface NewsItem {
  id: number;
  category: string;
  title: string;
  excerpt: string;
  image: string;
  time: string;
}

@Component({
  selector: 'app-news-grid',
  standalone: true,
  imports: [CommonModule],
  template: `
    <section class="py-12 lg:py-16">
      <div class="container mx-auto px-4">
        <!-- Section Header -->
        <div class="flex items-center justify-between mb-8">
          <div>
            <h2 class="font-display text-2xl lg:text-3xl font-bold">
              Latest <span class="gradient-text">Stories</span>
            </h2>
            <p class="text-muted-foreground mt-1">Stay updated with the latest news</p>
          </div>
          <a
            href="#"
            class="hidden sm:flex items-center gap-2 text-primary hover:text-primary/80 transition-colors font-medium">
            View All
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14 5l7 7m0 0l-7 7m7-7H3" />
            </svg>
          </a>
        </div>

        <!-- News Grid -->
        <div class="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          @for (news of newsItems; track news.id; let i = $index) {
            <article
              class="news-card group opacity-0 animate-fade-in"
              [style.animation-delay]="i * 100 + 'ms'">
              <div class="relative aspect-[16/10] overflow-hidden rounded-t-xl">
                <img
                  [src]="news.image"
                  [alt]="news.title"
                  class="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                <div class="absolute top-4 left-4">
                  <span [class]="'px-3 py-1 text-xs font-semibold rounded-full ' + getCategoryColor(news.category)">
                    {{ news.category }}
                  </span>
                </div>
              </div>

              <div class="p-5">
                <h3 class="font-display text-lg font-semibold leading-tight mb-2 group-hover:text-primary transition-colors line-clamp-2">
                  {{ news.title }}
                </h3>
                <p class="text-muted-foreground text-sm line-clamp-2 mb-4">
                  {{ news.excerpt }}
                </p>
                <div class="flex items-center justify-between">
                  <span class="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    {{ news.time }}
                  </span>
                  <svg class="w-4 h-4 text-primary opacity-0 group-hover:opacity-100 transition-all transform group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                  </svg>
                </div>
              </div>
            </article>
          }
        </div>

        <!-- Mobile View All -->
        <div class="sm:hidden mt-8 text-center">
          <a
            href="#"
            class="inline-flex items-center gap-2 text-primary hover:text-primary/80 transition-colors font-medium">
            View All Stories
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14 5l7 7m0 0l-7 7m7-7H3" />
            </svg>
          </a>
        </div>
      </div>
    </section>
  `,
  styles: []
})
export class NewsGridComponent {
  newsItems: NewsItem[] = [
    {
      id: 1,
      category: 'National',
      title: 'Putin\'s India Visit: Five-Year Partnership Plan Finalized',
      excerpt: 'Russian President Vladimir Putin and PM Modi discuss strengthening trade and economic ties, finalizing a comprehensive five-year partnership plan during the state visit.',
      image: 'assets/videos/Putin_in_India_.webp',
      time: '2 hours ago',
    },
    {
      id: 2,
      category: 'Sports',
      title: 'India Secures 3-2 T20 Series Victory Against New Zealand',
      excerpt: 'Thrilling cricket action as India wins the T20 series with standout performances from emerging players in the final match.',
      image: 'assets/videos/indianz.avif',
      time: '3 hours ago',
    },
    {
      id: 3,
      category: 'Business',
      title: 'RBI Reduces Repo Rate to 5.25% Citing Low Inflation',
      excerpt: 'Reserve Bank of India cuts repo rate by 25 basis points, citing low inflation and strong economic growth indicators.',
      image: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=600&q=80',
      time: '4 hours ago',
    },
    {
      id: 4,
      category: 'Entertainment',
      title: 'Real Kashmir Football Club Series Premieres on SonyLIV',
      excerpt: 'New sports drama series inspired by the real-life story of the football club from Jammu and Kashmir set to premiere on December 9.',
      image: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=600&q=80',
      time: '5 hours ago',
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
      id: 6,
      category: 'Entertainment',
      title: 'Netflix Releases India vs Pakistan Cricket Documentary',
      excerpt: 'Three-part documentary series exploring the cricketing rivalry between India and Pakistan, featuring archived match footage and player interviews.',
      image: 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=600&q=80',
      time: '7 hours ago',
    },
  ];

  categoryColors: Record<string, string> = {
    Health: 'bg-green-500/20 text-green-400',
    Sports: 'bg-orange-500/20 text-orange-400',
    Business: 'bg-blue-500/20 text-blue-400',
    Entertainment: 'bg-pink-500/20 text-pink-400',
    International: 'bg-purple-500/20 text-purple-400',
    Technology: 'bg-cyan-500/20 text-cyan-400',
  };

  getCategoryColor(category: string): string {
    return this.categoryColors[category] || 'bg-primary/20 text-primary';
  }
}

