import { Component, OnInit, OnDestroy, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LanguageService } from '../../services/language.service';
import { WeatherWidgetComponent } from '../weather-widget/weather-widget.component';
import { CricketScoreWidgetComponent } from '../cricket-score-widget/cricket-score-widget.component';
import { PanchangWidgetComponent } from '../panchang-widget/panchang-widget.component';
import { SidebarAdSlotComponent } from './sidebar-ad-slot.component';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [
    CommonModule,
    WeatherWidgetComponent,
    CricketScoreWidgetComponent,
    PanchangWidgetComponent,
    SidebarAdSlotComponent
  ],
  template: `
    <aside>
      <app-sidebar-ad-slot adId="home-ad1" label="Ad 1" />

      <div class="mb-4 sm:mb-5 lg:mb-6">
        <app-weather-widget (dataLoaded)="onWidgetLoaded('weather')" />
      </div>

      <app-sidebar-ad-slot adId="home-ad2" label="Ad 2" />

      <div class="mb-4 sm:mb-5 lg:mb-6">
        <app-cricket-score-widget (dataLoaded)="onWidgetLoaded('cricket')" />
      </div>

      <app-sidebar-ad-slot adId="home-ad3" label="Ad 3" />

      <div class="mb-4 sm:mb-5 lg:mb-6">
        <app-panchang-widget (dataLoaded)="onWidgetLoaded('panchang')" />
      </div>

      <app-sidebar-ad-slot adId="home-ad4" label="Ad 4" />
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
    if (this.loadedWidgets.size === 3) {
      this.widgetsLoaded.emit(true);
    }
  }
}
