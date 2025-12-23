import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Router, RouterModule } from '@angular/router';
import { environment } from '../../../../environments/environment';

interface PendingNews {
  _id: string;
  title: string;
  titleEn: string;
  excerpt: string;
  content: string;
  category: string;
  tags: string[];
  pages: string[];
  author: string;
  image: string;
  isBreaking: boolean;
  isFeatured: boolean;
  generatedBy: string;
  generatedAt: string;
  createdAt: string;
  updatedAt: string;
}

@Component({
  selector: 'app-admin-review-posts',
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
                <h1 class="text-3xl font-bold">Review Posts</h1>
                <span class="px-3 py-1 text-sm bg-primary/10 text-primary rounded-full">
                  {{ pendingNews.length }} pending
                </span>
              </div>
              <button
                (click)="logout()"
                class="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600">
                Logout
              </button>
            </div>

            @if (isLoading) {
              <div class="text-center py-12">
                <div class="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                <p class="text-muted-foreground">Loading pending posts...</p>
              </div>
            } @else if (pendingNews.length === 0) {
              <div class="text-center py-12 glass-card rounded-xl">
                <svg class="w-16 h-16 mx-auto text-muted-foreground mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <h2 class="text-2xl font-bold mb-2">No Pending Posts</h2>
                <p class="text-muted-foreground">All posts have been reviewed. New AI-generated posts will appear here.</p>
              </div>
            } @else {
              <!-- Pending News Grid -->
              <div class="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                @for (news of pendingNews; track news._id) {
                  <article class="glass-card rounded-xl overflow-hidden group">
                    <!-- Image -->
                    <div class="relative aspect-[16/10] overflow-hidden bg-secondary/20">
                      @if (getImageUrl(news.image)) {
                        <img
                          [src]="getImageUrl(news.image)"
                          [alt]="news.title"
                          class="w-full h-full object-cover transition-all duration-500 group-hover:scale-110" />
                      } @else {
                        <div class="absolute inset-0 flex items-center justify-center bg-secondary/50">
                          <svg class="w-12 h-12 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                        </div>
                      }
                      <!-- Category Badge -->
                      <div class="absolute top-4 left-4 z-20 flex gap-2">
                        @if (news.isBreaking) {
                          <span class="px-3 py-1 text-xs font-semibold rounded-full bg-red-600 text-white animate-pulse">
                            BREAKING
                          </span>
                        }
                        <span [class]="'px-3 py-1 text-xs font-semibold rounded-full ' + getCategoryColor(news.category)">
                          {{ news.category }}
                        </span>
                      </div>
                    </div>

                    <!-- Content -->
                    <div class="p-5">
                      <h3 class="font-display text-lg font-semibold leading-tight mb-2 line-clamp-2">
                        {{ news.title }}
                      </h3>
                      <p class="text-muted-foreground text-sm line-clamp-2 mb-4">
                        {{ news.excerpt }}
                      </p>

                      <!-- Meta Info -->
                      <div class="flex items-center justify-between text-xs text-muted-foreground mb-4">
                        <span>By {{ news.author }}</span>
                        <span>{{ formatDate(news.createdAt) }}</span>
                      </div>

                      <!-- Tags -->
                      @if (news.tags && news.tags.length > 0) {
                        <div class="flex flex-wrap gap-1 mb-4">
                          @for (tag of news.tags.slice(0, 3); track tag) {
                            <span class="px-2 py-1 text-xs bg-secondary rounded-md">{{ tag }}</span>
                          }
                        </div>
                      }

                      <!-- Action Buttons -->
                      <div class="flex gap-2 pt-4 border-t border-border/30">
                        <button
                          (click)="publishNews(news._id)"
                          [disabled]="processingIds.has(news._id)"
                          class="flex-1 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed">
                          @if (processingIds.has(news._id)) {
                            <span class="flex items-center justify-center gap-2">
                              <svg class="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                              </svg>
                              Publishing...
                            </span>
                          } @else {
                            Post
                          }
                        </button>
                        <button
                          (click)="editNews(news)"
                          class="flex-1 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90">
                          Edit
                        </button>
                        <button
                          (click)="deleteNews(news._id)"
                          [disabled]="processingIds.has(news._id)"
                          class="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 disabled:opacity-50">
                          Delete
                        </button>
                      </div>
                    </div>
                  </article>
                }
              </div>
            }

            @if (error) {
              <div class="glass-card p-4 rounded-xl bg-red-500/10 border border-red-500/20">
                <p class="text-red-500">{{ error }}</p>
              </div>
            }
          </div>
        }
      </div>
    </div>
  `,
  styles: []
})
export class AdminReviewPostsComponent implements OnInit {
  isAuthenticated = false;
  authToken = '';
  pendingNews: PendingNews[] = [];
  isLoading = false;
  error = '';
  processingIds = new Set<string>();

  constructor(private http: HttpClient, private router: Router) {
    // Check if already authenticated
    const token = localStorage.getItem('admin_token');
    if (token) {
      this.authToken = token;
      this.verifyToken();
    } else {
      this.router.navigate(['/admin']);
    }
  }

  ngOnInit() {
    if (this.isAuthenticated) {
      this.loadPendingNews();
    }
  }

  verifyToken() {
    const headers = new HttpHeaders().set('Authorization', `Bearer ${this.authToken}`);
    this.http.get<{ valid: boolean }>(`${this.getApiUrl()}/api/auth/verify`, { headers }).subscribe({
      next: (response) => {
        if (response.valid) {
          this.isAuthenticated = true;
          this.loadPendingNews();
        } else {
          localStorage.removeItem('admin_token');
          this.router.navigate(['/admin']);
        }
      },
      error: () => {
        localStorage.removeItem('admin_token');
        this.router.navigate(['/admin']);
      }
    });
  }

  loadPendingNews() {
    this.isLoading = true;
    this.error = '';
    const headers = new HttpHeaders().set('Authorization', `Bearer ${this.authToken}`);

    this.http.get<{ success: boolean; data: PendingNews[]; error?: string }>(
      `${this.getApiUrl()}/api/pending-news`,
      { headers }
    ).subscribe({
      next: (response) => {
        if (response.success) {
          this.pendingNews = response.data;
        } else {
          this.error = response.error || 'Failed to load pending news';
        }
        this.isLoading = false;
      },
      error: (err) => {
        this.error = err.error?.error || 'Failed to load pending news. Please try again.';
        this.isLoading = false;
      }
    });
  }

  publishNews(id: string) {
    if (this.processingIds.has(id)) return;

    this.processingIds.add(id);
    const headers = new HttpHeaders().set('Authorization', `Bearer ${this.authToken}`);

    this.http.post<{ success: boolean; message?: string; error?: string }>(
      `${this.getApiUrl()}/api/pending-news/${id}/publish`,
      {},
      { headers }
    ).subscribe({
      next: (response) => {
        if (response.success) {
          // Remove from list
          this.pendingNews = this.pendingNews.filter(news => news._id !== id);
        } else {
          this.error = response.error || 'Failed to publish news';
        }
        this.processingIds.delete(id);
      },
      error: (err) => {
        this.error = err.error?.error || 'Failed to publish news. Please try again.';
        this.processingIds.delete(id);
      }
    });
  }

  editNews(news: PendingNews) {
    // Store news in sessionStorage for edit page
    sessionStorage.setItem('editNews', JSON.stringify(news));
    this.router.navigate(['/admin/edit', news._id]);
  }

  deleteNews(id: string) {
    if (!confirm('Are you sure you want to delete this post?')) {
      return;
    }

    if (this.processingIds.has(id)) return;

    this.processingIds.add(id);
    const headers = new HttpHeaders().set('Authorization', `Bearer ${this.authToken}`);

    this.http.delete<{ success: boolean; message?: string; error?: string }>(
      `${this.getApiUrl()}/api/pending-news/${id}`,
      { headers }
    ).subscribe({
      next: (response) => {
        if (response.success) {
          // Remove from list
          this.pendingNews = this.pendingNews.filter(news => news._id !== id);
        } else {
          this.error = response.error || 'Failed to delete news';
        }
        this.processingIds.delete(id);
      },
      error: (err) => {
        this.error = err.error?.error || 'Failed to delete news. Please try again.';
        this.processingIds.delete(id);
      }
    });
  }

  logout() {
    localStorage.removeItem('admin_token');
    this.authToken = '';
    this.isAuthenticated = false;
    this.router.navigate(['/admin']);
  }

  getImageUrl(image: string): string {
    if (!image) return '';
    if (image.startsWith('http')) return image;
    const apiUrl = this.getApiUrl();
    return `${apiUrl}${image}`;
  }

  formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  }

  getCategoryColor(category: string): string {
    const colors: Record<string, string> = {
      'National': 'bg-blue-500 text-white',
      'International': 'bg-purple-500 text-white',
      'Sports': 'bg-green-500 text-white',
      'Business': 'bg-yellow-500 text-white',
      'Entertainment': 'bg-pink-500 text-white',
      'Health': 'bg-red-500 text-white',
      'Politics': 'bg-indigo-500 text-white'
    };
    return colors[category] || 'bg-primary text-primary-foreground';
  }

  private getApiUrl(): string {
    return environment.apiUrl || 'http://localhost:3000';
  }
}

