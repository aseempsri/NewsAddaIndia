import { Component, EventEmitter, Output, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-unsaved-changes-modal',
  standalone: true,
  imports: [CommonModule],
  template: `
    @if (isOpen) {
      <div class="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 backdrop-blur-sm" (click)="stay()">
        <div class="bg-background border border-border rounded-xl shadow-2xl max-w-md w-full mx-4" (click)="$event.stopPropagation()">
          <div class="p-6">
            <div class="flex items-start gap-4 mb-6">
              <div class="flex-shrink-0 w-12 h-12 rounded-full bg-amber-500/20 flex items-center justify-center">
                <svg class="w-7 h-7 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <div class="flex-1">
                <h2 class="text-xl font-bold text-foreground mb-2">Unsaved Changes</h2>
                <p class="text-muted-foreground text-sm leading-relaxed">
                  {{ message }}
                </p>
              </div>
            </div>
            
            <div class="flex gap-3">
              <button
                (click)="stay()"
                type="button"
                class="flex-1 px-4 py-2.5 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors font-medium">
                Stay
              </button>
              <button
                (click)="leave()"
                type="button"
                class="flex-1 px-4 py-2.5 bg-secondary text-foreground rounded-lg hover:bg-secondary/80 transition-colors font-medium border border-border">
                Leave
              </button>
            </div>
          </div>
        </div>
      </div>
    }
  `,
  styles: []
})
export class UnsavedChangesModalComponent {
  @Input() isOpen = false;
  @Input() message = 'You have unsaved changes. If you leave now, your work will be lost. Are you sure you want to leave?';
  @Output() leaveConfirmed = new EventEmitter<void>();
  @Output() stayClicked = new EventEmitter<void>();

  stay() {
    this.stayClicked.emit();
  }

  leave() {
    this.leaveConfirmed.emit();
  }
}
