import { Component, OnInit, OnDestroy, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LanguageService } from '../../services/language.service';
import { AdService } from '../../services/ad.service';
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

      <!-- Ad 3 - After Weather Widget -->
      @if (isAdEnabled('ad3')) {
        <div class="mb-4 sm:mb-5 lg:mb-6 w-full min-h-[200px] sm:min-h-[250px] lg:min-h-[300px] rounded-lg overflow-hidden border-4 border-blue-500 dark:border-blue-400 shadow-lg">
          <a
            [href]="getAdLink('ad3') || 'javascript:void(0)'"
            [target]="getAdLink('ad3') ? '_blank' : '_self'"
            [rel]="getAdLink('ad3') ? 'noopener noreferrer' : ''"
            class="block w-full h-full cursor-pointer">
            @if (hasAdMedia('ad3')) {
              @if (getAdMediaType('ad3') === 'image') {
                <img
                  [src]="getAdMediaUrl('ad3')"
                  [alt]="getAdAltText('ad3')"
                  class="w-full h-full object-cover"
                />
              } @else if (getAdMediaType('ad3') === 'video') {
                <video
                  #ad3Video
                  [src]="getAdMediaUrl('ad3')"
                  autoplay
                  muted
                  loop
                  playsinline
                  preload="auto"
                  (canplay)="onAdVideoCanPlay('ad3', $event)"
                  (error)="onAdVideoError('ad3', $event)"
                  (loadeddata)="onAdVideoLoaded('ad3', $event)"
                  class="w-full h-full object-cover"
                ></video>
              }
            } @else {
              <div class="w-full h-full bg-white dark:bg-gray-800 flex items-center justify-center">
                <span class="text-purple-600 dark:text-purple-400 font-semibold text-base sm:text-lg">Ad 3</span>
              </div>
            }
          </a>
        </div>
      }

      <!-- Cricket Score Widget -->
      <div class="mb-4 sm:mb-5 lg:mb-6">
        <app-cricket-score-widget (dataLoaded)="onWidgetLoaded('cricket')" />
      </div>

      <!-- Ad 4 - After Cricket Widget -->
      @if (isAdEnabled('ad4')) {
        <div class="mb-4 sm:mb-5 lg:mb-6 w-full min-h-[200px] sm:min-h-[250px] lg:min-h-[300px] rounded-lg overflow-hidden border-4 border-blue-500 dark:border-blue-400 shadow-lg">
          <a
            [href]="getAdLink('ad4') || 'javascript:void(0)'"
            [target]="getAdLink('ad4') ? '_blank' : '_self'"
            [rel]="getAdLink('ad4') ? 'noopener noreferrer' : ''"
            class="block w-full h-full cursor-pointer">
            @if (hasAdMedia('ad4')) {
              @if (getAdMediaType('ad4') === 'image') {
                <img
                  [src]="getAdMediaUrl('ad4')"
                  [alt]="getAdAltText('ad4')"
                  class="w-full h-full object-cover"
                />
              } @else if (getAdMediaType('ad4') === 'video') {
                <video
                  #ad4Video
                  [src]="getAdMediaUrl('ad4')"
                  autoplay
                  muted
                  loop
                  playsinline
                  preload="auto"
                  (canplay)="onAdVideoCanPlay('ad4', $event)"
                  (error)="onAdVideoError('ad4', $event)"
                  (loadeddata)="onAdVideoLoaded('ad4', $event)"
                  class="w-full h-full object-cover"
                ></video>
              }
            } @else {
              <div class="w-full h-full bg-white dark:bg-gray-800 flex items-center justify-center">
                <span class="text-purple-600 dark:text-purple-400 font-semibold text-base sm:text-lg">Ad 4</span>
              </div>
            }
          </a>
        </div>
      }

      <!-- Panchang Widget -->
      <div class="mb-4 sm:mb-5 lg:mb-6">
        <app-panchang-widget (dataLoaded)="onWidgetLoaded('panchang')" />
      </div>

      <!-- Ad 5 - After Panchang Widget -->
      @if (isAdEnabled('ad5')) {
        <div class="mb-4 sm:mb-5 lg:mb-6 w-full min-h-[200px] sm:min-h-[250px] lg:min-h-[300px] rounded-lg overflow-hidden border-4 border-blue-500 dark:border-blue-400 shadow-lg">
          <a
            [href]="getAdLink('ad5') || 'javascript:void(0)'"
            [target]="getAdLink('ad5') ? '_blank' : '_self'"
            [rel]="getAdLink('ad5') ? 'noopener noreferrer' : ''"
            class="block w-full h-full cursor-pointer">
            @if (hasAdMedia('ad5')) {
              @if (getAdMediaType('ad5') === 'image') {
                <img
                  [src]="getAdMediaUrl('ad5')"
                  [alt]="getAdAltText('ad5')"
                  class="w-full h-full object-cover"
                />
              } @else if (getAdMediaType('ad5') === 'video') {
                <video
                  #ad5Video
                  [src]="getAdMediaUrl('ad5')"
                  autoplay
                  muted
                  loop
                  playsinline
                  preload="auto"
                  (canplay)="onAdVideoCanPlay('ad5', $event)"
                  (error)="onAdVideoError('ad5', $event)"
                  (loadeddata)="onAdVideoLoaded('ad5', $event)"
                  class="w-full h-full object-cover"
                ></video>
              }
            } @else {
              <div class="w-full h-full bg-white dark:bg-gray-800 flex items-center justify-center">
                <span class="text-purple-600 dark:text-purple-400 font-semibold text-base sm:text-lg">Ad 5</span>
              </div>
            }
          </a>
        </div>
      }

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
  private adSubscription?: Subscription;
  private loadedWidgets = new Set<string>();

  constructor(
    private languageService: LanguageService,
    private adService: AdService
  ) {}

  ngOnInit() {
    this.updateTranslations();
    
    // Subscribe to language changes
    this.languageSubscription = this.languageService.currentLanguage$.subscribe(() => {
      this.updateTranslations();
    });
  }

  ngOnDestroy() {
    this.languageSubscription?.unsubscribe();
    this.adSubscription?.unsubscribe();
  }

  isAdEnabled(adId: string): boolean {
    return this.adService.isAdEnabled(adId);
  }

  getAdMediaUrl(adId: string): string | null {
    return this.adService.getAdMediaUrl(adId);
  }

  getAdLink(adId: string): string | null {
    return this.adService.getAdLink(adId);
  }

  getAdAltText(adId: string): string {
    return this.adService.getAdAltText(adId);
  }

  getAdMediaType(adId: string): 'image' | 'video' | null {
    return this.adService.getAdMediaType(adId);
  }

  hasAdMedia(adId: string): boolean {
    return this.adService.hasAdMedia(adId);
  }

  onAdVideoCanPlay(adId: string, event: Event) {
    const video = event.target as HTMLVideoElement;
    if (video) {
      // Ensure video is muted for autoplay
      video.muted = true;
      // Try to play the video
      const playPromise = video.play();
      if (playPromise !== undefined) {
        playPromise.catch((error) => {
          console.warn(`[Sidebar] Autoplay prevented for ${adId}:`, error);
        });
      }
    }
  }

  onAdVideoLoaded(adId: string, event: Event) {
    const video = event.target as HTMLVideoElement;
    if (video) {
      // Ensure video is muted and try to play
      video.muted = true;
      video.play().catch((error) => {
        console.warn(`[Sidebar] Video play failed for ${adId}:`, error);
      });
    }
  }

  onAdVideoError(adId: string, event: Event) {
    const video = event.target as HTMLVideoElement;
    console.error(`[Sidebar] Video error for ${adId}:`, {
      error: video?.error,
      code: video?.error?.code,
      message: video?.error?.message,
      src: video?.src
    });
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

