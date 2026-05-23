import { ChangeDetectorRef, Component, Input, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AdService } from '../../services/ad.service';
import { isLandscapeMedia } from '../../utils/media-aspect';

@Component({
  selector: 'app-ad-slot-display',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div
      class="rounded-lg overflow-hidden shadow-lg bg-white dark:bg-gray-800 flex flex-col"
      [ngClass]="shellClass"
    >
      <a
        [href]="link || 'javascript:void(0)'"
        [target]="link ? '_blank' : '_self'"
        [rel]="link ? 'noopener noreferrer' : ''"
        class="block w-full cursor-pointer box-border p-0"
      >
        <div class="flex flex-col w-[98%] min-h-0 min-w-0 mx-auto my-[1%]">
          <div
            class="shrink-0 h-[15px] sm:h-[17px] flex items-center justify-center"
            aria-hidden="true"
          >
            <span
              class="text-[13.5px] sm:text-[15px] leading-none text-gray-400/80 dark:text-gray-500/90 font-normal tracking-wide select-none"
            >
              Advertisement
            </span>
          </div>
          <div [class]="mediaFrameClass" [style.aspect-ratio]="aspectRatioCss">
            @if (hasMedia) {
              @if (mediaType === 'image') {
                <img
                  [src]="mediaUrl"
                  [alt]="altText"
                  [class]="mediaFitClass"
                  (load)="onImageLoad($event)"
                />
              } @else if (mediaType === 'video') {
                <video
                  [src]="mediaUrl"
                  autoplay
                  muted
                  loop
                  playsinline
                  preload="auto"
                  [class]="mediaFitClass"
                  (loadedmetadata)="onVideoMetadata($event)"
                  (canplay)="onVideoCanPlay($event)"
                  (error)="onVideoError($event)"
                  (loadeddata)="onVideoLoaded($event)"
                ></video>
              }
            } @else if (placeholderLabel) {
              <div class="w-full h-full bg-white dark:bg-gray-800 flex items-center justify-center min-h-[45px]">
                <span class="text-purple-600 dark:text-purple-400 font-semibold text-xs sm:text-sm">{{
                  placeholderLabel
                }}</span>
              </div>
            }
          </div>
        </div>
      </a>
    </div>
  `,
})
export class AdSlotDisplayComponent implements OnChanges {
  @Input({ required: true }) adId!: string;
  @Input() wrapperClass = '';
  @Input() placeholderLabel = '';
  /** Resize frame to 16:10 (landscape) or 3:4 (portrait) when media loads */
  @Input() autoAspect = true;
  /** Keep tall category-slot ads inside the grid row height */
  @Input() constrainToParent = false;

  isLandscape = false;
  orientationKnown = false;
  naturalWidth = 0;
  naturalHeight = 0;

  constructor(
    private adService: AdService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['adId']) {
      this.isLandscape = false;
      this.orientationKnown = false;
      this.naturalWidth = 0;
      this.naturalHeight = 0;
    }
  }

  /** Portrait: centered narrow shell (no full-width side bars); landscape: full row */
  get shellClass(): string {
    const width =
      this.autoAspect && this.orientationKnown && !this.isLandscape
        ? 'w-full max-w-md mx-auto sm:max-w-lg'
        : 'w-full';
    return `${width} ${this.wrapperClass}`.trim();
  }

  get aspectRatioCss(): string | null {
    if (!this.autoAspect) return null;
    if (!this.orientationKnown) return '16 / 10';
    if (this.isLandscape) return '16 / 10';
    if (this.naturalWidth > 0 && this.naturalHeight > 0) {
      return `${this.naturalWidth} / ${this.naturalHeight}`;
    }
    return '3 / 4';
  }

  get hasMedia(): boolean {
    return this.adService.hasAdMedia(this.adId);
  }

  get mediaUrl(): string | null {
    return this.adService.getAdMediaUrl(this.adId);
  }

  get mediaType(): 'image' | 'video' | null {
    return this.adService.getAdMediaType(this.adId);
  }

  get link(): string | null {
    return this.adService.getAdLink(this.adId);
  }

  get altText(): string {
    return this.adService.getAdAltText(this.adId);
  }

  get mediaFrameClass(): string {
    const base =
      'overflow-hidden rounded-sm bg-gray-100 dark:bg-gray-900/80 flex items-center justify-center';

    if (!this.autoAspect) {
      return `${base} w-full min-h-[80px] sm:min-h-[100px]`;
    }

    if (!this.orientationKnown) {
      return `${base} w-full min-h-[72px] sm:min-h-[90px]`;
    }

    const cap = this.constrainToParent ? ' max-h-full' : '';
    if (this.isLandscape) {
      return `${base} w-full${cap}`;
    }
    return `${base} w-full max-h-[min(75vh,520px)]${cap}`;
  }

  get mediaFitClass(): string {
    return 'w-full h-full object-contain object-center';
  }

  private applyOrientation(width: number, height: number): void {
    const nextLandscape = isLandscapeMedia(width, height);
    const sizeChanged = this.naturalWidth !== width || this.naturalHeight !== height;
    if (this.orientationKnown && this.isLandscape === nextLandscape && !sizeChanged) return;
    this.naturalWidth = width;
    this.naturalHeight = height;
    this.isLandscape = nextLandscape;
    this.orientationKnown = true;
    this.cdr.markForCheck();
  }

  onImageLoad(event: Event) {
    const img = event.target as HTMLImageElement;
    this.applyOrientation(img.naturalWidth, img.naturalHeight);
  }

  onVideoMetadata(event: Event) {
    const video = event.target as HTMLVideoElement;
    if (video.videoWidth && video.videoHeight) {
      this.applyOrientation(video.videoWidth, video.videoHeight);
    }
  }

  onVideoCanPlay(event: Event) {
    const video = event.target as HTMLVideoElement;
    if (video) {
      video.muted = true;
      video.play().catch(() => {});
    }
  }

  onVideoLoaded(event: Event) {
    const video = event.target as HTMLVideoElement;
    if (video) {
      if (video.videoWidth && video.videoHeight) {
        this.applyOrientation(video.videoWidth, video.videoHeight);
      }
      video.muted = true;
      video.play().catch(() => {});
    }
  }

  onVideoError(event: Event) {
    console.error(`[AdSlot] Video error for ${this.adId}:`, event);
  }
}
