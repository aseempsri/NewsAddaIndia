import { Component, Input } from '@angular/core';
import { AdService } from '../../services/ad.service';
import { AdSlotDisplayComponent } from '../ad-slot-display/ad-slot-display.component';

@Component({
  selector: 'app-home-inline-ad-slot',
  standalone: true,
  imports: [AdSlotDisplayComponent],
  host: {
    class: 'block w-full min-w-0',
  },
  template: `
    @if (isAdEnabled(adId)) {
      <div class="w-full flex justify-center my-6 sm:my-8 lg:my-10">
        <app-ad-slot-display
          [adId]="adId"
          [placeholderLabel]="label"
        />
      </div>
    }
  `,
})
export class HomeInlineAdSlotComponent {
  @Input({ required: true }) adId!: string;
  @Input({ required: true }) label!: string;

  constructor(private adService: AdService) {}

  isAdEnabled(adId: string): boolean {
    return this.adService.isAdEnabled(adId);
  }
}
