import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { environment } from '../../../../environments/environment';

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
              <button
                (click)="logout()"
                class="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600">
                Logout
              </button>
            </div>

            <!-- Menu Options -->
            <div class="grid md:grid-cols-2 gap-6 mt-8">
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

              <!-- Review Posts Option -->
              <a
                routerLink="/admin/review"
                class="glass-card p-8 rounded-xl hover:shadow-lg transition-all duration-300 cursor-pointer group">
                <div class="flex flex-col items-center text-center space-y-4">
                  <div class="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                    <svg class="w-10 h-10 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <h2 class="text-2xl font-bold">Review Posts</h2>
                  <p class="text-muted-foreground">Review and approve AI-generated news articles before publishing</p>
                  <div class="flex items-center text-primary group-hover:translate-x-2 transition-transform">
                    <span class="font-medium">Go to Review Posts</span>
                    <svg class="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </div>
              </a>
            </div>
          </div>
        }
      </div>
    </div>
  `,
  styles: []
})
export class AdminDashboardComponent implements OnInit {
  isAuthenticated = false;
  username = '';
  password = '';
  loginError = '';
  isLoading = false;
  authToken = '';

  constructor(private http: HttpClient, private router: Router) {
    // Check if already authenticated
    const token = localStorage.getItem('admin_token');
    if (token) {
      this.authToken = token;
      this.verifyToken();
    }
  }

  ngOnInit() {}

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

  private getApiUrl(): string {
    return environment.apiUrl || 'http://localhost:3000';
  }
}

