import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Router } from '@angular/router';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { environment } from '../../../environments/environment';

interface NewsForm {
  title: string;
  titleEn: string;
  excerpt: string;
  content: string;
  category: string;
  tags: string[];
  pages: string[];
  author: string;
  image: File | null;
  isBreaking: boolean;
  isFeatured: boolean;
  isTrending: boolean;
}

@Component({
  selector: 'app-admin',
  standalone: true,
  imports: [CommonModule, FormsModule],
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

        <!-- News Form -->
        @if (isAuthenticated) {
          <div class="space-y-6">
            <div class="flex items-center justify-between">
              <h1 class="text-3xl font-bold">Admin Panel - Add News</h1>
              <button
                (click)="logout()"
                class="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600">
                Logout
              </button>
            </div>

            <!-- Form and Preview Layout -->
            <div class="grid lg:grid-cols-2 gap-6">
              <!-- Form Section -->
              <div class="glass-card p-6 rounded-xl">
              <form (ngSubmit)="submitNews()" enctype="multipart/form-data" class="space-y-6">
                <!-- Title -->
                <div>
                  <label class="block text-sm font-medium mb-2">Title *</label>
                  <input
                    type="text"
                    [(ngModel)]="newsForm.title"
                    name="title"
                    class="w-full px-4 py-2 rounded-lg border border-border bg-background text-foreground"
                    required
                  />
                </div>

                <!-- Title (English) -->
                <div>
                  <label class="block text-sm font-medium mb-2">Title (English)</label>
                  <input
                    type="text"
                    [(ngModel)]="newsForm.titleEn"
                    name="titleEn"
                    class="w-full px-4 py-2 rounded-lg border border-border bg-background text-foreground"
                  />
                </div>

                <!-- Excerpt -->
                <div>
                  <label class="block text-sm font-medium mb-2">Excerpt *</label>
                  <textarea
                    [(ngModel)]="newsForm.excerpt"
                    name="excerpt"
                    rows="3"
                    class="w-full px-4 py-2 rounded-lg border border-border bg-background text-foreground"
                    required
                  ></textarea>
                </div>

                <!-- Content -->
                <div>
                  <label class="block text-sm font-medium mb-2">Content</label>
                  <textarea
                    [(ngModel)]="newsForm.content"
                    name="content"
                    rows="5"
                    class="w-full px-4 py-2 rounded-lg border border-border bg-background text-foreground"
                  ></textarea>
                </div>

                <!-- Category -->
                <div>
                  <label class="block text-sm font-medium mb-2">Category *</label>
                  <select
                    [(ngModel)]="newsForm.category"
                    name="category"
                    (change)="onCategoryChange()"
                    class="w-full px-4 py-2 rounded-lg border border-border bg-background text-foreground"
                    required
                  >
                    <option value="">Select Category</option>
                    <option value="National">National</option>
                    <option value="International">International</option>
                    <option value="Sports">Sports</option>
                    <option value="Business">Business</option>
                    <option value="Entertainment">Entertainment</option>
                    <option value="Health">Health</option>
                    <option value="Politics">Politics</option>
                    <option value="Religious">Religious</option>
                  </select>
                </div>

                <!-- Tags -->
                <div>
                  <label class="block text-sm font-medium mb-2">Tags (comma-separated)</label>
                  <input
                    type="text"
                    [(ngModel)]="tagsInput"
                    name="tags"
                    placeholder="e.g., breaking, latest, india"
                    class="w-full px-4 py-2 rounded-lg border border-border bg-background text-foreground"
                    (blur)="updateTags()"
                  />
                </div>

                <!-- Pages -->
                <div>
                  <label class="block text-sm font-medium mb-2">Pages to Display *</label>
                  <div class="grid grid-cols-2 md:grid-cols-4 gap-2">
                    @for (page of availablePages; track page) {
                      <label class="flex items-center space-x-2 cursor-pointer">
                        <input
                          type="checkbox"
                          [value]="page"
                          [checked]="newsForm.pages.includes(page)"
                          (change)="togglePage(page, $event)"
                          class="rounded"
                        />
                        <span class="text-sm capitalize">{{ page }}</span>
                      </label>
                    }
                  </div>
                </div>

                <!-- Author -->
                <div>
                  <label class="block text-sm font-medium mb-2">Author</label>
                  <input
                    type="text"
                    [(ngModel)]="newsForm.author"
                    name="author"
                    placeholder="News Adda India"
                    class="w-full px-4 py-2 rounded-lg border border-border bg-background text-foreground"
                  />
                </div>

                <!-- Breaking News, Featured & Trending -->
                <div class="grid grid-cols-3 gap-4">
                  <label class="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="checkbox"
                      [(ngModel)]="newsForm.isBreaking"
                      name="isBreaking"
                      class="rounded"
                    />
                    <span class="text-sm font-medium">Breaking News</span>
                  </label>
                  <label class="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="checkbox"
                      [(ngModel)]="newsForm.isFeatured"
                      name="isFeatured"
                      class="rounded"
                    />
                    <span class="text-sm font-medium">Featured</span>
                  </label>
                  <label class="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="checkbox"
                      [(ngModel)]="newsForm.isTrending"
                      name="isTrending"
                      class="rounded"
                    />
                    <span class="text-sm font-medium">Trending</span>
                  </label>
                </div>

                <!-- Image Upload -->
                <div>
                  <label class="block text-sm font-medium mb-2">Image</label>
                  <input
                    type="file"
                    accept="image/*"
                    (change)="onFileSelected($event)"
                    class="w-full px-4 py-2 rounded-lg border border-border bg-background text-foreground"
                  />
                  @if (newsForm.image) {
                    <div class="mt-2">
                      <p class="text-sm text-muted-foreground">Selected: {{ newsForm.image.name }}</p>
                    </div>
                  }
                </div>

                @if (submitError) {
                  <div class="text-red-500 text-sm">{{ submitError }}</div>
                }
                @if (submitSuccess) {
                  <div class="text-green-500 text-sm">{{ submitSuccess }}</div>
                }

                <button
                  type="submit"
                  [disabled]="isSubmitting"
                  class="w-full bg-primary text-primary-foreground py-3 rounded-lg hover:bg-primary/90 disabled:opacity-50 font-semibold">
                  {{ isSubmitting ? 'Submitting...' : 'Submit News' }}
                </button>
              </form>
              </div>

              <!-- Preview Section -->
              <div class="glass-card p-6 rounded-xl">
                <h2 class="text-xl font-bold mb-4">Preview</h2>
                <div class="sticky top-4">
                  <article class="news-card group">
                    <div class="relative aspect-[16/10] overflow-hidden rounded-t-xl bg-secondary/20">
                      <!-- Image Preview -->
                      @if (previewImageUrl) {
                        <img
                          [src]="previewImageUrl"
                          [alt]="newsForm.title || 'Preview'"
                          class="w-full h-full object-cover transition-all duration-500 group-hover:scale-110" />
                      } @else {
                        <div class="absolute inset-0 flex items-center justify-center bg-secondary/50">
                          <div class="text-center p-4">
                            <svg class="w-12 h-12 mx-auto text-muted-foreground mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                            <p class="text-sm text-muted-foreground">No image selected</p>
                          </div>
                        </div>
                      }
                      <!-- Category Badge -->
                      @if (newsForm.category) {
                        <div class="absolute top-4 left-4 z-20 flex gap-2">
                          @if (newsForm.isBreaking) {
                            <span class="px-3 py-1 text-xs font-semibold rounded-full bg-red-600 text-white animate-pulse">
                              BREAKING
                            </span>
                          }
                          <span [class]="'px-3 py-1 text-xs font-semibold rounded-full ' + getCategoryColor(newsForm.category)">
                            {{ newsForm.category }}
                          </span>
                        </div>
                      }
                    </div>

                    <div class="p-5">
                      <!-- Title -->
                      <div class="flex items-start gap-3 mb-2">
                        <h3 class="font-display text-lg font-semibold leading-tight group-hover:text-primary transition-colors line-clamp-2 flex-1">
                          {{ newsForm.title || 'News Title' }}
                        </h3>
                      </div>
                      <!-- Excerpt -->
                      <p class="text-muted-foreground text-sm line-clamp-2 mb-4">
                        {{ newsForm.excerpt || 'News excerpt will appear here...' }}
                      </p>
                      <!-- Footer -->
                      <div class="flex items-center justify-between">
                        <span class="flex items-center gap-1.5 text-xs text-muted-foreground">
                          <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          Just now
                        </span>
                        <svg class="w-4 h-4 text-primary opacity-0 group-hover:opacity-100 transition-all transform group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                        </svg>
                      </div>
                      <!-- Author (if provided) -->
                      @if (newsForm.author) {
                        <div class="mt-2 pt-2 border-t border-border/30">
                          <span class="text-xs text-muted-foreground">By {{ newsForm.author }}</span>
                        </div>
                      }
                      <!-- Tags Preview -->
                      @if (newsForm.tags.length > 0) {
                        <div class="mt-3 pt-3 border-t border-border/30">
                          <div class="flex flex-wrap gap-1">
                            @for (tag of newsForm.tags; track tag) {
                              <span class="px-2 py-1 text-xs bg-secondary rounded-md text-muted-foreground">{{ tag }}</span>
                            }
                          </div>
                        </div>
                      }
                      <!-- Pages Preview -->
                      @if (newsForm.pages.length > 0) {
                        <div class="mt-3 pt-3 border-t border-border/30">
                          <p class="text-xs text-muted-foreground mb-1">Will appear on:</p>
                          <div class="flex flex-wrap gap-1">
                            @for (page of newsForm.pages; track page) {
                              <span class="px-2 py-1 text-xs bg-primary/10 text-primary rounded-md capitalize">{{ page }}</span>
                            }
                          </div>
                        </div>
                      }
                    </div>
                  </article>
                </div>
              </div>
            </div>
          </div>
        }
      </div>
    </div>
  `,
  styles: []
})
export class AdminComponent implements OnInit {
  isAuthenticated = false;
  username = '';
  password = '';
  loginError = '';
  isLoading = false;
  isSubmitting = false;
  submitError = '';
  submitSuccess = '';
  authToken = '';
  tagsInput = '';
  previewImageUrl: string | null = null;

  newsForm: NewsForm = {
    title: '',
    titleEn: '',
    excerpt: '',
    content: '',
    category: '',
    tags: [],
    pages: ['home'],
    author: 'News Adda India',
    image: null,
    isBreaking: false,
    isFeatured: false,
    isTrending: false
  };

  availablePages = ['home', 'national', 'international', 'politics', 'health', 'entertainment', 'sports', 'business', 'religious'];

  constructor(
    private http: HttpClient,
    private router: Router,
    private sanitizer: DomSanitizer
  ) {
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
    this.newsForm = {
      title: '',
      titleEn: '',
      excerpt: '',
      content: '',
      category: '',
      tags: [],
      pages: ['home'],
      author: 'News Adda India',
      image: null,
      isBreaking: false,
      isFeatured: false
    };
    this.tagsInput = '';
    this.previewImageUrl = null;
    this.submitError = '';
    this.submitSuccess = '';
  }

  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.newsForm.image = input.files[0];
      // Create preview URL
      const reader = new FileReader();
      reader.onload = (e) => {
        this.previewImageUrl = e.target?.result as string;
      };
      reader.readAsDataURL(this.newsForm.image);
    } else {
      this.previewImageUrl = null;
    }
  }

  updateTags() {
    if (this.tagsInput.trim()) {
      this.newsForm.tags = this.tagsInput.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0);
    } else {
      this.newsForm.tags = [];
    }
  }

  togglePage(page: string, event: Event) {
    const checked = (event.target as HTMLInputElement).checked;
    if (checked) {
      if (!this.newsForm.pages.includes(page)) {
        this.newsForm.pages.push(page);
      }
    } else {
      this.newsForm.pages = this.newsForm.pages.filter(p => p !== page);
    }
  }

  // Icon methods removed

  // Sync pages with category
  onCategoryChange() {
    if (!this.newsForm.category) {
      return;
    }

    // Map category to corresponding page
    const categoryToPageMap: { [key: string]: string } = {
      'National': 'national',
      'International': 'international',
      'Sports': 'sports',
      'Business': 'business',
      'Entertainment': 'entertainment',
      'Health': 'health',
      'Politics': 'politics'
    };

    const correspondingPage = categoryToPageMap[this.newsForm.category];
    
    if (correspondingPage) {
      // Always include 'home' and the corresponding category page
      const defaultPages = ['home', correspondingPage];
      
      // Keep any other pages that were already selected (except the old category page)
      const otherPages = this.newsForm.pages.filter(
        p => p !== 'home' && !Object.values(categoryToPageMap).includes(p)
      );
      
      // Combine default pages with other selected pages
      this.newsForm.pages = [...defaultPages, ...otherPages];
    }
  }

  submitNews() {
    this.isSubmitting = true;
    this.submitError = '';
    this.submitSuccess = '';

    const formData = new FormData();
    formData.append('title', this.newsForm.title);
    formData.append('titleEn', this.newsForm.titleEn || this.newsForm.title);
    formData.append('excerpt', this.newsForm.excerpt);
    formData.append('content', this.newsForm.content || this.newsForm.excerpt);
    formData.append('category', this.newsForm.category);
    formData.append('tags', JSON.stringify(this.newsForm.tags));
    formData.append('pages', JSON.stringify(this.newsForm.pages));
    formData.append('author', this.newsForm.author);
    formData.append('isBreaking', this.newsForm.isBreaking.toString());
    formData.append('isFeatured', this.newsForm.isFeatured.toString());
    formData.append('isTrending', this.newsForm.isTrending.toString());
    
    if (this.newsForm.image) {
      formData.append('image', this.newsForm.image);
    }

    const headers = new HttpHeaders().set('Authorization', `Bearer ${this.authToken}`);

    this.http.post<{ success: boolean; message?: string; error?: string }>(
      `${this.getApiUrl()}/api/news`,
      formData,
      { headers }
    ).subscribe({
      next: (response) => {
        if (response.success) {
          this.submitSuccess = response.message || 'News submitted successfully!';
          // Reset form
          this.newsForm = {
            title: '',
            titleEn: '',
            excerpt: '',
            content: '',
            category: '',
            tags: [],
            pages: ['home'],
            author: 'News Adda India',
            image: null,
            isBreaking: false,
            isFeatured: false,
            isTrending: false
          };
          this.tagsInput = '';
          this.previewImageUrl = null;
          // Clear file input
          const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
          if (fileInput) {
            fileInput.value = '';
          }
        } else {
          this.submitError = response.error || 'Failed to submit news';
        }
        this.isSubmitting = false;
      },
      error: (error) => {
        this.submitError = error.error?.error || 'Failed to submit news. Please try again.';
        this.isSubmitting = false;
      }
    });
  }

  private getApiUrl(): string {
    return environment.apiUrl || 'http://localhost:3000';
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
}

