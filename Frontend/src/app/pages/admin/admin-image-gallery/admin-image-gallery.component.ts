import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Router, RouterModule } from '@angular/router';
import { environment } from '../../../../environments/environment';
import { AdminThemeService, AdminTheme } from '../../../services/admin-theme.service';
import { Subscription } from 'rxjs';

interface GalleryImage {
  url: string;
  newsId: string;
  slug: string;
  title: string;
  createdAt: string;
}

@Component({
  selector: 'app-admin-image-gallery',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="min-h-screen bg-background py-8">
      <div class="container mx-auto px-4 max-w-7xl">
        @if (isAuthenticated) {
          <div class="space-y-6">
            <!-- Header -->
            <div class="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div class="flex flex-wrap items-center gap-3 md:gap-4">
                <a routerLink="/admin" class="text-primary hover:text-primary/80 flex-shrink-0 transition-colors">
                  <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                  </svg>
                </a>
                <h1 class="text-2xl md:text-3xl font-bold truncate min-w-0">Image Gallery</h1>
                <span class="px-3 py-1 text-sm bg-cyan-500/15 text-cyan-600 dark:text-cyan-400 rounded-full whitespace-nowrap">
                  {{ images.length }} images
                </span>
              </div>
              <div class="flex items-center gap-3 flex-shrink-0">
                <button
                  (click)="toggleAdminTheme()"
                  [attr.aria-label]="currentAdminTheme === 'light' ? 'Switch to Dark Mode' : 'Switch to Light Mode'"
                  [class]="'relative w-12 h-7 rounded-full transition-all duration-300 ease-in-out focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-1 shadow-lg ' + (currentAdminTheme === 'dark' ? 'bg-gradient-to-r from-gray-700 to-gray-900 shadow-gray-700/50' : 'bg-gradient-to-r from-yellow-400 to-orange-500 shadow-yellow-400/50')">
                  <div
                    [class]="'absolute top-0.5 left-0.5 w-6 h-6 bg-white rounded-full shadow-md transform transition-transform duration-300 ease-in-out flex items-center justify-center ' + (currentAdminTheme === 'dark' ? 'translate-x-[22px]' : '')">
                    @if (currentAdminTheme === 'dark') {
                      <svg class="w-3.5 h-3.5 text-gray-800" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                      </svg>
                    } @else {
                      <svg class="w-3.5 h-3.5 text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                      </svg>
                    }
                  </div>
                </button>
                <button
                  (click)="logout()"
                  class="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors">
                  Logout
                </button>
              </div>
            </div>

            <!-- Loading -->
            @if (loading) {
              <div class="flex flex-col items-center justify-center py-20">
                <div class="w-12 h-12 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin mb-4"></div>
                <p class="text-muted-foreground">Loading images...</p>
              </div>
            }

            <!-- Empty state -->
            @if (!loading && images.length === 0) {
              <div class="glass-card p-16 rounded-2xl text-center">
                <div class="w-24 h-24 mx-auto mb-6 bg-cyan-500/10 rounded-full flex items-center justify-center">
                  <svg class="w-12 h-12 text-cyan-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <h2 class="text-xl font-bold mb-2">No images yet</h2>
                <p class="text-muted-foreground max-w-md mx-auto">Published news with images will appear here. Create and publish posts to see them in the gallery.</p>
              </div>
            }

            <!-- Masonry-style image grid -->
            @if (!loading && images.length > 0) {
              <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                @for (img of images; track img.url + img.newsId) {
                  <a
                    [routerLink]="['/news', img.slug || img.newsId]"
                    target="_blank"
                    class="group relative block aspect-square overflow-hidden rounded-xl bg-secondary/30 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-[1.02] hover:-translate-y-1">
                    <img
                      [src]="getImageUrl(img.url)"
                      [alt]="img.title"
                      loading="lazy"
                      class="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                      (error)="onImageError($event)" />
                    <!-- Overlay on hover -->
                    <div class="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-3">
                      <p class="text-white text-sm font-medium line-clamp-2 drop-shadow-lg">{{ img.title || 'News image' }}</p>
                      <p class="text-white/80 text-xs mt-1">{{ formatDate(img.createdAt) }}</p>
                    </div>
                    <!-- Click hint -->
                    <div class="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity p-1.5 bg-white/90 dark:bg-gray-800/90 rounded-lg">
                      <svg class="w-4 h-4 text-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                      </svg>
                    </div>
                  </a>
                }
              </div>
            }
          </div>
        } @else {
          <!-- Login redirect -->
          <div class="max-w-md mx-auto">
            <div class="glass-card p-8 rounded-xl text-center">
              <p class="text-muted-foreground mb-4">Please log in to view the image gallery.</p>
              <a routerLink="/admin" class="text-primary hover:underline font-medium">Go to Admin Login</a>
            </div>
          </div>
        }
      </div>

      <!-- Lightbox (full-screen view on click) - optional enhancement, using external link for now -->
    </div>
  `,
  styles: []
})
export class AdminImageGalleryComponent implements OnInit, OnDestroy {
  isAuthenticated = false;
  currentAdminTheme: AdminTheme = 'light';
  private adminThemeSubscription?: Subscription;
  authToken = '';
  images: GalleryImage[] = [];
  loading = false;

  constructor(
    private http: HttpClient,
    private router: Router,
    private adminThemeService: AdminThemeService
  ) {
    const token = localStorage.getItem('admin_token');
    if (token) {
      this.authToken = token;
      this.verifyToken();
    }
  }

  ngOnInit() {
    this.currentAdminTheme = this.adminThemeService.getCurrentTheme();
    this.adminThemeService.checkAndApplyTheme();
    this.adminThemeSubscription = this.adminThemeService.theme$.subscribe(theme => {
      this.currentAdminTheme = theme;
    });
  }

  ngOnDestroy() {
    this.adminThemeSubscription?.unsubscribe();
  }

  toggleAdminTheme() {
    this.adminThemeService.toggleTheme();
  }

  verifyToken() {
    const headers = new HttpHeaders().set('Authorization', `Bearer ${this.authToken}`);
    this.http.get<{ valid: boolean }>(`${this.getApiUrl()}/api/auth/verify`, { headers }).subscribe({
      next: (response) => {
        if (response.valid) {
          this.isAuthenticated = true;
          this.fetchImages();
        } else {
          this.clearAuth();
        }
      },
      error: () => this.clearAuth()
    });
  }

  fetchImages() {
    this.loading = true;
    const headers = new HttpHeaders().set('Authorization', `Bearer ${this.authToken}`);
    this.http.get<{ success: boolean; items: GalleryImage[] }>(`${this.getApiUrl()}/api/news/images/gallery`, { headers }).subscribe({
      next: (response) => {
        if (response.success && response.items) {
          this.images = response.items;
        } else {
          this.images = [];
        }
        this.loading = false;
      },
      error: () => {
        this.images = [];
        this.loading = false;
      }
    });
  }

  getImageUrl(url: string): string {
    if (!url) return '';
    if (url.startsWith('http')) return url;
    const base = this.getApiUrl();
    const path = url.startsWith('/') ? url : `/${url}`;
    return base ? `${base}${path}` : path;
  }

  onImageError(event: Event) {
    const el = event.target as HTMLImageElement;
    el.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="200" height="200" viewBox="0 0 200 200"%3E%3Crect fill="%23e5e7eb" width="200" height="200"/%3E%3Ctext fill="%239ca3af" font-family="sans-serif" font-size="14" x="50%25" y="50%25" dominant-baseline="middle" text-anchor="middle"%3EImage not found%3C/text%3E%3C/svg%3E';
    el.onerror = null;
  }

  formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }

  logout() {
    this.clearAuth();
    this.router.navigate(['/admin']);
  }

  private clearAuth() {
    localStorage.removeItem('admin_token');
    this.authToken = '';
    this.isAuthenticated = false;
  }

  private getApiUrl(): string {
    return (environment.apiUrl !== undefined && environment.apiUrl !== null && String(environment.apiUrl).trim() !== '')
      ? environment.apiUrl
      : (environment.production ? '' : 'http://localhost:3000');
  }
}
