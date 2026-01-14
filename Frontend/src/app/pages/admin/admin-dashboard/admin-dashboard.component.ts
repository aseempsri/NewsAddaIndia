import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { environment } from '../../../../environments/environment';
import { AdminThemeService, AdminTheme } from '../../../services/admin-theme.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  template: `
    <div class="min-h-screen bg-background py-8">
      <div class="container mx-auto px-4 max-w-7xl">
        <!-- Login Form -->
        @if (!isAuthenticated) {
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

        <!-- Dashboard Menu -->
        @if (isAuthenticated) {
          <div class="space-y-6">
            <div class="flex items-center justify-between">
              <h1 class="text-3xl font-bold">Admin Dashboard</h1>
              <div class="flex items-center gap-3">
                <!-- Theme Toggle Button -->
                <button
                  (click)="toggleAdminTheme()"
                  [attr.aria-label]="currentAdminTheme === 'light' ? 'Switch to Dark Mode' : 'Switch to Light Mode'"
                  [class]="'relative w-12 h-7 rounded-full transition-all duration-300 ease-in-out focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-1 shadow-lg ' + (currentAdminTheme === 'dark' ? 'bg-gradient-to-r from-gray-700 to-gray-900 shadow-gray-700/50' : 'bg-gradient-to-r from-yellow-400 to-orange-500 shadow-yellow-400/50')">
                  <!-- Toggle Circle -->
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
                  <!-- Theme Labels -->
                  <div class="absolute inset-0 flex items-center justify-between px-1.5 text-xs font-semibold text-white pointer-events-none">
                    <span [class]="'transition-opacity duration-300 ' + (currentAdminTheme === 'light' ? 'opacity-100' : 'opacity-50')">
                      <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                      </svg>
                    </span>
                    <span [class]="'transition-opacity duration-300 ' + (currentAdminTheme === 'dark' ? 'opacity-100' : 'opacity-50')">
                      <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                      </svg>
                    </span>
                  </div>
                </button>
                <button
                  (click)="logout()"
                  class="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600">
                  Logout
                </button>
              </div>
            </div>

            <!-- Menu Options -->
            <div class="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mt-8">
              <!-- Create Post Option -->
              <a
                routerLink="/admin/create"
                class="glass-card p-8 rounded-xl hover:shadow-lg transition-all duration-300 cursor-pointer group">
                <div class="flex flex-col items-center text-center space-y-4">
                  <div class="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                    <svg class="w-10 h-10 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
                    </svg>
                  </div>
                  <h2 class="text-2xl font-bold">Create Post</h2>
                  <p class="text-muted-foreground">Create a new news article and publish it immediately</p>
                  <div class="flex items-center text-primary group-hover:translate-x-2 transition-transform">
                    <span class="font-medium">Go to Create Post</span>
                    <svg class="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </div>
              </a>

              <!-- Review Unpublished Posts Option -->
              <a
                routerLink="/admin/review"
                class="glass-card p-8 rounded-xl hover:shadow-lg transition-all duration-300 cursor-pointer group">
                <div class="flex flex-col items-center text-center space-y-4">
                  <div class="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                    <svg class="w-10 h-10 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <h2 class="text-2xl font-bold">Review Unpublished Posts</h2>
                  <p class="text-muted-foreground">Review and approve AI-generated news articles before publishing</p>
                  <div class="flex items-center text-primary group-hover:translate-x-2 transition-transform">
                    <span class="font-medium">Go to Review Unpublished Posts</span>
                    <svg class="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </div>
              </a>

              <!-- Review Live Posts Option -->
              <a
                routerLink="/admin/review-live"
                class="glass-card p-8 rounded-xl hover:shadow-lg transition-all duration-300 cursor-pointer group">
                <div class="flex flex-col items-center text-center space-y-4">
                  <div class="w-20 h-20 bg-green-500/10 rounded-full flex items-center justify-center group-hover:bg-green-500/20 transition-colors">
                    <svg class="w-10 h-10 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <h2 class="text-2xl font-bold">Review Live Posts</h2>
                  <p class="text-muted-foreground">View and manage all published posts currently live on the website</p>
                  <div class="flex items-center text-green-500 group-hover:translate-x-2 transition-transform">
                    <span class="font-medium">Go to Review Live Posts</span>
                    <svg class="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </div>
              </a>

              <!-- Translate All News Option -->
              <button
                (click)="translateAllNews()"
                [disabled]="isTranslating"
                class="glass-card p-8 rounded-xl hover:shadow-lg transition-all duration-300 cursor-pointer group text-left w-full">
                <div class="flex flex-col items-center text-center space-y-4">
                  <div class="w-20 h-20 bg-blue-500/10 rounded-full flex items-center justify-center group-hover:bg-blue-500/20 transition-colors">
                    <svg class="w-10 h-10 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129" />
                    </svg>
                  </div>
                  <h2 class="text-2xl font-bold">Translate All News</h2>
                  <p class="text-muted-foreground">Manually trigger translation of all news articles from Hindi to English</p>
                  @if (isTranslating) {
                    <div class="flex items-center text-blue-500">
                      <div class="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mr-2"></div>
                      <span class="font-medium">Translating...</span>
                    </div>
                  } @else {
                    <div class="flex items-center text-blue-500 group-hover:translate-x-2 transition-transform">
                      <span class="font-medium">Start Translation</span>
                      <svg class="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  }
                  @if (translationResult) {
                    <div class="mt-2 text-sm" [class.text-green-500]="translationResult.success" [class.text-red-500]="!translationResult.success">
                      {{ translationResult.message }}
                      @if (translationResult.translated !== undefined) {
                        <span class="block mt-1">Translated: {{ translationResult.translated }}, Errors: {{ translationResult.errors }}</span>
                      }
                    </div>
                  }
                </div>
              </button>
            </div>
          </div>
        }
      </div>
    </div>
  `,
  styles: []
})
export class AdminDashboardComponent implements OnInit, OnDestroy {
  isAuthenticated = false;
  currentAdminTheme: AdminTheme = 'light';
  private adminThemeSubscription?: Subscription;
  username = '';
  password = '';
  loginError = '';
  isLoading = false;
  isTranslating = false;
  authToken = '';
  translationResult: { success: boolean; message: string; translated?: number; errors?: number } | null = null;

  constructor(
    private http: HttpClient,
    private router: Router,
    private adminThemeService: AdminThemeService
  ) {
    // Check if already authenticated
    const token = localStorage.getItem('admin_token');
    if (token) {
      this.authToken = token;
      this.verifyToken();
    }
  }

  ngOnInit() {
    // Initialize admin theme
    this.currentAdminTheme = this.adminThemeService.getCurrentTheme();
    this.adminThemeService.checkAndApplyTheme();
    
    // Subscribe to theme changes
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
  }

  translateAllNews() {
    if (this.isTranslating) return;
    
    this.isTranslating = true;
    this.translationResult = null;
    
    const headers = new HttpHeaders().set('Authorization', `Bearer ${this.authToken}`);
    
    this.http.post<{ success: boolean; message?: string; translated?: number; errors?: number; total?: number }>(
      `${this.getApiUrl()}/api/translation/translate-all`,
      {},
      { headers }
    ).subscribe({
      next: (response) => {
        this.translationResult = {
          success: response.success,
          message: response.message || (response.success ? 'Translation completed successfully!' : 'Translation failed'),
          translated: response.translated,
          errors: response.errors
        };
        this.isTranslating = false;
      },
      error: (error) => {
        this.translationResult = {
          success: false,
          message: error.error?.message || 'Failed to translate news. Please try again.'
        };
        this.isTranslating = false;
      }
    });
  }

  private getApiUrl(): string {
    return environment.apiUrl || 'http://localhost:3000';
  }
}

