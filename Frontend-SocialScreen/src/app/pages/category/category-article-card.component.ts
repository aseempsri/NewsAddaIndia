import { Component, EventEmitter, Input, OnChanges, Output, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NewsArticle } from '../../services/news.service';
import { isLandscapeMedia } from '../../utils/media-aspect';

@Component({
  selector: 'app-category-article-card',
  standalone: true,
  imports: [CommonModule],
  template: `
    <article
      class="news-card group opacity-0 animate-fade-in hover:shadow-2xl hover:shadow-purple-500/20 transition-all duration-300 flex flex-col h-full"
      [style.animation-delay]="animationDelay + 'ms'"
    >
      <div
        class="relative aspect-[16/10] overflow-hidden rounded-t-xl bg-gradient-to-br from-purple-100/20 via-pink-100/20 to-orange-100/20 dark:from-purple-900/20 dark:via-pink-900/20 dark:to-orange-900/20 border-2 border-transparent hover:border-purple-300/50 dark:hover:border-purple-700/50 transition-all duration-300 flex-shrink-0 flex items-center justify-center"
      >
        @if (news.imageLoading || !news.image) {
          <div class="absolute inset-0 flex items-center justify-center bg-secondary/50 z-10">
            <div class="flex flex-col items-center gap-2">
              <div class="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
              <span class="text-xs text-muted-foreground">{{ loadingImageLabel }}</span>
            </div>
          </div>
        }
        @if (news.image && !news.imageLoading) {
          <img
            [src]="news.image"
            [alt]="news.title"
            [class]="imageFitClass"
            (load)="onImageLoad($event)"
            style="filter: none; -webkit-filter: none; image-rendering: -webkit-optimize-contrast; image-rendering: crisp-edges; image-rendering: high-quality;"
          />
        }
        <div class="absolute top-4 left-4 z-20 flex gap-2 flex-wrap">
          @if (news.isTrending) {
            <span
              class="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-black rounded-full bg-gradient-to-r from-purple-600 via-pink-500 to-fuchsia-600 text-white shadow-xl animate-pulse border-2 border-white/50 uppercase tracking-wider"
            >
              <span>TRENDING</span>
            </span>
          }
          @if (news.isBreaking) {
            <span
              class="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-black rounded-full bg-gradient-to-r from-red-600 to-red-700 text-white shadow-xl animate-pulse border-2 border-white/50 uppercase tracking-wider"
            >
              <span>BREAKING</span>
            </span>
          }
          @if (news.isFeatured) {
            <span
              class="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-black rounded-full bg-gradient-to-r from-yellow-500 to-amber-500 text-white shadow-xl border-2 border-white/50 uppercase tracking-wider"
            >
              <span>FEATURED</span>
            </span>
          }
          <span [class]="'inline-flex items-center justify-center px-3 py-1 text-xs font-semibold rounded-full shadow-lg ' + categoryColor">
            {{ categoryName }}
          </span>
        </div>
      </div>

      <div class="h-[2px] bg-gradient-to-r from-purple-500 via-pink-500 to-orange-500"></div>

      <div
        class="p-3 pt-4 pb-4 bg-gradient-to-br from-background via-purple-50/5 dark:via-purple-900/5 to-background rounded-b-xl border-t border-purple-200/20 dark:border-purple-800/20 flex flex-col flex-1 min-h-0"
      >
        <div class="flex-1 min-w-0 mb-3 min-h-0">
          <h3
            [class]="
              'font-display text-sm sm:text-base font-bold dark:font-normal leading-tight group-hover:opacity-90 transition-all duration-300 pb-1 cursor-pointer hover:opacity-80 hover:scale-[1.02] break-words ' +
              (news.isTrending ? 'text-purple-700 dark:text-purple-300' : headlineColor)
            "
            (click)="articleClick.emit(news)"
            (touchstart)="touchStart.emit({ event: $event, news })"
            (touchend)="touchEnd.emit({ event: $event, news })"
            (touchmove)="touchMove.emit($event)"
            style="touch-action: pan-y;"
          >
            {{ displayTitle }}
          </h3>
        </div>
        <div class="flex items-center justify-end text-[0.65rem] sm:text-xs text-muted-foreground mt-auto pt-2 border-t border-border/30">
          <span class="flex items-center gap-1">
            <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <span>{{ news.date || news.time }}</span>
          </span>
        </div>
      </div>
    </article>
  `,
})
export class CategoryArticleCardComponent implements OnChanges {
  @Input({ required: true }) news!: NewsArticle;
  @Input() displayTitle = '';
  @Input() categoryName = '';
  @Input() categoryColor = '';
  @Input() headlineColor = '';
  @Input() loadingImageLabel = 'Loading...';
  @Input() animationDelay = 0;

  isLandscape = false;

  @Output() articleClick = new EventEmitter<NewsArticle>();

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['news']) {
      this.isLandscape = false;
    }
  }

  get imageFitClass(): string {
    const hoverZoom = this.isLandscape ? '' : ' group-hover:scale-110';
    return this.isLandscape
      ? `w-full h-full object-contain object-center transition-transform duration-700${hoverZoom}`
      : `w-full h-full object-cover object-center transition-transform duration-700${hoverZoom}`;
  }

  onImageLoad(event: Event) {
    const img = event.target as HTMLImageElement;
    this.isLandscape = isLandscapeMedia(img.naturalWidth, img.naturalHeight);
  }
  @Output() touchStart = new EventEmitter<{ event: TouchEvent; news: NewsArticle }>();
  @Output() touchEnd = new EventEmitter<{ event: TouchEvent; news: NewsArticle }>();
  @Output() touchMove = new EventEmitter<TouchEvent>();
}
