import { Injectable } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';
import { Location } from '@angular/common';
import { filter } from 'rxjs/operators';
import { Subscription } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ScrollRestorationService {
  private scrollPositions: Map<string, number> = new Map();
  private currentRoute: string = '';
  private routerSubscription?: Subscription;
  private isRestoring: boolean = false;
  private popStateHandler?: () => void;
  private readonly STORAGE_KEY = 'news_adda_scroll_positions';

  constructor(
    private router: Router,
    private location: Location
  ) {
    // Load saved scroll positions from sessionStorage (survives page reloads)
    this.loadScrollPositionsFromStorage();
    this.initialize();
  }
  
  private loadScrollPositionsFromStorage(): void {
    try {
      if (typeof window !== 'undefined' && window.sessionStorage) {
        const stored = sessionStorage.getItem(this.STORAGE_KEY);
        if (stored) {
          const parsed = JSON.parse(stored);
          this.scrollPositions = new Map(Object.entries(parsed));
          console.log('[ScrollRestoration] Loaded scroll positions from storage:', this.scrollPositions.size);
        }
      }
    } catch (error) {
      console.error('[ScrollRestoration] Error loading scroll positions from storage:', error);
    }
  }
  
  private saveScrollPositionsToStorage(): void {
    try {
      if (typeof window !== 'undefined' && window.sessionStorage) {
        const toStore = Object.fromEntries(this.scrollPositions);
        sessionStorage.setItem(this.STORAGE_KEY, JSON.stringify(toStore));
      }
    } catch (error) {
      console.error('[ScrollRestoration] Error saving scroll positions to storage:', error);
    }
  }

  private initialize() {
    // Save scroll position before navigation
    this.routerSubscription = this.router.events
      .pipe(filter(event => event instanceof NavigationEnd))
      .subscribe((event: any) => {
        const previousRoute = this.currentRoute;
        const newRoute = event.urlAfterRedirects || event.url;
        
        if (!this.isRestoring && previousRoute) {
          // Save current scroll position for the route we're leaving
          const scrollPosition = window.pageYOffset || document.documentElement.scrollTop || document.body.scrollTop || 0;
          if (scrollPosition > 0) {
            this.scrollPositions.set(previousRoute, scrollPosition);
            this.saveScrollPositionsToStorage(); // Persist to sessionStorage
            console.log('[ScrollRestoration] Saved scroll position for route:', previousRoute, scrollPosition);
          }
        }

        // Update current route
        this.currentRoute = newRoute;
        
        // Restore scroll position for the new route after delays to handle content loading
        // BUT: Skip restoration for detail routes (/news/:id) - they should always start at top
        if (!this.isRestoring && !newRoute.startsWith('/news/')) {
          // Multiple restore attempts to handle lazy loading and content rendering
          setTimeout(() => {
            this.restoreScrollPosition(newRoute);
          }, 50);
          
          setTimeout(() => {
            this.restoreScrollPosition(newRoute);
          }, 200);
          
          setTimeout(() => {
            this.restoreScrollPosition(newRoute);
          }, 500);
        } else if (newRoute.startsWith('/news/')) {
          // For detail routes, ensure scroll is at top and clear any saved position
          console.log('[ScrollRestoration] Detail route detected, clearing scroll position and forcing top');
          this.clearScrollPosition(newRoute);
          setTimeout(() => {
            window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
            document.documentElement.scrollTop = 0;
            document.body.scrollTop = 0;
          }, 0);
        }
      });

    // Handle browser back/forward buttons using window popstate event
    if (typeof window !== 'undefined') {
      this.popStateHandler = () => {
        const currentUrl = this.router.url;
        setTimeout(() => {
          this.restoreScrollPosition(currentUrl);
        }, 100);
      };
      window.addEventListener('popstate', this.popStateHandler);
    }
  }

  saveScrollPosition(route?: string): void {
    const routeKey = route || this.currentRoute || this.router.url;
    const scrollPosition = window.pageYOffset || document.documentElement.scrollTop || document.body.scrollTop || 0;
    if (scrollPosition > 0) {
      this.scrollPositions.set(routeKey, scrollPosition);
      this.saveScrollPositionsToStorage(); // Persist to sessionStorage
      console.log('[ScrollRestoration] Saved scroll position for route:', routeKey, scrollPosition);
    }
  }

  restoreScrollPosition(route?: string): void {
    const routeKey = route || this.currentRoute || this.router.url;
    const savedPosition = this.scrollPositions.get(routeKey);
    
    if (savedPosition !== undefined && savedPosition > 0) {
      this.isRestoring = true;
      console.log('[ScrollRestoration] Restoring scroll position for route:', routeKey, savedPosition);
      
      // Use requestAnimationFrame to ensure DOM is ready
      requestAnimationFrame(() => {
        // Multiple restore attempts to ensure it works
        window.scrollTo({
          top: savedPosition,
          left: 0,
          behavior: 'auto' // Instant scroll, not smooth
        });
        
        // Also set directly as fallback
        document.documentElement.scrollTop = savedPosition;
        document.body.scrollTop = savedPosition;
        
        // Additional restore after a tiny delay
        setTimeout(() => {
          window.scrollTo({
            top: savedPosition,
            left: 0,
            behavior: 'auto'
          });
          document.documentElement.scrollTop = savedPosition;
          document.body.scrollTop = savedPosition;
        }, 10);
        
        // Reset flag after a short delay
        setTimeout(() => {
          this.isRestoring = false;
        }, 100);
      });
    } else {
      console.log('[ScrollRestoration] No saved scroll position for route:', routeKey, '(savedPosition:', savedPosition, ')');
    }
  }

  clearScrollPosition(route?: string): void {
    const routeKey = route || this.currentRoute || this.router.url;
    this.scrollPositions.delete(routeKey);
    console.log('[ScrollRestoration] Cleared scroll position for route:', routeKey);
  }

  clearAllScrollPositions(): void {
    this.scrollPositions.clear();
    console.log('[ScrollRestoration] Cleared all scroll positions');
  }

  getScrollPosition(route?: string): number {
    const routeKey = route || this.currentRoute || this.router.url;
    return this.scrollPositions.get(routeKey) || 0;
  }

  ngOnDestroy() {
    this.routerSubscription?.unsubscribe();
    if (typeof window !== 'undefined' && this.popStateHandler) {
      window.removeEventListener('popstate', this.popStateHandler);
    }
  }
}

