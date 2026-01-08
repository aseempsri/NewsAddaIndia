import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Router, RouterModule } from '@angular/router';
import { environment } from '../../../../environments/environment';
import { ModalService } from '../../../services/modal.service';
import { NewsDetailModalComponent } from '../../../components/news-detail-modal/news-detail-modal.component';
import { NewsArticle } from '../../../services/news.service';
import { Subscription } from 'rxjs';

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
  isTrending: boolean;
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
  imports: [CommonModule, FormsModule, RouterModule, NewsDetailModalComponent],
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
              <!-- Filters Section -->
              <div class="glass-card rounded-xl p-6 space-y-4">
                <div class="flex items-center justify-between flex-wrap gap-4">
                  <h2 class="text-xl font-bold flex items-center gap-2">
                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                    </svg>
                    Filters
                    @if (getActiveFilterCount() > 0) {
                      <span class="px-2 py-0.5 text-xs bg-primary text-primary-foreground rounded-full">
                        {{ getActiveFilterCount() }}
                      </span>
                    }
                  </h2>
                  @if (getActiveFilterCount() > 0) {
                    <button
                      (click)="clearAllFilters()"
                      class="text-sm text-red-500 hover:text-red-600 flex items-center gap-1">
                      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                      Clear All
                    </button>
                  }
                </div>

                <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <!-- Search Filter -->
                  <div class="space-y-2">
                    <label class="text-sm font-medium text-muted-foreground">Search</label>
                    <div class="relative">
                      <input
                        type="text"
                        [(ngModel)]="searchQuery"
                        (ngModelChange)="applyFilters()"
                        placeholder="Search by title..."
                        class="w-full px-4 py-2 pl-10 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary">
                      <svg class="absolute left-3 top-2.5 w-5 h-5 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                      </svg>
                    </div>
                  </div>

                  <!-- Category Filter -->
                  <div class="space-y-2">
                    <label class="text-sm font-medium text-muted-foreground">Category</label>
                    <select
                      [(ngModel)]="selectedCategory"
                      (ngModelChange)="applyFilters()"
                      class="w-full px-4 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary">
                      <option value="">All Categories</option>
                      @for (category of availableCategories; track category) {
                        <option [value]="category">{{ category }}</option>
                      }
                    </select>
                  </div>

                  <!-- Date Sort -->
                  <div class="space-y-2">
                    <label class="text-sm font-medium text-muted-foreground">Sort by Date</label>
                    <select
                      [(ngModel)]="dateSort"
                      (ngModelChange)="applyFilters()"
                      class="w-full px-4 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary">
                      <option value="latest">Latest First</option>
                      <option value="oldest">Oldest First</option>
                    </select>
                  </div>

                  <!-- Page Filter -->
                  <div class="space-y-2">
                    <label class="text-sm font-medium text-muted-foreground">Visible on Page</label>
                    <select
                      [(ngModel)]="selectedPage"
                      (ngModelChange)="applyFilters()"
                      class="w-full px-4 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary">
                      <option value="">All Pages</option>
                      @for (page of availablePages; track page) {
                        <option [value]="page">{{ page | titlecase }}</option>
                      }
                    </select>
                  </div>
                </div>

                <!-- Toggle Filters -->
                <div class="flex flex-wrap gap-3 pt-2">
                  <button
                    (click)="toggleFilter('breaking')"
                    [class]="'px-4 py-2 rounded-lg text-sm font-medium transition-colors ' + (filters.breaking ? 'bg-red-500 text-white' : 'bg-secondary text-foreground hover:bg-secondary/80')">
                    <span class="flex items-center gap-2">
                      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                      </svg>
                      Breaking News
                      @if (filters.breaking) {
                        <span class="ml-1">({{ getBreakingCount() }})</span>
                      }
                    </span>
                  </button>

                  <button
                    (click)="toggleFilter('featured')"
                    [class]="'px-4 py-2 rounded-lg text-sm font-medium transition-colors ' + (filters.featured ? 'bg-yellow-500 text-white' : 'bg-secondary text-foreground hover:bg-secondary/80')">
                    <span class="flex items-center gap-2">
                      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                      </svg>
                      Featured
                      @if (filters.featured) {
                        <span class="ml-1">({{ getFeaturedCount() }})</span>
                      }
                    </span>
                  </button>

                  <button
                    (click)="toggleFilter('trending')"
                    [class]="'px-4 py-2 rounded-lg text-sm font-medium transition-colors ' + (filters.trending ? 'bg-purple-500 text-white' : 'bg-secondary text-foreground hover:bg-secondary/80')">
                    <span class="flex items-center gap-2">
                      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                      </svg>
                      Trending
                      @if (filters.trending) {
                        <span class="ml-1">({{ getTrendingCount() }})</span>
                      }
                    </span>
                  </button>
                </div>

                <!-- Active Filters Display -->
                @if (getActiveFilterCount() > 0) {
                  <div class="pt-4 border-t border-border/30">
                    <p class="text-sm text-muted-foreground mb-2">Active Filters:</p>
                    <div class="flex flex-wrap gap-2">
                      @if (searchQuery) {
                        <span class="px-3 py-1 text-xs bg-primary/10 text-primary rounded-full flex items-center gap-2">
                          Search: "{{ searchQuery }}"
                          <button (click)="searchQuery = ''; applyFilters()" class="hover:text-primary/70">
                            <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        </span>
                      }
                      @if (selectedCategory) {
                        <span class="px-3 py-1 text-xs bg-primary/10 text-primary rounded-full flex items-center gap-2">
                          Category: {{ selectedCategory }}
                          <button (click)="selectedCategory = ''; applyFilters()" class="hover:text-primary/70">
                            <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        </span>
                      }
                      @if (selectedPage) {
                        <span class="px-3 py-1 text-xs bg-primary/10 text-primary rounded-full flex items-center gap-2">
                          Page: {{ selectedPage | titlecase }}
                          <button (click)="selectedPage = ''; applyFilters()" class="hover:text-primary/70">
                            <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        </span>
                      }
                      @if (filters.breaking) {
                        <span class="px-3 py-1 text-xs bg-red-500/10 text-red-500 rounded-full flex items-center gap-2">
                          Breaking News
                          <button (click)="toggleFilter('breaking')" class="hover:text-red-500/70">
                            <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        </span>
                      }
                      @if (filters.featured) {
                        <span class="px-3 py-1 text-xs bg-yellow-500/10 text-yellow-500 rounded-full flex items-center gap-2">
                          Featured
                          <button (click)="toggleFilter('featured')" class="hover:text-yellow-500/70">
                            <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        </span>
                      }
                      @if (filters.trending) {
                        <span class="px-3 py-1 text-xs bg-purple-500/10 text-purple-500 rounded-full flex items-center gap-2">
                          Trending
                          <button (click)="toggleFilter('trending')" class="hover:text-purple-500/70">
                            <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        </span>
                      }
                    </div>
                  </div>
                }

                <!-- Results Count -->
                <div class="pt-2 border-t border-border/30">
                  <p class="text-sm text-muted-foreground">
                    Showing <span class="font-semibold text-foreground">{{ filteredNews.length }}</span> of 
                    <span class="font-semibold text-foreground">{{ totalPosts }}</span> posts
                  </p>
                </div>
              </div>

              <!-- Filtered News Display -->
              @if (filteredNews.length === 0) {
                <div class="text-center py-12 glass-card rounded-xl">
                  <svg class="w-16 h-16 mx-auto text-muted-foreground mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <h2 class="text-2xl font-bold mb-2">No Posts Found</h2>
                  <p class="text-muted-foreground mb-4">Try adjusting your filters to see more results.</p>
                  <button
                    (click)="clearAllFilters()"
                    class="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90">
                    Clear All Filters
                  </button>
                </div>
              } @else {
                <!-- Grouped News by Category -->
                @for (group of filteredGroupedNews; track group.category) {
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
                            @if (news.isTrending) {
                              <span class="inline-flex items-center justify-center gap-1.5 px-4 py-1.5 text-xs font-black rounded-full bg-gradient-to-r from-purple-600 via-pink-500 to-fuchsia-600 text-white shadow-xl animate-pulse border-2 border-white/50 uppercase tracking-wider" style="font-family: 'Arial Black', 'Helvetica Neue', sans-serif; text-shadow: 2px 2px 4px rgba(0,0,0,0.5), 0 0 8px rgba(255,255,255,0.3); letter-spacing: 0.1em;">
                                <svg class="w-3.5 h-3.5 text-white flex-shrink-0" fill="currentColor" viewBox="0 0 24 24" style="filter: drop-shadow(0 1px 2px rgba(0,0,0,0.4));">
                                  <path d="M13 10V3L4 14h7v7l9-11h-7z"/>
                                </svg>
                                <span class="text-xs leading-none">🔥</span>
                                <span>TRENDING</span>
                                <span class="text-xs leading-none">🔥</span>
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
                                (click)="viewNews(news)"
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
            }

            @if (error) {
              <div class="glass-card p-4 rounded-xl bg-red-500/10 border border-red-500/20">
                <p class="text-red-500">{{ error }}</p>
              </div>
            }
          </div>
        }
      </div>
      
      <!-- News Detail Modal -->
      <app-news-detail-modal></app-news-detail-modal>
    </div>
  `,
  styles: []
})
export class AdminReviewLivePostsComponent implements OnInit, OnDestroy {
  isAuthenticated = false;
  authToken = '';
  liveNews: LiveNews[] = [];
  groupedNews: GroupedNews[] = [];
  filteredNews: LiveNews[] = [];
  filteredGroupedNews: GroupedNews[] = [];
  totalPosts = 0;
  isLoading = false;
  error = '';
  processingIds = new Set<string>();
  private modalSubscription?: Subscription;

  // Filter properties
  searchQuery = '';
  selectedCategory = '';
  selectedPage = '';
  dateSort: 'latest' | 'oldest' = 'latest';
  filters = {
    breaking: false,
    featured: false,
    trending: false
  };

  // Available options
  availableCategories: string[] = [];
  availablePages: string[] = [];

  constructor(
    private http: HttpClient,
    private router: Router,
    private modalService: ModalService
  ) {
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

  ngOnDestroy() {
    if (this.modalSubscription) {
      this.modalSubscription.unsubscribe();
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
          this.extractAvailableOptions();
          this.groupNewsByCategory();
          this.applyFilters();
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

  extractAvailableOptions() {
    // Extract unique categories
    const categories = new Set<string>();
    const pages = new Set<string>();

    this.liveNews.forEach(news => {
      if (news.category) {
        categories.add(news.category);
      }
      if (news.pages && news.pages.length > 0) {
        news.pages.forEach(page => pages.add(page));
      }
    });

    // Always include all possible categories, even if no posts exist yet
    const allCategories = ['National', 'International', 'Sports', 'Business', 'Entertainment', 'Health', 'Politics', 'Religious'];
    allCategories.forEach(cat => categories.add(cat));

    this.availableCategories = Array.from(categories).sort();
    this.availablePages = Array.from(pages).sort();
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
    const categoryOrder = ['National', 'International', 'Sports', 'Business', 'Entertainment', 'Health', 'Politics', 'Religious'];
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

  applyFilters() {
    let filtered = [...this.liveNews];

    // Search filter
    if (this.searchQuery.trim()) {
      const query = this.searchQuery.toLowerCase().trim();
      filtered = filtered.filter(news =>
        news.title.toLowerCase().includes(query) ||
        (news.titleEn && news.titleEn.toLowerCase().includes(query)) ||
        news.excerpt.toLowerCase().includes(query) ||
        (news.content && news.content.toLowerCase().includes(query))
      );
    }

    // Category filter
    if (this.selectedCategory) {
      filtered = filtered.filter(news => news.category === this.selectedCategory);
    }

    // Page filter
    if (this.selectedPage) {
      filtered = filtered.filter(news =>
        news.pages && news.pages.includes(this.selectedPage)
      );
    }

    // Breaking news filter
    if (this.filters.breaking) {
      filtered = filtered.filter(news => news.isBreaking === true);
    }

    // Featured filter
    if (this.filters.featured) {
      filtered = filtered.filter(news => news.isFeatured === true);
    }

    // Trending filter
    if (this.filters.trending) {
      filtered = filtered.filter(news => news.isTrending === true);
    }

    // Date sorting
    filtered.sort((a, b) => {
      const dateA = new Date(a.date || a.createdAt).getTime();
      const dateB = new Date(b.date || b.createdAt).getTime();
      return this.dateSort === 'latest' ? dateB - dateA : dateA - dateB;
    });

    this.filteredNews = filtered;
    this.groupFilteredNews();
  }

  groupFilteredNews() {
    const grouped: Record<string, LiveNews[]> = {};

    this.filteredNews.forEach(news => {
      if (!grouped[news.category]) {
        grouped[news.category] = [];
      }
      grouped[news.category].push(news);
    });

    const categoryOrder = ['National', 'International', 'Sports', 'Business', 'Entertainment', 'Health', 'Politics', 'Religious'];
    this.filteredGroupedNews = categoryOrder
      .filter(cat => grouped[cat] && grouped[cat].length > 0)
      .map(category => ({
        category,
        news: grouped[category]
      }));

    // Add any categories not in the predefined order
    Object.keys(grouped).forEach(category => {
      if (!categoryOrder.includes(category)) {
        this.filteredGroupedNews.push({
          category,
          news: grouped[category]
        });
      }
    });
  }

  toggleFilter(filterType: 'breaking' | 'featured' | 'trending') {
    this.filters[filterType] = !this.filters[filterType];
    this.applyFilters();
  }

  clearAllFilters() {
    this.searchQuery = '';
    this.selectedCategory = '';
    this.selectedPage = '';
    this.dateSort = 'latest';
    this.filters = {
      breaking: false,
      featured: false,
      trending: false
    };
    this.applyFilters();
  }

  getActiveFilterCount(): number {
    let count = 0;
    if (this.searchQuery.trim()) count++;
    if (this.selectedCategory) count++;
    if (this.selectedPage) count++;
    if (this.filters.breaking) count++;
    if (this.filters.featured) count++;
    if (this.filters.trending) count++;
    return count;
  }

  getBreakingCount(): number {
    return this.liveNews.filter(news => news.isBreaking).length;
  }

  getFeaturedCount(): number {
    return this.liveNews.filter(news => news.isFeatured).length;
  }

  getTrendingCount(): number {
    return this.liveNews.filter(news => news.isTrending).length;
  }

  viewNews(newsItem: LiveNews) {
    // Convert LiveNews to NewsArticle format
    const newsArticle: NewsArticle = {
      id: newsItem._id,
      category: newsItem.category,
      title: newsItem.title,
      titleEn: newsItem.titleEn || newsItem.title,
      excerpt: newsItem.excerpt,
      content: newsItem.content,
      image: this.getImageUrl(newsItem.image),
      time: newsItem.date || newsItem.createdAt,
      author: newsItem.author,
      date: newsItem.date || newsItem.createdAt
    };

    // Open the modal with the news article
    this.modalService.openModal(newsArticle, newsItem.isBreaking);
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
      'Politics': 'bg-indigo-500 text-white',
      'Religious': 'bg-indigo-500 text-white'
    };
    return colors[category] || 'bg-primary text-primary-foreground';
  }

  private getApiUrl(): string {
    return environment.apiUrl || 'http://localhost:3000';
  }
}

