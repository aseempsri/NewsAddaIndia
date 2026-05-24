import {
  ChangeDetectorRef,
  Component,
  HostListener,
  Input,
  OnChanges,
  OnDestroy,
  OnInit,
  SimpleChanges,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subscription } from 'rxjs';
import { AdService } from '../../services/ad.service';
import {
  getHoverLandscapePreviewSize,
  getHoverPortraitPreviewSize,
  getPortraitFrameSize,
  LANDSCAPE_FRAME_ASPECT,
} from '../../utils/ad-frame-sizes';
import { isLandscapeMedia } from '../../utils/media-aspect';

const PREVIEW_GAP_PX = 14;
const PREVIEW_ARROW_PX = 10;
const VIEWPORT_PAD_PX = 12;

@Component({
  selector: 'app-ad-slot-display',
  standalone: true,
  imports: [CommonModule],
  host: {
    class: 'block w-full min-w-0',
  },
  template: `
    <div
      class="rounded-lg overflow-hidden shadow-lg bg-white dark:bg-gray-800 flex flex-col"
      [ngClass]="shellClass"
      [ngStyle]="shellSizeStyle"
      (mouseenter)="onSlotMouseEnter($event)"
      (mouseleave)="onSlotMouseLeave()"
      (mousemove)="onSlotMouseMove($event)"
    >
      <a
        [href]="link || 'javascript:void(0)'"
        [target]="link ? '_blank' : '_self'"
        [rel]="link ? 'noopener noreferrer' : ''"
        [class]="linkClass"
      >
        <div [class]="innerWrapClass">
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
          <div
            [class]="mediaFrameClass"
            [style.aspect-ratio]="mediaFrameAspectRatio"
            [ngStyle]="mediaFrameSizeStyle"
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
              <div [class]="placeholderClass">
                <span class="text-purple-600 dark:text-purple-400 font-semibold text-xs sm:text-sm">{{
                  placeholderLabel
                }}</span>
              </div>
            }
          </div>
        </div>
      </a>
    </div>

    @if (hoverPreviewOpen && hasMedia && hoverPreviewEnabled) {
      <div
        class="ad-hover-preview fixed z-[10000] pointer-events-none"
        [style.left.px]="hoverPreviewLeft"
        [style.top.px]="hoverPreviewTop"
        role="tooltip"
        [attr.aria-label]="altText || 'Advertisement preview'"
      >
        <div
          class="ad-hover-preview-panel rounded-lg overflow-hidden shadow-2xl border border-gray-200/90 dark:border-gray-600/90 bg-white dark:bg-gray-800 flex flex-col"
          [ngStyle]="hoverPreviewPanelStyle"
        >
          <div
            class="shrink-0 h-[17px] flex items-center justify-center bg-white dark:bg-gray-800"
            aria-hidden="true"
          >
            <span
              class="text-[14px] leading-none text-gray-400/80 dark:text-gray-500/90 font-normal tracking-wide select-none"
            >
              Advertisement
            </span>
          </div>
          <div
            class="relative overflow-hidden bg-gray-100 dark:bg-gray-900/80"
            [ngStyle]="hoverPreviewMediaStyle"
          >
            @if (mediaType === 'image') {
              <img
                [src]="mediaUrl"
                [alt]="altText"
                class="absolute inset-0 w-full h-full object-cover object-center"
              />
            } @else if (mediaType === 'video') {
              <video
                [src]="mediaUrl"
                autoplay
                muted
                loop
                playsinline
                class="absolute inset-0 w-full h-full object-cover object-center"
              ></video>
            }
          </div>
        </div>
        <div
          class="ad-hover-preview-arrow absolute w-0 h-0"
          [style.left.px]="hoverArrowLeft"
          [style.top.px]="hoverArrowTop"
          [class]="hoverArrowClass"
        ></div>
      </div>
    }
  `,
  styles: [
    `
      .ad-hover-preview-arrow {
        border-left: 10px solid transparent;
        border-right: 10px solid transparent;
        filter: drop-shadow(0 2px 2px rgba(0, 0, 0, 0.15));
      }
      .ad-hover-preview-arrow--below {
        border-top: 12px solid rgb(255 255 255);
      }
      :host-context(.dark) .ad-hover-preview-arrow--below {
        border-top-color: rgb(31 41 55);
      }
      .ad-hover-preview-arrow--above {
        border-bottom: 12px solid rgb(255 255 255);
      }
      :host-context(.dark) .ad-hover-preview-arrow--above {
        border-bottom-color: rgb(31 41 55);
      }
      .ad-hover-preview-arrow--right {
        border-top: 10px solid transparent;
        border-bottom: 10px solid transparent;
        border-left: 12px solid rgb(255 255 255);
      }
      :host-context(.dark) .ad-hover-preview-arrow--right {
        border-left-color: rgb(31 41 55);
      }
      .ad-hover-preview-arrow--left {
        border-top: 10px solid transparent;
        border-bottom: 10px solid transparent;
        border-right: 12px solid rgb(255 255 255);
      }
      :host-context(.dark) .ad-hover-preview-arrow--left {
        border-right-color: rgb(31 41 55);
      }
    `,
  ],
})
export class AdSlotDisplayComponent implements OnInit, OnChanges, OnDestroy {
  @Input({ required: true }) adId!: string;
  @Input() wrapperClass = '';
  @Input() placeholderLabel = '';
  @Input() autoAspect = true;
  @Input() constrainToParent = false;

  isLandscape = false;
  orientationKnown = false;
  naturalWidth = 0;
  naturalHeight = 0;

  hoverPreviewOpen = false;
  hoverPreviewLeft = 0;
  hoverPreviewTop = 0;
  hoverArrowLeft = 0;
  hoverArrowTop = 0;
  hoverArrowPlacement: 'above' | 'below' | 'left' | 'right' = 'below';

  private cursorX = 0;
  private cursorY = 0;
  private adsSubscription?: Subscription;
  private dimensionProbeToken = 0;

  constructor(
    private adService: AdService,
    private cdr: ChangeDetectorRef
  ) {}

  get hoverPreviewEnabled(): boolean {
    return typeof window !== 'undefined' && window.matchMedia('(hover: hover)').matches;
  }

  get hoverPreviewPanelStyle(): Record<string, string> {
    const labelPx = 17;
    if (this.usePortraitStandardFrame) {
      const { widthPx, heightPx } = getHoverPortraitPreviewSize(
        this.naturalWidth,
        this.naturalHeight
      );
      return {
        width: `${widthPx}px`,
        height: `${heightPx + labelPx}px`,
        maxWidth: `min(${widthPx}px, calc(100vw - 24px))`,
        display: 'flex',
        flexDirection: 'column',
      };
    }
    const { widthPx, heightPx } = getHoverLandscapePreviewSize();
    return {
      width: `${widthPx}px`,
      height: `${heightPx + labelPx}px`,
      maxWidth: `min(${widthPx}px, calc(100vw - 24px))`,
      display: 'flex',
      flexDirection: 'column',
    };
  }

  get hoverPreviewMediaStyle(): Record<string, string> {
    if (this.usePortraitStandardFrame) {
      const { heightPx } = getHoverPortraitPreviewSize(
        this.naturalWidth,
        this.naturalHeight
      );
      return { height: `${heightPx}px`, flex: '1 1 auto', minHeight: '0' };
    }
    const { heightPx } = getHoverLandscapePreviewSize();
    return { height: `${heightPx}px`, flex: '1 1 auto', minHeight: '0' };
  }

  get hoverPreviewSize(): { width: number; height: number } {
    const label = 17;
    if (this.usePortraitStandardFrame) {
      const { widthPx, heightPx } = getHoverPortraitPreviewSize(
        this.naturalWidth,
        this.naturalHeight
      );
      return { width: widthPx, height: heightPx + label };
    }
    const { widthPx, heightPx } = getHoverLandscapePreviewSize();
    return { width: widthPx, height: heightPx + label };
  }

  get hoverArrowClass(): string {
    const map = {
      above: 'ad-hover-preview-arrow--above',
      below: 'ad-hover-preview-arrow--below',
      left: 'ad-hover-preview-arrow--left',
      right: 'ad-hover-preview-arrow--right',
    };
    return map[this.hoverArrowPlacement];
  }

  ngOnInit(): void {
    this.adsSubscription = this.adService.ads$.subscribe(() => {
      this.resetOrientation();
      this.probeMediaDimensions();
      this.cdr.markForCheck();
    });
    this.probeMediaDimensions();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['adId']) {
      this.resetOrientation();
      this.probeMediaDimensions();
      this.hoverPreviewOpen = false;
    }
  }

  ngOnDestroy(): void {
    this.adsSubscription?.unsubscribe();
    this.hoverPreviewOpen = false;
  }

  @HostListener('window:scroll')
  onWindowScroll(): void {
    if (this.hoverPreviewOpen) {
      this.updateHoverPreviewPosition();
    }
  }

  onSlotMouseEnter(event: MouseEvent): void {
    if (!this.hoverPreviewEnabled || !this.hasMedia) return;
    this.hoverPreviewOpen = true;
    this.onSlotMouseMove(event);
  }

  onSlotMouseLeave(): void {
    this.hoverPreviewOpen = false;
  }

  onSlotMouseMove(event: MouseEvent): void {
    if (!this.hoverPreviewOpen) return;
    this.cursorX = event.clientX;
    this.cursorY = event.clientY;
    this.updateHoverPreviewPosition();
  }

  private updateHoverPreviewPosition(): void {
    const { width: panelW, height: panelH } = this.hoverPreviewSize;
    const vw = window.innerWidth;
    const vh = window.innerHeight;

    let left = this.cursorX - panelW / 2;
    let top = this.cursorY - panelH - PREVIEW_GAP_PX - PREVIEW_ARROW_PX;
    let placement: typeof this.hoverArrowPlacement = 'below';

    if (top < VIEWPORT_PAD_PX) {
      top = this.cursorY + PREVIEW_GAP_PX + PREVIEW_ARROW_PX;
      placement = 'above';
    }

    if (top + panelH > vh - VIEWPORT_PAD_PX) {
      const tryAbove = this.cursorY - panelH - PREVIEW_GAP_PX - PREVIEW_ARROW_PX;
      if (tryAbove >= VIEWPORT_PAD_PX) {
        top = tryAbove;
        placement = 'below';
      }
    }

    if (left < VIEWPORT_PAD_PX) {
      left = VIEWPORT_PAD_PX;
    } else if (left + panelW > vw - VIEWPORT_PAD_PX) {
      left = vw - VIEWPORT_PAD_PX - panelW;
    }

    if (left + panelW > vw - VIEWPORT_PAD_PX || left < VIEWPORT_PAD_PX) {
      const tryRight = this.cursorX + PREVIEW_GAP_PX + PREVIEW_ARROW_PX;
      const tryLeft = this.cursorX - panelW - PREVIEW_GAP_PX - PREVIEW_ARROW_PX;
      if (tryRight + panelW <= vw - VIEWPORT_PAD_PX) {
        left = tryRight;
        top = this.cursorY - panelH / 2;
        placement = 'left';
      } else if (tryLeft >= VIEWPORT_PAD_PX) {
        left = tryLeft;
        top = this.cursorY - panelH / 2;
        placement = 'right';
      }
    }

    top = Math.max(
      VIEWPORT_PAD_PX,
      Math.min(vh - VIEWPORT_PAD_PX - panelH, top)
    );
    left = Math.max(
      VIEWPORT_PAD_PX,
      Math.min(vw - VIEWPORT_PAD_PX - panelW, left)
    );

    this.hoverPreviewLeft = left;
    this.hoverPreviewTop = top;
    this.hoverArrowPlacement = placement;

    const arrowHalf = 10;
    switch (placement) {
      case 'below':
        this.hoverArrowLeft = this.cursorX - left - arrowHalf;
        this.hoverArrowTop = panelH;
        break;
      case 'above':
        this.hoverArrowLeft = this.cursorX - left - arrowHalf;
        this.hoverArrowTop = -PREVIEW_ARROW_PX;
        break;
      case 'left':
        this.hoverArrowLeft = panelW;
        this.hoverArrowTop = this.cursorY - top - arrowHalf;
        break;
      case 'right':
        this.hoverArrowLeft = -PREVIEW_ARROW_PX;
        this.hoverArrowTop = this.cursorY - top - arrowHalf;
        break;
    }

    this.hoverArrowLeft = Math.max(12, Math.min(panelW - 24, this.hoverArrowLeft));
    this.hoverArrowTop = Math.max(
      placement === 'above' ? -PREVIEW_ARROW_PX : 12,
      Math.min(panelH - 12, this.hoverArrowTop)
    );

    this.cdr.markForCheck();
  }

  get useLandscapeStandardFrame(): boolean {
    return this.autoAspect && (!this.orientationKnown || this.isLandscape);
  }

  get usePortraitStandardFrame(): boolean {
    return this.autoAspect && this.orientationKnown && !this.isLandscape;
  }

  get portraitFrameSize() {
    return getPortraitFrameSize(this.naturalWidth, this.naturalHeight);
  }

  get shellClass(): string {
    let width = 'w-full';
    if (this.useLandscapeStandardFrame) {
      width = 'w-full max-w-[572px] mx-auto shrink-0';
    } else if (this.usePortraitStandardFrame) {
      width = 'mx-auto shrink-0';
    }
    const extra = this.wrapperClass.replace(/\bmax-w-\S+/g, '').trim();
    return `${width} ${extra}`.trim();
  }

  get linkClass(): string {
    const base = 'block cursor-pointer box-border p-0';
    return this.usePortraitStandardFrame ? base : `${base} w-full`;
  }

  get innerWrapClass(): string {
    return this.usePortraitStandardFrame
      ? 'flex flex-col'
      : 'flex flex-col w-[98%] min-h-0 min-w-0 mx-auto my-[1%]';
  }

  get shellSizeStyle(): Record<string, string> | null {
    if (!this.usePortraitStandardFrame) return null;
    const { widthPx } = this.portraitFrameSize;
    return {
      width: `${widthPx}px`,
      maxWidth: '100%',
    };
  }

  get mediaFrameAspectRatio(): string | null {
    if (!this.autoAspect || this.usePortraitStandardFrame) return null;
    if (this.useLandscapeStandardFrame) return LANDSCAPE_FRAME_ASPECT;
    return null;
  }

  get mediaFrameSizeStyle(): Record<string, string> | null {
    if (!this.usePortraitStandardFrame) return null;
    const { widthPx, heightPx } = this.portraitFrameSize;
    return {
      width: `${widthPx}px`,
      height: `${heightPx}px`,
      maxWidth: '100%',
    };
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
    const cap = this.constrainToParent ? ' max-h-full' : '';

    if (this.useLandscapeStandardFrame) {
      return `relative w-full min-w-full aspect-[16/10] overflow-hidden rounded-sm bg-gray-100 dark:bg-gray-900/80 shrink-0 flex items-center justify-center${cap}`;
    }

    if (this.usePortraitStandardFrame) {
      return `relative overflow-hidden rounded-sm bg-gray-100 dark:bg-gray-900/80 shrink-0 flex items-center justify-center box-border${cap}`;
    }

    return `overflow-hidden rounded-sm bg-gray-100 dark:bg-gray-900/80 flex items-center justify-center w-full min-h-[80px]${cap}`;
  }

  get mediaFitClass(): string {
    if (this.useLandscapeStandardFrame || this.usePortraitStandardFrame) {
      return 'max-w-full max-h-full w-auto h-auto object-contain object-center block';
    }
    return 'w-full h-full object-contain object-center';
  }

  get placeholderClass(): string {
    if (this.useLandscapeStandardFrame || this.usePortraitStandardFrame) {
      return 'absolute inset-0 flex items-center justify-center bg-white dark:bg-gray-800';
    }
    return 'w-full h-full min-h-[45px] bg-white dark:bg-gray-800 flex items-center justify-center';
  }

  private resetOrientation(): void {
    this.isLandscape = false;
    this.orientationKnown = false;
    this.naturalWidth = 0;
    this.naturalHeight = 0;
  }

  private probeMediaDimensions(): void {
    if (!this.autoAspect || !this.hasMedia) return;

    const url = this.mediaUrl;
    if (!url) return;

    if (this.mediaType === 'video') {
      return;
    }

    const token = ++this.dimensionProbeToken;
    const img = new Image();
    img.onload = () => {
      if (token !== this.dimensionProbeToken) return;
      this.applyOrientation(img.naturalWidth, img.naturalHeight);
    };
    img.onerror = () => {
      if (token !== this.dimensionProbeToken) return;
    };
    img.src = url;
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
