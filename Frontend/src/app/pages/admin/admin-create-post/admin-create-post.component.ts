import { Component, OnInit, OnDestroy, HostListener, ElementRef, ViewChild, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Router, RouterModule } from '@angular/router';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { environment } from '../../../../environments/environment';
import { CKEditorModule } from '@ckeditor/ckeditor5-angular';
import ClassicEditor from '@ckeditor/ckeditor5-build-classic';
import { AdminThemeService, AdminTheme } from '../../../services/admin-theme.service';
import { Subscription } from 'rxjs';

interface NewsForm {
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
  images: File[];
  isBreaking: boolean;
  isFeatured: boolean;
  isTrending: boolean;
  trendingTitle: string;
  trendingTitleEn: string;
}

@Component({
  selector: 'app-admin-create-post',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, CKEditorModule],
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
                <h1 class="text-3xl font-bold">Create Post</h1>
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

            <!-- Form and Preview Layout -->
            <div class="grid lg:grid-cols-2 gap-6">
              <!-- Form Section -->
              <div class="glass-card p-6 rounded-xl" #formSection>
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

                <!-- Excerpt (English) -->
                <div>
                  <label class="block text-sm font-medium mb-2">Excerpt (English)</label>
                  <textarea
                    [(ngModel)]="newsForm.excerptEn"
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
                    [(ngModel)]="newsForm.summary"
                    name="summary"
                    rows="4"
                    maxlength="400"
                    class="w-full px-4 py-2 rounded-lg border border-border bg-background text-foreground"
                    placeholder="Enter a concise summary of the article (approximately 60 words)..."
                    required
                  ></textarea>
                  <p class="text-xs text-muted-foreground mt-1">{{ getWordCount(newsForm.summary) }} / 60 words</p>
                </div>

                <!-- Summary (60 words in English) -->
                <div>
                  <label class="block text-sm font-medium mb-2">Summary (60 words in English)</label>
                  <textarea
                    [(ngModel)]="newsForm.summaryEn"
                    name="summaryEn"
                    rows="4"
                    maxlength="400"
                    class="w-full px-4 py-2 rounded-lg border border-border bg-background text-foreground"
                    placeholder="Enter a concise summary in English (approximately 60 words)..."
                  ></textarea>
                  <p class="text-xs text-muted-foreground mt-1">{{ getWordCount(newsForm.summaryEn) }} / 60 words</p>
                </div>

                <!-- Detailed Content (Full Article) -->
                <div>
                  <label class="block text-sm font-medium mb-2">Detailed Content (Full Article) *</label>
                  <p class="text-xs text-muted-foreground mb-2">Enter the complete article content that will be displayed on the news detail page</p>
                  <ckeditor
                    [(ngModel)]="newsForm.content"
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
                    [(ngModel)]="newsForm.contentEn"
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
                <div class="space-y-4">
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
                  
                  <!-- Trending Title (shown only when Trending is checked) -->
                  @if (newsForm.isTrending) {
                    <div class="space-y-4">
                      <div>
                        <label class="block text-sm font-medium mb-2">
                          Trending Title <span class="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          [(ngModel)]="newsForm.trendingTitle"
                          name="trendingTitle"
                          required
                          placeholder="Enter a catchy title for trending news..."
                          class="w-full px-4 py-2 rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                          [class.border-red-500]="newsForm.isTrending && !newsForm.trendingTitle"
                        />
                        <p class="text-xs text-muted-foreground mt-1">This title will be displayed in the trending news section</p>
                      </div>
                      <div>
                        <label class="block text-sm font-medium mb-2">
                          Trending Title (English) <span class="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          [(ngModel)]="newsForm.trendingTitleEn"
                          name="trendingTitleEn"
                          required
                          placeholder="Enter a catchy title for trending news in English..."
                          class="w-full px-4 py-2 rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                          [class.border-red-500]="newsForm.isTrending && !newsForm.trendingTitleEn"
                        />
                        <p class="text-xs text-muted-foreground mt-1">This title will be displayed in the trending news section (English version)</p>
                      </div>
                    </div>
                  }
                </div>

                <!-- Image Upload (Max 3) -->
                <div>
                  <label class="block text-sm font-medium mb-2">Images (Max 3)</label>
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    (change)="onFilesSelected($event)"
                    class="w-full px-4 py-2 rounded-lg border border-border bg-background text-foreground"
                  />
                  @if (newsForm.images.length > 0) {
                    <div class="mt-2 space-y-1">
                      @for (img of newsForm.images; track $index) {
                        <p class="text-sm text-muted-foreground">Image {{ $index + 1 }}: {{ img.name }}</p>
                      }
                      <p class="text-xs text-muted-foreground mt-2">{{ newsForm.images.length }} / 3 images selected</p>
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

                <button
                  type="submit"
                  [disabled]="isSubmitting"
                  class="w-full bg-primary text-primary-foreground py-3 rounded-lg hover:bg-primary/90 disabled:opacity-50 font-semibold">
                  {{ isSubmitting ? 'Submitting...' : 'Submit News' }}
                </button>
              </form>
              </div>

              <!-- Preview Section -->
              <div class="glass-card p-6 rounded-xl" #previewSection>
                <h2 class="text-xl font-bold mb-4">Preview</h2>
                <div>
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
                      <p class="text-muted-foreground text-sm line-clamp-2 mb-3">
                        {{ newsForm.excerpt || 'News excerpt will appear here...' }}
                      </p>
                      <!-- Summary -->
                      @if (newsForm.summary) {
                        <div class="mb-4 p-3 bg-secondary/30 rounded-lg border border-border/50">
                          <p class="text-xs font-semibold text-muted-foreground mb-1">Summary:</p>
                          <p class="text-muted-foreground text-sm leading-relaxed">
                            {{ newsForm.summary }}
                          </p>
                        </div>
                      }
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
export class AdminCreatePostComponent implements OnInit, OnDestroy, AfterViewInit {
  @ViewChild('formSection', { static: false }) formSection?: ElementRef;
  @ViewChild('previewSection', { static: false }) previewSection?: ElementRef;
  
  isAuthenticated = false;
  authToken = '';
  isSubmitting = false;
  isTranslating = false;
  submitError = '';
  submitSuccess = '';
  tagsInput = '';
  previewImageUrl: string | null = null;
  currentAdminTheme: AdminTheme = 'light';
  private adminThemeSubscription?: Subscription;
  private isScrolling = false;

  newsForm: NewsForm = {
    title: '',
    titleEn: '',
    excerpt: '',
    excerptEn: '',
    summary: '',
    summaryEn: '',
    content: '',
    contentEn: '',
    category: '',
    icon: undefined,
    tags: [],
    pages: ['home'],
    author: 'News Adda India',
    images: [],
    isBreaking: false,
    isFeatured: false,
    isTrending: false,
    trendingTitle: '',
    trendingTitleEn: ''
  };

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
    private sanitizer: DomSanitizer,
    private adminThemeService: AdminThemeService
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
    // Initialize admin theme
    this.currentAdminTheme = this.adminThemeService.getCurrentTheme();
    this.adminThemeService.checkAndApplyTheme();
    
    // Subscribe to theme changes
    this.adminThemeSubscription = this.adminThemeService.theme$.subscribe(theme => {
      this.currentAdminTheme = theme;
    });
  }

  ngAfterViewInit() {
    // Set up scroll synchronization after view initialization
    setTimeout(() => {
      if (this.formSection && this.previewSection) {
        this.setupScrollSync();
      }
    }, 100);
  }

  ngOnDestroy() {
    this.adminThemeSubscription?.unsubscribe();
  }

  toggleAdminTheme() {
    this.adminThemeService.toggleTheme();
  }

  @HostListener('window:scroll', ['$event'])
  onWindowScroll() {
    if (!this.isScrolling && this.formSection && this.previewSection) {
      this.syncPreviewScroll();
    }
  }

  private setupScrollSync() {
    // Sync preview scroll with form scroll
    if (this.formSection?.nativeElement && this.previewSection?.nativeElement) {
      const previewElement = this.previewSection.nativeElement;
      
      // Make preview scrollable with max height
      previewElement.style.maxHeight = 'calc(100vh - 200px)';
      previewElement.style.overflowY = 'auto';
      previewElement.style.overflowX = 'hidden';
    }
  }

  private syncPreviewScroll() {
    if (!this.formSection?.nativeElement || !this.previewSection?.nativeElement) {
      return;
    }

    const formElement = this.formSection.nativeElement;
    const previewElement = this.previewSection.nativeElement;
    
    // Get scroll position relative to viewport
    const formRect = formElement.getBoundingClientRect();
    const windowHeight = window.innerHeight;
    
    // Calculate scroll percentage based on form position
    const formTop = formRect.top;
    const formHeight = formRect.height;
    const scrollableHeight = Math.max(0, formHeight - windowHeight + Math.max(0, formTop));
    
    if (scrollableHeight > 0 && formTop < windowHeight) {
      const scrollPercent = Math.max(0, Math.min(1, (windowHeight - formTop) / (windowHeight + formHeight)));
      
      // Sync preview scroll
      const previewScrollHeight = previewElement.scrollHeight - previewElement.clientHeight;
      if (previewScrollHeight > 0) {
        this.isScrolling = true;
        previewElement.scrollTop = scrollPercent * previewScrollHeight;
        
        // Reset flag after a short delay
        setTimeout(() => {
          this.isScrolling = false;
        }, 50);
      }
    }
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

  logout() {
    localStorage.removeItem('admin_token');
    this.authToken = '';
    this.isAuthenticated = false;
    this.router.navigate(['/admin']);
  }

  onFilesSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      // Limit to max 3 images
      const filesArray = Array.from(input.files).slice(0, 3);
      this.newsForm.images = filesArray;
      
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
      this.newsForm.images = [];
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

  async convertToEnglish(field: 'title' | 'excerpt' | 'summary' | 'content') {
    if (!this.newsForm[field] || !this.newsForm[field].trim()) {
      this.submitError = `Please enter ${field} first`;
      return;
    }

    this.isTranslating = true;
    this.submitError = '';

    try {
      const response = await this.http.post<{ translatedText: string }>(
        `${this.getApiUrl()}/api/translation/translate-text`,
        {
          text: this.newsForm[field],
          sourceLang: 'hi',
          targetLang: 'en'
        },
        {
          headers: new HttpHeaders().set('Authorization', `Bearer ${this.authToken}`)
        }
      ).toPromise();

      if (response && response.translatedText) {
        if (field === 'title') {
          this.newsForm.titleEn = response.translatedText;
        } else if (field === 'excerpt') {
          this.newsForm.excerptEn = response.translatedText;
        } else if (field === 'summary') {
          this.newsForm.summaryEn = response.translatedText;
        } else if (field === 'content') {
          this.newsForm.contentEn = response.translatedText;
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
    if (!this.newsForm.title || !this.newsForm.excerpt) {
      this.submitError = 'Please enter title and excerpt first';
      return;
    }

    this.isTranslating = true;
    this.submitError = '';
    this.submitSuccess = '';

    try {
      // Translate title
      if (this.newsForm.title && !this.newsForm.titleEn) {
        await this.convertToEnglish('title');
        await new Promise(resolve => setTimeout(resolve, 500)); // Delay to avoid rate limiting
      }

      // Translate excerpt
      if (this.newsForm.excerpt && !this.newsForm.excerptEn) {
        await this.convertToEnglish('excerpt');
        await new Promise(resolve => setTimeout(resolve, 500));
      }

      // Translate summary
      if (this.newsForm.summary && !this.newsForm.summaryEn) {
        await this.convertToEnglish('summary');
        await new Promise(resolve => setTimeout(resolve, 500));
      }

      // Translate content
      if (this.newsForm.content && !this.newsForm.contentEn) {
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

  submitNews() {
    this.isSubmitting = true;
    this.submitError = '';
    this.submitSuccess = '';

    // Validate trending title if trending is checked
    if (this.newsForm.isTrending && !this.newsForm.trendingTitle?.trim()) {
      this.submitError = 'Trending Title is required when Trending is checked';
      this.isSubmitting = false;
      return;
    }
    if (this.newsForm.isTrending && !this.newsForm.trendingTitleEn?.trim()) {
      this.submitError = 'Trending Title (English) is required when Trending is checked';
      this.isSubmitting = false;
      return;
    }

    const formData = new FormData();
    // Send all fields as-is (empty string if cleared) - allow clearing any field
    formData.append('title', this.newsForm.title !== undefined ? this.newsForm.title : '');
    // Send titleEn as-is (empty string if cleared, don't fallback to Hindi title)
    formData.append('titleEn', this.newsForm.titleEn !== undefined ? this.newsForm.titleEn : '');
    formData.append('excerpt', this.newsForm.excerpt !== undefined ? this.newsForm.excerpt : '');
    // Send excerptEn as-is (empty string if cleared)
    formData.append('excerptEn', this.newsForm.excerptEn !== undefined ? this.newsForm.excerptEn : '');
    formData.append('summary', this.newsForm.summary !== undefined ? this.newsForm.summary : '');
    // Send summaryEn as-is (empty string if cleared)
    formData.append('summaryEn', this.newsForm.summaryEn !== undefined ? this.newsForm.summaryEn : '');
    formData.append('content', this.newsForm.content !== undefined ? this.newsForm.content : (this.newsForm.excerpt || ''));
    // Send contentEn as-is (empty string if cleared)
    formData.append('contentEn', this.newsForm.contentEn !== undefined ? this.newsForm.contentEn : '');
    formData.append('category', this.newsForm.category !== undefined ? this.newsForm.category : '');
    if (this.newsForm.icon) {
      formData.append('icon', this.newsForm.icon);
    }
    formData.append('tags', JSON.stringify(this.newsForm.tags));
    formData.append('pages', JSON.stringify(this.newsForm.pages));
    formData.append('author', this.newsForm.author !== undefined ? this.newsForm.author : '');
    formData.append('isBreaking', this.newsForm.isBreaking.toString());
    formData.append('isFeatured', this.newsForm.isFeatured.toString());
    formData.append('isTrending', this.newsForm.isTrending.toString());
    // Always send trendingTitle when isTrending is true, or send empty string to clear it if trending is unchecked
    if (this.newsForm.isTrending) {
      // If trending is checked, send trendingTitle (even if empty, backend will validate)
      formData.append('trendingTitle', this.newsForm.trendingTitle !== undefined ? this.newsForm.trendingTitle : '');
      // Send trendingTitleEn as-is (empty string if cleared)
      formData.append('trendingTitleEn', this.newsForm.trendingTitleEn !== undefined ? this.newsForm.trendingTitleEn : '');
    } else {
      // If trending is unchecked, send empty string to clear it
      formData.append('trendingTitle', '');
      formData.append('trendingTitleEn', '');
    }
    
    // Append all images (max 3)
    if (this.newsForm.images.length > 0) {
      this.newsForm.images.forEach((image, index) => {
        formData.append('images', image);
      });
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
          // Scroll to top immediately when news is created successfully
          window.scrollTo({ top: 0, left: 0, behavior: 'smooth' });
          document.documentElement.scrollTop = 0;
          document.body.scrollTop = 0;
          
          // Reset form
          this.newsForm = {
            title: '',
            titleEn: '',
            excerpt: '',
            excerptEn: '',
            summary: '',
            summaryEn: '',
            content: '',
            contentEn: '',
            category: '',
            icon: undefined,
            tags: [],
            pages: ['home'],
            author: 'News Adda India',
            images: [],
            isBreaking: false,
            isFeatured: false,
            isTrending: false,
            trendingTitle: '',
            trendingTitleEn: ''
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

  getWordCount(text: string | undefined): number {
    if (!text) return 0;
    return text.split(/\s+/).filter(w => w.length > 0).length;
  }
}

