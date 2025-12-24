import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Router, RouterModule } from '@angular/router';
import { environment } from '../../../../environments/environment';

interface LiveNews {
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
  date: string;
  createdAt: string;
  updatedAt: string;
}

interface GroupedNews {
  category: string;
  news: LiveNews[];
}

@Component({
  selector: 'app-admin-review-live-posts',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  template: `
    <div class="min-h-screen bg-background py-8">
      <div class="container mx-auto px-4 max-w-7xl">
        @if (isAuthenticated) {
          <div class="space-y-8">
            <div class="flex items-center justify-between">
              <div class="flex items-center gap-4">
                <a routerLink="/admin" class="text-primary hover:text-primary/80">
                  <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                  </svg>
                </a>
                <h1 class="text-3xl font-bold">Review Live Posts</h1>
                <span class="px-3 py-1 text-sm bg-green-500/10 text-green-500 rounded-full">
                  {{ totalPosts }} live posts
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
                <p class="text-muted-foreground">Loading live posts...</p>
              </div>
            } @else if (groupedNews.length === 0) {
              <div class="text-center py-12 glass-card rounded-xl">
                <svg class="w-16 h-16 mx-auto text-muted-foreground mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <h2 class="text-2xl font-bold mb-2">No Live Posts</h2>
                <p class="text-muted-foreground">There are no published posts currently live on the website.</p>
              </div>
            } @else {
              <!-- Grouped News by Category -->
              @for (group of groupedNews; track group.category) {
                <div class="space-y-4">
                  <!-- Section Header -->
                  <div class="flex items-center justify-between border-b-2 border-primary/20 pb-2">
                    <h2 class="text-2xl font-bold flex items-center gap-3">
                      <span [class]="'px-3 py-1 text-sm font-semibold rounded-full ' + getCategoryColor(group.category)">
                        {{ group.category }}
                      </span>
                      <span class="text-muted-foreground text-lg font-normal">
                        ({{ group.news.length }} {{ group.news.length === 1 ? 'post' : 'posts' }})
                      </span>
                    </h2>
                  </div>

                  <!-- News Grid for this Category -->
                  <div class="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                    @for (news of group.news; track news._id) {
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
                          <!-- Badges -->
                          <div class="absolute top-4 left-4 z-20 flex gap-2">
                            @if (news.isBreaking) {
                              <span class="px-3 py-1 text-xs font-semibold rounded-full bg-red-600 text-white animate-pulse">
                                BREAKING
                              </span>
                            }
                            @if (news.isFeatured) {
                              <span class="px-3 py-1 text-xs font-semibold rounded-full bg-yellow-500 text-white">
                                FEATURED
                              </span>
                            }
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
                            <span>{{ formatDate(news.date || news.createdAt) }}</span>
                          </div>

                          <!-- Tags -->
                          @if (news.tags && news.tags.length > 0) {
                            <div class="flex flex-wrap gap-1 mb-4">
                              @for (tag of news.tags.slice(0, 3); track tag) {
                                <span class="px-2 py-1 text-xs bg-secondary rounded-md">{{ tag }}</span>
                              }
                            </div>
                          }

                          <!-- Pages -->
                          @if (news.pages && news.pages.length > 0) {
                            <div class="mb-4">
                              <p class="text-xs text-muted-foreground mb-1">Visible on:</p>
                              <div class="flex flex-wrap gap-1">
                                @for (page of news.pages; track page) {
                                  <span class="px-2 py-1 text-xs bg-primary/10 text-primary rounded-md">{{ page }}</span>
                                }
                              </div>
                            </div>
                          }

                          <!-- Action Buttons -->
                          <div class="space-y-2 pt-4 border-t border-border/30">
                            <div class="flex gap-2">
                              <button
                                (click)="viewNews(news._id)"
                                class="flex-1 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90">
                                View
                              </button>
                              <button
                                (click)="editNews(news)"
                                class="flex-1 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600">
                                Edit
                              </button>
                            </div>
                            <div class="flex gap-2">
                              <button
                                (click)="deleteFromWebsite(news._id)"
                                [disabled]="processingIds.has(news._id)"
                                class="flex-1 px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 disabled:opacity-50 text-sm">
                                @if (processingIds.has(news._id)) {
                                  <span class="flex items-center justify-center gap-2">
                                    <svg class="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                                      <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                                      <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                    Removing...
                                  </span>
                                } @else {
                                  Delete from Website
                                }
                              </button>
                              <button
                                (click)="permanentDelete(news._id)"
                                [disabled]="processingIds.has(news._id)"
                                class="flex-1 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 disabled:opacity-50 text-sm">
                                @if (processingIds.has(news._id)) {
                                  <span class="flex items-center justify-center gap-2">
                                    <svg class="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                                      <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                                      <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                    Deleting...
                                  </span>
                                } @else {
                                  Permanent Delete
                                }
                              </button>
                            </div>
                          </div>
                        </div>
                      </article>
                    }
                  </div>
                </div>
              }
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
export class AdminReviewLivePostsComponent implements OnInit {
  isAuthenticated = false;
  authToken = '';
  liveNews: LiveNews[] = [];
  groupedNews: GroupedNews[] = [];
  totalPosts = 0;
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
      this.loadLiveNews();
    }
  }

  verifyToken() {
    const headers = new HttpHeaders().set('Authorization', `Bearer ${this.authToken}`);
    this.http.get<{ valid: boolean }>(`${this.getApiUrl()}/api/auth/verify`, { headers }).subscribe({
      next: (response) => {
        if (response.valid) {
          this.isAuthenticated = true;
          this.loadLiveNews();
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

  loadLiveNews() {
    this.isLoading = true;
    this.error = '';
    // Fetch all published news without limit to get all live posts
    this.http.get<{ success: boolean; data: LiveNews[]; error?: string }>(
      `${this.getApiUrl()}/api/news?published=true&limit=1000`
    ).subscribe({
      next: (response) => {
        if (response.success) {
          this.liveNews = response.data;
          this.totalPosts = this.liveNews.length;
          this.groupNewsByCategory();
        } else {
          this.error = response.error || 'Failed to load live news';
        }
        this.isLoading = false;
      },
      error: (err) => {
        this.error = err.error?.error || 'Failed to load live news. Please try again.';
        this.isLoading = false;
      }
    });
  }

  groupNewsByCategory() {
    // Group news by category
    const grouped: Record<string, LiveNews[]> = {};
    
    // Sort all news by date (latest first)
    const sortedNews = [...this.liveNews].sort((a, b) => {
      const dateA = new Date(a.date || a.createdAt).getTime();
      const dateB = new Date(b.date || b.createdAt).getTime();
      return dateB - dateA; // Latest first
    });

    // Group by category
    sortedNews.forEach(news => {
      if (!grouped[news.category]) {
        grouped[news.category] = [];
      }
      grouped[news.category].push(news);
    });

    // Convert to array and sort categories
    const categoryOrder = ['National', 'International', 'Sports', 'Business', 'Entertainment', 'Health', 'Politics'];
    this.groupedNews = categoryOrder
      .filter(cat => grouped[cat] && grouped[cat].length > 0)
      .map(category => ({
        category,
        news: grouped[category] // Already sorted by date
      }));

    // Add any categories not in the predefined order
    Object.keys(grouped).forEach(category => {
      if (!categoryOrder.includes(category)) {
        this.groupedNews.push({
          category,
          news: grouped[category]
        });
      }
    });
  }

  viewNews(id: string) {
    // Navigate to news detail page or open in new tab
    window.open(`/news/${id}`, '_blank');
  }

  editNews(news: LiveNews) {
    // Store news in sessionStorage for edit page
    sessionStorage.setItem('editLiveNews', JSON.stringify(news));
    this.router.navigate(['/admin/edit-live', news._id]);
  }

  deleteFromWebsite(id: string) {
    if (!confirm('Are you sure you want to remove this post from the website? It will be hidden but remain in the database.')) {
      return;
    }

    if (this.processingIds.has(id)) return;

    this.processingIds.add(id);
    const headers = new HttpHeaders().set('Authorization', `Bearer ${this.authToken}`);

    // Send as FormData since the backend uses multer
    const formData = new FormData();
    formData.append('published', 'false');

    // Update published status to false
    this.http.put<{ success: boolean; message?: string; error?: string }>(
      `${this.getApiUrl()}/api/news/${id}`,
      formData,
      { headers }
    ).subscribe({
      next: (response) => {
        if (response.success) {
          // Reload the list
          this.loadLiveNews();
        } else {
          this.error = response.error || 'Failed to remove post from website';
        }
        this.processingIds.delete(id);
      },
      error: (err) => {
        this.error = err.error?.error || 'Failed to remove post from website. Please try again.';
        this.processingIds.delete(id);
      }
    });
  }

  permanentDelete(id: string) {
    if (!confirm('Are you sure you want to permanently delete this post? This action cannot be undone and will remove it from both the website and database.')) {
      return;
    }

    if (this.processingIds.has(id)) return;

    this.processingIds.add(id);
    const headers = new HttpHeaders().set('Authorization', `Bearer ${this.authToken}`);

    this.http.delete<{ success: boolean; message?: string; error?: string }>(
      `${this.getApiUrl()}/api/news/${id}`,
      { headers }
    ).subscribe({
      next: (response) => {
        if (response.success) {
          // Reload the list
          this.loadLiveNews();
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

