import { Component, EventEmitter, Output, Input, OnInit, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { environment } from '../../../environments/environment';

interface GalleryImage {
  url: string;
  newsId: string;
  slug: string;
  title: string;
  createdAt: string;
}

@Component({
  selector: 'app-image-gallery-picker',
  standalone: true,
  imports: [CommonModule],
  template: `
    @if (isOpen) {
      <div class="fixed inset-0 z-[9999] flex flex-col bg-background shadow-2xl" role="dialog" aria-modal="true" aria-labelledby="gallery-picker-title">
          <!-- Header -->
          <div class="flex items-center justify-between p-4 border-b border-border shrink-0 bg-background">
            <h2 id="gallery-picker-title" class="text-xl font-bold">Choose from Gallery</h2>
            <div class="flex items-center gap-3">
              <span class="text-sm text-muted-foreground">
                {{ selectedUrls.size }} / {{ maxSelectable }} selected
              </span>
              <button
                type="button"
                (click)="close()"
                class="p-2 rounded-lg hover:bg-secondary/50 transition-colors"
                aria-label="Close">
                <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>

          <!-- Content -->
          <div class="flex-1 overflow-auto p-6 min-h-0">
            @if (loading) {
              <div class="flex flex-col items-center justify-center py-20">
                <div class="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mb-4"></div>
                <p class="text-muted-foreground">Loading images...</p>
              </div>
            } @else if (images.length === 0) {
              <div class="text-center py-20 text-muted-foreground">
                <p>No images in gallery yet. Upload images with your news posts first.</p>
              </div>
            } @else {
              <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                @for (img of images; track img.url + img.newsId) {
                  <button
                    type="button"
                    (click)="toggleSelect(img.url)"
                    [disabled]="!isSelectable(img.url)"
                    [class.ring-2]="selectedUrls.has(normalizeUrl(img.url))"
                    [class.ring-primary]="selectedUrls.has(normalizeUrl(img.url))"
                    [class.ring-offset-2]="selectedUrls.has(normalizeUrl(img.url))"
                    class="relative block aspect-square overflow-hidden rounded-lg bg-secondary/30 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed hover:opacity-90">
                    <img
                      [src]="getImageUrl(img.url)"
                      [alt]="img.title"
                      loading="lazy"
                      class="w-full h-full object-cover"
                      (error)="onImageError($event)" />
                    @if (selectedUrls.has(normalizeUrl(img.url))) {
                      <div class="absolute inset-0 bg-primary/30 flex items-center justify-center">
                        <span class="w-10 h-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-lg">
                          {{ getSelectionOrder(img.url) }}
                        </span>
                      </div>
                    }
                  </button>
                }
              </div>
            }
          </div>

          <!-- Footer -->
          <div class="flex items-center justify-end gap-3 p-4 border-t border-border shrink-0 bg-background">
            <button
              type="button"
              (click)="close()"
              class="px-4 py-2 rounded-lg bg-secondary text-foreground hover:bg-secondary/80">
              Cancel
            </button>
            <button
              type="button"
              (click)="confirm()"
              [disabled]="selectedUrls.size === 0"
              class="px-4 py-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed">
              Add {{ selectedUrls.size }} image{{ selectedUrls.size !== 1 ? 's' : '' }}
            </button>
          </div>
      </div>
    }
  `,
  styles: []
})
export class ImageGalleryPickerComponent implements OnInit, OnChanges {
  @Input() isOpen = false;
  @Input() maxSelectable = 3;
  @Input() authToken = '';
  @Output() selected = new EventEmitter<string[]>();
  @Output() cancelled = new EventEmitter<void>();

  images: GalleryImage[] = [];
  loading = false;
  selectedUrls = new Set<string>();
  private selectionOrder: string[] = [];

  constructor(private http: HttpClient) {}

  ngOnInit() {
    if (this.isOpen) this.fetchImages();
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['isOpen'] && this.isOpen) {
      this.fetchImages();
    }
  }

  fetchImages() {
    this.loading = true;
    this.selectedUrls.clear();
    this.selectionOrder = [];
    const headers = new HttpHeaders().set('Authorization', `Bearer ${this.authToken}`);
    this.http.get<{ success: boolean; items: GalleryImage[] }>(`${this.getApiUrl()}/api/news/images/gallery`, { headers }).subscribe({
      next: (response) => {
        if (response.success && response.items) {
          this.images = response.items;
        } else {
          this.images = [];
        }
        this.loading = false;
      },
      error: () => {
        this.images = [];
        this.loading = false;
      }
    });
  }

  toggleSelect(url: string) {
    const normalized = this.normalizeUrl(url);
    if (this.selectedUrls.has(normalized)) {
      this.selectedUrls.delete(normalized);
      this.selectionOrder = this.selectionOrder.filter(u => u !== normalized);
    } else if (this.selectedUrls.size < this.maxSelectable) {
      this.selectedUrls.add(normalized);
      this.selectionOrder.push(normalized);
    }
  }

  isSelectable(url: string): boolean {
    const normalized = this.normalizeUrl(url);
    return this.selectedUrls.has(normalized) || this.selectedUrls.size < this.maxSelectable;
  }

  getSelectionOrder(url: string): number {
    const idx = this.selectionOrder.indexOf(this.normalizeUrl(url));
    return idx >= 0 ? idx + 1 : 0;
  }

  normalizeUrl(url: string): string {
    if (!url) return '';
    return url.startsWith('/') ? url : `/${url}`;
  }

  confirm() {
    const ordered = this.selectionOrder.filter(u => this.selectedUrls.has(u));
    this.selected.emit(ordered);
    this.isOpen = false;
  }

  close() {
    this.isOpen = false;
    this.cancelled.emit();
  }

  getImageUrl(url: string): string {
    if (!url) return '';
    if (url.startsWith('http')) return url;
    const base = this.getApiUrl();
    const path = url.startsWith('/') ? url : `/${url}`;
    return base ? `${base}${path}` : path;
  }

  onImageError(event: Event) {
    const el = event.target as HTMLImageElement;
    el.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="200" height="200" viewBox="0 0 200 200"%3E%3Crect fill="%23e5e7eb" width="200" height="200"/%3E%3C/svg%3E';
    el.onerror = null;
  }

  private getApiUrl(): string {
    return (environment.apiUrl !== undefined && environment.apiUrl !== null && String(environment.apiUrl).trim() !== '')
      ? environment.apiUrl
      : (environment.production ? '' : 'http://localhost:3000');
  }
}
