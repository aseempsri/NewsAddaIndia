import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Router, RouterModule } from '@angular/router';
import { environment } from '../../../../environments/environment';
import { AdminThemeService, AdminTheme } from '../../../services/admin-theme.service';
import { ModalService } from '../../../services/modal.service';
import { NewsDetailModalComponent } from '../../../components/news-detail-modal/news-detail-modal.component';
import { NewsArticle } from '../../../services/news.service';
import { LanguageService } from '../../../services/language.service';
import { TranslationService } from '../../../services/translation.service';
import { Subscription } from 'rxjs';

interface ArchivedNews {
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
  createdAt: string;
  updatedAt: string;
  generatedAt?: string;
}

@Component({
  selector: 'app-admin-archived-news',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, NewsDetailModalComponent],
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
                <h1 class="text-3xl font-bold">Archived News</h1>
                <span class="px-3 py-1 text-sm bg-purple-500/10 text-purple-500 rounded-full">
                  {{ totalPosts }} archived posts
                </span>
              </div>
              <div class="flex items-center gap-3">
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

            <!-- Search Filter -->
            <div class="glass-card p-6 rounded-xl mb-6">
              <h2 class="text-xl font-bold mb-4">Search Articles</h2>
              <div class="flex gap-2">
                <div class="flex-1 relative">
                  <input
                    type="text"
                    [(ngModel)]="searchQuery"
                    (keyup.enter)="performSearch()"
                    placeholder="Type keywords in English to search..."
                    class="w-full px-4 py-2 pr-24 rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary">
                  @if (isTranslating) {
                    <div class="absolute right-2 top-1/2 -translate-y-1/2">
                      <div class="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                    </div>
                  }
                </div>
                <button
                  (click)="translateAndSearch()"
                  [disabled]="!searchQuery || isTranslating"
                  class="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2">
                  <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129" />
                  </svg>
                  Translate & Search
                </button>
                @if (searchQuery) {
                  <button
                    (click)="clearSearch()"
                    class="px-4 py-2 bg-secondary text-foreground rounded-lg hover:bg-secondary/80">
                    Clear
                  </button>
                }
              </div>
              @if (searchQuery && translatedQuery) {
                <div class="mt-3 p-3 bg-blue-500/10 rounded-lg">
                  <p class="text-sm">
                    <span class="font-semibold">Searching for:</span> 
                    <span class="text-blue-600 dark:text-blue-400">{{ translatedQuery }}</span>
                    <span class="text-muted-foreground ml-2">(translated from: {{ searchQuery }})</span>
                  </p>
                </div>
              }
            </div>

            <!-- Month and Year Filters -->
            <div class="glass-card p-6 rounded-xl">
              <h2 class="text-xl font-bold mb-4">Filter by Date</h2>
              <div class="grid md:grid-cols-3 gap-4">
                <div>
                  <label class="block text-sm font-medium mb-2">Year</label>
                  <select
                    [(ngModel)]="selectedYear"
                    (change)="applyFilters()"
                    class="w-full px-4 py-2 rounded-lg border border-border bg-background text-foreground">
                    <option value="">All Years</option>
                    @for (year of availableYears; track year) {
                      <option [value]="year">{{ year }}</option>
                    }
                  </select>
                </div>
                <div>
                  <label class="block text-sm font-medium mb-2">Month</label>
                  <select
                    [(ngModel)]="selectedMonth"
                    (change)="applyFilters()"
                    class="w-full px-4 py-2 rounded-lg border border-border bg-background text-foreground">
                    <option value="">All Months</option>
                    @for (month of availableMonths; track month.value) {
                      <option [value]="month.value">{{ month.label }}</option>
                    }
                  </select>
                </div>
                <div class="flex items-end">
                  <button
                    (click)="clearFilters()"
                    class="w-full px-4 py-2 bg-secondary text-foreground rounded-lg hover:bg-secondary/80">
                    Clear Filters
                  </button>
                </div>
              </div>
              @if (selectedYear || selectedMonth) {
                <div class="mt-4 p-3 bg-primary/10 rounded-lg">
                  <p class="text-sm">
                    Showing posts from: 
                    <span class="font-semibold">
                      @if (selectedMonth) {
                        {{ getMonthName(selectedMonth) }}
                      }
                      @if (selectedYear) {
                        {{ selectedYear }}
                      }
                    </span>
                  </p>
                </div>
              }
            </div>

            @if (isLoading) {
              <div class="text-center py-12">
                <p class="text-muted-foreground">Loading archived news...</p>
              </div>
            } @else if (error) {
              <div class="text-center py-12">
                <p class="text-red-500">{{ error }}</p>
              </div>
            } @else if (archivedNews.length === 0) {
              <div class="text-center py-12">
                <h2 class="text-2xl font-bold mb-2">No Archived News</h2>
                <p class="text-muted-foreground">No archived news found for the selected filters.</p>
              </div>
            } @else {
              <!-- News List -->
              <div class="space-y-4">
                @for (news of archivedNews; track news._id) {
                  <div class="glass-card p-6 rounded-xl hover:shadow-lg transition-all">
                    <div class="flex flex-col md:flex-row gap-4">
                      @if (news.image) {
                        <div class="md:w-48 flex-shrink-0">
                          <img [src]="news.image" [alt]="news.title" class="w-full h-32 object-cover rounded-lg" />
                        </div>
                      }
                      <div class="flex-1">
                        <div class="flex items-start justify-between gap-4">
                          <div class="flex-1">
                            <h3 class="text-xl font-bold mb-2">{{ news.title }}</h3>
                            @if (news.titleEn && news.titleEn !== news.title) {
                              <p class="text-sm text-muted-foreground mb-2">{{ news.titleEn }}</p>
                            }
                            <p class="text-muted-foreground mb-3 line-clamp-2">{{ news.excerpt }}</p>
                            <div class="flex flex-wrap gap-2 mb-3">
                              <span class="px-2 py-1 text-xs bg-primary/10 text-primary rounded">{{ news.category }}</span>
                              @if (news.isBreaking) {
                                <span class="px-2 py-1 text-xs bg-red-500/10 text-red-500 rounded">Breaking</span>
                              }
                              @if (news.isFeatured) {
                                <span class="px-2 py-1 text-xs bg-yellow-500/10 text-yellow-500 rounded">Featured</span>
                              }
                            </div>
                            <p class="text-xs text-muted-foreground">
                              Created: {{ formatDate(news.createdAt) }}
                              @if (news.generatedAt) {
                                | Generated: {{ formatDate(news.generatedAt) }}
                              }
                            </p>
                          </div>
                          <div class="flex flex-col gap-2">
                            <button
                              (click)="viewNews(news)"
                              class="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90">
                              View
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                }
              </div>

              <!-- Pagination -->
              @if (totalPosts > pageSize) {
                <div class="flex items-center justify-between mt-6">
                  <p class="text-sm text-muted-foreground">
                    Showing {{ (currentPage - 1) * pageSize + 1 }} - {{ Math.min(currentPage * pageSize, totalPosts) }} of {{ totalPosts }}
                  </p>
                  <div class="flex gap-2">
                    <button
                      (click)="previousPage()"
                      [disabled]="currentPage === 1"
                      class="px-4 py-2 bg-secondary text-foreground rounded-lg hover:bg-secondary/80 disabled:opacity-50">
                      Previous
                    </button>
                    <button
                      (click)="nextPage()"
                      [disabled]="currentPage >= totalPages"
                      class="px-4 py-2 bg-secondary text-foreground rounded-lg hover:bg-secondary/80 disabled:opacity-50">
                      Next
                    </button>
                  </div>
                </div>
              }
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
export class AdminArchivedNewsComponent implements OnInit, OnDestroy {
  isAuthenticated = false;
  currentAdminTheme: AdminTheme = 'light';
  private adminThemeSubscription?: Subscription;
  authToken = '';
  archivedNews: ArchivedNews[] = [];
  isLoading = false;
  error = '';
  
  selectedYear: string = '';
  selectedMonth: string = '';
  availableYears: number[] = [];
  availableMonths = [
    { value: '01', label: 'January' },
    { value: '02', label: 'February' },
    { value: '03', label: 'March' },
    { value: '04', label: 'April' },
    { value: '05', label: 'May' },
    { value: '06', label: 'June' },
    { value: '07', label: 'July' },
    { value: '08', label: 'August' },
    { value: '09', label: 'September' },
    { value: '10', label: 'October' },
    { value: '11', label: 'November' },
    { value: '12', label: 'December' }
  ];

  totalPosts = 0;
  currentPage = 1;
  pageSize = 50;
  totalPages = 1;
  Math = Math;

  searchQuery = '';
  translatedQuery = '';
  isTranslating = false;

  constructor(
    private http: HttpClient,
    private router: Router,
    private adminThemeService: AdminThemeService,
    private modalService: ModalService,
    private languageService: LanguageService,
    private translationService: TranslationService
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
      this.loadArchivedNews();
      this.loadAvailableYears();
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
          this.loadArchivedNews();
          this.loadAvailableYears();
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

  loadAvailableYears() {
    const headers = new HttpHeaders().set('Authorization', `Bearer ${this.authToken}`);
    this.http.get<{ success: boolean; data: number[] }>(
      `${this.getApiUrl()}/api/pending-news/archived/years`,
      { headers }
    ).subscribe({
      next: (response) => {
        if (response.success) {
          this.availableYears = response.data.sort((a, b) => b - a); // Descending order
        }
      },
      error: () => {
        // If endpoint doesn't exist, generate years from 2020 to current year
        const currentYear = new Date().getFullYear();
        this.availableYears = Array.from({ length: currentYear - 2019 }, (_, i) => currentYear - i);
      }
    });
  }

  loadArchivedNews() {
    this.isLoading = true;
    this.error = '';
    const headers = new HttpHeaders().set('Authorization', `Bearer ${this.authToken}`);
    
    let queryParams = `limit=${this.pageSize}&skip=${(this.currentPage - 1) * this.pageSize}`;
    if (this.selectedYear) {
      queryParams += `&year=${this.selectedYear}`;
    }
    if (this.selectedMonth) {
      queryParams += `&month=${this.selectedMonth}`;
    }
    if (this.translatedQuery) {
      queryParams += `&search=${encodeURIComponent(this.translatedQuery)}`;
    }

    this.http.get<{ success: boolean; data: ArchivedNews[]; total?: number }>(
      `${this.getApiUrl()}/api/pending-news/archived?${queryParams}`,
      { headers }
    ).subscribe({
      next: (response) => {
        if (response.success) {
          this.archivedNews = response.data;
          this.totalPosts = response.total || response.data.length;
          this.totalPages = Math.ceil(this.totalPosts / this.pageSize);
        } else {
          this.error = 'Failed to load archived news';
        }
        this.isLoading = false;
      },
      error: (err) => {
        this.error = err.error?.error || 'Failed to load archived news. Please try again.';
        this.isLoading = false;
      }
    });
  }

  async translateAndSearch() {
    if (!this.searchQuery || this.searchQuery.trim() === '') {
      return;
    }

    this.isTranslating = true;
    try {
      // Translate English to Hindi
      this.translationService.translateToHindi(this.searchQuery).subscribe({
        next: (translated) => {
          this.translatedQuery = translated;
          this.isTranslating = false;
          this.currentPage = 1; // Reset to first page
          this.loadArchivedNews();
        },
        error: (err) => {
          console.error('Translation error:', err);
          // If translation fails, use original query
          this.translatedQuery = this.searchQuery;
          this.isTranslating = false;
          this.currentPage = 1;
          this.loadArchivedNews();
        }
      });
    } catch (error) {
      console.error('Translation error:', error);
      this.translatedQuery = this.searchQuery;
      this.isTranslating = false;
      this.currentPage = 1;
      this.loadArchivedNews();
    }
  }

  performSearch() {
    if (this.translatedQuery) {
      // Already translated, just search
      this.currentPage = 1;
      this.loadArchivedNews();
    } else if (this.searchQuery) {
      // Translate first, then search
      this.translateAndSearch();
    }
  }

  clearSearch() {
    this.searchQuery = '';
    this.translatedQuery = '';
    this.currentPage = 1;
    this.loadArchivedNews();
  }

  applyFilters() {
    this.currentPage = 1;
    this.loadArchivedNews();
  }

  clearFilters() {
    this.selectedYear = '';
    this.selectedMonth = '';
    this.currentPage = 1;
    this.loadArchivedNews();
  }

  getMonthName(monthValue: string): string {
    const month = this.availableMonths.find(m => m.value === monthValue);
    return month ? month.label : '';
  }

  previousPage() {
    if (this.currentPage > 1) {
      this.currentPage--;
      this.loadArchivedNews();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }

  nextPage() {
    if (this.currentPage < this.totalPages) {
      this.currentPage++;
      this.loadArchivedNews();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }

  viewNews(news: ArchivedNews) {
    // Ensure ID is a clean string
    const newsId = typeof news._id === 'string' ? news._id.trim() : String(news._id).trim();
    
    if (!newsId || newsId.length !== 24 || !/^[0-9a-fA-F]{24}$/.test(newsId)) {
      console.error('[Archived News] Invalid news ID:', news._id);
      alert('Invalid article ID. Cannot open article.');
      return;
    }
    
    // Construct full image URL if it's a relative path
    let imageUrl = news.image || '';
    if (imageUrl && imageUrl.trim() !== '' && !imageUrl.startsWith('http')) {
      if (!imageUrl.startsWith('/')) {
        imageUrl = '/' + imageUrl;
      }
      imageUrl = `${this.getApiUrl()}${imageUrl}`;
    }

    const newsArticle: NewsArticle = {
      id: newsId,
      category: news.category,
      title: news.title,
      titleEn: news.titleEn || news.title,
      excerpt: news.excerpt || '',
      excerptEn: news.titleEn || news.title,
      content: news.content || '',
      contentEn: news.titleEn || news.title,
      image: imageUrl,
      images: news.image ? [imageUrl] : [],
      time: this.formatDate(news.createdAt),
      date: this.formatDate(news.createdAt),
      author: news.author || 'News Adda India',
      isBreaking: news.isBreaking || false,
      isFeatured: news.isFeatured || false,
      isTrending: false,
      tags: news.tags || []
    };
    
    console.log('[Archived News] Opening modal with article:', newsArticle);
    this.modalService.openModal(newsArticle, news.isBreaking || false);
  }

  formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  logout() {
    localStorage.removeItem('admin_token');
    this.authToken = '';
    this.isAuthenticated = false;
    this.router.navigate(['/admin']);
  }

  private getApiUrl(): string {
    return environment.apiUrl || 'http://localhost:3000';
  }
}
