import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Router, RouterModule } from '@angular/router';
import { environment } from '../../../../environments/environment';
import { Location } from '@angular/common';

const AD_SITE = environment.adSite || 'socialscreen';
import { AdminThemeService, AdminTheme } from '../../../services/admin-theme.service';
import { Subscription } from 'rxjs';
import { AD_SECTIONS, sectionAdId } from '../../../config/ad-sections';

interface AdMediaItem {
  mediaType: 'image' | 'video';
  mediaUrl: string;
}

interface Ad {
  _id?: string;
  adId: string;
  enabled: boolean;
  mediaType: 'image' | 'video' | null;
  mediaUrl: string | null;
  mediaItems?: AdMediaItem[];
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
                <a routerLink="/" class="text-primary hover:text-primary/80" title="Back to site">
                  <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                  </svg>
                </a>
                <img [src]="logoPath" alt="" class="block h-10 sm:h-12 w-auto max-w-[280px] object-contain object-left" height="48" />
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

            <!-- Section cards: Home + 8 categories -->
            <div class="grid gap-6 lg:grid-cols-2">
              @for (section of adSections; track section.id) {
                <div class="glass-card p-6 rounded-xl border border-border/60">
                  <h2 class="text-xl font-bold mb-4 text-primary">{{ section.title }}</h2>

                  <!-- All Ads for this section -->
                  <div class="flex items-center justify-between mb-6 pb-4 border-b border-border/50">
                    <div>
                      <p class="font-semibold">All Ads</p>
                      <p class="text-muted-foreground text-sm">Toggle all slots in {{ section.title }}</p>
                    </div>
                    <label class="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        [checked]="isSectionAllEnabled(section.id)"
                        (change)="toggleSectionAll(section.id, $event)"
                        class="sr-only peer"
                      />
                      <div class="w-14 h-7 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary/20 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[4px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all dark:border-gray-600 peer-checked:bg-primary"></div>
                      <span class="ml-3 text-sm font-medium">
                        {{ isSectionAllEnabled(section.id) ? 'Enabled' : 'Disabled' }}
                      </span>
                    </label>
                  </div>

                  <div class="space-y-6">
                    @for (slot of section.slots; track slot) {
                      @if (getAdRecord(section.id, slot); as ad) {
                        <div class="rounded-lg border border-border/40 p-4 bg-secondary/20">
                          <div class="flex items-center justify-between mb-3">
                            <div>
                              <h3 class="text-lg font-bold">AD{{ slot }}</h3>
                            </div>
                            <label class="relative inline-flex items-center cursor-pointer">
                              <input
                                type="checkbox"
                                [checked]="ad.enabled"
                                (change)="toggleAd(ad.adId, $event)"
                                class="sr-only peer"
                              />
                              <div class="w-14 h-7 bg-gray-200 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[4px] after:bg-white after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-primary"></div>
                              <span class="ml-3 text-sm font-medium">
                                {{ ad.enabled ? 'Enabled' : 'Disabled' }}
                              </span>
                            </label>
                          </div>

                          @if (getAdMediaList(ad).length > 0) {
                            <div class="mb-3 p-3 bg-secondary/50 rounded-lg space-y-3">
                              <div class="flex items-center justify-between gap-2">
                                <p class="text-sm font-medium">
                                  Media ({{ getAdMediaList(ad).length }})
                                  @if (getAdMediaList(ad).length > 1) {
                                    <span class="text-muted-foreground font-normal">— rotates on each site refresh</span>
                                  }
                                </p>
                                <button (click)="deleteAllMedia(ad.adId)" class="px-2 py-1 bg-red-500/90 text-white rounded-lg hover:bg-red-600 text-xs">
                                  Delete all
                                </button>
                              </div>
                              <div class="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2">
                                @for (item of getAdMediaList(ad); track item.mediaUrl; let mi = $index) {
                                  <div class="relative rounded-md border border-border/50 overflow-hidden bg-background group">
                                    <span class="absolute top-1 left-1 z-10 text-[9px] font-semibold bg-black/70 text-white px-1 py-0.5 rounded">
                                      #{{ mi + 1 }}
                                    </span>
                                    @if (item.mediaType === 'image') {
                                      <img
                                        [src]="getMediaUrl(item.mediaUrl)"
                                        [alt]="ad.altText || ad.adId"
                                        class="w-full h-16 sm:h-20 object-cover"
                                      />
                                    } @else {
                                      <video
                                        [src]="getMediaUrl(item.mediaUrl)"
                                        class="w-full h-16 sm:h-20 object-cover"
                                      ></video>
                                    }
                                    <button
                                      type="button"
                                      (click)="deleteMediaItem(ad.adId, mi, $event)"
                                      class="absolute top-1 right-1 z-10 w-5 h-5 flex items-center justify-center rounded bg-red-600 text-white text-xs leading-none hover:bg-red-700"
                                      title="Remove"
                                    >
                                      ×
                                    </button>
                                  </div>
                                }
                              </div>
                            </div>
                          }

                          <div class="space-y-3">
                            <div>
                              <label class="block text-sm font-medium mb-1">Add image(s) or video</label>
                              <p class="text-xs text-muted-foreground mb-1">Select multiple images to rotate in this ad slot on each page refresh.</p>
                              <input
                                type="file"
                                [id]="'file-' + ad.adId"
                                accept="image/*,video/*"
                                multiple
                                [disabled]="uploadingAdId === ad.adId"
                                (change)="onFilesSelected(ad.adId, $event)"
                                class="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm disabled:opacity-50"
                              />
                              @if (uploadingAdId === ad.adId) {
                                <p class="text-xs text-muted-foreground mt-1">Uploading…</p>
                              }
                            </div>
                            <div>
                              <label class="block text-sm font-medium mb-1">Link URL (optional)</label>
                              <input
                                type="url"
                                [(ngModel)]="ad.linkUrl"
                                (blur)="updateAd(ad.adId, { linkUrl: ad.linkUrl })"
                                placeholder="https://example.com"
                                class="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm"
                              />
                            </div>
                            <div>
                              <label class="block text-sm font-medium mb-1">Alt Text (optional)</label>
                              <input
                                type="text"
                                [(ngModel)]="ad.altText"
                                (blur)="updateAd(ad.adId, { altText: ad.altText })"
                                placeholder="Description for accessibility"
                                class="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm"
                              />
                            </div>
                          </div>
                        </div>
                      }
                    }
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
              <div class="flex justify-center mb-6">
                <img [src]="logoPath" alt="" class="block h-12 sm:h-14 w-auto max-w-[min(300px,90vw)] object-contain" height="56" />
              </div>
              <p class="text-center text-muted-foreground mb-6 text-sm">Ad management login</p>
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
  adSections = AD_SECTIONS;
  adsById: Record<string, Ad> = {};
  error = '';
  success = '';
  uploadingAdId: string | null = null;

  logoPath: string;

  constructor(
    private http: HttpClient,
    private router: Router,
    private adminThemeService: AdminThemeService,
    private location: Location
  ) {
    const baseHref = this.location.prepareExternalUrl('/');
    this.logoPath = baseHref + 'assets/socialscreen-logo.png';
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
    this.router.navigate(['/admin/ads']);
  }

  loadAds() {
    this.http.get<{ success: boolean; data: Ad[] }>(`${this.getApiUrl()}/api/ads?site=${AD_SITE}`).subscribe({
      next: (response) => {
        if (response.success) {
          const existingAds = response.data || [];
          const map: Record<string, Ad> = {};
          for (const section of this.adSections) {
            for (const slot of section.slots) {
              const adId = sectionAdId(section.id, slot);
              const existing = existingAds.find(a => a.adId === adId);
              map[adId] = existing || {
                adId,
                enabled: false,
                mediaType: null,
                mediaUrl: null,
                mediaItems: [],
                linkUrl: null,
                altText: ''
              };
            }
          }
          this.adsById = map;
        }
      },
      error: (error) => {
        console.error('Error loading ads:', error);
        const msg = error.error?.error || '';
        if (msg.includes('duplicate key') || msg.includes('E11000') || msg.includes('adId_1')) {
          this.error =
            'Ads database needs a one-time migration. From the repo: cd backend && node scripts/migrateAdsSiteField.js — then restart the API server.';
        } else {
          this.error = msg || 'Failed to load ads. Is the backend running on port 3000?';
        }
      }
    });
  }

  getAdRecord(sectionId: string, slot: number): Ad {
    const adId = sectionAdId(sectionId, slot);
    return this.adsById[adId] || {
      adId,
      enabled: false,
      mediaType: null,
      mediaUrl: null,
      mediaItems: [],
      linkUrl: null,
      altText: ''
    };
  }

  getAdMediaList(ad: Ad): AdMediaItem[] {
    if (ad.mediaItems && ad.mediaItems.length > 0) {
      return ad.mediaItems.filter((i) => i && i.mediaUrl);
    }
    if (ad.mediaUrl && ad.mediaType) {
      return [{ mediaType: ad.mediaType, mediaUrl: ad.mediaUrl }];
    }
    return [];
  }

  isSectionAllEnabled(sectionId: string): boolean {
    const section = this.adSections.find(s => s.id === sectionId);
    if (!section) return false;
    return section.slots.every(slot => this.getAdRecord(sectionId, slot).enabled);
  }

  toggleSectionAll(sectionId: string, event: Event) {
    const enabled = (event.target as HTMLInputElement).checked;
    const section = this.adSections.find(s => s.id === sectionId);
    if (!section) return;
    for (const slot of section.slots) {
      const adId = sectionAdId(sectionId, slot);
      this.updateAd(adId, { enabled });
    }
    this.success = `${section.title}: all ads ${enabled ? 'enabled' : 'disabled'}`;
    setTimeout(() => this.success = '', 3000);
  }

  toggleAd(adId: string, event: Event) {
    const checked = (event.target as HTMLInputElement).checked;
    this.updateAd(adId, { enabled: checked });
  }

  onFilesSelected(adId: string, event: Event) {
    const input = event.target as HTMLInputElement;
    const files = input.files;
    if (!files || files.length === 0) return;

    const fileList = Array.from(files);
    const formData = new FormData();
    for (const file of fileList) {
      formData.append('media', file);
    }

    this.uploadingAdId = adId;
    this.error = '';
    const headers = new HttpHeaders().set('Authorization', `Bearer ${this.authToken}`);

    this.uploadMediaPut(adId, formData, fileList.length, input, headers, false);
  }

  /** PUT /api/ads/:id supports multiple files; POST /media is fallback for newer API builds. */
  private uploadMediaPut(
    adId: string,
    formData: FormData,
    fileCount: number,
    input: HTMLInputElement,
    headers: HttpHeaders,
    triedPostFallback: boolean
  ) {
    this.http
      .put<{ success: boolean; data: Ad }>(
        `${this.getApiUrl()}/api/ads/${adId}?site=${AD_SITE}`,
        formData,
        { headers }
      )
      .subscribe({
        next: (response) => {
          this.uploadingAdId = null;
          input.value = '';
          if (response.success) {
            this.adsById[adId] = response.data;
            this.success =
              fileCount > 1 ? `${fileCount} files added to this ad slot` : 'Media uploaded successfully';
            setTimeout(() => (this.success = ''), 3000);
          }
        },
        error: (err) => {
          if (err.status === 404 && !triedPostFallback) {
            this.http
              .post<{ success: boolean; data: Ad; added?: number }>(
                `${this.getApiUrl()}/api/ads/${adId}/media?site=${AD_SITE}`,
                formData,
                { headers }
              )
              .subscribe({
                next: (response) => {
                  this.uploadingAdId = null;
                  input.value = '';
                  if (response.success) {
                    this.adsById[adId] = response.data;
                    const count = response.added ?? fileCount;
                    this.success =
                      count > 1 ? `${count} files added to this ad slot` : 'Media uploaded successfully';
                    setTimeout(() => (this.success = ''), 3000);
                  }
                },
                error: (postErr) => this.handleUploadError(postErr, input),
              });
            return;
          }
          this.handleUploadError(err, input);
        },
      });
  }

  private handleUploadError(err: { status?: number; error?: { error?: string } }, input: HTMLInputElement) {
    this.uploadingAdId = null;
    input.value = '';
    console.error('Error uploading media:', err);
    if (err.status === 404) {
      this.error = 'Upload API not found. Restart the backend server (port 3000) and try again.';
    } else {
      this.error = err.error?.error || 'Failed to upload media';
    }
    setTimeout(() => (this.error = ''), 5000);
  }

  updateAd(adId: string, updateData: Partial<Ad>) {
    const headers = new HttpHeaders().set('Authorization', `Bearer ${this.authToken}`);
    
    this.http.put<{ success: boolean; data: Ad }>(
      `${this.getApiUrl()}/api/ads/${adId}?site=${AD_SITE}`,
      { ...updateData, site: AD_SITE },
      { headers }
    ).subscribe({
      next: (response) => {
        if (response.success) {
          this.adsById[adId] = response.data;
        }
      },
      error: (error) => {
        console.error('Error updating ad:', error);
        this.error = 'Failed to update ad';
        setTimeout(() => this.error = '', 3000);
      }
    });
  }

  deleteAllMedia(adId: string) {
    if (!confirm('Delete all media for this ad slot?')) return;

    const headers = new HttpHeaders().set('Authorization', `Bearer ${this.authToken}`);

    this.http
      .delete<{ success: boolean; data: Ad }>(
        `${this.getApiUrl()}/api/ads/${adId}/media?site=${AD_SITE}`,
        { headers }
      )
      .subscribe({
        next: (response) => {
          if (response.success) {
            this.adsById[adId] = response.data;
            this.success = 'All media deleted';
            setTimeout(() => (this.success = ''), 3000);
          }
        },
        error: (error) => {
          console.error('Error deleting media:', error);
          this.error = 'Failed to delete media';
          setTimeout(() => (this.error = ''), 3000);
        },
      });
  }

  deleteMediaItem(adId: string, mediaIndex: number, event?: Event) {
    event?.preventDefault();
    event?.stopPropagation();

    const items = this.getAdMediaList(this.adsById[adId]);
    if (items.length <= 1) {
      this.deleteAllMedia(adId);
      return;
    }

    const headers = new HttpHeaders().set('Authorization', `Bearer ${this.authToken}`);

    this.http
      .delete<{ success: boolean; data: Ad }>(
        `${this.getApiUrl()}/api/ads/${adId}/media/${mediaIndex}?site=${AD_SITE}`,
        { headers }
      )
      .subscribe({
        next: (response) => {
          if (response.success) {
            this.adsById[adId] = response.data;
            this.success = 'Media removed';
            setTimeout(() => (this.success = ''), 3000);
          }
        },
        error: (error) => {
          console.error('Error deleting media item:', error);
          if (error.status === 404) {
            this.error = 'Remove API not found. Restart the backend server (port 3000) and try again.';
          } else {
            this.error = error.error?.error || 'Failed to remove media';
          }
          setTimeout(() => (this.error = ''), 5000);
        },
      });
  }

  getMediaUrl(url: string | null): string {
    if (!url) return '';
    if (url.startsWith('http')) return url;
    return `${this.getApiUrl()}${url}`;
  }

  private getApiUrl(): string {
    return (environment.apiUrl !== undefined && environment.apiUrl !== null && String(environment.apiUrl).trim() !== '')
      ? environment.apiUrl
      : (environment.production ? '' : '');
  }
}
