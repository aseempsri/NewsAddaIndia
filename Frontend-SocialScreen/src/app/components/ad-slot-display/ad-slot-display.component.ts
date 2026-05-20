import { Component, Input, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AdService } from '../../services/ad.service';
import { isLandscapeMedia } from '../../utils/media-aspect';

@Component({
  selector: 'app-ad-slot-display',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div
      class="w-full rounded-lg overflow-hidden border-4 border-blue-500 dark:border-blue-400 shadow-lg bg-white dark:bg-gray-800 flex flex-col min-h-[inherit]"
      [ngClass]="wrapperClass"
    >
      <a
        [href]="link || 'javascript:void(0)'"
        [target]="link ? '_blank' : '_self'"
        [rel]="link ? 'noopener noreferrer' : ''"
        class="block w-full h-full min-h-[inherit] cursor-pointer box-border p-[8%]"
      >
        <div class="flex flex-col w-full h-full min-h-0">
          <div
            class="flex-[0_0_10%] min-h-[6px] max-h-[16px] flex items-center justify-center shrink-0"
            aria-hidden="true"
          >
            <span
              class="text-[10px] sm:text-[10px] leading-none text-gray-400/80 dark:text-gray-500/90 font-normal tracking-wide select-none"
            >
              Advertisement
            </span>
          </div>
          <div
            class="flex-[0_0_90%] min-h-0 flex-1 basis-[90%] overflow-hidden rounded-sm bg-gray-100 dark:bg-gray-900/80 flex items-center justify-center"
          >
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

  isLandscape = false;

  constructor(private adService: AdService) {}

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['adId']) {
      this.isLandscape = false;
    }
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

  get mediaFitClass(): string {
    return this.isLandscape
      ? 'w-full h-full object-contain object-center'
      : 'w-full h-full object-cover object-center';
  }

  onImageLoad(event: Event) {
    const img = event.target as HTMLImageElement;
    this.isLandscape = isLandscapeMedia(img.naturalWidth, img.naturalHeight);
  }

  onVideoMetadata(event: Event) {
    const video = event.target as HTMLVideoElement;
    if (video.videoWidth && video.videoHeight) {
      this.isLandscape = isLandscapeMedia(video.videoWidth, video.videoHeight);
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
        this.isLandscape = isLandscapeMedia(video.videoWidth, video.videoHeight);
      }
      video.muted = true;
      video.play().catch(() => {});
    }
  }

  onVideoError(event: Event) {
    console.error(`[AdSlot] Video error for ${this.adId}:`, event);
  }
}
