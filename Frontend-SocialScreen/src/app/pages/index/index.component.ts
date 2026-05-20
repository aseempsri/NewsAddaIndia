import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HeaderComponent } from '../../components/header/header.component';
import { ThemeService, Theme } from '../../services/theme.service';
import { LanguageService, Language } from '../../services/language.service';
import { PushNotificationService } from '../../services/push-notification.service';
import { ScrollRestorationService } from '../../services/scroll-restoration.service';
import { DisplayedNewsService } from '../../services/displayed-news.service';
import { HttpClient } from '@angular/common/http';
import { Subscription } from 'rxjs';
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
      
      <!-- Mobile Top Bar -->
      <div class="lg:hidden bg-secondary/50 backdrop-blur-md border-b border-border/50 w-full mb-2">
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
    : (environment.production ? '' : '');
  private languageSubscription?: Subscription;
  private weatherRefreshInterval: any;

  constructor(
    private themeService: ThemeService,
    private languageService: LanguageService,
    private scrollRestorationService: ScrollRestorationService,
    private displayedNewsService: DisplayedNewsService,
    private router: Router,
    private http: HttpClient,
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
      });
      
      // Restore after short delay
      setTimeout(() => {
        this.scrollRestorationService.restoreScrollPosition('/');
      }, 100);
      
      // Additional restore after longer delay to handle any layout shifts or lazy loading
      setTimeout(() => {
        this.scrollRestorationService.restoreScrollPosition('/');
      }, 300);
      
      // Final restore attempt after content loads
      setTimeout(() => {
        this.scrollRestorationService.restoreScrollPosition('/');
      }, 800);
    } else {
      // First load - ensure we're at top
      window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
    }
    

    // Subscribe to theme changes
    this.currentTheme = this.themeService.getCurrentTheme();
    this.themeSubscription = this.themeService.theme$.subscribe(theme => {
      this.currentTheme = theme;
    });

    // Initialize mobile top bar data
    this.initializeMobileTopBar();

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
    this.pushSubscription?.unsubscribe();
    if (this.weatherRefreshInterval) {
      clearInterval(this.weatherRefreshInterval);
    }
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
}

