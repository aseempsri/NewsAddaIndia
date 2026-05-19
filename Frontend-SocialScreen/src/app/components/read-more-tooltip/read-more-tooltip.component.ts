import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-read-more-tooltip',
  standalone: true,
  imports: [CommonModule],
  template: `
    @if (isVisible) {
      <div 
        class="read-more-tooltip"
        [style.left.px]="positionX"
        [style.top.px]="positionY"
        (click)="onReadMoreClick()"
        (touchend)="onReadMoreClick()">
        <button 
          class="px-4 py-2 bg-primary text-primary-foreground rounded-lg font-medium shadow-lg hover:bg-primary/90 active:bg-primary/80 transition-colors touch-manipulation min-h-[44px] flex items-center justify-center gap-2"
          type="button">
          Read More
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14 5l7 7m0 0l-7 7m7-7H3" />
          </svg>
        </button>
      </div>
    }
  `,
  styles: [`
    .read-more-tooltip {
      position: fixed;
      z-index: 10001;
      pointer-events: auto;
      animation: tooltip-fade-in 0.2s ease-out;
    }
    @keyframes tooltip-fade-in {
      from {
        opacity: 0;
        transform: translateY(-5px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }
  `]
})
export class ReadMoreTooltipComponent {
  @Input() isVisible: boolean = false;
  @Input() positionX: number = 0;
  @Input() positionY: number = 0;
  @Output() readMoreClick = new EventEmitter<void>();

  onReadMoreClick() {
    this.readMoreClick.emit();
  }
}

