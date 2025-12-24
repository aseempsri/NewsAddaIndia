import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LanguageService } from '../../services/language.service';
import { WeatherWidgetComponent } from '../weather-widget/weather-widget.component';
import { Subscription } from 'rxjs';

interface PopularArticle {
  rank: number;
  title: string;
  comments: number;
  shares: number;
}

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, WeatherWidgetComponent],
  template: `
    <aside class="space-y-8">
      <!-- Weather Widget -->
      <app-weather-widget />

      <!-- Popular Articles -->
      <div class="glass-card rounded-2xl p-6">
        <div class="flex items-center gap-2 mb-6">
          <svg class="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
          </svg>
          <h3 class="font-display text-lg font-semibold">{{ t.mostPopular }}</h3>
        </div>

        <div class="space-y-4">
          @for (article of popularArticles; track article.rank) {
            <article class="group flex gap-4 p-3 -mx-3 rounded-xl hover:bg-secondary/50 transition-colors cursor-pointer">
              <div class="shrink-0">
                <span class="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center font-display font-bold text-sm text-primary-foreground">
                  {{ article.rank }}
                </span>
              </div>
              <div class="flex-1 min-w-0">
                <h4 class="text-sm font-medium leading-tight group-hover:text-primary transition-colors line-clamp-2">
                  {{ article.title }}
                </h4>
                <div class="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                  <span class="flex items-center gap-1">
                    <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                    </svg>
                    {{ article.comments }}
                  </span>
                  <span class="flex items-center gap-1">
                    <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                    </svg>
                    {{ article.shares }}
                  </span>
                </div>
              </div>
            </article>
          }
        </div>
      </div>

      <!-- Subscribe Card -->
      <div class="relative overflow-hidden rounded-2xl p-6 bg-gradient-to-br from-primary/20 via-primary/10 to-accent/20 border border-primary/30">
        <div class="absolute top-0 right-0 w-32 h-32 bg-primary/20 rounded-full blur-2xl"></div>
        <div class="relative">
          <h3 class="font-display text-xl font-bold mb-2">
            {{ t.stayInformed }}
          </h3>
          <p class="text-sm text-muted-foreground mb-4">
            {{ t.subscribeDescription }}
          </p>
          <input
            type="email"
            [placeholder]="t.enterYourEmail"
            class="w-full px-4 py-3 rounded-lg bg-background/50 border border-border/50 text-sm placeholder:text-muted-foreground focus:outline-none focus:border-primary/50 mb-3" />
          <button class="w-full py-3 rounded-xl bg-primary text-primary-foreground font-semibold hover:bg-primary/90 transition-colors glow-primary">
            {{ t.subscribeNow }}
          </button>
        </div>
      </div>
    </aside>
  `,
  styles: []
})
export class SidebarComponent implements OnInit, OnDestroy {
  t: any = {};
  private languageSubscription?: Subscription;
  popularArticles: PopularArticle[] = [
    {
      rank: 1,
      title: 'Government Announces New Digital Infrastructure Plans',
      comments: 234,
      shares: 89,
    },
    {
      rank: 2,
      title: 'Economic Growth Exceeds Expectations in Q3',
      comments: 187,
      shares: 67,
    },
    {
      rank: 3,
      title: 'Technology Startups See Record Investment in 2025',
      comments: 156,
      shares: 54,
    },
    {
      rank: 4,
      title: 'Healthcare Reforms: What Changes Are Coming',
      comments: 143,
      shares: 48,
    },
    {
      rank: 5,
      title: 'Education Policy Updates for New Academic Year',
      comments: 98,
      shares: 32,
    },
  ];

  constructor(private languageService: LanguageService) {}

  ngOnInit() {
    this.updateTranslations();
    
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
}

