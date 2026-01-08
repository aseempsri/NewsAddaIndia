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
  icon?: string;
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

                <!-- Icon Selection -->
                <div class="border-t-2 border-primary/30 pt-6 mt-6 bg-primary/5 p-4 rounded-lg shadow-lg">
                  <label class="block text-lg font-bold mb-3 text-foreground">🎨 Icon Selection</label>
                  <p class="text-sm text-muted-foreground mb-4">Select an icon to display with the headline in the news card</p>
                  <div class="grid grid-cols-4 sm:grid-cols-6 gap-3 p-4 border-2 border-border rounded-lg bg-background max-h-64 overflow-y-auto">
                    @for (icon of availableIcons; track icon.id) {
                      <button
                        type="button"
                        (click)="selectIcon(icon.id)"
                        [class]="'p-3 rounded-lg border-2 transition-all hover:scale-110 ' + (newsForm.icon === icon.id ? 'border-primary bg-primary/20 shadow-md ring-2 ring-primary/50' : 'border-border hover:border-primary/50 bg-background/50')"
                        [title]="icon.name">
                        <div [innerHTML]="getIconSvg(icon)" class="w-6 h-6 mx-auto text-foreground flex items-center justify-center"></div>
                      </button>
                    }
                  </div>
                  @if (newsForm.icon) {
                    <div class="mt-3 p-3 bg-primary/10 border-2 border-primary/30 rounded-lg">
                      <div class="text-sm font-medium text-foreground">
                        ✓ Selected: <span class="text-primary font-bold">{{ getIconName(newsForm.icon) }}</span>
                      </div>
                    </div>
                  } @else {
                    <div class="mt-2 text-sm text-muted-foreground italic p-2 bg-secondary/30 rounded">
                      No icon selected (optional - icon will appear next to headline in preview)
                    </div>
                  }
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
                        @if (newsForm.icon) {
                          <div class="flex-shrink-0" style="margin-top: 0.76rem; line-height: 1;">
                            <div [innerHTML]="getPreviewIconSvg(newsForm.icon)" [class]="'w-6 h-6 drop-shadow-lg ' + getIconColorClass(newsForm.category)" [style.filter]="getIconFilter(newsForm.category)" style="vertical-align: baseline;"></div>
                          </div>
                        }
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
    icon: undefined,
    tags: [],
    pages: ['home'],
    author: 'News Adda India',
    image: null,
    isBreaking: false,
    isFeatured: false,
    isTrending: false
  };

  availablePages = ['home', 'national', 'international', 'politics', 'health', 'entertainment', 'sports', 'business', 'religious'];

  availableIcons = [
    { id: 'star', name: 'Star', path: '<path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>' },
    { id: 'location', name: 'Location Pin', path: '<path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>' },
    { id: 'sports', name: 'Sports/Dollar', path: '<path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1.41 16.09V20h-2.67v-1.93c-1.71-.36-3.16-1.46-3.27-3.4h1.96c.1 1.05.82 1.87 2.65 1.87 1.96 0 2.4-.98 2.4-1.59 0-.83-.44-1.61-2.67-2.14-2.48-.6-4.18-1.62-4.18-3.67 0-1.72 1.39-2.84 3.11-3.21V4h2.67v1.95c1.86.45 2.79 1.86 2.85 3.39H14.3c-.05-1.11-.64-1.87-2.22-1.87-1.5 0-2.4.68-2.4 1.64 0 .84.65 1.39 2.67 1.91s4.18 1.39 4.18 3.91c-.01 1.83-1.38 2.83-3.12 3.16z"/>' },
    { id: 'business', name: 'Business/Dollar', path: '<path d="M11.8 10.9c-2.27-.59-3-1.2-3-2.15 0-1.09 1.01-1.85 2.7-1.85 1.78 0 2.44.85 2.5 2.1h2.21c-.07-1.72-1.12-3.3-3.21-3.81V3h-3v2.16c-1.94.42-3.5 1.68-3.5 3.61 0 2.31 1.91 3.46 4.7 4.13 2.5.6 3 1.48 3 2.41 0 .69-.49 1.79-2.7 1.79-2.06 0-2.87-.92-2.98-2.1h-2.2c.12 2.19 1.76 3.42 3.68 3.83V21h3v-2.15c1.95-.37 3.5-1.5 3.5-3.55 0-2.84-2.43-3.81-4.7-4.4z"/>' },
    { id: 'play', name: 'Play/Entertainment', path: '<path d="M8 5v14l11-7z"/>' },
    { id: 'check', name: 'Check/Health', path: '<path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>' },
    { id: 'globe', name: 'Globe/International', path: '<path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.94-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z"/>' },
    { id: 'newspaper', name: 'Newspaper', path: '<path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-5 14H5v-4h9v4zm0-5H5V9h9v3zm0-5H5V5h9v2zm5 10h-4v-4h4v4zm0-5h-4V9h4v3zm0-5h-4V5h4v2z"/>' },
    { id: 'fire', name: 'Fire/Trending', path: '<path d="M13.5.67s.74 2.65.74 4.8c0 2.06-1.35 3.73-3.41 3.73-2.07 0-3.63-1.67-3.63-3.73l.03-.36C5.21 7.51 4 10.62 4 14c0 4.42 3.58 8 8 8s8-3.58 8-8C20 8.61 17.41 3.8 13.5.67zM11.71 19c-1.78 0-3.22-1.4-3.22-3.14 0-1.62 1.05-2.76 2.81-3.12 1.77-.35 3.6-1.21 4.62-2.58.39 1.29.59 2.65.59 4.04 0 2.65-2.15 4.8-4.8 4.8z"/>' },
    { id: 'lightning', name: 'Lightning', path: '<path d="M13 10V3L4 14h7v7l9-11h-7z"/>' },
    { id: 'heart', name: 'Heart', path: '<path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>' },
    { id: 'calendar', name: 'Calendar', path: '<path d="M19 3h-1V1h-2v2H8V1H6v2H5c-1.11 0-1.99.9-1.99 2L3 19c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V8h14v11zM7 10h5v5H7z"/>' },
    { id: 'clock', name: 'Clock', path: '<path d="M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zM12 20c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm.5-13H11v6l5.25 3.15.75-1.23-4.5-2.67z"/>' },
    { id: 'user', name: 'User', path: '<path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>' },
    { id: 'tag', name: 'Tag', path: '<path d="M17.63 5.84C17.27 5.33 16.67 5 16 5L5 5.01C3.9 5.01 3 5.9 3 7.01v10c0 1.1.9 1.99 2 1.99L16 19c.67 0 1.27-.33 1.63-.84L22 12l-4.37-6.16z"/>' },
    { id: 'bell', name: 'Bell', path: '<path d="M12 22c1.1 0 2-.9 2-2h-4c0 1.1.89 2 2 2zm6-6v-5c0-3.07-1.64-5.64-4.5-6.32V4c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v.68C7.63 5.36 6 7.92 6 11v5l-2 2v1h16v-1l-2-2z"/>' },
    { id: 'megaphone', name: 'Megaphone', path: '<path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 14H6l-2 2V4h16v12z"/><path d="M11.5 12.5l2.5 2.5 5-5-2.5-2.5z"/>' },
    { id: 'camera', name: 'Camera', path: '<path d="M12 12.5c1.38 0 2.5-1.12 2.5-2.5s-1.12-2.5-2.5-2.5S9.5 8.62 9.5 10s1.12 2.5 2.5 2.5zM12 3l1.09 2.26L15.5 6l-2.41.74L12 9l-1.09-2.26L8.5 6l2.41-.74L12 3zm4.5 9l-1.41 1.41L16.5 15l-1.41-1.41L13.5 12l1.41-1.41L16.5 12l1.41 1.41zm-9 0l-1.41 1.41L7.5 15l-1.41-1.41L4.5 12l1.41-1.41L7.5 12l1.41 1.41z"/>' },
    { id: 'video', name: 'Video', path: '<path d="M17 10.5V7a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h12a1 1 0 001-1v-3.5l4 4v-11l-4 4z"/>' },
    { id: 'chart', name: 'Chart', path: '<path d="M3 13h8V3H3v10zm0 8h8v-6H3v6zm10 0h8V11h-8v10zm0-18v6h8V3h-8z"/>' },
    { id: 'shield', name: 'Shield', path: '<path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4z"/>' },
    { id: 'trophy', name: 'Trophy', path: '<path d="M19 5h-2V3H7v2H5c-1.1 0-2 .9-2 2v1c0 2.55 1.92 4.78 4.39 5.13A5.96 5.96 0 009 19c0 1.66 1.34 3 3 3s3-1.34 3-3c0-1.84-1.04-3.43-2.56-4.39C16.08 12.78 18 10.55 18 8V7c0-1.1-.9-2-2-2zM7 8V7h2v3.82C7.84 10.4 7 9.3 7 8zm7 0c0 1.3-.84 2.4-2 2.82V7h2v1z"/>' }
  ];

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

  selectIcon(iconId: string) {
    if (this.newsForm.icon === iconId) {
      // Deselect if clicking the same icon
      this.newsForm.icon = undefined;
    } else {
      this.newsForm.icon = iconId;
    }
  }

  getIconName(iconId: string): string {
    const icon = this.availableIcons.find(i => i.id === iconId);
    return icon ? icon.name : iconId;
  }

  getIconSvg(icon: { id: string; name: string; path: string }): SafeHtml {
    const svgHtml = `<svg class="w-6 h-6 text-foreground" viewBox="0 0 24 24" fill="currentColor">${icon.path}</svg>`;
    return this.sanitizer.bypassSecurityTrustHtml(svgHtml);
  }

  getPreviewIconSvg(iconId: string): SafeHtml {
    const icon = this.availableIcons.find(i => i.id === iconId);
    if (!icon) {
      return this.sanitizer.bypassSecurityTrustHtml('');
    }
    const svgHtml = `<svg class="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">${icon.path}</svg>`;
    return this.sanitizer.bypassSecurityTrustHtml(svgHtml);
  }

  getIconColorClass(category: string): string {
    const colors: Record<string, string> = {
      'Sports': 'text-orange-500',
      'Business': 'text-blue-500',
      'Entertainment': 'text-pink-500',
      'Health': 'text-green-500',
      'National': 'text-blue-500',
      'International': 'text-purple-500',
      'Politics': 'text-red-500',
      'Technology': 'text-cyan-500'
    };
    return colors[category] || 'text-purple-500';
  }

  getIconFilter(category: string): string {
    const filters: Record<string, string> = {
      'Sports': 'drop-shadow(0 2px 4px rgba(251,146,60,0.4))',
      'Business': 'drop-shadow(0 2px 4px rgba(59,130,246,0.4))',
      'Entertainment': 'drop-shadow(0 2px 4px rgba(236,72,153,0.4))',
      'Health': 'drop-shadow(0 2px 4px rgba(34,197,94,0.4))',
      'National': 'drop-shadow(0 2px 4px rgba(59,130,246,0.4))',
      'International': 'drop-shadow(0 2px 4px rgba(168,85,247,0.4))',
      'Politics': 'drop-shadow(0 2px 4px rgba(239,68,68,0.4))',
      'Technology': 'drop-shadow(0 2px 4px rgba(6,182,212,0.4))'
    };
    return filters[category] || 'drop-shadow(0 2px 4px rgba(168,85,247,0.4))';
  }

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
    if (this.newsForm.icon) {
      formData.append('icon', this.newsForm.icon);
    }
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
            icon: undefined,
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

