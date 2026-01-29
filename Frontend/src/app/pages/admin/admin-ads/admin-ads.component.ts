import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Router, RouterModule } from '@angular/router';
import { environment } from '../../../../environments/environment';
import { AdminThemeService, AdminTheme } from '../../../services/admin-theme.service';
import { Subscription } from 'rxjs';

interface Ad {
  _id?: string;
  adId: string;
  enabled: boolean;
  mediaType: 'image' | 'video' | null;
  mediaUrl: string | null;
  linkUrl: string | null;
  altText: string;
  createdAt?: string;
  updatedAt?: string;
}

@Component({
  selector: 'app-admin-ads',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  template: `
    <div class="min-h-screen bg-background py-8">
      <div class="container mx-auto px-4 max-w-7xl">
        @if (isAuthenticated) {
          <div class="space-y-6">
            <div class="flex items-center justify-between">
              <div class="flex items-center gap-4">
                <a routerLink="/admin" class="text-primary hover:text-primary/80">
                  <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                  </svg>
                </a>
                <h1 class="text-3xl font-bold">Ad Management</h1>
              </div>
              <div class="flex items-center gap-3">
                <!-- Theme Toggle Button -->
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
                  class="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600">
                  Logout
                </button>
              </div>
            </div>

            <!-- Main Toggle Switch -->
            <div class="glass-card p-6 rounded-xl">
              <div class="flex items-center justify-between">
                <div>
                  <h2 class="text-xl font-bold mb-2">All Ads</h2>
                  <p class="text-muted-foreground text-sm">Toggle all ad spaces on or off</p>
                </div>
                <label class="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    [(ngModel)]="allAdsEnabled"
                    (change)="toggleAllAds()"
                    class="sr-only peer"
                  />
                  <div class="w-14 h-7 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary/20 dark:peer-focus:ring-primary/40 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[4px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all dark:border-gray-600 peer-checked:bg-primary"></div>
                  <span class="ml-3 text-sm font-medium text-foreground">
                    {{ allAdsEnabled ? 'Enabled' : 'Disabled' }}
                  </span>
                </label>
              </div>
            </div>

            <!-- Ad Spaces -->
            <div class="space-y-6">
              @for (ad of ads; track ad.adId) {
                <div class="glass-card p-6 rounded-xl">
                  <div class="flex items-center justify-between mb-4">
                    <h3 class="text-xl font-bold">{{ ad.adId.toUpperCase() }}</h3>
                    <label class="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        [checked]="ad.enabled"
                        (change)="toggleAd(ad.adId, $event)"
                        class="sr-only peer"
                      />
                      <div class="w-14 h-7 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary/20 dark:peer-focus:ring-primary/40 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[4px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all dark:border-gray-600 peer-checked:bg-primary"></div>
                      <span class="ml-3 text-sm font-medium text-foreground">
                        {{ ad.enabled ? 'Enabled' : 'Disabled' }}
                      </span>
                    </label>
                  </div>

                  <!-- Current Media Preview -->
                  @if (ad.mediaUrl) {
                    <div class="mb-4 p-4 bg-secondary/50 rounded-lg">
                      <p class="text-sm font-medium mb-2">Current Media:</p>
                      @if (ad.mediaType === 'image') {
                        <img
                          [src]="getMediaUrl(ad.mediaUrl)"
                          [alt]="ad.altText || ad.adId"
                          class="max-w-full h-auto max-h-64 rounded-lg"
                        />
                      } @else if (ad.mediaType === 'video') {
                        <video
                          [src]="getMediaUrl(ad.mediaUrl)"
                          controls
                          class="max-w-full h-auto max-h-64 rounded-lg"
                        ></video>
                      }
                      <button
                        (click)="deleteMedia(ad.adId)"
                        class="mt-2 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 text-sm">
                        Delete Media
                      </button>
                    </div>
                  }

                  <!-- Upload Section -->
                  <div class="space-y-4">
                    <div>
                      <label class="block text-sm font-medium mb-2">Upload Image/Video</label>
                      <input
                        type="file"
                        [id]="'file-' + ad.adId"
                        accept="image/*,video/*"
                        (change)="onFileSelected(ad.adId, $event)"
                        class="w-full px-4 py-2 rounded-lg border border-border bg-background text-foreground"
                      />
                      <p class="text-xs text-muted-foreground mt-1">Accepted: Images (JPG, PNG, GIF, WebP) and Videos (MP4, WebM, etc.)</p>
                    </div>

                    <div>
                      <label class="block text-sm font-medium mb-2">Link URL (optional)</label>
                      <input
                        type="url"
                        [(ngModel)]="ad.linkUrl"
                        (blur)="updateAd(ad.adId, { linkUrl: ad.linkUrl })"
                        placeholder="https://example.com"
                        class="w-full px-4 py-2 rounded-lg border border-border bg-background text-foreground"
                      />
                    </div>

                    <div>
                      <label class="block text-sm font-medium mb-2">Alt Text (optional)</label>
                      <input
                        type="text"
                        [(ngModel)]="ad.altText"
                        (blur)="updateAd(ad.adId, { altText: ad.altText })"
                        placeholder="Description for accessibility"
                        class="w-full px-4 py-2 rounded-lg border border-border bg-background text-foreground"
                      />
                    </div>
                  </div>
                </div>
              }
            </div>

            @if (error) {
              <div class="glass-card p-4 rounded-xl bg-red-500/10 border border-red-500/20">
                <p class="text-red-500">{{ error }}</p>
              </div>
            }

            @if (success) {
              <div class="glass-card p-4 rounded-xl bg-green-500/10 border border-green-500/20">
                <p class="text-green-500">{{ success }}</p>
              </div>
            }
          </div>
        } @else {
          <div class="max-w-md mx-auto">
            <div class="glass-card p-8 rounded-xl">
              <h1 class="text-3xl font-bold mb-6 text-center">Admin Login</h1>
              <form (ngSubmit)="login()" class="space-y-4">
                <div>
                  <label class="block text-sm font-medium mb-2">Username</label>
                  <input
                    type="text"
                    [(ngModel)]="username"
                    name="username"
                    class="w-full px-4 py-2 rounded-lg border border-border bg-background text-foreground"
                    required
                  />
                </div>
                <div>
                  <label class="block text-sm font-medium mb-2">Password</label>
                  <input
                    type="password"
                    [(ngModel)]="password"
                    name="password"
                    class="w-full px-4 py-2 rounded-lg border border-border bg-background text-foreground"
                    required
                  />
                </div>
                @if (loginError) {
                  <div class="text-red-500 text-sm">{{ loginError }}</div>
                }
                <button
                  type="submit"
                  [disabled]="isLoading"
                  class="w-full bg-primary text-primary-foreground py-2 rounded-lg hover:bg-primary/90 disabled:opacity-50">
                  {{ isLoading ? 'Logging in...' : 'Login' }}
                </button>
              </form>
            </div>
          </div>
        }
      </div>
    </div>
  `,
  styles: []
})
export class AdminAdsComponent implements OnInit, OnDestroy {
  isAuthenticated = false;
  currentAdminTheme: AdminTheme = 'light';
  private adminThemeSubscription?: Subscription;
  username = '';
  password = '';
  loginError = '';
  isLoading = false;
  authToken = '';
  ads: Ad[] = [];
  allAdsEnabled = false;
  error = '';
  success = '';

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

    if (this.isAuthenticated) {
      this.loadAds();
    }
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
          this.loadAds();
        } else {
          localStorage.removeItem('admin_token');
          this.authToken = '';
        }
      },
      error: () => {
        localStorage.removeItem('admin_token');
        this.authToken = '';
      }
    });
  }

  login() {
    this.isLoading = true;
    this.loginError = '';

    this.http.post<{ success: boolean; token?: string; error?: string }>(
      `${this.getApiUrl()}/api/auth/login`,
      { username: this.username, password: this.password }
    ).subscribe({
      next: (response) => {
        if (response.success && response.token) {
          this.authToken = response.token;
          localStorage.setItem('admin_token', response.token);
          this.isAuthenticated = true;
          this.username = '';
          this.password = '';
          this.loadAds();
        } else {
          this.loginError = response.error || 'Login failed';
        }
        this.isLoading = false;
      },
      error: (error) => {
        this.loginError = error.error?.error || 'Login failed. Please try again.';
        this.isLoading = false;
      }
    });
  }

  logout() {
    localStorage.removeItem('admin_token');
    this.authToken = '';
    this.isAuthenticated = false;
    this.router.navigate(['/admin']);
  }

  loadAds() {
    this.http.get<{ success: boolean; data: Ad[] }>(`${this.getApiUrl()}/api/ads`).subscribe({
      next: (response) => {
        if (response.success) {
          // Initialize ads if they don't exist
          const adIds = ['ad1', 'ad2', 'ad3', 'ad4', 'ad5'];
          const existingAds = response.data;
          
          this.ads = adIds.map(adId => {
            const existing = existingAds.find(a => a.adId === adId);
            return existing || {
              adId,
              enabled: false,
              mediaType: null,
              mediaUrl: null,
              linkUrl: null,
              altText: ''
            };
          });

          // Update allAdsEnabled based on current state
          this.allAdsEnabled = this.ads.every(ad => ad.enabled);
        }
      },
      error: (error) => {
        console.error('Error loading ads:', error);
        this.error = 'Failed to load ads';
      }
    });
  }

  toggleAllAds() {
    const headers = new HttpHeaders().set('Authorization', `Bearer ${this.authToken}`);
    this.http.post<{ success: boolean; data: Ad[] }>(
      `${this.getApiUrl()}/api/ads/toggle-all`,
      { enabled: this.allAdsEnabled },
      { headers }
    ).subscribe({
      next: (response) => {
        if (response.success) {
          this.ads = response.data.sort((a, b) => a.adId.localeCompare(b.adId));
          this.success = `All ads ${this.allAdsEnabled ? 'enabled' : 'disabled'}`;
          setTimeout(() => this.success = '', 3000);
        }
      },
      error: (error) => {
        console.error('Error toggling all ads:', error);
        this.error = 'Failed to toggle all ads';
        setTimeout(() => this.error = '', 3000);
      }
    });
  }

  toggleAd(adId: string, event: Event) {
    const checked = (event.target as HTMLInputElement).checked;
    this.updateAd(adId, { enabled: checked });
  }

  onFileSelected(adId: string, event: Event) {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('media', file);
    
    const headers = new HttpHeaders().set('Authorization', `Bearer ${this.authToken}`);
    
    this.http.put<{ success: boolean; data: Ad }>(
      `${this.getApiUrl()}/api/ads/${adId}`,
      formData,
      { headers }
    ).subscribe({
      next: (response) => {
        if (response.success) {
          const index = this.ads.findIndex(a => a.adId === adId);
          if (index !== -1) {
            this.ads[index] = response.data;
          }
          this.success = 'Media uploaded successfully';
          setTimeout(() => this.success = '', 3000);
          // Reset file input
          input.value = '';
        }
      },
      error: (error) => {
        console.error('Error uploading media:', error);
        this.error = error.error?.error || 'Failed to upload media';
        setTimeout(() => this.error = '', 3000);
      }
    });
  }

  updateAd(adId: string, updateData: Partial<Ad>) {
    const headers = new HttpHeaders().set('Authorization', `Bearer ${this.authToken}`);
    
    this.http.put<{ success: boolean; data: Ad }>(
      `${this.getApiUrl()}/api/ads/${adId}`,
      updateData,
      { headers }
    ).subscribe({
      next: (response) => {
        if (response.success) {
          const index = this.ads.findIndex(a => a.adId === adId);
          if (index !== -1) {
            this.ads[index] = response.data;
          }
          // Update allAdsEnabled
          this.allAdsEnabled = this.ads.every(ad => ad.enabled);
        }
      },
      error: (error) => {
        console.error('Error updating ad:', error);
        this.error = 'Failed to update ad';
        setTimeout(() => this.error = '', 3000);
      }
    });
  }

  deleteMedia(adId: string) {
    if (!confirm('Are you sure you want to delete this media?')) return;

    const headers = new HttpHeaders().set('Authorization', `Bearer ${this.authToken}`);
    
    this.http.delete<{ success: boolean; data: Ad }>(
      `${this.getApiUrl()}/api/ads/${adId}/media`,
      { headers }
    ).subscribe({
      next: (response) => {
        if (response.success) {
          const index = this.ads.findIndex(a => a.adId === adId);
          if (index !== -1) {
            this.ads[index] = response.data;
          }
          this.success = 'Media deleted successfully';
          setTimeout(() => this.success = '', 3000);
        }
      },
      error: (error) => {
        console.error('Error deleting media:', error);
        this.error = 'Failed to delete media';
        setTimeout(() => this.error = '', 3000);
      }
    });
  }

  getMediaUrl(url: string | null): string {
    if (!url) return '';
    if (url.startsWith('http')) return url;
    return `${this.getApiUrl()}${url}`;
  }

  private getApiUrl(): string {
    return environment.apiUrl || 'http://localhost:3000';
  }
}
