import { Component, Input } from '@angular/core';
import { AdService } from '../../services/ad.service';
import { sectionAdId } from '../../config/ad-sections';
import { AdSlotDisplayComponent } from '../ad-slot-display/ad-slot-display.component';

export type SectionAdVariant = 'banner' | 'tall';

@Component({
  selector: 'app-section-inline-ad',
  standalone: true,
  imports: [AdSlotDisplayComponent],
  template: `
    @if (enabled && hasMedia) {
      <div [class]="containerClass">
        <app-ad-slot-display [adId]="adId" [wrapperClass]="wrapperClass" />
      </div>
    }
  `,
})
export class SectionInlineAdComponent {
  @Input({ required: true }) sectionId!: string;
  @Input({ required: true }) slot!: number;
  /** tall = spans two card rows in category grid */
  @Input() variant: SectionAdVariant = 'banner';

  constructor(private adService: AdService) {}

  get adId(): string {
    return sectionAdId(this.sectionId, this.slot);
  }

  get enabled(): boolean {
    return this.adService.isAdEnabled(this.adId);
  }

  get hasMedia(): boolean {
    return this.adService.hasAdMedia(this.adId);
  }

  get containerClass(): string {
    return this.variant === 'tall'
      ? 'w-full h-full min-h-[200px] lg:min-h-0 flex items-stretch py-0'
      : 'w-full flex justify-center py-1 sm:py-2.5';
  }

  get wrapperClass(): string {
    return this.variant === 'tall'
      ? 'w-full h-full min-h-[200px] sm:min-h-[220px] lg:min-h-full max-w-none'
      : 'w-full max-w-[26.88rem] min-h-[67px] sm:min-h-[90px] lg:min-h-[112px]';
  }
}
