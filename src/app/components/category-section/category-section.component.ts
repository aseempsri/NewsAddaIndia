import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NewsService } from '../../services/news.service';

interface Article {
  title: string;
  image: string;
  time: string;
  hasVideo?: boolean;
}

interface Category {
  title: string;
  accentColor: string;
  articles: Article[];
}

@Component({
  selector: 'app-category-section',
  standalone: true,
  imports: [CommonModule],
  template: `
    <section class="py-12 lg:py-16 bg-gradient-to-b from-transparent via-secondary/30 to-transparent">
      <div class="container mx-auto px-4">
        <div class="grid lg:grid-cols-2 gap-8 lg:gap-12">
          @for (category of categories; track category.title) {
            <div>
              <!-- Category Header -->
              <div class="flex items-center justify-between mb-6">
                <div class="flex items-center gap-3">
                  <div [class]="'w-1 h-8 rounded-full bg-gradient-to-b ' + category.accentColor"></div>
                  <h2 class="font-display text-xl lg:text-2xl font-bold">
                    {{ category.title }}
                  </h2>
                </div>
                <a
                  href="#"
                  class="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors">
                  More
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                  </svg>
                </a>
              </div>

              <!-- Articles -->
              <div class="space-y-4">
                <!-- Featured Article -->
                <article class="news-card group">
                  <div class="relative aspect-video overflow-hidden rounded-t-xl">
                    <img
                      [src]="category.articles[0].image"
                      [alt]="category.articles[0].title"
                      class="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
                    @if (category.articles[0].hasVideo) {
                      <div class="absolute inset-0 flex items-center justify-center">
                        <div class="w-14 h-14 rounded-full bg-primary/90 flex items-center justify-center backdrop-blur-sm group-hover:scale-110 transition-transform cursor-pointer">
                          <svg class="w-6 h-6 text-primary-foreground ml-1" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M8 5v14l11-7z" />
                          </svg>
                        </div>
                      </div>
                    }
                    <div class="absolute inset-0 bg-gradient-to-t from-background/80 to-transparent"></div>
                  </div>
                  <div class="p-4">
                    <h3 class="font-display text-lg font-semibold leading-tight group-hover:text-primary transition-colors">
                      {{ category.articles[0].title }}
                    </h3>
                    <span class="text-xs text-muted-foreground mt-2 inline-block">
                      {{ category.articles[0].time }}
                    </span>
                  </div>
                </article>

                <!-- List Articles -->
                @for (article of category.articles.slice(1); track $index) {
                  <article class="group flex gap-4 p-3 rounded-xl hover:bg-secondary/50 transition-colors cursor-pointer">
                    <div class="relative w-24 h-20 rounded-lg overflow-hidden shrink-0">
                      <img
                        [src]="article.image"
                        [alt]="article.title"
                        class="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                    </div>
                    <div class="flex-1 min-w-0">
                      <h4 class="font-medium text-sm leading-tight group-hover:text-primary transition-colors line-clamp-2">
                        {{ article.title }}
                      </h4>
                      <span class="text-xs text-muted-foreground mt-1.5 inline-block">
                        {{ article.time }}
                      </span>
                    </div>
                  </article>
                }
              </div>
            </div>
          }
        </div>
      </div>
    </section>
  `,
  styles: []
})
export class CategorySectionComponent implements OnInit {
  categories: Category[] = [
    {
      title: 'Entertainment',
      accentColor: 'from-pink-500 to-rose-500',
      articles: [],
    },
    {
      title: 'Sports',
      accentColor: 'from-orange-500 to-amber-500',
      articles: [],
    },
  ];

  isLoading = true;

  constructor(private newsService: NewsService) { }

  ngOnInit() {
    this.loadCategoryNews();
  }

  loadCategoryNews() {
    // Load Entertainment news
    this.newsService.fetchNewsByCategory('Entertainment', 4).subscribe({
      next: (news) => {
        this.categories[0].articles = news.map((n, index) => ({
          title: n.title,
          image: n.image,
          time: n.time,
          hasVideo: index === 0
        }));
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading Entertainment news:', error);
        this.isLoading = false;
      }
    });

    // Load Sports news
    this.newsService.fetchNewsByCategory('Sports', 4).subscribe({
      next: (news) => {
        this.categories[1].articles = news.map((n, index) => ({
          title: n.title,
          image: n.image,
          time: n.time,
          hasVideo: index === 0
        }));
      },
      error: (error) => {
        console.error('Error loading Sports news:', error);
      }
    });
  }
}

