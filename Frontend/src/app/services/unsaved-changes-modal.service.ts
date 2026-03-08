import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';

export interface UnsavedChangesModalState {
  isOpen: boolean;
  message?: string;
}

@Injectable({ providedIn: 'root' })
export class UnsavedChangesModalService {
  private state$ = new Subject<UnsavedChangesModalState>();
  private resolvePromise: ((value: boolean) => void) | null = null;

  getState() {
    return this.state$.asObservable();
  }

  show(message?: string, _nextUrl?: string): Promise<boolean> {
    this.state$.next({
      isOpen: true,
      message: message || 'You have unsaved changes. If you leave now, your work will be lost. Are you sure you want to leave?'
    });
    return new Promise<boolean>((resolve) => {
      this.resolvePromise = resolve;
    });
  }

  close(leave: boolean) {
    this.state$.next({ isOpen: false });
    if (this.resolvePromise) {
      this.resolvePromise(leave);
      this.resolvePromise = null;
    }
  }
}
