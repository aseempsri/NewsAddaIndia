import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LanguageService } from '../../services/language.service';
import { WeatherWidgetComponent } from '../weather-widget/weather-widget.component';
import { CricketScoreWidgetComponent } from '../cricket-score-widget/cricket-score-widget.component';
import { PanchangWidgetComponent } from '../panchang-widget/panchang-widget.component';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, WeatherWidgetComponent, CricketScoreWidgetComponent, PanchangWidgetComponent],
  template: `
    <aside>
      <!-- Weather Widget -->
      <div class="mb-6">
        <app-weather-widget />
      </div>

      <!-- Cricket Score Widget -->
      <div class="mb-6">
        <app-cricket-score-widget />
      </div>

      <!-- Panchang Widget -->
      <div class="mb-6">
        <app-panchang-widget />
      </div>

      <!-- Subscribe Card -->
      <div class="relative overflow-hidden rounded-2xl p-6 bg-gradient-to-br from-primary/20 via-primary/10 to-accent/20 border border-primary/30">
        <div class="absolute top-0 right-0 w-32 h-32 bg-primary/20 rounded-full blur-2xl"></div>
        <div class="relative">
          <h3 class="font-display text-xl font-bold mb-2 leading-relaxed pt-2 pb-1">
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

