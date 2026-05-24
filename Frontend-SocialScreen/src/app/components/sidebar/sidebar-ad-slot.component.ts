import { Component, Input } from '@angular/core';

import { AdService } from '../../services/ad.service';

import { AdSlotDisplayComponent } from '../ad-slot-display/ad-slot-display.component';



@Component({

  selector: 'app-sidebar-ad-slot',

  standalone: true,

  imports: [AdSlotDisplayComponent],

  host: {
    class: 'block w-full min-w-0',
  },

  template: `

    @if (isAdEnabled(adId)) {

      <app-ad-slot-display

        [adId]="adId"

        [placeholderLabel]="label"

        wrapperClass="mb-2.5 sm:mb-3 lg:mb-3 w-full"

      />

    }

  `,

})

export class SidebarAdSlotComponent {

  @Input({ required: true }) adId!: string;

  @Input({ required: true }) label!: string;



  constructor(private adService: AdService) {}



  isAdEnabled(adId: string): boolean {

    return this.adService.isAdEnabled(adId);

  }

}

