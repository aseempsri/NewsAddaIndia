import { Component, Input } from '@angular/core';
import { AdService } from '../../services/ad.service';
import { sectionAdId } from '../../config/ad-sections';
import { AdSlotDisplayComponent } from '../ad-slot-display/ad-slot-display.component';

export type SectionAdVariant = 'banner' | 'tall';

@Component({
  selector: 'app-section-inline-ad',
  standalone: true,
  imports: [AdSlotDisplayComponent],
  host: {
    class: 'block w-full min-w-0',
  },
  template: `
    @if (shouldShow) {
      <div [class]="containerClass">
        <app-ad-slot-display
          [adId]="adId"
          [wrapperClass]="wrapperClass"
          [constrainToParent]="variant === 'tall'"
        />
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

  get shouldShow(): boolean {
    return this.adService.shouldDisplayAd(this.adId);
  }

  get containerClass(): string {
    return this.variant === 'tall'
      ? 'w-full h-full flex items-center justify-center py-0 min-h-0'
      : 'w-full flex justify-center py-1 sm:py-2.5';
  }

  get wrapperClass(): string {
    return this.variant === 'tall' ? 'h-auto max-h-full' : '';
  }
}
