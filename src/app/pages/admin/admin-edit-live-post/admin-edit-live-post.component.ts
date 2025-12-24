import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Router, RouterModule, ActivatedRoute } from '@angular/router';
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

@Component({
  selector: 'app-admin-edit-live-post',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  template: `
    <div class="min-h-screen bg-background py-8">
      <div class="container mx-auto px-4 max-w-7xl">
        @if (isAuthenticated) {
          <div class="space-y-6">
            <div class="flex items-center justify-between">
              <div class="flex items-center gap-4">
                <a routerLink="/admin/review-live" class="text-primary hover:text-primary/80">
                  <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                  </svg>
                </a>
                <h1 class="text-3xl font-bold">Edit Live Post</h1>
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
                <p class="text-muted-foreground">Loading post...</p>
              </div>
            } @else {
              <!-- Form and Preview Layout -->
              <div class="grid lg:grid-cols-2 gap-6">
                <!-- Form Section -->
                <div class="glass-card p-6 rounded-xl">
                <form (ngSubmit)="updateNews()" enctype="multipart/form-data" class="space-y-6">
                  <!-- Title -->
                  <div>
                    <label class="block text-sm font-medium mb-2">Title *</label>
                    <input
                      type="text"
                      [(ngModel)]="newsData.title"
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
                      [(ngModel)]="newsData.titleEn"
                      name="titleEn"
                      class="w-full px-4 py-2 rounded-lg border border-border bg-background text-foreground"
                    />
                  </div>

                  <!-- Excerpt -->
                  <div>
                    <label class="block text-sm font-medium mb-2">Excerpt *</label>
                    <textarea
                      [(ngModel)]="newsData.excerpt"
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
                      [(ngModel)]="newsData.content"
                      name="content"
                      rows="5"
                      class="w-full px-4 py-2 rounded-lg border border-border bg-background text-foreground"
                    ></textarea>
                  </div>

                  <!-- Category -->
                  <div>
                    <label class="block text-sm font-medium mb-2">Category *</label>
                    <select
                      [(ngModel)]="newsData.category"
                      name="category"
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
                            [checked]="newsData.pages.includes(page)"
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
                      [(ngModel)]="newsData.author"
                      name="author"
                      placeholder="News Adda India"
                      class="w-full px-4 py-2 rounded-lg border border-border bg-background text-foreground"
                    />
                  </div>

                  <!-- Breaking News & Featured -->
                  <div class="grid grid-cols-2 gap-4">
                    <label class="flex items-center space-x-2 cursor-pointer">
                      <input
                        type="checkbox"
                        [(ngModel)]="newsData.isBreaking"
                        name="isBreaking"
                        class="rounded"
                      />
                      <span class="text-sm font-medium">Breaking News</span>
                    </label>
                    <label class="flex items-center space-x-2 cursor-pointer">
                      <input
                        type="checkbox"
                        [(ngModel)]="newsData.isFeatured"
                        name="isFeatured"
                        class="rounded"
                      />
                      <span class="text-sm font-medium">Featured</span>
                    </label>
                  </div>

                  <!-- Image Upload -->
                  <div>
                    <label class="block text-sm font-medium mb-2">Image</label>
                    @if (currentImageUrl) {
                      <div class="mb-2">
                        <img [src]="currentImageUrl" alt="Current image" class="w-32 h-32 object-cover rounded-lg" />
                      </div>
                    }
                    <input
                      type="file"
                      accept="image/*"
                      (change)="onFileSelected($event)"
                      class="w-full px-4 py-2 rounded-lg border border-border bg-background text-foreground"
                    />
                    @if (newImage) {
                      <div class="mt-2">
                        <p class="text-sm text-muted-foreground">New image selected: {{ newImage.name }}</p>
                      </div>
                    }
                  </div>

                  @if (submitError) {
                    <div class="text-red-500 text-sm">{{ submitError }}</div>
                  }
                  @if (submitSuccess) {
                    <div class="text-green-500 text-sm">{{ submitSuccess }}</div>
                  }

                  <div class="flex gap-2">
                    <button
                      type="submit"
                      [disabled]="isSubmitting"
                      class="flex-1 bg-primary text-primary-foreground py-3 rounded-lg hover:bg-primary/90 disabled:opacity-50 font-semibold">
                      {{ isSubmitting ? 'Updating...' : 'Update Post' }}
                    </button>
                    <a
                      routerLink="/admin/review-live"
                      class="px-6 py-3 bg-secondary text-foreground rounded-lg hover:bg-secondary/80">
                      Cancel
                    </a>
                  </div>
                </form>
                </div>

                <!-- Preview Section -->
                <div class="glass-card p-6 rounded-xl">
                  <h2 class="text-xl font-bold mb-4">Preview</h2>
                  <div class="sticky top-4">
                    <article class="news-card group">
                      <div class="relative aspect-[16/10] overflow-hidden rounded-t-xl bg-secondary/20">
                        <!-- Image Preview -->
                        @if (previewImageUrl || currentImageUrl) {
                          <img
                            [src]="previewImageUrl || currentImageUrl"
                            [alt]="newsData.title || 'Preview'"
                            class="w-full h-full object-cover transition-all duration-500 group-hover:scale-110" />
                        } @else {
                          <div class="absolute inset-0 flex items-center justify-center bg-secondary/50">
                            <div class="text-center p-4">
                              <svg class="w-12 h-12 mx-auto text-muted-foreground mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                              </svg>
                              <p class="text-sm text-muted-foreground">No image</p>
                            </div>
                          </div>
                        }
                        <!-- Category Badge -->
                        @if (newsData.category) {
                          <div class="absolute top-4 left-4 z-20 flex gap-2">
                            @if (newsData.isBreaking) {
                              <span class="px-3 py-1 text-xs font-semibold rounded-full bg-red-600 text-white animate-pulse">
                                BREAKING
                              </span>
                            }
                            <span [class]="'px-3 py-1 text-xs font-semibold rounded-full ' + getCategoryColor(newsData.category)">
                              {{ newsData.category }}
                            </span>
                          </div>
                        }
                      </div>

                      <div class="p-5">
                        <h3 class="font-display text-lg font-semibold leading-tight mb-2 group-hover:text-primary transition-colors line-clamp-2">
                          {{ newsData.title || 'News Title' }}
                        </h3>
                        <p class="text-muted-foreground text-sm line-clamp-2 mb-4">
                          {{ newsData.excerpt || 'News excerpt will appear here...' }}
                        </p>
                        <div class="flex items-center justify-between">
                          <span class="flex items-center gap-1.5 text-xs text-muted-foreground">
                            <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            Just now
                          </span>
                        </div>
                      </div>
                    </article>
                  </div>
                </div>
              </div>
            }
          </div>
        }
      </div>
    </div>
  `,
  styles: []
})
export class AdminEditLivePostComponent implements OnInit {
  isAuthenticated = false;
  authToken = '';
  newsId = '';
  newsData: LiveNews = {
    _id: '',
    title: '',
    titleEn: '',
    excerpt: '',
    content: '',
    category: '',
    tags: [],
    pages: ['home'],
    author: 'News Adda India',
    image: '',
    isBreaking: false,
    isFeatured: false,
    date: '',
    createdAt: '',
    updatedAt: ''
  };
  isLoading = false;
  isSubmitting = false;
  submitError = '';
  submitSuccess = '';
  tagsInput = '';
  previewImageUrl: string | null = null;
  currentImageUrl: string | null = null;
  newImage: File | null = null;

  availablePages = ['home', 'national', 'international', 'politics', 'health', 'entertainment', 'sports', 'business'];

  constructor(
    private http: HttpClient,
    private router: Router,
    private route: ActivatedRoute
  ) {
    const token = localStorage.getItem('admin_token');
    if (token) {
      this.authToken = token;
      this.verifyToken();
    } else {
      this.router.navigate(['/admin']);
    }
  }

  ngOnInit() {
    this.route.params.subscribe(params => {
      this.newsId = params['id'];
      this.loadNews();
    });
  }

  verifyToken() {
    const headers = new HttpHeaders().set('Authorization', `Bearer ${this.authToken}`);
    this.http.get<{ valid: boolean }>(`${this.getApiUrl()}/api/auth/verify`, { headers }).subscribe({
      next: (response) => {
        if (response.valid) {
          this.isAuthenticated = true;
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

  loadNews() {
    // Try to load from sessionStorage first (from review page)
    const storedNews = sessionStorage.getItem('editLiveNews');
    if (storedNews) {
      try {
        this.newsData = JSON.parse(storedNews);
        this.tagsInput = this.newsData.tags.join(', ');
        if (this.newsData.image) {
          this.currentImageUrl = this.getImageUrl(this.newsData.image);
        }
        sessionStorage.removeItem('editLiveNews');
        return;
      } catch (e) {
        console.error('Error parsing stored news:', e);
      }
    }

    // Otherwise fetch from API
    this.isLoading = true;
    this.http.get<{ success: boolean; data: LiveNews; error?: string }>(
      `${this.getApiUrl()}/api/news/${this.newsId}`
    ).subscribe({
      next: (response) => {
        if (response.success) {
          this.newsData = response.data;
          this.tagsInput = this.newsData.tags.join(', ');
          if (this.newsData.image) {
            this.currentImageUrl = this.getImageUrl(this.newsData.image);
          }
        } else {
          this.submitError = response.error || 'Failed to load news';
        }
        this.isLoading = false;
      },
      error: (err) => {
        this.submitError = err.error?.error || 'Failed to load news. Please try again.';
        this.isLoading = false;
      }
    });
  }

  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.newImage = input.files[0];
      const reader = new FileReader();
      reader.onload = (e) => {
        this.previewImageUrl = e.target?.result as string;
      };
      reader.readAsDataURL(this.newImage);
    }
  }

  updateTags() {
    if (this.tagsInput.trim()) {
      this.newsData.tags = this.tagsInput.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0);
    } else {
      this.newsData.tags = [];
    }
  }

  togglePage(page: string, event: Event) {
    const checked = (event.target as HTMLInputElement).checked;
    if (checked) {
      if (!this.newsData.pages.includes(page)) {
        this.newsData.pages.push(page);
      }
    } else {
      this.newsData.pages = this.newsData.pages.filter(p => p !== page);
    }
  }

  updateNews() {
    this.isSubmitting = true;
    this.submitError = '';
    this.submitSuccess = '';

    const formData = new FormData();
    formData.append('title', this.newsData.title);
    formData.append('titleEn', this.newsData.titleEn || this.newsData.title);
    formData.append('excerpt', this.newsData.excerpt);
    formData.append('content', this.newsData.content || this.newsData.excerpt);
    formData.append('category', this.newsData.category);
    formData.append('tags', JSON.stringify(this.newsData.tags));
    formData.append('pages', JSON.stringify(this.newsData.pages));
    formData.append('author', this.newsData.author);
    formData.append('isBreaking', this.newsData.isBreaking.toString());
    formData.append('isFeatured', this.newsData.isFeatured.toString());
    formData.append('published', 'true'); // Keep it published
    
    if (this.newImage) {
      formData.append('image', this.newImage);
    }

    const headers = new HttpHeaders().set('Authorization', `Bearer ${this.authToken}`);

    this.http.put<{ success: boolean; message?: string; error?: string; data?: LiveNews }>(
      `${this.getApiUrl()}/api/news/${this.newsId}`,
      formData,
      { headers }
    ).subscribe({
      next: (response) => {
        if (response.success) {
          this.submitSuccess = response.message || 'Post updated successfully!';
          setTimeout(() => {
            this.router.navigate(['/admin/review-live']);
          }, 1500);
        } else {
          this.submitError = response.error || 'Failed to update post';
        }
        this.isSubmitting = false;
      },
      error: (error) => {
        this.submitError = error.error?.error || 'Failed to update post. Please try again.';
        this.isSubmitting = false;
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

