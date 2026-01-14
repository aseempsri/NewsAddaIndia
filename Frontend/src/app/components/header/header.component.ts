import { Component, OnInit, OnDestroy, HostListener, ViewEncapsulation, ChangeDetectorRef, ViewChild, ElementRef, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive, Router, NavigationEnd } from '@angular/router';
import { Location } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { ButtonComponent } from '../../ui/button/button.component';
import { LanguageService, Language } from '../../services/language.service';
import { ThemeService, Theme } from '../../services/theme.service';
import { ModalService } from '../../services/modal.service';
import { ScrollRestorationService } from '../../services/scroll-restoration.service';
import { environment } from '../../../environments/environment';
import { catchError, filter } from 'rxjs/operators';
import { of, Subscription } from 'rxjs';

interface NavLink {
  name: string;
  route: string;
}

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive, ButtonComponent],
  encapsulation: ViewEncapsulation.None,
  template: `
    <div class="header-wrapper">
    <!-- Main Header (Navigation) - Fixed at top, highest z-index -->
    <header class="main-header glass-card border-b border-border/30 transition-all duration-300 w-full bg-background/95 backdrop-blur-sm" [style.top.px]="0" [style.position]="getHeaderPosition()" [style.left]="'0'" [style.right]="'0'" [style.transform]="'translateZ(0)'">
        <div class="container mx-auto px-4 py-3">
          <div class="flex items-center justify-between gap-2.5">
            <!-- Logo -->
            <a [routerLink]="'/'" (click)="onNavLinkClick('/')" class="flex items-center gap-2.5 group shrink-0">
              <div class="relative w-10 h-10 shrink-0">
                <img 
                  [src]="logoPath" 
                  alt="NewsAddaIndia Logo" 
                  class="w-full h-full rounded-xl object-cover transition-all duration-300"
                  style="box-shadow: 0 0 15px rgba(37, 99, 235, 0.6), 0 0 30px rgba(37, 99, 235, 0.4);"
                  loading="eager"
                  width="40"
                  height="40" />
                <div class="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full bg-accent animate-pulse"></div>
              </div>
              <div>
                <h1 class="font-display text-sm sm:text-lg font-bold tracking-tight leading-tight">
                  <span style="color: #FF9933;">News</span>
                  <span style="color: #FFFFFF; -webkit-text-stroke: 1.5px #2563EB; text-stroke: 1.5px #2563EB; paint-order: stroke fill;">Adda</span>
                  <span style="color: #138808;">India</span>
                </h1>
                <p class="text-[9px] sm:text-[10px] text-muted-foreground -mt-0.5 leading-tight">{{ t.yourDailyNewsCompanion }}</p>
              </div>
            </a>

            <!-- Desktop Navigation -->
            <nav class="hidden lg:flex items-center gap-1">
              @for (link of navLinks; track link.name) {
                <a
                  [routerLink]="link.route"
                  routerLinkActive="text-primary font-bold bg-primary/10"
                  [routerLinkActiveOptions]="{exact: link.route === '/'}"
                  (click)="onNavLinkClick(link.route)"
                  class="nav-link px-3.5 py-1.5 rounded-lg text-sm font-bold text-muted-foreground hover:text-foreground hover:bg-secondary/50 transition-all">
                  {{ link.name }}
                </a>
              }
            </nav>

            <!-- Actions -->
            <div class="flex items-center gap-2.5 shrink-0">
              <!-- Language Toggle Switch (E -> H) -->
              <button
                type="button"
                (click)="toggleLanguage(); $event.stopPropagation()"
                (mousedown)="onLanguageButtonMouseDown($event)"
                [attr.aria-label]="currentLanguage === 'en' ? 'Switch to Hindi' : 'Switch to English'"
                [class]="'relative w-12 h-7 rounded-full transition-all duration-300 ease-in-out focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-1 shadow-lg z-50 ' + (currentLanguage === 'en' ? 'bg-gradient-to-r from-blue-500 to-blue-600 shadow-blue-500/50' : 'bg-gradient-to-r from-orange-500 to-orange-600 shadow-orange-500/50')"
                style="cursor: pointer; position: relative; z-index: 50;">
                <!-- Toggle Circle -->
                <div
                  [class]="'absolute top-0.5 left-0.5 w-6 h-6 bg-white rounded-full shadow-md transform transition-transform duration-300 ease-in-out flex items-center justify-center font-bold text-xs ' + (currentLanguage === 'hi' ? 'translate-x-[22px] text-orange-600' : 'text-blue-600')">
                  {{ currentLanguage === 'en' ? 'E' : 'H' }}
                </div>
                <!-- Language Labels -->
                <div class="absolute inset-0 flex items-center justify-between px-1.5 text-xs font-semibold text-white pointer-events-none">
                  <span [class]="'transition-opacity duration-300 ' + (currentLanguage === 'en' ? 'opacity-100' : 'opacity-50')">E</span>
                  <span [class]="'transition-opacity duration-300 ' + (currentLanguage === 'hi' ? 'opacity-100' : 'opacity-50')">H</span>
                </div>
              </button>
              <!-- Theme Toggle Switch (Light -> Dark) -->
              <button
                (click)="toggleTheme()"
                [attr.aria-label]="currentTheme === 'light' ? 'Switch to Dark Mode' : 'Switch to Light Mode'"
                [class]="'relative w-12 h-7 rounded-full transition-all duration-300 ease-in-out focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-1 shadow-lg ' + (currentTheme === 'dark' ? 'bg-gradient-to-r from-gray-700 to-gray-900 shadow-gray-700/50' : 'bg-gradient-to-r from-yellow-400 to-orange-500 shadow-yellow-400/50')">
                <!-- Toggle Circle -->
                <div
                  [class]="'absolute top-0.5 left-0.5 w-6 h-6 bg-white rounded-full shadow-md transform transition-transform duration-300 ease-in-out flex items-center justify-center ' + (currentTheme === 'dark' ? 'translate-x-[22px]' : '')">
                  @if (currentTheme === 'dark') {
                    <svg class="w-3.5 h-3.5 text-gray-800" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                    </svg>
                  } @else {
                    <svg class="w-3.5 h-3.5 text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                    </svg>
                  }
                </div>
                <!-- Theme Labels -->
                <div class="absolute inset-0 flex items-center justify-between px-1.5 text-xs font-semibold text-white pointer-events-none">
                  <span [class]="'transition-opacity duration-300 ' + (currentTheme === 'light' ? 'opacity-100' : 'opacity-50')">
                    <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                    </svg>
                  </span>
                  <span [class]="'transition-opacity duration-300 ' + (currentTheme === 'dark' ? 'opacity-100' : 'opacity-50')">
                    <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                    </svg>
                  </span>
                </div>
              </button>
            </div>
          </div>
        </div>

      <!-- Mobile Navigation Bar -->
      <div class="mobile-nav-wrapper lg:hidden bg-background/95 backdrop-blur-sm border-b border-border/30 relative">
        <nav 
          #mobileNavContainer
          class="overflow-x-auto scrollbar-hide" 
          style="scrollbar-width: none; -ms-overflow-style: none; -webkit-overflow-scrolling: touch; touch-action: pan-x;"
          (scroll)="checkMobileNavScroll()">
          <div [class]="'flex items-center gap-2 whitespace-nowrap px-4 py-1 ' + (showNavBounce ? 'nav-bounce-left' : '')">
            @for (link of navLinks; track link.name) {
              <a
                [routerLink]="link.route"
                routerLinkActive="text-primary font-bold bg-primary/15 border border-primary/30"
                [routerLinkActiveOptions]="{exact: link.route === '/'}"
                (click)="onNavLinkClick(link.route)"
                class="px-2.5 py-0.75 rounded-md text-xs font-bold text-foreground hover:text-primary hover:bg-secondary/70 active:bg-secondary transition-all shrink-0 min-w-fit border border-transparent touch-manipulation">
                {{ link.name }}
              </a>
            }
          </div>
        </nav>
        <!-- Right Arrow Indicator with Gradient Fade - Fixed on right side -->
        @if (showRightArrow) {
          <div class="mobile-nav-arrow absolute right-0 top-0 bottom-0 w-16 pointer-events-none flex items-center justify-end pr-2 z-10">
            <!-- Gradient Fade -->
            <div class="absolute inset-0 bg-gradient-to-l from-background/95 via-background/60 to-transparent"></div>
            <!-- Animated Arrow -->
            <div class="relative flex items-center justify-center w-6 h-6 rounded-full bg-primary/10 backdrop-blur-sm border border-primary/20 animate-pulse-slow">
              <svg class="w-3.5 h-3.5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24" style="filter: drop-shadow(0 1px 2px rgba(59, 130, 246, 0.3));">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M9 5l7 7-7 7" />
              </svg>
            </div>
          </div>
        }
      </div>
    </header>

    <!-- Top Bar - Fixed below navigation bar, lower z-index - Only show on home page, hide when modal is open on web view -->
    @if (isHomePage && !(isModalOpen && isDesktop)) {
      <div class="top-bar" [class]="getTopBarClasses()" [style.top.px]="getTopBarTop()" [style.position]="getTopBarPosition()" [style.left]="'0'" [style.right]="'0'" [style.z-index]="'10001'">
        <div class="container mx-auto px-4 py-1.5 flex items-center justify-between text-sm">
          <div class="flex items-center gap-4 text-muted-foreground">
            <span class="flex items-center gap-1.5">
              <svg class="w-3.5 h-3.5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {{ currentDate }}
            </span>
            <span class="hidden sm:flex items-center gap-1.5">
              <svg class="w-3.5 h-3.5 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              {{ t.delhiIndia }}
            </span>
          </div>
          <div class="flex items-center gap-3">
            @if (currentTemperature !== null) {
              <span class="text-muted-foreground">{{ currentTemperature }}°C</span>
            } @else {
              <span class="text-muted-foreground">--°C</span>
            }
            <div class="w-px h-4 bg-border"></div>
            <span class="text-accent font-medium">{{ readerCount | number }}+ {{ t.readers }}</span>
          </div>
        </div>
      </div>
    }
    </div>
  `,
  styles: [`
    @keyframes bounce-left {
      0%, 100% {
        transform: translateX(0);
      }
      25% {
        transform: translateX(-16px);
      }
      50% {
        transform: translateX(0);
      }
      75% {
        transform: translateX(-8px);
      }
    }
    .nav-bounce-left {
      animation: bounce-left 1s ease-in-out;
    }
    @keyframes pulse-slow {
      0%, 100% {
        opacity: 0.6;
        transform: scale(1);
      }
      50% {
        opacity: 1;
        transform: scale(1.05);
      }
    }
    .animate-pulse-slow {
      animation: pulse-slow 2s ease-in-out infinite;
    }
    /* Ensure sticky positioning works */
    .header-wrapper {
      width: 100% !important;
      display: block !important;
    }
    
    /* Fixed positioning for desktop - more reliable than sticky */
    @media (min-width: 1024px) {
      /* Main header (navigation) - at top, highest z-index */
      header.main-header {
        position: fixed !important;
        top: 0 !important;
        left: 0 !important;
        right: 0 !important;
        z-index: 10002 !important;
        width: 100% !important;
        transform: translateZ(0) !important;
        will-change: transform !important;
      }
      
      /* Top bar - below navigation bar, lower z-index */
      .top-bar {
        position: fixed !important;
        left: 0 !important;
        right: 0 !important;
        z-index: 10001 !important;
      }
    }
    
    /* Sticky for mobile */
    @media (max-width: 1023px) {
      header.main-header {
        position: sticky !important;
        top: 0 !important;
        z-index: 9999 !important;
        width: 100% !important;
      }
      
      /* Top bar on mobile - sticky below navigation */
      .top-bar {
        position: sticky !important;
        z-index: 9998 !important;
        /* top is controlled by inline style - must be below navigation */
      }
    }
    
    /* Ensure header wrapper doesn't create stacking context */
    .header-wrapper {
      position: relative !important;
      z-index: auto !important;
      transform: none !important;
    }
    
    /* Mobile navigation arrow indicator - fixed on right */
    @media (max-width: 1023px) {
      /* Ensure the wrapper stays fixed relative to viewport */
      .mobile-nav-wrapper {
        position: relative !important;
        overflow: hidden !important;
      }
      
      /* Arrow indicator overlay - fixed on right side, doesn't scroll */
      .mobile-nav-arrow {
        position: absolute !important;
        right: 0 !important;
        top: 0 !important;
        bottom: 0 !important;
        z-index: 10 !important;
        pointer-events: none !important;
      }
    }
    
    /* Ensure navigation links are always bold - both desktop and mobile */
    .nav-link,
    .mobile-nav-wrapper a {
      font-weight: 700 !important;
    }
    
    /* Ensure active state also maintains bold */
    .nav-link.router-link-active,
    .mobile-nav-wrapper a.router-link-active {
      font-weight: 700 !important;
    }
  `]
})
export class HeaderComponent implements OnInit, OnDestroy, AfterViewInit {
  logoPath: string;
  readerCount = 4320;
  currentLanguage: Language = 'en';
  currentTheme: Theme = 'light';
  isScrolled = false;
  topBarHeight = 0;
  t: any = {};
  currentDate = '';
  currentTemperature: number | null = null;
  private apiUrl = environment.apiUrl || 'http://localhost:3000';
  private languageSubscription?: Subscription;
  private themeSubscription?: Subscription;
  private weatherRefreshInterval: any;

  navLinks: NavLink[] = [];
  showNavBounce = false;
  isHomePage = false;
  isModalOpen = false;
  isDesktop = false;
  
  @ViewChild('mobileNavContainer', { static: false }) mobileNavContainer?: ElementRef<HTMLElement>;
  showRightArrow = false;

  constructor(
    private location: Location,
    private http: HttpClient,
    private languageService: LanguageService,
    private themeService: ThemeService,
    private modalService: ModalService,
    private router: Router,
    private cdr: ChangeDetectorRef,
    private scrollRestorationService: ScrollRestorationService
  ) {
    // Get the base href and construct the logo path
    const baseHref = this.location.prepareExternalUrl('/');
    this.logoPath = baseHref + 'assets/videos/slogo.png';
  }

  ngOnInit() {
    console.log('[Header] ngOnInit called');
    this.fetchReaderCount();
    this.fetchWeather();
    this.currentLanguage = this.languageService.getCurrentLanguage();
    console.log('[Header] Initial currentLanguage:', this.currentLanguage);
    this.currentTheme = this.themeService.getCurrentTheme();
    
    // Check if we're on desktop
    if (typeof window !== 'undefined') {
      this.isDesktop = window.innerWidth >= 1024;
    }
    
    // Check if we're on home page initially
    this.checkIfHomePage();
    
    this.setupFixedHeader();
    // Calculate top bar height on init and force change detection
    setTimeout(() => {
      if (typeof window !== 'undefined' && window.innerWidth >= 1024) {
        const topBar = document.querySelector('app-header .header-wrapper > div:first-child');
        if (topBar) {
          this.topBarHeight = (topBar as HTMLElement).offsetHeight;
        }
      }
    }, 200);
    // Initialize translations first
    this.updateTranslations();
    // Then update dependent data
    this.updateDate();
    this.updateNavLinks();
    
    // Check initial scroll position
    this.onWindowScroll();
    
    // Check if we're on home page and trigger bounce animation
    if (this.router.url === '/' || this.router.url === '') {
      setTimeout(() => {
        this.showNavBounce = true;
        setTimeout(() => {
          this.showNavBounce = false;
        }, 1000);
      }, 500);
    }
    
    // Subscribe to route changes to trigger bounce on home page navigation and update home page status
    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe((event: any) => {
      this.checkIfHomePage();
      if (event.url === '/' || event.url === '') {
        setTimeout(() => {
          this.showNavBounce = true;
          setTimeout(() => {
            this.showNavBounce = false;
          }, 1000);
        }, 500);
      }
    });
    
    // Subscribe to language changes
    console.log('[Header] Subscribing to language changes...');
    this.languageSubscription = this.languageService.currentLanguage$.subscribe(lang => {
      console.log('[Header] Language subscription triggered, new language:', lang);
      this.currentLanguage = lang;
      this.updateTranslations();
      this.updateDate();
      this.updateNavLinks();
      console.log('[Header] Header updated for language:', lang);
    });
    console.log('[Header] Language subscription set up, current language:', this.currentLanguage);
    console.log('[Header] Component initialized successfully');

    // Subscribe to theme changes
    this.themeSubscription = this.themeService.theme$.subscribe(theme => {
      this.currentTheme = theme;
    });

    // Subscribe to modal state changes
    this.modalService.getModalState().subscribe(state => {
      this.isModalOpen = state.isOpen;
      this.cdr.detectChanges();
    });

    // Refresh weather every 30 minutes
    this.weatherRefreshInterval = setInterval(() => {
      this.fetchWeather();
    }, 30 * 60 * 1000);
  }

  ngAfterViewInit() {
    // Check mobile nav scroll state after view init
    setTimeout(() => {
      this.checkMobileNavScroll();
    }, 100);
  }

  ngOnDestroy() {
    this.languageSubscription?.unsubscribe();
    this.themeSubscription?.unsubscribe();
    if (this.weatherRefreshInterval) {
      clearInterval(this.weatherRefreshInterval);
    }
  }

  checkMobileNavScroll() {
    if (!this.mobileNavContainer || typeof window === 'undefined') {
      return;
    }
    
    // Only check on mobile view
    if (window.innerWidth >= 1024) {
      this.showRightArrow = false;
      return;
    }
    
    const navElement = this.mobileNavContainer.nativeElement;
    const scrollLeft = navElement.scrollLeft;
    const scrollWidth = navElement.scrollWidth;
    const clientWidth = navElement.clientWidth;
    
    // Calculate if user has scrolled to the extreme right
    // Use a small threshold (5px) to account for rounding and sub-pixel rendering
    const isAtRightEnd = scrollLeft >= (scrollWidth - clientWidth - 5);
    
    // Show arrow only if:
    // 1. Content is wider than container (scrollable)
    // 2. User hasn't scrolled all the way to the right
    this.showRightArrow = scrollWidth > clientWidth && !isAtRightEnd;
    this.cdr.detectChanges();
  }

  onNavLinkClick(route: string) {
    // Clear any saved scroll position for the target route to ensure it always starts at top
    this.scrollRestorationService.clearScrollPosition(route);
    
    // Scroll to top immediately
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;
    
    // Also scroll to top after navigation completes
    setTimeout(() => {
      window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
      document.documentElement.scrollTop = 0;
      document.body.scrollTop = 0;
    }, 100);
  }

  onLanguageButtonMouseDown(event: MouseEvent) {
    console.log('[Header] Language button mousedown event fired!', event);
  }

  toggleLanguage() {
    console.log('[Header] ===== toggleLanguage() METHOD CALLED =====');
    console.log('[Header] Current language before toggle:', this.currentLanguage);
    const newLang = this.currentLanguage === 'en' ? 'hi' : 'en';
    console.log('[Header] Toggling language from', this.currentLanguage, 'to', newLang);
    console.log('[Header] Calling languageService.setLanguage(', newLang, ')');
    try {
      this.languageService.setLanguage(newLang);
      const updatedLang = this.languageService.getCurrentLanguage();
      console.log('[Header] Language toggle complete, current language:', updatedLang);
      console.log('[Header] this.currentLanguage after service call:', this.currentLanguage);
    } catch (error) {
      console.error('[Header] ERROR in toggleLanguage:', error);
    }
    console.log('[Header] ===== toggleLanguage() METHOD END =====');
  }

  toggleTheme() {
    this.themeService.toggleTheme();
  }

  updateTranslations() {
    this.t = this.languageService.getTranslations();
  }

  updateDate() {
    const locale = this.currentLanguage === 'hi' ? 'hi-IN' : 'en-IN';
    this.currentDate = new Date().toLocaleDateString(locale, {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  }

  updateNavLinks() {
    // Ensure translations are loaded
    if (!this.t || !this.t.home) {
      this.updateTranslations();
    }
    this.navLinks = [
      { name: this.t.home || 'Home', route: '/' },
      { name: this.t.national || 'National', route: '/category/national' },
      { name: this.t.international || 'International', route: '/category/international' },
      { name: this.t.religious || 'Religious', route: '/category/religious' },
      { name: this.t.politics || 'Politics', route: '/category/politics' },
      { name: this.t.health || 'Health', route: '/category/health' },
      { name: this.t.entertainment || 'Entertainment', route: '/category/entertainment' },
      { name: this.t.sports || 'Sports', route: '/category/sports' },
      { name: this.t.business || 'Business', route: '/category/business' },
    ];
    // Check mobile nav scroll state after nav links update
    setTimeout(() => {
      this.checkMobileNavScroll();
    }, 100);
  }

  fetchReaderCount() {
    this.http.get<{ success: boolean; data: { readerCount: number } }>(`${this.apiUrl}/api/stats`).pipe(
      catchError(error => {
        console.error('Error fetching reader count:', error);
        return of({ success: false, data: { readerCount: 4320 } });
      })
    ).subscribe(response => {
      if (response.success) {
        this.readerCount = response.data.readerCount;
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
        this.currentTemperature = Math.round(data.current.temperature_2m);
      }
    });
  }

  @HostListener('window:scroll', [])
  onWindowScroll() {
    this.updateScrollState();
  }

  @HostListener('window:resize', [])
  onWindowResize() {
    // Update desktop state
    if (typeof window !== 'undefined') {
      this.isDesktop = window.innerWidth >= 1024;
    }
    this.updateScrollState();
    // Recalculate top bar height on resize
    if (typeof window !== 'undefined' && window.innerWidth >= 1024) {
      setTimeout(() => {
        const topBar = document.querySelector('app-header .header-wrapper > div:first-child');
        if (topBar) {
          this.topBarHeight = (topBar as HTMLElement).offsetHeight;
        }
      }, 100);
    }
    // Check mobile nav scroll state on resize
    setTimeout(() => {
      this.checkMobileNavScroll();
    }, 100);
  }

  private updateScrollState() {
    // Only apply sticky behavior on desktop (lg breakpoint and above)
    // Check if window width is >= 1024px (lg breakpoint)
    if (window.innerWidth >= 1024) {
      const scrollPosition = window.pageYOffset || document.documentElement.scrollTop || document.body.scrollTop || 0;
      // Once user scrolls down, keep header sticky even when scrolling back up
      // Only reset to relative when at the very top (within 5px)
      const wasScrolled = this.isScrolled;
      this.isScrolled = scrollPosition > 5;
      
      // Force change detection if state changed
      if (wasScrolled !== this.isScrolled) {
        // Trigger change detection
        setTimeout(() => {}, 0);
      }
    } else {
      // On mobile, keep header always sticky (original behavior)
      this.isScrolled = false;
    }
  }
  
  
  getTopBarClasses(): string {
    const baseClasses = 'bg-secondary/50 backdrop-blur-md border-b border-border/50 transition-all duration-300 w-full';
    if (typeof window !== 'undefined' && window.innerWidth >= 1024) {
      // Desktop: fixed below navigation, scrolls away when scrolled
      if (this.isScrolled) {
        return `${baseClasses} -translate-y-full opacity-0`;
      }
      return baseClasses;
    }
    // Mobile: always visible
    return baseClasses;
  }

  getTopBarPosition(): string {
    if (typeof window !== 'undefined' && window.innerWidth >= 1024) {
      return 'fixed';
    }
    return 'sticky';
  }

  getTopBarTop(): number {
    // Calculate navigation header height to position top bar below it
    const navHeader = document.querySelector('app-header header.main-header');
    if (navHeader) {
      const height = (navHeader as HTMLElement).offsetHeight;
      if (height > 0) {
        return height;
      }
    }
    // Fallback to approximate navigation bar height (reduced by 20%)
    if (typeof window !== 'undefined' && window.innerWidth >= 1024) {
      return 64; // Approximate height of navigation bar on desktop (80px * 0.8)
    }
    return 64; // Approximate height on mobile too
  }

  getHeaderTop(): number {
    // Navigation header is always at top: 0
    return 0;
  }

  getHeaderPosition(): string {
    if (typeof window !== 'undefined' && window.innerWidth >= 1024) {
      return 'fixed';
    }
    return 'sticky';
  }

  private setupFixedHeader() {
    if (typeof window !== 'undefined' && window.innerWidth >= 1024) {
      // Calculate top bar height for desktop
      setTimeout(() => {
        const topBar = document.querySelector('app-header .header-wrapper > div:first-child');
        if (topBar) {
          this.topBarHeight = (topBar as HTMLElement).offsetHeight;
        }
      }, 100);
    }
  }

  private checkIfHomePage() {
    const url = this.router.url;
    const wasHomePage = this.isHomePage;
    this.isHomePage = url === '/' || url === '' || url === '/home';
    console.log('[Header] checkIfHomePage - URL:', url, 'isHomePage:', this.isHomePage);
    // Trigger change detection if the value changed
    if (wasHomePage !== this.isHomePage) {
      this.cdr.detectChanges();
    }
  }

}

