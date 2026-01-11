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

  constructor(
    private router: Router,
    private location: Location
  ) {
    this.initialize();
  }

  private initialize() {
    // Save scroll position before navigation
    this.routerSubscription = this.router.events
      .pipe(filter(event => event instanceof NavigationEnd))
      .subscribe((event: any) => {
        if (!this.isRestoring) {
          // Save current scroll position for the route we're leaving
          if (this.currentRoute) {
            const scrollPosition = window.pageYOffset || document.documentElement.scrollTop || document.body.scrollTop || 0;
            this.scrollPositions.set(this.currentRoute, scrollPosition);
            console.log('[ScrollRestoration] Saved scroll position for route:', this.currentRoute, scrollPosition);
          }
        }

        // Update current route
        this.currentRoute = event.urlAfterRedirects || event.url;
        
        // Restore scroll position for the new route after a short delay
        if (!this.isRestoring) {
          setTimeout(() => {
            this.restoreScrollPosition(this.currentRoute);
          }, 100);
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
    this.scrollPositions.set(routeKey, scrollPosition);
    console.log('[ScrollRestoration] Saved scroll position for route:', routeKey, scrollPosition);
  }

  restoreScrollPosition(route?: string): void {
    const routeKey = route || this.currentRoute || this.router.url;
    const savedPosition = this.scrollPositions.get(routeKey);
    
    if (savedPosition !== undefined) {
      this.isRestoring = true;
      console.log('[ScrollRestoration] Restoring scroll position for route:', routeKey, savedPosition);
      
      // Use requestAnimationFrame to ensure DOM is ready
      requestAnimationFrame(() => {
        window.scrollTo({
          top: savedPosition,
          left: 0,
          behavior: 'auto' // Instant scroll, not smooth
        });
        
        // Also set directly as fallback
        document.documentElement.scrollTop = savedPosition;
        document.body.scrollTop = savedPosition;
        
        // Reset flag after a short delay
        setTimeout(() => {
          this.isRestoring = false;
        }, 50);
      });
    } else {
      console.log('[ScrollRestoration] No saved scroll position for route:', routeKey);
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

