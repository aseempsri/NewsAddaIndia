import { Component, OnInit, HostListener, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HeaderComponent } from '../../components/header/header.component';
import { ThemeService, Theme } from '../../services/theme.service';
import { LanguageService, Language } from '../../services/language.service';
import { ScrollRestorationService } from '../../services/scroll-restoration.service';
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
      <div class="fixed inset-0 bg-background z-50 flex items-center justify-center">
        <div class="flex flex-col items-center gap-4">
          <div class="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
          <div class="text-center">
            <p class="text-lg font-semibold text-foreground mb-2">Loading News</p>
            <!-- <p class="text-sm text-muted-foreground">Fetching images based on headlines...</p> -->
          </div>
        </div>
      </div>
    }

    <div class="min-h-screen bg-background overflow-x-hidden w-full max-w-full" [class.opacity-0]="isPageLoading" [class.opacity-100]="!isPageLoading" [class.transition-opacity]="!isPageLoading" [class.duration-500]="!isPageLoading">
      <app-header />
      <!-- Spacer for fixed header on desktop - accounts for navigation bar (~64px, reduced by 20%) + top bar (~32px, reduced by 20%) = ~96px -->
      <div class="lg:h-[96px]"></div>
      
      <app-video-banner [imagesLoaded]="!isPageLoading" />
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
        
        <div class="container mx-auto px-4 py-8">
          <div class="grid lg:grid-cols-3 gap-8 lg:gap-12">
            <div class="lg:col-span-2">
              <app-news-grid (imagesLoaded)="onNewsGridImagesLoaded()" />
              <app-category-section />
            </div>
            <div class="order-first lg:order-last">
              <app-sidebar />
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
  styles: []
})
export class IndexComponent implements OnInit, OnDestroy {
  isPageLoading = true;
  heroImagesLoaded = false;
  newsGridImagesLoaded = false;
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

  constructor(
    private themeService: ThemeService,
    private languageService: LanguageService,
    private scrollRestorationService: ScrollRestorationService,
    private http: HttpClient
  ) {}

  ngOnInit() {
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
    
    // Maximum wait time of 30 seconds as fallback
    setTimeout(() => {
      this.isPageLoading = false;
    }, 30000);
    
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

  checkIfAllLoaded() {
    if (this.heroImagesLoaded && this.newsGridImagesLoaded) {
      // Small delay to ensure smooth transition
      setTimeout(() => {
        this.isPageLoading = false;
      }, 300);
    }
  }
}

