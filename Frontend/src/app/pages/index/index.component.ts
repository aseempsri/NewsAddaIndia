import { Component, OnInit, HostListener, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HeaderComponent } from '../../components/header/header.component';
import { ThemeService, Theme } from '../../services/theme.service';
import { LanguageService, Language } from '../../services/language.service';
import { PushNotificationService } from '../../services/push-notification.service';
import { ScrollRestorationService } from '../../services/scroll-restoration.service';
import { DisplayedNewsService } from '../../services/displayed-news.service';
import { AdService } from '../../services/ad.service';
import { HttpClient } from '@angular/common/http';
import { Subscription } from 'rxjs';
import { VideoBannerComponent } from '../../components/video-banner/video-banner.component';
import { NewsTickerComponent } from '../../components/news-ticker/news-ticker.component';
import { ShareMarketTickerComponent } from '../../components/share-market-ticker/share-market-ticker.component';
import { HeroSectionComponent } from '../../components/hero-section/hero-section.component';
import { NewsGridComponent } from '../../components/news-grid/news-grid.component';
import { CategorySectionComponent } from '../../components/category-section/category-section.component';
import { SidebarComponent } from '../../components/sidebar/sidebar.component';
import { FooterComponent } from '../../components/footer/footer.component';
import { environment } from '../../../environments/environment';
import { catchError } from 'rxjs/operators';
import { of } from 'rxjs';
import { Router, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';

@Component({
  selector: 'app-index',
  standalone: true,
  imports: [
    CommonModule,
    HeaderComponent,
    VideoBannerComponent,
    NewsTickerComponent,
    ShareMarketTickerComponent,
    HeroSectionComponent,
    NewsGridComponent,
    CategorySectionComponent,
    SidebarComponent,
    FooterComponent
  ],
  template: `
    <div class="min-h-screen bg-background overflow-x-hidden w-full max-w-full">
      <app-header />
      <!-- Spacer for fixed header on desktop - accounts for navigation bar (~64px, reduced by 20%) + top bar (~32px, reduced by 20%) = ~96px -->
      <div class="lg:h-[96px]"></div>
      
      <!-- Video Banner with Ad Spaces (Desktop Only) -->
      <div class="hidden lg:flex lg:items-center lg:justify-center lg:gap-6 lg:px-4 lg:relative">
        <!-- Ad 1 - Left Side -->
        @if (isAdEnabled('ad1')) {
          <a
            [href]="getAdLink('ad1') || 'javascript:void(0)'"
            [target]="getAdLink('ad1') ? '_blank' : '_self'"
            [rel]="getAdLink('ad1') ? 'noopener noreferrer' : ''"
            class="flex-shrink-0 w-[300px] h-[400px] rounded-lg overflow-hidden border-4 border-blue-500 dark:border-blue-400 shadow-lg cursor-pointer">
            @if (hasAdMedia('ad1')) {
              @if (getAdMediaType('ad1') === 'image') {
                <img
                  [src]="getAdMediaUrl('ad1')"
                  [alt]="getAdAltText('ad1')"
                  class="w-full h-full object-cover"
                />
              } @else if (getAdMediaType('ad1') === 'video') {
                <video
                  #ad1Video
                  [src]="getAdMediaUrl('ad1')"
                  autoplay
                  muted
                  loop
                  playsinline
                  preload="auto"
                  (canplay)="onAdVideoCanPlay('ad1', $event)"
                  (error)="onAdVideoError('ad1', $event)"
                  (loadeddata)="onAdVideoLoaded('ad1', $event)"
                  class="w-full h-full object-cover"
                ></video>
              }
            } @else {
              <div class="w-full h-full bg-white dark:bg-gray-800 flex items-center justify-center">
                <span class="text-purple-600 dark:text-purple-400 font-semibold text-lg">Ad 1</span>
              </div>
            }
          </a>
        }
        
        <!-- Video Banner (Original Size Preserved - No wrapper constraints) -->
        <app-video-banner [imagesLoaded]="true" />
        
        <!-- Ad 2 - Right Side -->
        @if (isAdEnabled('ad2')) {
          <a
            [href]="getAdLink('ad2') || 'javascript:void(0)'"
            [target]="getAdLink('ad2') ? '_blank' : '_self'"
            [rel]="getAdLink('ad2') ? 'noopener noreferrer' : ''"
            class="flex-shrink-0 w-[300px] h-[400px] rounded-lg overflow-hidden border-4 border-blue-500 dark:border-blue-400 shadow-lg cursor-pointer">
            @if (hasAdMedia('ad2')) {
              @if (getAdMediaType('ad2') === 'image') {
                <img
                  [src]="getAdMediaUrl('ad2')"
                  [alt]="getAdAltText('ad2')"
                  class="w-full h-full object-cover"
                />
              } @else if (getAdMediaType('ad2') === 'video') {
                <video
                  #ad2Video
                  [src]="getAdMediaUrl('ad2')"
                  autoplay
                  muted
                  loop
                  playsinline
                  preload="auto"
                  (canplay)="onAdVideoCanPlay('ad2', $event)"
                  (error)="onAdVideoError('ad2', $event)"
                  (loadeddata)="onAdVideoLoaded('ad2', $event)"
                  class="w-full h-full object-cover"
                ></video>
              }
            } @else {
              <div class="w-full h-full bg-white dark:bg-gray-800 flex items-center justify-center">
                <span class="text-purple-600 dark:text-purple-400 font-semibold text-lg">Ad 2</span>
              </div>
            }
          </a>
        }
      </div>
      
      <!-- Video Banner (Mobile Only) -->
      <div class="lg:hidden">
        <app-video-banner [imagesLoaded]="true" />
      </div>
      
      <app-news-ticker />
      
      <app-share-market-ticker />
      
      <!-- Mobile Top Bar - Below News Ticker -->
      <div class="lg:hidden bg-secondary/50 backdrop-blur-md border-b border-border/50 w-full">
        <div class="container mx-auto px-3 py-1 flex items-center justify-between text-xs gap-2">
          <span class="flex items-center gap-1 text-muted-foreground shrink-0">
            <svg class="w-3 h-3 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span class="leading-tight">{{ mobileTopBarDate }}</span>
          </span>
          <div class="flex items-center gap-2 min-w-0">
            @if (pushSupported && pushSubscribed) {
              <span class="flex items-center gap-1 text-muted-foreground shrink-0">
                <svg class="w-3 h-3 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
                <span class="leading-tight">{{ getPushLabelSubscribed() }}</span>
              </span>
              <div class="w-px h-3 bg-border shrink-0"></div>
            }
            @if (mobileTopBarTemperature !== null) {
              <span class="text-muted-foreground shrink-0">{{ mobileTopBarTemperature }}°C</span>
              <div class="w-px h-3 bg-border shrink-0"></div>
            }
            <span class="text-accent font-medium leading-tight shrink-0">{{ getFormattedReaderCount() }}</span>
          </div>
        </div>
      </div>
      
      <main>
        <app-hero-section (imagesLoaded)="onHeroImagesLoaded()" (displayedReady)="onHeroDisplayedReady()" />
        
        <div class="container mx-auto px-2 sm:px-4 py-4 sm:py-6 lg:py-8 w-full max-w-full">
          <div class="grid lg:grid-cols-3 gap-3 sm:gap-6 lg:gap-12 w-full">
            <div class="lg:col-span-2 w-full min-w-0">
              <!-- CRITICAL: Latest Stories (6 items) must always come FIRST before Category Sections -->
              <!-- This ensures Latest Stories items are registered first and won't appear in Category Sections -->
              <app-news-grid [heroDisplayedReady]="heroDisplayedReady" (imagesLoaded)="onNewsGridImagesLoaded()" />
              <!-- Category Sections come AFTER Latest Stories to prevent duplicates -->
              <app-category-section (dataLoaded)="onCategorySectionLoaded()" />
            </div>
            <div class="order-first lg:order-last w-full min-w-0">
              <app-sidebar (widgetsLoaded)="onWidgetsLoaded()" />
            </div>
          </div>
        </div>
      </main>

      <app-footer />
      
      <!-- Scroll Indicator - Desktop Only -->
      @if (showScrollIndicator) {
        <div 
          class="hidden lg:flex fixed bottom-8 left-1/2 transform -translate-x-1/2 z-40 animate-bounce cursor-pointer"
          (click)="scrollToContent()"
          title="Scroll down to see more content">
          <div class="flex flex-col items-center gap-2 px-6 py-4 bg-[#1e293b] dark:bg-white backdrop-blur-md border border-[#1e293b]/20 dark:border-white/20 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 group">
            <span class="text-xs font-bold text-white dark:text-[#1e293b] uppercase tracking-wider">Scroll</span>
            <svg class="w-6 h-6 text-white dark:text-[#1e293b] animate-pulse group-hover:animate-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 14l-7 7m0 0l-7-7m7 7V3" />
            </svg>
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    @keyframes shimmer {
      0% {
        opacity: 0.3;
        transform: translateX(-100%);
      }
      50% {
        opacity: 0.6;
      }
      100% {
        opacity: 0.3;
        transform: translateX(100%);
      }
    }
    
    .animate-shimmer {
      animation: shimmer 3s ease-in-out infinite;
    }
    
    @keyframes border-glow {
      0%, 100% {
        background-position: 0% 50%;
      }
      50% {
        background-position: 100% 50%;
      }
    }
    
    @media (max-width: 768px) {
      .container {
        padding-left: 0.5rem !important;
        padding-right: 0.5rem !important;
        max-width: 100% !important;
        width: 100% !important;
        margin-left: 0 !important;
        margin-right: 0 !important;
      }
      main {
        width: 100% !important;
        max-width: 100% !important;
        overflow-x: hidden !important;
        padding: 0 !important;
        margin: 0 !important;
      }
      main > div {
        width: 100% !important;
        max-width: 100% !important;
        padding-left: 0.5rem !important;
        padding-right: 0.5rem !important;
      }
      main .grid {
        gap: 0.75rem !important;
        width: 100% !important;
        max-width: 100% !important;
      }
      main .grid > div {
        width: 100% !important;
        max-width: 100% !important;
        min-width: 0 !important;
        box-sizing: border-box !important;
      }
      .container {
        box-sizing: border-box !important;
      }
      main > div {
        box-sizing: border-box !important;
      }
      /* Stay Informed widget mobile styles - matching panchang font sizes */
      .stay-informed-mobile h3 {
        font-size: 1rem !important;
        line-height: 1.3 !important;
      }
      .stay-informed-mobile p {
        font-size: 1rem !important;
        line-height: 1.3 !important;
      }
      .stay-informed-mobile input {
        font-size: 1rem !important;
        line-height: 1.4 !important;
      }
      .stay-informed-mobile input::placeholder {
        font-size: 0.9375rem !important;
      }
      .stay-informed-mobile button {
        font-size: 1rem !important;
        line-height: 1.3 !important;
      }
    }
  `]
})
export class IndexComponent implements OnInit, OnDestroy {
  private static hasAppLoaded = false; // Static flag to track first app load across component instances
  isPageLoading = false;
  heroImagesLoaded = false;
  heroDisplayedReady = false;
  newsGridImagesLoaded = false;
  categorySectionLoaded = false;
  widgetsLoaded = false;
  showScrollIndicator = false;
  currentTheme: Theme = 'light';
  private themeSubscription?: Subscription;
  
  // Mobile Top Bar Data
  mobileTopBarDate = '';
  mobileTopBarLocation = '';
  mobileTopBarTemperature: number | null = null;
  mobileTopBarReaderCount = 4320;
  mobileTopBarReaders = '';
  pushSupported = false;
  pushSubscribed = false;
  // Same-origin when apiUrl is empty in production
  private apiUrl = (environment.apiUrl !== undefined && environment.apiUrl !== null && String(environment.apiUrl).trim() !== '')
    ? environment.apiUrl
    : (environment.production ? '' : 'http://localhost:3000');
  private languageSubscription?: Subscription;
  private weatherRefreshInterval: any;

  ad1Enabled = false;
  ad2Enabled = false;
  ad1MediaUrl: string | null = null;
  ad2MediaUrl: string | null = null;
  ad1MediaType: 'image' | 'video' | null = null;
  ad2MediaType: 'image' | 'video' | null = null;
  ad1Link: string | null = null;
  ad2Link: string | null = null;
  ad1AltText = 'Ad 1';
  ad2AltText = 'Ad 2';
  private adSubscription?: Subscription;

  constructor(
    private themeService: ThemeService,
    private languageService: LanguageService,
    private scrollRestorationService: ScrollRestorationService,
    private displayedNewsService: DisplayedNewsService,
    private router: Router,
    private http: HttpClient,
    private adService: AdService,
    private pushService: PushNotificationService,
    private cdr: ChangeDetectorRef
  ) {}

  private pushSubscription?: Subscription;

  ngOnInit() {
    // Show main content immediately (intro video removed)
    this.isPageLoading = false;
    if (!IndexComponent.hasAppLoaded) {
      IndexComponent.hasAppLoaded = true;
    }
    
    // Clear displayed news when entering home page to start fresh
    this.displayedNewsService.clear();
    this.heroDisplayedReady = false;
    
    // Subscribe to route changes to clear displayed news when leaving home page
    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe((event: any) => {
      const url = event.urlAfterRedirects || event.url;
      // Clear displayed news when navigating away from home page
      if (url !== '/' && url !== '/home' && !url.startsWith('/?')) {
        this.displayedNewsService.clear();
      }
    });
    
    // IMPORTANT: Don't restore scroll position here if we're just initializing
    // Only restore if we're returning from another route
    // The scroll restoration service handles this automatically via NavigationEnd events
    
    // Check if we have a saved scroll position for this route
    const savedPosition = this.scrollRestorationService.getScrollPosition('/');
    
    // Only restore if we have a saved position (meaning we're returning, not first load)
    if (savedPosition > 0) {
      console.log('[IndexComponent] Restoring saved scroll position:', savedPosition);
      
      // Immediate restore attempt
      requestAnimationFrame(() => {
        this.scrollRestorationService.restoreScrollPosition('/');
        this.checkScrollPosition();
      });
      
      // Restore after short delay
      setTimeout(() => {
        this.scrollRestorationService.restoreScrollPosition('/');
        this.checkScrollPosition();
      }, 100);
      
      // Additional restore after longer delay to handle any layout shifts or lazy loading
      setTimeout(() => {
        this.scrollRestorationService.restoreScrollPosition('/');
        this.checkScrollPosition();
      }, 300);
      
      // Final restore attempt after content loads
      setTimeout(() => {
        this.scrollRestorationService.restoreScrollPosition('/');
        this.checkScrollPosition();
      }, 800);
    } else {
      // First load - ensure we're at top
      window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
    }
    
    // Check scroll position on init and show indicator after page loads
    setTimeout(() => {
      this.checkScrollPosition();
      // Show indicator after a short delay if user hasn't scrolled
      if (typeof window !== 'undefined' && window.innerWidth >= 1024) {
        const scrollPosition = window.pageYOffset || document.documentElement.scrollTop || document.body.scrollTop || 0;
        if (scrollPosition < 200) {
          setTimeout(() => {
            this.showScrollIndicator = true;
          }, 2000); // Show after 2 seconds
        }
      }
    }, 500);

    // Subscribe to theme changes
    this.currentTheme = this.themeService.getCurrentTheme();
    this.themeSubscription = this.themeService.theme$.subscribe(theme => {
      this.currentTheme = theme;
    });

    // Initialize mobile top bar data
    this.initializeMobileTopBar();

    // Subscribe to ad changes
    this.adSubscription = this.adService.ads$.subscribe(ads => {
      this.updateAdData();
    });
  }

  updateAdData() {
    this.ad1Enabled = this.adService.isAdEnabled('ad1');
    this.ad2Enabled = this.adService.isAdEnabled('ad2');
    this.ad1MediaUrl = this.adService.getAdMediaUrl('ad1');
    this.ad2MediaUrl = this.adService.getAdMediaUrl('ad2');
    this.ad1Link = this.adService.getAdLink('ad1');
    this.ad2Link = this.adService.getAdLink('ad2');
    this.ad1AltText = this.adService.getAdAltText('ad1');
    this.ad2AltText = this.adService.getAdAltText('ad2');
    this.ad1MediaType = this.adService.getAdMediaType('ad1');
    this.ad2MediaType = this.adService.getAdMediaType('ad2');
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

  async initializeMobileTopBar() {
    // Fetch reader count
    this.fetchReaderCount();
    
    // Fetch weather
    this.fetchWeather();
    
    // Initialize push notification state
    this.pushSupported = await this.pushService.isSupported();
    this.pushSubscribed = await this.pushService.isSubscribed();
    this.pushSubscription = this.pushService.subscribed$.subscribe(subscribed => {
      this.pushSubscribed = subscribed;
      this.cdr.markForCheck();
    });
    this.cdr.markForCheck();
    
    // Update date and location
    this.updateMobileTopBarData();
    
    // Subscribe to language changes
    this.languageSubscription = this.languageService.currentLanguage$.subscribe(lang => {
      this.updateMobileTopBarData();
    });
    
    // Refresh weather every 30 minutes
    this.weatherRefreshInterval = setInterval(() => {
      this.fetchWeather();
    }, 30 * 60 * 1000);
  }

  updateMobileTopBarData() {
    // Set location to "Del" for mobile
    this.mobileTopBarLocation = 'Del';
    
    // Format date as "Sun, 11 Jan '26"
    const date = new Date();
    const weekdays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    
    const weekday = weekdays[date.getDay()];
    const day = date.getDate();
    const month = months[date.getMonth()];
    const year = date.getFullYear().toString().slice(-2); // Get last 2 digits
    
    this.mobileTopBarDate = `${weekday}, ${day} ${month} '${year}`;
  }

  getFormattedReaderCount(): string {
    const t = this.languageService.getTranslations();
    const readersText = t.readers || 'Readers';
    
    // Format reader count as millions (e.g., 4M+) or thousands (e.g., 4.3K+)
    if (this.mobileTopBarReaderCount >= 1000000) {
      const millions = (this.mobileTopBarReaderCount / 1000000).toFixed(1);
      // Remove .0 if it's a whole number
      const formatted = millions.endsWith('.0') ? millions.slice(0, -2) : millions;
      return `${formatted}M+ ${readersText}`;
    } else if (this.mobileTopBarReaderCount >= 1000) {
      const thousands = (this.mobileTopBarReaderCount / 1000).toFixed(1);
      const formatted = thousands.endsWith('.0') ? thousands.slice(0, -2) : thousands;
      return `${formatted}K+ ${readersText}`;
    }
    return `${this.mobileTopBarReaderCount}+ ${readersText}`;
  }

  getPushLabelSubscribed(): string {
    const t = this.languageService.getTranslations();
    return t.notificationsSubscribed || 'Subscribed';
  }

  fetchReaderCount() {
    this.http.get<{ success: boolean; data: { readerCount: number } }>(`${this.apiUrl}/api/stats`).pipe(
      catchError(error => {
        console.error('Error fetching reader count:', error);
        return of({ success: false, data: { readerCount: 4320 } });
      })
    ).subscribe(response => {
      if (response.success) {
        this.mobileTopBarReaderCount = response.data.readerCount;
      }
    });
  }

  fetchWeather() {
    // Delhi, India coordinates
    const latitude = 28.6139;
    const longitude = 77.2090;
    const weatherUrl = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m&timezone=Asia/Kolkata`;

    this.http.get<any>(weatherUrl).pipe(
      catchError(error => {
        console.error('Error fetching weather:', error);
        return of(null);
      })
    ).subscribe(data => {
      if (data && data.current && data.current.temperature_2m !== undefined) {
        this.mobileTopBarTemperature = Math.round(data.current.temperature_2m);
      }
    });
  }

  ngOnDestroy() {
    // Cleanup subscriptions
    this.themeSubscription?.unsubscribe();
    this.languageSubscription?.unsubscribe();
    this.adSubscription?.unsubscribe();
    this.pushSubscription?.unsubscribe();
    if (this.weatherRefreshInterval) {
      clearInterval(this.weatherRefreshInterval);
    }
  }

  @HostListener('window:scroll', [])
  onWindowScroll() {
    this.checkScrollPosition();
  }

  @HostListener('window:resize', [])
  onWindowResize() {
    this.checkScrollPosition();
  }

  checkScrollPosition() {
    if (typeof window !== 'undefined' && window.innerWidth >= 1024) {
      // Only show on desktop
      const scrollPosition = window.pageYOffset || document.documentElement.scrollTop || document.body.scrollTop || 0;
      // Hide indicator if user has scrolled down more than 200px
      this.showScrollIndicator = scrollPosition < 200;
    } else {
      // Hide on mobile
      this.showScrollIndicator = false;
    }
  }

  scrollToContent() {
    // Smooth scroll to content below the video banner
    const videoBannerHeight = 600; // Approximate height of video banner + header
    window.scrollTo({
      top: videoBannerHeight,
      behavior: 'smooth'
    });
  }

  onHeroImagesLoaded() {
    this.heroImagesLoaded = true;
  }

  onHeroDisplayedReady() {
    this.heroDisplayedReady = true;
  }

  onNewsGridImagesLoaded() {
    this.newsGridImagesLoaded = true;
  }

  onCategorySectionLoaded() {
    this.categorySectionLoaded = true;
  }

  onWidgetsLoaded() {
    this.widgetsLoaded = true;
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
          console.warn(`[IndexComponent] Autoplay prevented for ${adId}:`, error);
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
        console.warn(`[IndexComponent] Video play failed for ${adId}:`, error);
      });
    }
  }

  onAdVideoError(adId: string, event: Event) {
    const video = event.target as HTMLVideoElement;
    console.error(`[IndexComponent] Video error for ${adId}:`, {
      error: video?.error,
      code: video?.error?.code,
      message: video?.error?.message,
      src: video?.src
    });
  }
}

