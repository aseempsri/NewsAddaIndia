import { Component, OnInit, OnDestroy } from '@angular/core';
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
import { LanguageService } from '../../../services/language.service';

interface PendingNews {
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
  generatedBy: string;
  generatedAt: string;
  createdAt: string;
  updatedAt: string;
}

@Component({
  selector: 'app-admin-edit-post',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, CKEditorModule],
  template: `
    <div class="min-h-screen bg-background py-8">
      <div class="container mx-auto px-4 max-w-7xl">
        @if (isAuthenticated) {
          <div class="space-y-6">
            <div class="flex items-center justify-between">
              <div class="flex items-center gap-4">
                <a routerLink="/admin/review" class="text-primary hover:text-primary/80">
                  <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                  </svg>
                </a>
                <h1 class="text-3xl font-bold">Edit Post</h1>
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
                    <div class="flex items-center justify-between mb-2">
                      <label class="block text-sm font-medium">Title (English)</label>
                      <button
                        type="button"
                        (click)="translateTitleToEnglish()"
                        [disabled]="!newsData.title?.trim() || isTranslatingTitleEn"
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
                    <div class="flex items-center justify-between mb-2">
                      <label class="block text-sm font-medium">Excerpt (English)</label>
                      <button
                        type="button"
                        (click)="translateExcerptToEnglish()"
                        [disabled]="!newsData.excerpt?.trim() || isTranslatingExcerptEn"
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
                    <div class="flex items-center justify-between mb-2">
                      <label class="block text-sm font-medium">Summary (60 words in English)</label>
                      <button
                        type="button"
                        (click)="translateSummaryToEnglish()"
                        [disabled]="!newsData.summary?.trim() || isTranslatingSummaryEn"
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
                    <div class="flex items-center justify-between mb-2">
                      <label class="block text-sm font-medium">Detailed Content (Full Article in English)</label>
                      <button
                        type="button"
                        (click)="translateContentToEnglish()"
                        [disabled]="!newsData.content?.trim() || isTranslatingContentEn"
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
                          <div class="flex items-center justify-between mb-2">
                            <label class="block text-sm font-medium">
                              Trending Title (English) <span class="text-red-500">*</span>
                            </label>
                            <button
                              type="button"
                              (click)="translateTrendingTitleToEnglish()"
                              [disabled]="!newsData.trendingTitle?.trim() || isTranslatingTrendingTitleEn"
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

                  <!-- Image Upload (Max 3) -->
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
                      routerLink="/admin/review"
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
export class AdminEditPostComponent implements OnInit, OnDestroy {
  isAuthenticated = false;
  currentAdminTheme: AdminTheme = 'light';
  private adminThemeSubscription?: Subscription;
  authToken = '';
  newsId = '';
  isTranslating = false;
  isTranslatingTitleEn = false;
  isTranslatingExcerptEn = false;
  isTranslatingSummaryEn = false;
  isTranslatingContentEn = false;
  isTranslatingTrendingTitleEn = false;
  newsData: PendingNews = {
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
    generatedBy: '',
    generatedAt: '',
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

  // Icon functionality removed

  constructor(
    private http: HttpClient,
    private router: Router,
    private languageService: LanguageService,
    private route: ActivatedRoute,
    private sanitizer: DomSanitizer,
    private adminThemeService: AdminThemeService
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
    // Try to load from sessionStorage first (from review page)
    const storedNews = sessionStorage.getItem('editNews');
    if (storedNews) {
      try {
        this.newsData = JSON.parse(storedNews);
        this.tagsInput = this.newsData.tags.join(', ');
        if (this.newsData.image) {
          this.currentImageUrl = this.getImageUrl(this.newsData.image);
        }
        // Load current images array
        console.log('[AdminEditPost] Loading images from sessionStorage:', {
          images: this.newsData.images,
          image: this.newsData.image
        });
        if (this.newsData.images && Array.isArray(this.newsData.images) && this.newsData.images.length > 0) {
          this.currentImages = this.newsData.images.map(img => this.getImageUrl(img));
          console.log('[AdminEditPost] Loaded images from sessionStorage:', this.currentImages);
        } else if (this.newsData.image) {
          this.currentImages = [this.currentImageUrl!];
        } else {
          this.currentImages = [];
        }
        sessionStorage.removeItem('editNews');
        return;
      } catch (e) {
        console.error('Error parsing stored news:', e);
      }
    }

    // Otherwise fetch from API
    this.isLoading = true;
    const headers = new HttpHeaders().set('Authorization', `Bearer ${this.authToken}`);

    this.http.get<{ success: boolean; data: PendingNews; error?: string }>(
      `${this.getApiUrl()}/api/pending-news/${this.newsId}`,
      { headers }
    ).subscribe({
      next: (response) => {
        if (response.success) {
          this.newsData = { 
            ...response.data, 
            summary: response.data.summary || '',
            summaryEn: response.data.summaryEn || '',
            excerptEn: response.data.excerptEn || '',
            contentEn: response.data.contentEn || ''
          };
          this.tagsInput = this.newsData.tags.join(', ');
          if (this.newsData.image) {
            this.currentImageUrl = this.getImageUrl(this.newsData.image);
          }
          // Load current images array
          console.log('[AdminEditPost] Loading images from API:', {
            images: this.newsData.images,
            image: this.newsData.image,
            imagesType: typeof this.newsData.images,
            imagesIsArray: Array.isArray(this.newsData.images)
          });
          if (this.newsData.images && Array.isArray(this.newsData.images) && this.newsData.images.length > 0) {
            this.currentImages = this.newsData.images.map(img => {
              const url = this.getImageUrl(img);
              console.log('[AdminEditPost] Mapping image:', img, '->', url);
              return url;
            });
            console.log('[AdminEditPost] Loaded images array:', this.currentImages);
          } else if (this.newsData.image) {
            this.currentImages = [this.currentImageUrl!];
            console.log('[AdminEditPost] Using single image:', this.currentImages);
          } else {
            this.currentImages = [];
            console.log('[AdminEditPost] No images found');
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

  // Icon methods removed

  async translateTitleToEnglish() {
    if (!this.newsData.title || !this.newsData.title.trim()) {
      this.submitError = 'Please enter Title (Hindi) first';
      return;
    }

    this.isTranslatingTitleEn = true;
    this.submitError = '';

    try {
      const translatedText = await this.languageService.translateText(this.newsData.title, 'hi', 'en');
      this.newsData.titleEn = translatedText;
      this.submitSuccess = 'Title translated successfully!';
    } catch (error) {
      console.error('[AdminEditPost] Error translating title:', error);
      this.submitError = 'Failed to translate title. Please try again.';
    } finally {
      this.isTranslatingTitleEn = false;
    }
  }

  async translateExcerptToEnglish() {
    if (!this.newsData.excerpt || !this.newsData.excerpt.trim()) {
      this.submitError = 'Please enter Excerpt (Hindi) first';
      return;
    }

    this.isTranslatingExcerptEn = true;
    this.submitError = '';

    try {
      const translatedText = await this.languageService.translateText(this.newsData.excerpt, 'hi', 'en');
      this.newsData.excerptEn = translatedText;
      this.submitSuccess = 'Excerpt translated successfully!';
    } catch (error) {
      console.error('[AdminEditPost] Error translating excerpt:', error);
      this.submitError = 'Failed to translate excerpt. Please try again.';
    } finally {
      this.isTranslatingExcerptEn = false;
    }
  }

  async translateSummaryToEnglish() {
    if (!this.newsData.summary || !this.newsData.summary.trim()) {
      this.submitError = 'Please enter Summary (Hindi) first';
      return;
    }

    this.isTranslatingSummaryEn = true;
    this.submitError = '';

    try {
      const translatedText = await this.languageService.translateText(this.newsData.summary, 'hi', 'en');
      this.newsData.summaryEn = translatedText;
      this.submitSuccess = 'Summary translated successfully!';
    } catch (error) {
      console.error('[AdminEditPost] Error translating summary:', error);
      this.submitError = 'Failed to translate summary. Please try again.';
    } finally {
      this.isTranslatingSummaryEn = false;
    }
  }

  async translateContentToEnglish() {
    if (!this.newsData.content || !this.newsData.content.trim()) {
      this.submitError = 'Please enter Content (Hindi) first';
      return;
    }

    this.isTranslatingContentEn = true;
    this.submitError = '';

    try {
      const htmlContent = this.newsData.content;
      
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
          this.newsData.contentEn = translatedBlocks.join('');
        } else {
          // Fallback: translate all text content
          const plainText = tempDiv.textContent || tempDiv.innerText || '';
          if (plainText.trim()) {
            const translated = await this.languageService.translateText(plainText, 'hi', 'en');
            this.newsData.contentEn = `<p>${translated}</p>`;
          }
        }
      } else {
        // Plain text - translate and wrap in paragraph
        const translated = await this.languageService.translateText(htmlContent, 'hi', 'en');
        this.newsData.contentEn = `<p>${translated}</p>`;
      }
      
      this.submitSuccess = 'Content translated successfully!';
    } catch (error) {
      console.error('[AdminEditPost] Error translating content:', error);
      this.submitError = 'Failed to translate content. Please try again.';
    } finally {
      this.isTranslatingContentEn = false;
    }
  }

  async translateTrendingTitleToEnglish() {
    if (!this.newsData.trendingTitle || !this.newsData.trendingTitle.trim()) {
      this.submitError = 'Please enter Trending Title (Hindi) first';
      return;
    }

    this.isTranslatingTrendingTitleEn = true;
    this.submitError = '';

    try {
      const translatedText = await this.languageService.translateText(this.newsData.trendingTitle, 'hi', 'en');
      this.newsData.trendingTitleEn = translatedText;
      this.submitSuccess = 'Trending Title translated successfully!';
    } catch (error) {
      console.error('[AdminEditPost] Error translating trending title:', error);
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
        if (fieldName === 'contentEn' && englishText.includes('<')) {
          this.newsData[hindiField] = translatedText;
        } else {
          this.newsData[hindiField] = translatedText;
        }
      }
    } catch (error) {
      console.error(`[AdminEditPost] Error translating ${fieldName}:`, error);
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

    const formData = new FormData();
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
    formData.append('content', this.newsData.content !== undefined ? this.newsData.content : (this.newsData.excerpt || ''));
    // Send contentEn as-is (empty string if cleared)
    formData.append('contentEn', this.newsData.contentEn !== undefined ? this.newsData.contentEn : '');
    formData.append('category', this.newsData.category !== undefined ? this.newsData.category : '');
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
    } else {
      // If trending is unchecked, send empty string to clear it
      formData.append('trendingTitle', '');
      formData.append('trendingTitleEn', '');
    }
    
    // Append all new images (max 3)
    if (this.newImages.length > 0) {
      this.newImages.forEach((image, index) => {
        formData.append('images', image);
      });
    }

    const headers = new HttpHeaders().set('Authorization', `Bearer ${this.authToken}`);

    this.http.put<{ success: boolean; message?: string; error?: string; data?: PendingNews }>(
      `${this.getApiUrl()}/api/pending-news/${this.newsId}`,
      formData,
      { headers }
    ).subscribe({
      next: (response) => {
        if (response.success) {
          this.submitSuccess = response.message || 'Post updated successfully!';
          setTimeout(() => {
            this.router.navigate(['/admin/review']);
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

