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
import { LanguageService } from '../../../services/language.service';

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
                  <div class="flex items-center justify-between mb-2">
                    <label class="block text-sm font-medium">Title (English)</label>
                    <button
                      type="button"
                      (click)="translateTitleToEnglish()"
                      [disabled]="!newsForm.title?.trim() || isTranslatingTitleEn"
                      class="px-3 py-1 text-xs bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1">
                      @if (isTranslatingTitleEn) {
                        <svg class="w-3 h-3 animate-spin" fill="none" viewBox="0 0 24 24">
                          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Translating...
                      } @else {
                        <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129" />
                        </svg>
                        Translate
                      }
                    </button>
                  </div>
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
                  <div class="flex items-center justify-between mb-2">
                    <label class="block text-sm font-medium">Excerpt (English)</label>
                    <button
                      type="button"
                      (click)="translateExcerptToEnglish()"
                      [disabled]="!newsForm.excerpt?.trim() || isTranslatingExcerptEn"
                      class="px-3 py-1 text-xs bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1">
                      @if (isTranslatingExcerptEn) {
                        <svg class="w-3 h-3 animate-spin" fill="none" viewBox="0 0 24 24">
                          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Translating...
                      } @else {
                        <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129" />
                        </svg>
                        Translate
                      }
                    </button>
                  </div>
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
                  <div class="flex items-center justify-between mb-2">
                    <label class="block text-sm font-medium">Summary (60 words in English)</label>
                    <button
                      type="button"
                      (click)="translateSummaryToEnglish()"
                      [disabled]="!newsForm.summary?.trim() || isTranslatingSummaryEn"
                      class="px-3 py-1 text-xs bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1">
                      @if (isTranslatingSummaryEn) {
                        <svg class="w-3 h-3 animate-spin" fill="none" viewBox="0 0 24 24">
                          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Translating...
                      } @else {
                        <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129" />
                        </svg>
                        Translate
                      }
                    </button>
                  </div>
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
                  <div class="flex items-center justify-between mb-2">
                    <label class="block text-sm font-medium">Detailed Content (Full Article in English)</label>
                    <button
                      type="button"
                      (click)="translateContentToEnglish()"
                      [disabled]="!newsForm.content?.trim() || isTranslatingContentEn"
                      class="px-3 py-1 text-xs bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1">
                      @if (isTranslatingContentEn) {
                        <svg class="w-3 h-3 animate-spin" fill="none" viewBox="0 0 24 24">
                          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Translating...
                      } @else {
                        <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129" />
                        </svg>
                        Translate
                      }
                    </button>
                  </div>
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
                        <div class="flex items-center justify-between mb-2">
                          <label class="block text-sm font-medium">
                            Trending Title (English) <span class="text-red-500">*</span>
                          </label>
                          <button
                            type="button"
                            (click)="translateTrendingTitleToEnglish()"
                            [disabled]="!newsForm.trendingTitle?.trim() || isTranslatingTrendingTitleEn"
                            class="px-3 py-1 text-xs bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1">
                            @if (isTranslatingTrendingTitleEn) {
                              <svg class="w-3 h-3 animate-spin" fill="none" viewBox="0 0 24 24">
                                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                              </svg>
                              Translating...
                            } @else {
                              <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129" />
                              </svg>
                              Translate
                            }
                          </button>
                        </div>
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
  isTranslatingTitleEn = false;
  isTranslatingExcerptEn = false;
  isTranslatingSummaryEn = false;
  isTranslatingContentEn = false;
  isTranslatingTrendingTitleEn = false;
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

  constructor(
    private http: HttpClient,
    private router: Router,
    private sanitizer: DomSanitizer,
    private adminThemeService: AdminThemeService,
    private languageService: LanguageService
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

  async translateTitleToEnglish() {
    if (!this.newsForm.title || !this.newsForm.title.trim()) {
      this.submitError = 'Please enter Title (Hindi) first';
      return;
    }

    this.isTranslatingTitleEn = true;
    this.submitError = '';

    try {
      const translatedText = await this.languageService.translateText(this.newsForm.title, 'hi', 'en');
      this.newsForm.titleEn = translatedText;
      this.submitSuccess = 'Title translated successfully!';
    } catch (error) {
      console.error('[AdminCreatePost] Error translating title:', error);
      this.submitError = 'Failed to translate title. Please try again.';
    } finally {
      this.isTranslatingTitleEn = false;
    }
  }

  async translateExcerptToEnglish() {
    if (!this.newsForm.excerpt || !this.newsForm.excerpt.trim()) {
      this.submitError = 'Please enter Excerpt (Hindi) first';
      return;
    }

    this.isTranslatingExcerptEn = true;
    this.submitError = '';

    try {
      const translatedText = await this.languageService.translateText(this.newsForm.excerpt, 'hi', 'en');
      this.newsForm.excerptEn = translatedText;
      this.submitSuccess = 'Excerpt translated successfully!';
    } catch (error) {
      console.error('[AdminCreatePost] Error translating excerpt:', error);
      this.submitError = 'Failed to translate excerpt. Please try again.';
    } finally {
      this.isTranslatingExcerptEn = false;
    }
  }

  async translateSummaryToEnglish() {
    if (!this.newsForm.summary || !this.newsForm.summary.trim()) {
      this.submitError = 'Please enter Summary (Hindi) first';
      return;
    }

    this.isTranslatingSummaryEn = true;
    this.submitError = '';

    try {
      const translatedText = await this.languageService.translateText(this.newsForm.summary, 'hi', 'en');
      this.newsForm.summaryEn = translatedText;
      this.submitSuccess = 'Summary translated successfully!';
    } catch (error) {
      console.error('[AdminCreatePost] Error translating summary:', error);
      this.submitError = 'Failed to translate summary. Please try again.';
    } finally {
      this.isTranslatingSummaryEn = false;
    }
  }

  async translateContentToEnglish() {
    if (!this.newsForm.content || !this.newsForm.content.trim()) {
      this.submitError = 'Please enter Content (Hindi) first';
      return;
    }

    this.isTranslatingContentEn = true;
    this.submitError = '';

    try {
      const htmlContent = this.newsForm.content;
      
      // Check if content has HTML structure
      if (htmlContent.includes('<')) {
        // Parse HTML and translate paragraph by paragraph
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = htmlContent;
        
        // Get all block elements (p, div, h1-h6, etc.)
        const blockElements = tempDiv.querySelectorAll('p, div, h1, h2, h3, h4, h5, h6, li, blockquote');
        const translatedBlocks: string[] = [];
        
        // Translate each block element
        for (const block of Array.from(blockElements)) {
          const text = block.textContent?.trim() || '';
          if (text) {
            const translated = await this.languageService.translateText(text, 'hi', 'en');
            // Preserve the tag name
            const tagName = block.tagName.toLowerCase();
            translatedBlocks.push(`<${tagName}>${translated}</${tagName}>`);
          }
        }
        
        // If we found block elements, use them
        if (translatedBlocks.length > 0) {
          this.newsForm.contentEn = translatedBlocks.join('');
        } else {
          // Fallback: translate all text content
          const plainText = tempDiv.textContent || tempDiv.innerText || '';
          if (plainText.trim()) {
            const translated = await this.languageService.translateText(plainText, 'hi', 'en');
            this.newsForm.contentEn = `<p>${translated}</p>`;
          }
        }
      } else {
        // Plain text - translate and wrap in paragraph
        const translated = await this.languageService.translateText(htmlContent, 'hi', 'en');
        this.newsForm.contentEn = `<p>${translated}</p>`;
      }
      
      this.submitSuccess = 'Content translated successfully!';
    } catch (error) {
      console.error('[AdminCreatePost] Error translating content:', error);
      this.submitError = 'Failed to translate content. Please try again.';
    } finally {
      this.isTranslatingContentEn = false;
    }
  }

  async translateTrendingTitleToEnglish() {
    if (!this.newsForm.trendingTitle || !this.newsForm.trendingTitle.trim()) {
      this.submitError = 'Please enter Trending Title (Hindi) first';
      return;
    }

    this.isTranslatingTrendingTitleEn = true;
    this.submitError = '';

    try {
      const translatedText = await this.languageService.translateText(this.newsForm.trendingTitle, 'hi', 'en');
      this.newsForm.trendingTitleEn = translatedText;
      this.submitSuccess = 'Trending Title translated successfully!';
    } catch (error) {
      console.error('[AdminCreatePost] Error translating trending title:', error);
      this.submitError = 'Failed to translate trending title. Please try again.';
    } finally {
      this.isTranslatingTrendingTitleEn = false;
    }
  }

  async translateField(fieldName: 'titleEn' | 'excerptEn' | 'summaryEn' | 'contentEn' | 'trendingTitleEn', englishText: string) {
    if (!englishText || !englishText.trim()) {
      return;
    }

    // Set the appropriate loading state
    switch (fieldName) {
      case 'titleEn':
        this.isTranslatingTitleEn = true;
        break;
      case 'excerptEn':
        this.isTranslatingExcerptEn = true;
        break;
      case 'summaryEn':
        this.isTranslatingSummaryEn = true;
        break;
      case 'contentEn':
        this.isTranslatingContentEn = true;
        break;
      case 'trendingTitleEn':
        this.isTranslatingTrendingTitleEn = true;
        break;
    }

    try {
      // Strip HTML tags from contentEn if it's HTML content
      let textToTranslate = englishText;
      if (fieldName === 'contentEn') {
        // Create a temporary div to extract text from HTML
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = englishText;
        textToTranslate = tempDiv.textContent || tempDiv.innerText || '';
      }

      const translatedText = await this.languageService.translateText(textToTranslate, 'en', 'hi');
      
      // Map field names to Hindi field names
      const fieldMap: Record<string, 'title' | 'excerpt' | 'summary' | 'content' | 'trendingTitle'> = {
        'titleEn': 'title',
        'excerptEn': 'excerpt',
        'summaryEn': 'summary',
        'contentEn': 'content',
        'trendingTitleEn': 'trendingTitle'
      };

      const hindiField = fieldMap[fieldName];
      if (hindiField) {
        // For contentEn, preserve HTML structure if original was HTML
        if (fieldName === 'contentEn' && englishText.includes('<')) {
          // If original was HTML, wrap translated text in same HTML structure
          // This is a simple approach - for complex HTML, you might need more sophisticated parsing
          this.newsForm[hindiField] = translatedText;
        } else {
          this.newsForm[hindiField] = translatedText;
        }
      }
    } catch (error) {
      console.error(`[AdminCreatePost] Error translating ${fieldName}:`, error);
      this.submitError = `Failed to translate ${fieldName}. Please try again.`;
    } finally {
      // Reset the appropriate loading state
      switch (fieldName) {
        case 'titleEn':
          this.isTranslatingTitleEn = false;
          break;
        case 'excerptEn':
          this.isTranslatingExcerptEn = false;
          break;
        case 'summaryEn':
          this.isTranslatingSummaryEn = false;
          break;
        case 'contentEn':
          this.isTranslatingContentEn = false;
          break;
        case 'trendingTitleEn':
          this.isTranslatingTrendingTitleEn = false;
          break;
      }
    }
  }

  getWordCount(text: string | undefined): number {
    if (!text) return 0;
    return text.split(/\s+/).filter(w => w.length > 0).length;
  }
}

