import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Router, RouterModule, ActivatedRoute } from '@angular/router';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { environment } from '../../../../environments/environment';
import { CKEditorModule } from '@ckeditor/ckeditor5-angular';
import ClassicEditor from '@ckeditor/ckeditor5-build-classic';
import { AdminThemeService, AdminTheme } from '../../../services/admin-theme.service';
import { Subscription } from 'rxjs';

interface LiveNews {
  _id: string;
  title: string;
  titleEn: string;
  excerpt: string;
  excerptEn: string;
  summary: string;
  summaryEn: string;
  content: string;
  contentEn: string;
  category: string;
  icon?: string;
  tags: string[];
  pages: string[];
  author: string;
  image: string;
  images?: string[];
  isBreaking: boolean;
  isFeatured: boolean;
  isTrending: boolean;
  trendingTitle?: string;
  trendingTitleEn?: string;
  date: string;
  createdAt: string;
  updatedAt: string;
}

@Component({
  selector: 'app-admin-edit-live-post',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, CKEditorModule],
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

                  <!-- Excerpt (English) -->
                  <div>
                    <label class="block text-sm font-medium mb-2">Excerpt (English)</label>
                    <textarea
                      [(ngModel)]="newsData.excerptEn"
                      name="excerptEn"
                      rows="3"
                      class="w-full px-4 py-2 rounded-lg border border-border bg-background text-foreground"
                    ></textarea>
                  </div>

                  <!-- Summary (60 words) -->
                  <div>
                    <label class="block text-sm font-medium mb-2">Summary (60 words) *</label>
                    <p class="text-xs text-muted-foreground mb-2">A brief summary of the article in approximately 60 words</p>
                    <textarea
                      [(ngModel)]="newsData.summary"
                      name="summary"
                      rows="4"
                      maxlength="400"
                      class="w-full px-4 py-2 rounded-lg border border-border bg-background text-foreground"
                      placeholder="Enter a concise summary of the article (approximately 60 words)..."
                      required
                    ></textarea>
                    <p class="text-xs text-muted-foreground mt-1">{{ getWordCount(newsData.summary) }} / 60 words</p>
                  </div>

                  <!-- Summary (60 words in English) -->
                  <div>
                    <label class="block text-sm font-medium mb-2">Summary (60 words in English)</label>
                    <textarea
                      [(ngModel)]="newsData.summaryEn"
                      name="summaryEn"
                      rows="4"
                      maxlength="400"
                      class="w-full px-4 py-2 rounded-lg border border-border bg-background text-foreground"
                      placeholder="Enter a concise summary in English (approximately 60 words)..."
                    ></textarea>
                    <p class="text-xs text-muted-foreground mt-1">{{ getWordCount(newsData.summaryEn) }} / 60 words</p>
                  </div>

                  <!-- Detailed Content (Full Article) -->
                  <div>
                    <label class="block text-sm font-medium mb-2">Detailed Content (Full Article) *</label>
                    <p class="text-xs text-muted-foreground mb-2">Enter the complete article content that will be displayed on the news detail page</p>
                    <ckeditor
                      [(ngModel)]="newsData.content"
                      [editor]="Editor"
                      [config]="editorConfig"
                      name="content"
                      class="ckeditor-custom">
                    </ckeditor>
                  </div>

                  <!-- Detailed Content (Full Article in English) -->
                  <div>
                    <label class="block text-sm font-medium mb-2">Detailed Content (Full Article in English)</label>
                    <ckeditor
                      [(ngModel)]="newsData.contentEn"
                      [editor]="Editor"
                      [config]="editorConfig"
                      name="contentEn"
                      class="ckeditor-custom">
                    </ckeditor>
                  </div>

                  <!-- Category -->
                  <div>
                    <label class="block text-sm font-medium mb-2">Category *</label>
                    <select
                      [(ngModel)]="newsData.category"
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
                  <div>
                    <label class="block text-sm font-medium mb-2">Icon</label>
                    <p class="text-xs text-muted-foreground mb-3">Select an icon to display with the headline</p>
                    <div class="grid grid-cols-4 sm:grid-cols-6 gap-3 p-4 border border-border rounded-lg bg-secondary/20 max-h-64 overflow-y-auto">
                      @for (icon of availableIcons; track icon.id) {
                        <button
                          type="button"
                          (click)="selectIcon(icon.id)"
                          [class]="'p-3 rounded-lg border-2 transition-all hover:scale-110 ' + (newsData.icon === icon.id ? 'border-primary bg-primary/10' : 'border-border hover:border-primary/50')"
                          [title]="icon.name">
                          <div [innerHTML]="getIconSvg(icon)" class="w-6 h-6 mx-auto text-foreground flex items-center justify-center"></div>
                        </button>
                      }
                    </div>
                    @if (newsData.icon) {
                      <div class="mt-2 text-sm text-muted-foreground">
                        Selected: {{ getIconName(newsData.icon) }}
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

                  <!-- Breaking News, Featured & Trending -->
                  <div class="space-y-4">
                    <div class="grid grid-cols-3 gap-4">
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
                      <label class="flex items-center space-x-2 cursor-pointer">
                        <input
                          type="checkbox"
                          [(ngModel)]="newsData.isTrending"
                          name="isTrending"
                          class="rounded"
                        />
                        <span class="text-sm font-medium">Trending</span>
                      </label>
                    </div>
                    
                    <!-- Trending Title (shown only when Trending is checked) -->
                    @if (newsData.isTrending) {
                      <div class="space-y-4">
                        <div>
                          <label class="block text-sm font-medium mb-2">
                            Trending Title <span class="text-red-500">*</span>
                          </label>
                          <input
                            type="text"
                            [(ngModel)]="newsData.trendingTitle"
                            name="trendingTitle"
                            required
                            placeholder="Enter a catchy title for trending news..."
                            class="w-full px-4 py-2 rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                            [class.border-red-500]="newsData.isTrending && !newsData.trendingTitle"
                          />
                          <p class="text-xs text-muted-foreground mt-1">This title will be displayed in the trending news section</p>
                        </div>
                        <div>
                          <label class="block text-sm font-medium mb-2">
                            Trending Title (English) <span class="text-red-500">*</span>
                          </label>
                          <input
                            type="text"
                            [(ngModel)]="newsData.trendingTitleEn"
                            name="trendingTitleEn"
                            required
                            placeholder="Enter a catchy title for trending news in English..."
                            class="w-full px-4 py-2 rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                            [class.border-red-500]="newsData.isTrending && !newsData.trendingTitleEn"
                          />
                          <p class="text-xs text-muted-foreground mt-1">This title will be displayed in the trending news section (English version)</p>
                        </div>
                      </div>
                    }
                  </div>

                  <!-- Image Upload -->
                  <div>
                    <label class="block text-sm font-medium mb-2">Images (Max 3)</label>
                    @if (currentImages.length > 0) {
                      <div class="mb-3">
                        <p class="text-xs text-muted-foreground mb-2 font-semibold">Current images ({{ currentImages.length }}):</p>
                        <div class="flex flex-wrap gap-3">
                          @for (img of currentImages; track $index) {
                            <div class="relative">
                              <img [src]="img" [alt]="'Current image ' + ($index + 1)" class="w-32 h-32 object-cover rounded-lg border-2 border-border shadow-md" />
                              <span class="absolute top-1 right-1 bg-primary text-primary-foreground text-xs px-2 py-0.5 rounded-full font-semibold">{{ $index + 1 }}</span>
                            </div>
                          }
                        </div>
                      </div>
                    } @else if (currentImageUrl) {
                      <div class="mb-3">
                        <p class="text-xs text-muted-foreground mb-2 font-semibold">Current image:</p>
                        <img [src]="currentImageUrl" alt="Current image" class="w-32 h-32 object-cover rounded-lg border-2 border-border shadow-md" />
                      </div>
                    }
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      (change)="onFilesSelected($event)"
                      class="w-full px-4 py-2 rounded-lg border border-border bg-background text-foreground"
                    />
                    @if (newImages.length > 0) {
                      <div class="mt-2 space-y-1">
                        @for (img of newImages; track $index) {
                          <p class="text-sm text-muted-foreground">New image {{ $index + 1 }}: {{ img.name }}</p>
                        }
                        <p class="text-xs text-muted-foreground mt-2">{{ newImages.length }} / 3 images selected</p>
                      </div>
                    } @else {
                      <p class="text-xs text-muted-foreground mt-1">You can upload up to 3 images. The first image will be shown on the card.</p>
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
                        @if (previewImageUrl || (currentImages.length > 0 && currentImages[0])) {
                          <img
                            [src]="previewImageUrl || currentImages[0]"
                            [alt]="newsData.title || 'Preview'"
                            class="w-full h-full object-cover transition-all duration-500 group-hover:scale-110" />
                        } @else if (currentImageUrl) {
                          <img
                            [src]="currentImageUrl"
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
                        <div class="flex items-start gap-3 mb-2">
                          @if (newsData.icon) {
                            <div class="flex-shrink-0" style="margin-top: 0.76rem; line-height: 1;">
                              <div [innerHTML]="getPreviewIconSvg(newsData.icon)" [class]="'w-6 h-6 drop-shadow-lg ' + getIconColorClass(newsData.category)" [style.filter]="getIconFilter(newsData.category)" style="vertical-align: baseline;"></div>
                            </div>
                          }
                          <h3 class="font-display text-lg font-semibold leading-tight group-hover:text-primary transition-colors line-clamp-2 flex-1">
                            {{ newsData.title || 'News Title' }}
                          </h3>
                        </div>
                        <p class="text-muted-foreground text-sm line-clamp-2 mb-3">
                          {{ newsData.excerpt || 'News excerpt will appear here...' }}
                        </p>
                        @if (newsData.summary) {
                          <div class="mb-4 p-3 bg-secondary/30 rounded-lg border border-border/50">
                            <p class="text-xs font-semibold text-muted-foreground mb-1">Summary:</p>
                            <p class="text-muted-foreground text-sm leading-relaxed">
                              {{ newsData.summary }}
                            </p>
                          </div>
                        }
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
  styles: [`
    ::ng-deep .ckeditor-custom .ck-editor__editable {
      min-height: 400px;
      background: white !important;
      color: black !important;
    }
    ::ng-deep .ckeditor-custom .ck-toolbar {
      background: hsl(var(--secondary));
      border-color: hsl(var(--border));
    }
    ::ng-deep .ckeditor-custom .ck-content {
      background: white !important;
      color: black !important;
    }
    ::ng-deep .ckeditor-custom .ck-editor__editable p,
    ::ng-deep .ckeditor-custom .ck-editor__editable h1,
    ::ng-deep .ckeditor-custom .ck-editor__editable h2,
    ::ng-deep .ckeditor-custom .ck-editor__editable h3,
    ::ng-deep .ckeditor-custom .ck-editor__editable h4,
    ::ng-deep .ckeditor-custom .ck-editor__editable h5,
    ::ng-deep .ckeditor-custom .ck-editor__editable h6,
    ::ng-deep .ckeditor-custom .ck-editor__editable li,
    ::ng-deep .ckeditor-custom .ck-editor__editable span,
    ::ng-deep .ckeditor-custom .ck-editor__editable div,
    ::ng-deep .ckeditor-custom .ck-editor__editable strong,
    ::ng-deep .ckeditor-custom .ck-editor__editable em {
      color: black !important;
    }
  `]
})
export class AdminEditLivePostComponent implements OnInit, OnDestroy {
  isAuthenticated = false;
  currentAdminTheme: AdminTheme = 'light';
  private adminThemeSubscription?: Subscription;
  authToken = '';
  newsId = '';
  isTranslating = false;
  newsData: LiveNews = {
    _id: '',
    title: '',
    titleEn: '',
    excerpt: '',
    excerptEn: '',
    summary: '',
    summaryEn: '',
    content: '',
    contentEn: '',
    category: '',
    tags: [],
    pages: ['home'],
    author: 'News Adda India',
    image: '',
    isBreaking: false,
    isFeatured: false,
    isTrending: false,
    trendingTitle: '',
    trendingTitleEn: '',
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
  currentImages: string[] = [];
  newImages: File[] = [];

  availablePages = ['home', 'national', 'international', 'politics', 'health', 'entertainment', 'sports', 'business', 'religious'];

  // CKEditor Configuration
  public Editor = ClassicEditor;
  public editorConfig = {
    toolbar: {
      items: [
        'heading', '|',
        'bold', 'italic', 'underline', 'strikethrough', '|',
        'fontSize', 'fontFamily', 'fontColor', 'fontBackgroundColor', '|',
        'bulletedList', 'numberedList', '|',
        'alignment', '|',
        'outdent', 'indent', '|',
        'link', 'blockQuote', 'insertTable', 'imageUpload', '|',
        'undo', 'redo'
      ],
      shouldNotGroupWhenFull: true
    },
    language: 'en',
    image: {
      toolbar: [
        'imageTextAlternative',
        'toggleImageCaption',
        'imageStyle:inline',
        'imageStyle:block',
        'imageStyle:side'
      ]
    },
    table: {
      contentToolbar: [
        'tableColumn',
        'tableRow',
        'mergeTableCells'
      ]
    }
  };

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
    private route: ActivatedRoute,
    private sanitizer: DomSanitizer,
    private adminThemeService: AdminThemeService,
    private cdr: ChangeDetectorRef
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
    // Initialize admin theme
    this.currentAdminTheme = this.adminThemeService.getCurrentTheme();
    this.adminThemeService.checkAndApplyTheme();
    
    // Subscribe to theme changes
    this.adminThemeSubscription = this.adminThemeService.theme$.subscribe(theme => {
      this.currentAdminTheme = theme;
    });
    
    this.route.params.subscribe(params => {
      this.newsId = params['id'];
      this.loadNews();
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
    // Always fetch from API to ensure we have the complete data including content field
    // The review page doesn't include content in list views, so sessionStorage won't have it
    this.isLoading = true;
    console.log('[AdminEditLivePost] Fetching news from API:', this.newsId);
    this.http.get<{ success: boolean; data: LiveNews; error?: string }>(
      `${this.getApiUrl()}/api/news/${this.newsId}`
    ).subscribe({
      next: (response) => {
        console.log('[AdminEditLivePost] API response received:', {
          success: response.success,
          hasData: !!response.data,
          dataImage: response.data?.image,
          dataImages: response.data?.images,
          dataImagesCount: response.data?.images ? response.data.images.length : 0,
          fullResponse: JSON.stringify(response.data, null, 2)
        });
        
        if (response.success) {
          // Log raw response to see what we're getting from API
          console.log('[AdminEditLivePost] Raw API response data:', {
            hasContent: !!response.data.content,
            contentType: typeof response.data.content,
            contentLength: response.data.content ? response.data.content.length : 0,
            contentValue: response.data.content ? response.data.content.substring(0, 200) : 'missing',
            contentStartsWith: response.data.content ? response.data.content.substring(0, 50) : 'N/A',
            hasExcerpt: !!response.data.excerpt,
            excerptLength: response.data.excerpt ? response.data.excerpt.length : 0,
            excerptValue: response.data.excerpt ? response.data.excerpt.substring(0, 200) : 'missing',
            excerptStartsWith: response.data.excerpt ? response.data.excerpt.substring(0, 50) : 'N/A',
            contentEqualsExcerpt: response.data.content === response.data.excerpt
          });
          
          // IMPORTANT: Use content field directly from database - DO NOT use excerpt as fallback
          // The content field contains the full article, excerpt is just a short preview
          const dbContent = response.data.content !== null && response.data.content !== undefined 
            ? response.data.content 
            : '';
          const dbContentEn = response.data.contentEn !== null && response.data.contentEn !== undefined
            ? response.data.contentEn 
            : '';
          
          this.newsData = { 
            ...response.data, 
            // Ensure English fields are set to empty string if null/undefined (not fallback to Hindi)
            titleEn: response.data.titleEn !== null && response.data.titleEn !== undefined ? response.data.titleEn : '',
            summary: response.data.summary || '',
            summaryEn: response.data.summaryEn !== null && response.data.summaryEn !== undefined ? response.data.summaryEn : '',
            excerptEn: response.data.excerptEn !== null && response.data.excerptEn !== undefined ? response.data.excerptEn : '',
            content: dbContent, // Use content field from DB - this is the full article
            contentEn: dbContentEn, // Use contentEn field from DB
            trendingTitle: response.data.trendingTitle || undefined,
            trendingTitleEn: response.data.trendingTitleEn !== null && response.data.trendingTitleEn !== undefined ? response.data.trendingTitleEn : undefined
          };
          console.log('[AdminEditLivePost] Loaded news data:', {
            id: this.newsData._id,
            title: this.newsData.title,
            content: this.newsData.content ? `${this.newsData.content.substring(0, 100)}...` : '(empty)',
            contentLength: this.newsData.content ? this.newsData.content.length : 0,
            contentStartsWith: this.newsData.content ? this.newsData.content.substring(0, 50) : 'N/A',
            contentEn: this.newsData.contentEn ? `${this.newsData.contentEn.substring(0, 100)}...` : '(empty)',
            contentEnLength: this.newsData.contentEn ? this.newsData.contentEn.length : 0,
            excerpt: this.newsData.excerpt ? `${this.newsData.excerpt.substring(0, 50)}...` : '(empty)',
            excerptLength: this.newsData.excerpt ? this.newsData.excerpt.length : 0,
            isTrending: this.newsData.isTrending,
            trendingTitle: this.newsData.trendingTitle,
            contentSource: response.data.content !== null && response.data.content !== undefined ? 'content field' : 'empty (no fallback)'
          });
          this.tagsInput = this.newsData.tags.join(', ');
          
          // Force change detection to update CKEditor
          this.cdr.detectChanges();
          if (this.newsData.image) {
            this.currentImageUrl = this.getImageUrl(this.newsData.image);
          }
          // Load current images array
          console.log('[AdminEditLivePost] Loading images from API response:', {
            images: this.newsData.images,
            image: this.newsData.image,
            imagesType: typeof this.newsData.images,
            imagesIsArray: Array.isArray(this.newsData.images),
            imagesLength: Array.isArray(this.newsData.images) ? this.newsData.images.length : 'N/A'
          });
          if (this.newsData.images && Array.isArray(this.newsData.images) && this.newsData.images.length > 0) {
            this.currentImages = this.newsData.images.map(img => {
              const url = this.getImageUrl(img);
              console.log('[AdminEditLivePost] Mapping image:', img, '->', url);
              return url;
            });
            console.log('[AdminEditLivePost] Final currentImages array:', this.currentImages);
          } else if (this.newsData.image) {
            this.currentImages = [this.currentImageUrl!];
            console.log('[AdminEditLivePost] Using single image (fallback):', this.currentImages);
          } else {
            this.currentImages = [];
            console.log('[AdminEditLivePost] No images found in response');
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


  onFilesSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      // Limit to max 3 images
      const filesArray = Array.from(input.files).slice(0, 3);
      this.newImages = filesArray;
      
      console.log('[AdminEditLivePost] Files selected:', {
        count: filesArray.length,
        files: filesArray.map(f => ({ name: f.name, size: f.size, type: f.type }))
      });
      
      // Create preview URL for first image
      if (filesArray.length > 0) {
        const reader = new FileReader();
        reader.onload = (e) => {
          this.previewImageUrl = e.target?.result as string;
        };
        reader.readAsDataURL(filesArray[0]);
      } else {
        this.previewImageUrl = null;
      }
    } else {
      this.newImages = [];
      this.previewImageUrl = null;
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

  selectIcon(iconId: string) {
    if (this.newsData.icon === iconId) {
      // Deselect if clicking the same icon
      this.newsData.icon = undefined;
    } else {
      this.newsData.icon = iconId;
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
    if (!this.newsData.category) {
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

    const correspondingPage = categoryToPageMap[this.newsData.category];
    
    if (correspondingPage) {
      // Always include 'home' and the corresponding category page
      const defaultPages = ['home', correspondingPage];
      
      // Keep any other pages that were already selected (except the old category page)
      const otherPages = this.newsData.pages.filter(
        p => p !== 'home' && !Object.values(categoryToPageMap).includes(p)
      );
      
      // Combine default pages with other selected pages
      this.newsData.pages = [...defaultPages, ...otherPages];
    }
  }

  async convertToEnglish(field: 'title' | 'excerpt' | 'summary' | 'content') {
    if (!this.newsData[field] || !this.newsData[field].trim()) {
      this.submitError = `Please enter ${field} first`;
      return;
    }

    this.isTranslating = true;
    this.submitError = '';

    try {
      const response = await this.http.post<{ translatedText: string }>(
        `${this.getApiUrl()}/api/translation/translate-text`,
        {
          text: this.newsData[field],
          sourceLang: 'hi',
          targetLang: 'en'
        },
        {
          headers: new HttpHeaders().set('Authorization', `Bearer ${this.authToken}`)
        }
      ).toPromise();

      if (response && response.translatedText) {
        if (field === 'title') {
          this.newsData.titleEn = response.translatedText;
        } else if (field === 'excerpt') {
          this.newsData.excerptEn = response.translatedText;
        } else if (field === 'summary') {
          this.newsData.summaryEn = response.translatedText;
        } else if (field === 'content') {
          this.newsData.contentEn = response.translatedText;
        }
        this.submitSuccess = `${field} translated successfully!`;
      }
    } catch (error: any) {
      console.error('Translation error:', error);
      this.submitError = `Failed to translate ${field}: ${error.error?.message || error.message || 'Unknown error'}`;
    } finally {
      this.isTranslating = false;
    }
  }

  async convertAllToEnglish() {
    if (!this.newsData.title || !this.newsData.excerpt) {
      this.submitError = 'Please enter title and excerpt first';
      return;
    }

    this.isTranslating = true;
    this.submitError = '';
    this.submitSuccess = '';

    try {
      // Translate title
      if (this.newsData.title && !this.newsData.titleEn) {
        await this.convertToEnglish('title');
        await new Promise(resolve => setTimeout(resolve, 500));
      }

      // Translate excerpt
      if (this.newsData.excerpt && !this.newsData.excerptEn) {
        await this.convertToEnglish('excerpt');
        await new Promise(resolve => setTimeout(resolve, 500));
      }

      // Translate summary
      if (this.newsData.summary && !this.newsData.summaryEn) {
        await this.convertToEnglish('summary');
        await new Promise(resolve => setTimeout(resolve, 500));
      }

      // Translate content
      if (this.newsData.content && !this.newsData.contentEn) {
        await this.convertToEnglish('content');
      }

      this.submitSuccess = 'All fields translated successfully!';
    } catch (error: any) {
      console.error('Translation error:', error);
      this.submitError = `Failed to translate: ${error.error?.message || error.message || 'Unknown error'}`;
    } finally {
      this.isTranslating = false;
    }
  }

  updateNews() {
    this.isSubmitting = true;
    this.submitError = '';
    this.submitSuccess = '';

    // Validate trending title if trending is checked
    if (this.newsData.isTrending && !this.newsData.trendingTitle?.trim()) {
      this.submitError = 'Trending Title is required when Trending is checked';
      this.isSubmitting = false;
      return;
    }
    if (this.newsData.isTrending && !this.newsData.trendingTitleEn?.trim()) {
      this.submitError = 'Trending Title (English) is required when Trending is checked';
      this.isSubmitting = false;
      return;
    }

    const formData = new FormData();
    // Log what we're about to send
    console.log('[AdminEditLivePost] Form submission data:', {
      content: this.newsData.content ? `${this.newsData.content.substring(0, 100)}...` : '(empty)',
      contentLength: this.newsData.content ? this.newsData.content.length : 0,
      excerpt: this.newsData.excerpt ? `${this.newsData.excerpt.substring(0, 100)}...` : '(empty)',
      excerptLength: this.newsData.excerpt ? this.newsData.excerpt.length : 0,
      contentEqualsExcerpt: this.newsData.content === this.newsData.excerpt
    });
    
    // Send all fields as-is (empty string if cleared) - allow clearing any field
    formData.append('title', this.newsData.title !== undefined ? this.newsData.title : '');
    // Send titleEn as-is (empty string if cleared, don't fallback to Hindi title)
    formData.append('titleEn', this.newsData.titleEn !== undefined ? this.newsData.titleEn : '');
    formData.append('excerpt', this.newsData.excerpt !== undefined ? this.newsData.excerpt : '');
    // Send excerptEn as-is (empty string if cleared)
    formData.append('excerptEn', this.newsData.excerptEn !== undefined ? this.newsData.excerptEn : '');
    formData.append('summary', this.newsData.summary !== undefined ? this.newsData.summary : '');
    // Send summaryEn as-is (empty string if cleared)
    formData.append('summaryEn', this.newsData.summaryEn !== undefined ? this.newsData.summaryEn : '');
    // IMPORTANT: Use content field only - DO NOT fallback to excerpt
    // Content field contains the full article, excerpt is just a preview
    formData.append('content', this.newsData.content !== undefined ? this.newsData.content : '');
    // Send contentEn as-is (empty string if cleared)
    formData.append('contentEn', this.newsData.contentEn !== undefined ? this.newsData.contentEn : '');
    formData.append('category', this.newsData.category !== undefined ? this.newsData.category : '');
    if (this.newsData.icon) {
      formData.append('icon', this.newsData.icon);
    }
    formData.append('tags', JSON.stringify(this.newsData.tags));
    formData.append('pages', JSON.stringify(this.newsData.pages));
    formData.append('author', this.newsData.author !== undefined ? this.newsData.author : '');
    formData.append('isBreaking', this.newsData.isBreaking.toString());
    formData.append('isFeatured', this.newsData.isFeatured.toString());
    formData.append('isTrending', this.newsData.isTrending.toString());
    // Always send trendingTitle when isTrending is true, or send empty string to clear it if trending is unchecked
    if (this.newsData.isTrending) {
      // If trending is checked, send trendingTitle (even if empty, backend will validate)
      formData.append('trendingTitle', this.newsData.trendingTitle !== undefined ? this.newsData.trendingTitle : '');
      // Send trendingTitleEn as-is (empty string if cleared)
      formData.append('trendingTitleEn', this.newsData.trendingTitleEn !== undefined ? this.newsData.trendingTitleEn : '');
      console.log('[AdminEditLivePost] Sending trendingTitle (isTrending=true):', {
        isTrending: this.newsData.isTrending,
        trendingTitle: this.newsData.trendingTitle || '(empty string)',
        trendingTitleEn: this.newsData.trendingTitleEn || '(empty string)',
        trendingTitleType: typeof this.newsData.trendingTitle,
        trendingTitleUndefined: this.newsData.trendingTitle === undefined
      });
    } else {
      // If trending is unchecked, send empty string to clear it
      formData.append('trendingTitle', '');
      formData.append('trendingTitleEn', '');
      console.log('[AdminEditLivePost] Sending empty trendingTitle (isTrending=false)');
    }
    formData.append('published', 'true'); // Keep it published
    
    // Append all new images (max 3)
    console.log('[AdminEditLivePost] Preparing to update news:', {
      newsId: this.newsId,
      currentImages: this.currentImages,
      newImagesCount: this.newImages.length,
      newImages: this.newImages.map(img => ({ name: img.name, size: img.size, type: img.type }))
    });
    
    if (this.newImages.length > 0) {
      console.log('[AdminEditLivePost] Appending', this.newImages.length, 'new images to FormData');
      this.newImages.forEach((image, index) => {
        formData.append('images', image);
        console.log(`[AdminEditLivePost] Appended image ${index + 1}:`, image.name, image.size, 'bytes');
      });
    } else {
      console.log('[AdminEditLivePost] No new images to upload');
    }

    const headers = new HttpHeaders().set('Authorization', `Bearer ${this.authToken}`);

    this.http.put<{ success: boolean; message?: string; error?: string; data?: LiveNews }>(
      `${this.getApiUrl()}/api/news/${this.newsId}`,
      formData,
      { headers }
    ).subscribe({
      next: (response) => {
        console.log('[AdminEditLivePost] Update response received:', {
          success: response.success,
          message: response.message,
          data: response.data ? {
            _id: response.data._id,
            image: response.data.image,
            images: response.data.images,
            imagesCount: response.data.images ? response.data.images.length : 0,
            isTrending: response.data.isTrending,
            trendingTitle: response.data.trendingTitle,
            trendingTitleType: typeof response.data.trendingTitle
          } : null
        });
        
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
        console.error('[AdminEditLivePost] Update error:', error);
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

  getWordCount(text: string | undefined): number {
    if (!text) return 0;
    return text.split(/\s+/).filter(w => w.length > 0).length;
  }

  private getApiUrl(): string {
    return environment.apiUrl || 'http://localhost:3000';
  }
}

