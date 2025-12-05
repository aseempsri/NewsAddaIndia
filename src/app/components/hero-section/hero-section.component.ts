import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ButtonComponent } from '../../ui/button/button.component';

interface SideNews {
  category: string;
  title: string;
  image: string;
}

@Component({
  selector: 'app-hero-section',
  standalone: true,
  imports: [CommonModule, ButtonComponent],
  template: `
    <section class="relative py-8 lg:py-12">
      <!-- Background Glow -->
      <div class="absolute top-0 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl pointer-events-none"></div>
      <div class="absolute bottom-0 right-1/4 w-96 h-96 bg-accent/10 rounded-full blur-3xl pointer-events-none"></div>

      <div class="container mx-auto px-4 relative">
        <div class="grid lg:grid-cols-3 gap-6">
          <!-- Main Featured Article -->
          <div class="lg:col-span-2">
            <article class="news-card group h-full">
              <div class="relative aspect-[16/10] lg:aspect-[16/9] overflow-hidden rounded-t-xl">
                <img
                  [src]="featuredNews.image"
                  [alt]="featuredNews.title"
                  class="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
                <div class="absolute inset-0 bg-gradient-to-t from-background via-background/50 to-transparent"></div>
                
                <!-- Content Overlay -->
                <div class="absolute bottom-0 left-0 right-0 p-6 lg:p-8">
                  <span class="category-badge text-primary-foreground mb-4 inline-block">
                    {{ featuredNews.category }}
                  </span>
                  <h2 class="font-display text-2xl lg:text-4xl font-bold leading-tight mb-3 text-foreground">
                    {{ featuredNews.titleEn }}
                  </h2>
                  <p class="text-muted-foreground text-sm lg:text-base mb-4 line-clamp-2">
                    {{ featuredNews.excerpt }}
                  </p>
                  <div class="flex items-center gap-4 text-sm text-muted-foreground">
                    <span class="flex items-center gap-1.5">
                      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                      {{ featuredNews.author }}
                    </span>
                    <span class="flex items-center gap-1.5">
                      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      {{ featuredNews.date }}
                    </span>
                  </div>
                </div>
              </div>

              <div class="p-4 lg:p-6 border-t border-border/30">
                <app-button variant="ghost" class="group/btn text-primary hover:text-primary">
                  Read Full Story
                  <svg class="w-4 h-4 ml-2 transition-transform group-hover/btn:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                  </svg>
                </app-button>
              </div>
            </article>
          </div>

          <!-- Side Articles -->
          <div class="flex flex-col gap-6">
            @for (news of sideNews; track $index; let i = $index) {
              <article
                class="news-card group flex-1"
                [style.animation-delay]="i * 100 + 'ms'">
                <div class="relative aspect-[16/10] overflow-hidden rounded-t-xl">
                  <img
                    [src]="news.image"
                    [alt]="news.title"
                    class="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
                  <div class="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-transparent"></div>
                  
                  <div class="absolute bottom-0 left-0 right-0 p-4">
                    <span class="category-badge text-primary-foreground text-xs mb-2 inline-block">
                      {{ news.category }}
                    </span>
                    <h3 class="font-display text-lg font-semibold leading-tight text-foreground line-clamp-2">
                      {{ news.title }}
                    </h3>
                  </div>
                </div>

                <div class="p-4 flex items-center justify-between border-t border-border/30">
                  <span class="text-xs text-muted-foreground">2 hours ago</span>
                  <svg class="w-4 h-4 text-primary opacity-0 group-hover:opacity-100 transition-opacity" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                  </svg>
                </div>
              </article>
            }
          </div>
        </div>
      </div>
    </section>
  `,
  styles: []
})
export class HeroSectionComponent {
  featuredNews = {
    category: 'National',
    title: 'Putin Visits India: Strengthening Bilateral Ties and Trade Relations',
    titleEn: 'Putin Visits India: Strengthening Bilateral Ties and Trade Relations',
    excerpt: 'Russian President Vladimir Putin arrives in New Delhi for a two-day state visit, marking his first trip to India since the Ukraine conflict. Discussions focus on strengthening trade, economic ties, and finalizing a five-year partnership plan.',
    author: 'News Adda India',
    date: new Date().toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' }),
    image: '/assets/videos/Putin_in_India_.webp',
  };

  sideNews: SideNews[] = [
    {
      category: 'Sports',
      title: 'India Wins Thrilling T20 Series 3-2 Against New Zealand',
      image: '/assets/videos/indianz.avif',
    },
    {
      category: 'Business',
      title: 'RBI Cuts Repo Rate by 25 Basis Points to 5.25%',
      image: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=600&q=80',
    },
  ];
}

