import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive, Router, NavigationEnd } from '@angular/router';
import { Location } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { ButtonComponent } from '../../ui/button/button.component';
import { LanguageService, Language } from '../../services/language.service';
import { ThemeService, Theme } from '../../services/theme.service';
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
  template: `
    <header class="sticky top-0 z-50">
      <!-- Top Bar -->
      <div class="bg-secondary/50 backdrop-blur-sm border-b border-border/50">
        <div class="container mx-auto px-4 py-2 flex items-center justify-between text-sm">
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

      <!-- Main Header -->
      <div class="glass-card border-b border-border/30">
        <div class="container mx-auto px-4 py-4">
          <div class="flex items-center justify-between gap-3">
            <!-- Logo -->
            <a [routerLink]="'/'" class="flex items-center gap-3 group shrink-0">
              <div class="relative w-12 h-12 shrink-0">
                <img 
                  [src]="logoPath" 
                  alt="NewsAddaIndia Logo" 
                  class="w-full h-full rounded-xl object-cover transition-all duration-300"
                  style="box-shadow: 0 0 15px rgba(37, 99, 235, 0.6), 0 0 30px rgba(37, 99, 235, 0.4);"
                  loading="eager"
                  width="48"
                  height="48" />
                <div class="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-accent animate-pulse"></div>
              </div>
              <div>
                <h1 class="font-display text-base sm:text-xl font-bold tracking-tight">
                  <span style="color: #FF9933;">News</span>
                  <span style="color: #FFFFFF; -webkit-text-stroke: 2px #2563EB; text-stroke: 2px #2563EB; paint-order: stroke fill;">Adda</span>
                  <span style="color: #138808;">India</span>
                </h1>
                <p class="text-[10px] sm:text-xs text-muted-foreground -mt-0.5">{{ t.yourDailyNewsCompanion }}</p>
              </div>
            </a>

            <!-- Desktop Navigation -->
            <nav class="hidden lg:flex items-center gap-1">
              @for (link of navLinks; track link.name) {
                <a
                  [routerLink]="link.route"
                  routerLinkActive="text-primary font-semibold bg-primary/10"
                  [routerLinkActiveOptions]="{exact: link.route === '/'}"
                  class="nav-link px-4 py-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary/50 transition-all">
                  {{ link.name }}
                </a>
              }
            </nav>

            <!-- Actions -->
            <div class="flex items-center gap-3 shrink-0">
              <!-- Language Toggle Switch (E -> H) -->
              <button
                type="button"
                (click)="toggleLanguage(); $event.stopPropagation()"
                (mousedown)="onLanguageButtonMouseDown($event)"
                [attr.aria-label]="currentLanguage === 'en' ? 'Switch to Hindi' : 'Switch to English'"
                [class]="'relative w-14 h-8 rounded-full transition-all duration-300 ease-in-out focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 shadow-lg z-50 ' + (currentLanguage === 'en' ? 'bg-gradient-to-r from-blue-500 to-blue-600 shadow-blue-500/50' : 'bg-gradient-to-r from-orange-500 to-orange-600 shadow-orange-500/50')"
                style="cursor: pointer; position: relative; z-index: 50;">
                <!-- Toggle Circle -->
                <div
                  [class]="'absolute top-1 left-1 w-6 h-6 bg-white rounded-full shadow-md transform transition-transform duration-300 ease-in-out flex items-center justify-center font-bold text-xs ' + (currentLanguage === 'hi' ? 'translate-x-6 text-orange-600' : 'text-blue-600')">
                  {{ currentLanguage === 'en' ? 'E' : 'H' }}
                </div>
                <!-- Language Labels -->
                <div class="absolute inset-0 flex items-center justify-between px-2 text-xs font-semibold text-white">
                  <span [class]="'transition-opacity duration-300 ' + (currentLanguage === 'en' ? 'opacity-100' : 'opacity-50')">E</span>
                  <span [class]="'transition-opacity duration-300 ' + (currentLanguage === 'hi' ? 'opacity-100' : 'opacity-50')">H</span>
                </div>
              </button>
              <!-- Theme Toggle Switch (Light -> Dark) -->
              <button
                (click)="toggleTheme()"
                [attr.aria-label]="currentTheme === 'light' ? 'Switch to Dark Mode' : 'Switch to Light Mode'"
                [class]="'relative w-14 h-8 rounded-full transition-all duration-300 ease-in-out focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 shadow-lg ' + (currentTheme === 'dark' ? 'bg-gradient-to-r from-gray-700 to-gray-900 shadow-gray-700/50' : 'bg-gradient-to-r from-yellow-400 to-orange-500 shadow-yellow-400/50')">
                <!-- Toggle Circle -->
                <div
                  [class]="'absolute top-1 left-1 w-6 h-6 bg-white rounded-full shadow-md transform transition-transform duration-300 ease-in-out flex items-center justify-center ' + (currentTheme === 'dark' ? 'translate-x-6' : '')">
                  @if (currentTheme === 'dark') {
                    <svg class="w-4 h-4 text-gray-800" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                    </svg>
                  } @else {
                    <svg class="w-4 h-4 text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                    </svg>
                  }
                </div>
                <!-- Theme Labels -->
                <div class="absolute inset-0 flex items-center justify-between px-2 text-xs font-semibold text-white">
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
      </div>

      <!-- Mobile Navigation Bar -->
      <nav class="lg:hidden bg-background/95 backdrop-blur-sm border-b border-border/30 overflow-x-auto scrollbar-hide" style="scrollbar-width: none; -ms-overflow-style: none; -webkit-overflow-scrolling: touch; touch-action: pan-x;">
        <div [class]="'flex items-center gap-2 whitespace-nowrap px-4 py-0.5 ' + (showNavBounce ? 'nav-bounce-left' : '')">
          @for (link of navLinks; track link.name) {
            <a
              [routerLink]="link.route"
              routerLinkActive="text-primary font-bold bg-primary/15 border border-primary/30"
              [routerLinkActiveOptions]="{exact: link.route === '/'}"
              class="px-3 py-1 rounded-md text-xs font-medium text-foreground hover:text-primary hover:bg-secondary/70 active:bg-secondary transition-all shrink-0 min-w-fit border border-transparent touch-manipulation">
              {{ link.name }}
            </a>
          }
        </div>
      </nav>
    </header>
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
  `]
})
export class HeaderComponent implements OnInit, OnDestroy {
  logoPath: string;
  readerCount = 4320;
  currentLanguage: Language = 'en';
  currentTheme: Theme = 'light';
  t: any = {};
  currentDate = '';
  currentTemperature: number | null = null;
  private apiUrl = environment.apiUrl || 'http://localhost:3000';
  private languageSubscription?: Subscription;
  private themeSubscription?: Subscription;
  private weatherRefreshInterval: any;

  navLinks: NavLink[] = [];
  showNavBounce = false;

  constructor(
    private location: Location,
    private http: HttpClient,
    private languageService: LanguageService,
    private themeService: ThemeService,
    private router: Router
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
    // Initialize translations first
    this.updateTranslations();
    // Then update dependent data
    this.updateDate();
    this.updateNavLinks();
    
    // Check if we're on home page and trigger bounce animation
    if (this.router.url === '/' || this.router.url === '') {
      setTimeout(() => {
        this.showNavBounce = true;
        setTimeout(() => {
          this.showNavBounce = false;
        }, 1000);
      }, 500);
    }
    
    // Subscribe to route changes to trigger bounce on home page navigation
    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe((event: any) => {
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

    // Refresh weather every 30 minutes
    this.weatherRefreshInterval = setInterval(() => {
      this.fetchWeather();
    }, 30 * 60 * 1000);
  }

  ngOnDestroy() {
    this.languageSubscription?.unsubscribe();
    this.themeSubscription?.unsubscribe();
    if (this.weatherRefreshInterval) {
      clearInterval(this.weatherRefreshInterval);
    }
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


}

