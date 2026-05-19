import { Component, EventEmitter, Output, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DeletePasswordService } from '../../services/delete-password.service';

@Component({
  selector: 'app-delete-password-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    @if (isOpen) {
      <div class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm" (click)="close()">
        <div class="bg-background border border-border rounded-xl shadow-2xl max-w-md w-full mx-4" (click)="$event.stopPropagation()">
          <div class="p-6">
            <div class="flex items-center justify-between mb-4">
              <h2 class="text-2xl font-bold text-red-600">Confirm Permanent Deletion</h2>
              <button
                (click)="close()"
                class="p-2 rounded-full bg-red-600 hover:bg-red-700 active:bg-red-800 border-2 border-red-500 shadow-lg transition-all touch-manipulation min-w-[44px] min-h-[44px] flex items-center justify-center close-button-glow-modal"
                aria-label="Close modal"
                type="button">
                <svg class="w-6 h-6 text-white close-icon-glow-modal" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div class="mb-6">
              <div class="flex items-start gap-3 p-4 bg-red-500/10 border border-red-500/20 rounded-lg mb-4">
                <svg class="w-6 h-6 text-red-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                <div>
                  <p class="font-semibold text-red-600 mb-1">Warning: Permanent Deletion</p>
                  <p class="text-sm text-muted-foreground">
                    This action cannot be undone. The post will be permanently deleted from both the website and database.
                  </p>
                </div>
              </div>
              
              <div>
                <label class="block text-sm font-medium mb-2">
                  Enter deletion password to confirm:
                </label>
                <input
                  type="password"
                  [(ngModel)]="password"
                  (keyup.enter)="confirm()"
                  placeholder="Enter password"
                  class="w-full px-4 py-2 rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-red-500"
                  autofocus
                />
                @if (error) {
                  <p class="text-red-500 text-sm mt-2">{{ error }}</p>
                }
              </div>
            </div>
            
            <div class="flex gap-3">
              <button
                (click)="close()"
                class="flex-1 px-4 py-2 bg-secondary text-foreground rounded-lg hover:bg-secondary/80 transition-colors">
                Cancel
              </button>
              <button
                (click)="confirm()"
                [disabled]="!password || isProcessing"
                class="flex-1 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
                @if (isProcessing) {
                  <span class="flex items-center justify-center gap-2">
                    <svg class="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                      <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Verifying...
                  </span>
                } @else {
                  Confirm Delete
                }
              </button>
            </div>
          </div>
        </div>
      </div>
    }
  `,
  styles: [`
    /* Glow effect for close button - Red background with white cross glow */
    .close-button-glow-modal {
      box-shadow: 0 0 20px rgba(220, 38, 38, 0.8), 0 0 40px rgba(220, 38, 38, 0.6), 0 0 60px rgba(220, 38, 38, 0.4), 0 4px 12px rgba(0, 0, 0, 0.3);
      transition: box-shadow 0.3s ease, transform 0.2s ease;
    }
    .close-button-glow-modal:hover {
      box-shadow: 0 0 25px rgba(220, 38, 38, 0.9), 0 0 50px rgba(220, 38, 38, 0.7), 0 0 75px rgba(220, 38, 38, 0.5), 0 6px 16px rgba(0, 0, 0, 0.4);
      transform: scale(1.05);
    }
    .close-button-glow-modal:active {
      box-shadow: 0 0 15px rgba(220, 38, 38, 0.7), 0 0 30px rgba(220, 38, 38, 0.5), 0 0 45px rgba(220, 38, 38, 0.3), 0 2px 8px rgba(0, 0, 0, 0.3);
      transform: scale(0.95);
    }
    .close-icon-glow-modal {
      filter: drop-shadow(0 0 6px rgba(255, 255, 255, 1)) drop-shadow(0 0 12px rgba(255, 255, 255, 0.8)) drop-shadow(0 0 18px rgba(255, 255, 255, 0.6));
      transition: filter 0.3s ease;
    }
    .close-button-glow-modal:hover .close-icon-glow-modal {
      filter: drop-shadow(0 0 8px rgba(255, 255, 255, 1)) drop-shadow(0 0 16px rgba(255, 255, 255, 0.9)) drop-shadow(0 0 24px rgba(255, 255, 255, 0.7));
    }
  `]
})
export class DeletePasswordModalComponent {
  @Input() isOpen = false;
  @Output() confirmed = new EventEmitter<void>();
  @Output() cancelled = new EventEmitter<void>();
  
  password = '';
  error = '';
  isProcessing = false;

  constructor(private deletePasswordService: DeletePasswordService) {}

  confirm() {
    if (!this.password) {
      this.error = 'Please enter the password';
      return;
    }

    this.isProcessing = true;
    this.error = '';

    // Simulate a small delay for better UX
    setTimeout(() => {
      if (this.deletePasswordService.verifyPassword(this.password)) {
        this.confirmed.emit();
        this.reset();
      } else {
        this.error = 'Incorrect password. Please try again.';
        this.password = '';
        this.isProcessing = false;
      }
    }, 300);
  }

  close() {
    this.reset();
    this.cancelled.emit();
  }

  private reset() {
    this.password = '';
    this.error = '';
    this.isProcessing = false;
    this.isOpen = false;
  }
}

