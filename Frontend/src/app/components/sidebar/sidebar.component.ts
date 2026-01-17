import { Component, OnInit, OnDestroy, Output, EventEmitter } from '@angular/core';
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
      <div class="mb-4 sm:mb-5 lg:mb-6">
        <app-weather-widget (dataLoaded)="onWidgetLoaded('weather')" />
      </div>

      <!-- Cricket Score Widget -->
      <div class="mb-4 sm:mb-5 lg:mb-6">
        <app-cricket-score-widget (dataLoaded)="onWidgetLoaded('cricket')" />
      </div>

      <!-- Panchang Widget -->
      <div class="mb-4 sm:mb-5 lg:mb-6">
        <app-panchang-widget (dataLoaded)="onWidgetLoaded('panchang')" />
      </div>

      <!-- Subscribe Card - Desktop only (hidden on mobile, shown before footer) -->
      <div class="hidden lg:block mb-0">
        <div class="relative overflow-hidden rounded-xl sm:rounded-2xl p-2.5 sm:p-4 lg:p-6 bg-gradient-to-br from-primary/20 via-primary/10 to-accent/20 border border-primary/30">
          <div class="absolute top-0 right-0 w-20 h-20 sm:w-28 sm:h-28 lg:w-32 lg:h-32 bg-primary/20 rounded-full blur-2xl"></div>
          <div class="relative">
            <h3 class="font-display text-sm sm:text-lg lg:text-xl font-bold mb-1 sm:mb-2 leading-relaxed pt-0.5 sm:pt-2 pb-0.5 sm:pb-1">
              {{ t.stayInformed }}
            </h3>
            <p class="text-[0.65rem] sm:text-sm text-muted-foreground mb-2 sm:mb-4">
              {{ t.subscribeDescription }}
            </p>
            <input
              type="email"
              [placeholder]="t.enterYourEmail"
              class="w-full px-2.5 sm:px-4 py-1.5 sm:py-2.5 lg:py-3 rounded-lg bg-background/50 border border-border/50 text-[0.65rem] sm:text-sm placeholder:text-muted-foreground focus:outline-none focus:border-primary/50 mb-1.5 sm:mb-3" />
            <button class="w-full py-1.5 sm:py-2.5 lg:py-3 rounded-lg sm:rounded-xl bg-primary text-primary-foreground text-[0.65rem] sm:text-sm lg:text-base font-semibold hover:bg-primary/90 transition-colors glow-primary">
              {{ t.subscribeNow }}
            </button>
          </div>
        </div>
      </div>
    </aside>
  `,
  styles: [`
    @media (max-width: 1024px) {
      :host {
        display: block !important;
        width: 100% !important;
        max-width: 100% !important;
        margin: 0 !important;
        padding: 0 !important;
        box-sizing: border-box !important;
      }
      aside {
        width: 100% !important;
        max-width: 100% !important;
        margin: 0 !important;
        padding: 0 !important;
        box-sizing: border-box !important;
      }
      aside > div {
        width: 100% !important;
        max-width: 100% !important;
        margin-left: 0 !important;
        margin-right: 0 !important;
        box-sizing: border-box !important;
      }
    }
    @media (max-width: 640px) {
      aside > div {
        margin-bottom: 0.75rem !important;
      }
      aside .glass-card {
        width: 100% !important;
        max-width: 100% !important;
      }
    }
  `]
})
export class SidebarComponent implements OnInit, OnDestroy {
  @Output() widgetsLoaded = new EventEmitter<boolean>();
  t: any = {};
  private languageSubscription?: Subscription;
  private loadedWidgets = new Set<string>();

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

  onWidgetLoaded(widgetName: string) {
    this.loadedWidgets.add(widgetName);
    // Emit when all 3 widgets are loaded
    if (this.loadedWidgets.size === 3) {
      this.widgetsLoaded.emit(true);
    }
  }
}

