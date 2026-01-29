import { Component, OnInit, HostListener, OnDestroy, ViewChild, ElementRef, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HeaderComponent } from '../../components/header/header.component';
import { ThemeService, Theme } from '../../services/theme.service';
import { LanguageService, Language } from '../../services/language.service';
import { ScrollRestorationService } from '../../services/scroll-restoration.service';
import { DisplayedNewsService } from '../../services/displayed-news.service';
import { AdService } from '../../services/ad.service';
import { HttpClient } from '@angular/common/http';
import { Subscription } from 'rxjs';
import { VideoBannerComponent } from '../../components/video-banner/video-banner.component';
import { NewsTickerComponent } from '../../components/news-ticker/news-ticker.component';
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
    HeroSectionComponent,
    NewsGridComponent,
    CategorySectionComponent,
    SidebarComponent,
    FooterComponent
  ],
  template: `
    <!-- Full Page Loading Overlay - Show while images are loading -->
    @if (isPageLoading) {
      <div class="loading-video-container fixed inset-0 z-50 overflow-hidden flex items-center justify-center">
        <!-- Animated gradient background that complements video -->
        <div class="absolute inset-0 bg-gradient-to-br from-slate-900 via-purple-900 to-indigo-900 animate-gradient-shift"></div>
        <div class="absolute inset-0 bg-gradient-to-tr from-blue-900/50 via-purple-800/30 to-pink-900/50 animate-pulse"></div>
        
        <!-- Video Player - Responsive with better mobile handling -->
        <div class="loading-video-wrapper">
          <video
            #loadingVideo
            autoplay
            muted
            playsinline
            preload="auto"
            class="loading-video relative z-10"
            (canplay)="onLoadingVideoCanPlay()"
            (error)="onLoadingVideoError()"
            (loadeddata)="onLoadingVideoLoaded()"
            (ended)="onLoadingVideoEnded()"
          >
            <source src="assets/videos/output.mp4" type="video/mp4">
            Your browser does not support the video tag.
          </video>
        </div>
      </div>
    }

    <div class="min-h-screen bg-background overflow-x-hidden w-full max-w-full" [class.opacity-0]="isPageLoading" [class.opacity-100]="!isPageLoading" [class.transition-opacity]="!isPageLoading" [class.duration-500]="!isPageLoading">
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
        <app-video-banner [imagesLoaded]="!isPageLoading" />
        
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
        <app-video-banner [imagesLoaded]="!isPageLoading" />
      </div>
      
      <app-news-ticker />
      
      <!-- Mobile Top Bar - Below News Ticker -->
      <div class="lg:hidden bg-secondary/50 backdrop-blur-md border-b border-border/50 w-full">
        <div class="container mx-auto px-3 py-1 flex items-center justify-between text-xs">
          <span class="flex items-center gap-1 text-muted-foreground">
            <svg class="w-3 h-3 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span class="leading-tight">{{ mobileTopBarDate }}</span>
          </span>
          <span class="text-accent font-medium leading-tight">{{ getFormattedReaderCount() }}</span>
        </div>
      </div>
      
      <main>
        <app-hero-section (imagesLoaded)="onHeroImagesLoaded()" />
        
        <div class="container mx-auto px-2 sm:px-4 py-4 sm:py-6 lg:py-8 w-full max-w-full">
          <div class="grid lg:grid-cols-3 gap-3 sm:gap-6 lg:gap-12 w-full">
            <div class="lg:col-span-2 w-full min-w-0">
              <!-- CRITICAL: Latest Stories (6 items) must always come FIRST before Category Sections -->
              <!-- This ensures Latest Stories items are registered first and won't appear in Category Sections -->
              <app-news-grid (imagesLoaded)="onNewsGridImagesLoaded()" />
              <!-- Category Sections come AFTER Latest Stories to prevent duplicates -->
              <app-category-section (dataLoaded)="onCategorySectionLoaded()" />
            </div>
            <div class="order-first lg:order-last w-full min-w-0">
              <app-sidebar (widgetsLoaded)="onWidgetsLoaded()" />
            </div>
          </div>
        </div>
      </main>

      <!-- Subscribe Card - Mobile only (shown before footer) -->
      <div class="lg:hidden container mx-auto px-2 sm:px-4 py-4 w-full max-w-full">
        <div class="relative overflow-hidden rounded-xl p-3 bg-gradient-to-br from-primary/20 via-primary/10 to-accent/20 border border-primary/30 stay-informed-mobile">
          <div class="absolute top-0 right-0 w-20 h-20 bg-primary/20 rounded-full blur-2xl"></div>
          <div class="relative">
            <h3 class="font-display text-base font-bold mb-1.5 leading-relaxed pt-0.5 pb-0.5">
              {{ getStayInformedText() }}
            </h3>
            <p class="text-base text-muted-foreground mb-3">
              {{ getSubscribeDescription() }}
            </p>
            <input
              type="email"
              [placeholder]="getEnterYourEmail()"
              class="w-full px-3 py-2.5 rounded-lg bg-background/50 border border-border/50 text-base placeholder:text-muted-foreground focus:outline-none focus:border-primary/50 mb-2" />
            <button class="w-full py-2.5 rounded-lg bg-primary text-primary-foreground text-base font-semibold hover:bg-primary/90 transition-colors glow-primary">
              {{ getSubscribeNow() }}
            </button>
          </div>
        </div>
      </div>

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
    /* Animated gradient background */
    @keyframes gradient-shift {
      0%, 100% {
        background-position: 0% 50%;
      }
      50% {
        background-position: 100% 50%;
      }
    }
    
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
    
    .animate-gradient-shift {
      background-size: 200% 200%;
      animation: gradient-shift 8s ease infinite;
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
    
    /* Loading video container - glassmorphism with gradient background */
    .loading-video-container {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      width: 100%;
      height: 100%;
      margin: 0;
      padding: 0;
      overflow: hidden;
      z-index: 9999;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    
    /* Video wrapper for border and glow effects - Desktop */
    .loading-video-wrapper {
      width: 96%;
      max-width: 96%;
      height: 90vh;
      max-height: 90vh;
      display: flex;
      align-items: center;
      justify-content: center;
      position: relative;
      padding: 6px;
      border-radius: 32px;
      background: linear-gradient(135deg, rgba(147, 51, 234, 0.8), rgba(59, 130, 246, 0.8), rgba(236, 72, 153, 0.8));
      background-size: 300% 300%;
      animation: border-glow 3s ease infinite;
      box-shadow: 
        0 0 30px rgba(147, 51, 234, 0.7),
        0 0 60px rgba(59, 130, 246, 0.6),
        0 0 90px rgba(236, 72, 153, 0.5),
        0 0 120px rgba(147, 51, 234, 0.4);
    }
    
    /* Loading video - desktop full screen with glow, fully visible */
    .loading-video {
      width: 100%;
      height: 100%;
      object-fit: contain; /* Changed from cover to contain to show full video */
      object-position: center;
      margin: 0;
      padding: 0;
      border-radius: 26px; /* Rounded edges */
      border: 3px solid rgba(255, 255, 255, 0.3); /* Inner border */
      -webkit-transform: translateZ(0);
      transform: translateZ(0);
      position: relative;
      z-index: 1;
    }
    
    @media (max-width: 768px) {
      /* Mobile-specific - glassmorphism video frame */
      .loading-video-container {
        position: fixed;
        top: 0;
        left: 0;
        width: 100vw;
        height: 100vh;
        height: 100dvh;
        max-width: 100vw;
        max-height: 100vh;
        max-height: 100dvh;
        margin: 0;
        padding: 0;
        overflow: hidden;
        display: flex;
        align-items: center;
        justify-content: center;
      }
      
      .loading-video-wrapper {
        width: 92%;
        max-width: 92%;
        height: auto;
        max-height: 85vh;
        max-height: 85dvh;
        position: relative;
        padding: 4px;
        border-radius: 28px;
        background: linear-gradient(135deg, rgba(147, 51, 234, 0.8), rgba(59, 130, 246, 0.8), rgba(236, 72, 153, 0.8));
        background-size: 300% 300%;
        animation: border-glow 3s ease infinite;
        box-shadow: 
          0 0 20px rgba(147, 51, 234, 0.6),
          0 0 40px rgba(59, 130, 246, 0.5),
          0 0 60px rgba(236, 72, 153, 0.4),
          0 0 80px rgba(147, 51, 234, 0.3);
      }
      
      .loading-video {
        width: 100%;
        height: auto;
        max-height: 100%;
        object-fit: contain; /* Ensure full video is visible */
        object-position: center;
        margin: 0;
        padding: 0;
        display: block;
        border-radius: 24px; /* Rounded edges */
        border: 2px solid rgba(255, 255, 255, 0.3); /* Inner border */
        -webkit-transform: translateZ(0);
        transform: translateZ(0);
        position: relative;
        z-index: 1;
      }
      
      /* Prevent body scroll on mobile when loading */
      body {
        overflow: hidden !important;
        position: fixed !important;
        width: 100% !important;
        height: 100% !important;
      }
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
export class IndexComponent implements OnInit, OnDestroy, AfterViewInit {
  private static hasAppLoaded = false; // Static flag to track first app load across component instances
  isPageLoading = true;
  heroImagesLoaded = false;
  newsGridImagesLoaded = false;
  categorySectionLoaded = false;
  widgetsLoaded = false;
  videoEnded = false; // Track if loading video has finished playing
  showScrollIndicator = false;
  currentTheme: Theme = 'light';
  private themeSubscription?: Subscription;
  
  // Mobile Top Bar Data
  mobileTopBarDate = '';
  mobileTopBarLocation = '';
  mobileTopBarTemperature: number | null = null;
  mobileTopBarReaderCount = 4320;
  mobileTopBarReaders = '';
  private apiUrl = environment.apiUrl || 'http://localhost:3000';
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

  @ViewChild('loadingVideo', { static: false }) loadingVideoRef?: ElementRef<HTMLVideoElement>;

  constructor(
    private themeService: ThemeService,
    private languageService: LanguageService,
    private scrollRestorationService: ScrollRestorationService,
    private displayedNewsService: DisplayedNewsService,
    private router: Router,
    private http: HttpClient,
    private adService: AdService
  ) {}

  ngOnInit() {
    // Only show loading video on first initial app load, not on subsequent navigations
    if (IndexComponent.hasAppLoaded) {
      // App has already loaded before, this is a navigation - skip loading screen
      this.isPageLoading = false;
      this.heroImagesLoaded = true;
      this.newsGridImagesLoaded = true;
      this.categorySectionLoaded = true;
      this.widgetsLoaded = true;
    } else {
      // This is the first app load, show loading screen
      IndexComponent.hasAppLoaded = true;
      this.isPageLoading = true;
      this.videoEnded = false; // Reset video ended flag
      
      // Prevent body scroll when loading starts
      if (typeof document !== 'undefined') {
        document.body.style.overflow = 'hidden';
        document.body.style.position = 'fixed';
        document.body.style.width = '100%';
        document.body.style.height = '100%';
      }
    }
    
    // Clear displayed news when entering home page to start fresh
    this.displayedNewsService.clear();
    
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
    
    // OPTIMIZATION: Timeout as fallback (increased to 30s to allow video to finish)
    setTimeout(() => {
      if (this.isPageLoading) {
        console.warn('Page loading timeout - showing page anyway');
        this.videoEnded = true; // Force video ended flag
        this.isPageLoading = false;
        this.restoreBodyScroll();
      }
    }, 30000); // 30s timeout to allow video to finish playing
    
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

  initializeMobileTopBar() {
    // Fetch reader count
    this.fetchReaderCount();
    
    // Fetch weather
    this.fetchWeather();
    
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

  getStayInformedText(): string {
    const t = this.languageService.getTranslations();
    return t.stayInformed || 'Stay Informed';
  }

  getSubscribeDescription(): string {
    const t = this.languageService.getTranslations();
    return t.subscribeDescription || 'Subscribe to our newsletter for daily news updates delivered to your inbox.';
  }

  getEnterYourEmail(): string {
    const t = this.languageService.getTranslations();
    return t.enterYourEmail || 'Enter your email';
  }

  getSubscribeNow(): string {
    const t = this.languageService.getTranslations();
    return t.subscribeNow || 'Subscribe Now';
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
    this.checkIfAllLoaded();
  }

  onNewsGridImagesLoaded() {
    this.newsGridImagesLoaded = true;
    this.checkIfAllLoaded();
  }

  onCategorySectionLoaded() {
    this.categorySectionLoaded = true;
    this.checkIfAllLoaded();
  }

  onWidgetsLoaded() {
    this.widgetsLoaded = true;
    this.checkIfAllLoaded();
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

  ngAfterViewInit(): void {
    // Ensure video plays when view is initialized
    if (this.loadingVideoRef?.nativeElement) {
      const video = this.loadingVideoRef.nativeElement;
      video.muted = true;
      video.play().catch((error) => {
        console.warn('[IndexComponent] Loading video autoplay prevented:', error);
      });
    }
  }

  onLoadingVideoCanPlay() {
    // Video is ready to play
    if (this.loadingVideoRef?.nativeElement) {
      const video = this.loadingVideoRef.nativeElement;
      video.muted = true;
      video.play().catch((error) => {
        console.warn('[IndexComponent] Loading video autoplay prevented:', error);
      });
    }
  }

  onLoadingVideoLoaded() {
    // Video has loaded, ensure it plays
    if (this.loadingVideoRef?.nativeElement) {
      const video = this.loadingVideoRef.nativeElement;
      video.muted = true;
      video.play().catch((error) => {
        console.warn('[IndexComponent] Loading video play failed:', error);
      });
    }
  }

  onLoadingVideoError() {
    // If video fails to load, fallback to spinner (optional)
    console.warn('[IndexComponent] Loading video failed to load, continuing with page load');
    // If video fails, mark as ended so page can still load
    this.videoEnded = true;
    this.checkIfAllLoaded();
  }

  onLoadingVideoEnded() {
    // Video has finished playing
    console.log('[IndexComponent] Loading video ended');
    this.videoEnded = true;
    this.checkIfAllLoaded();
  }

  checkIfAllLoaded() {
    // Wait for both: video to end AND all content to be loaded
    if (this.videoEnded && this.heroImagesLoaded && this.newsGridImagesLoaded && this.categorySectionLoaded && this.widgetsLoaded) {
      // Small delay to ensure smooth transition
      setTimeout(() => {
        this.isPageLoading = false;
        this.restoreBodyScroll();
      }, 200);
    }
  }

  restoreBodyScroll() {
    // Re-enable body scroll after loading completes
    if (typeof document !== 'undefined') {
      document.body.style.overflow = '';
      document.body.style.position = '';
      document.body.style.width = '';
      document.body.style.height = '';
    }
  }
}

