import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';

export interface ImageGalleryPickerConfig {
  maxSelectable: number;
  authToken: string;
}

@Injectable({ providedIn: 'root' })
export class ImageGalleryPickerService {
  private openSubject = new Subject<ImageGalleryPickerConfig | null>();
  private selectedSubject = new Subject<string[]>();
  private cancelledSubject = new Subject<void>();

  /** Emits config when opened, null when closed */
  readonly state$ = this.openSubject.asObservable();

  /** Emits selected image paths when user confirms */
  readonly selected$ = this.selectedSubject.asObservable();

  /** Emits when user cancels */
  readonly cancelled$ = this.cancelledSubject.asObservable();

  open(config: ImageGalleryPickerConfig) {
    this.openSubject.next(config);
  }

  close() {
    this.openSubject.next(null);
  }

  confirmSelected(paths: string[]) {
    this.selectedSubject.next(paths);
    this.close();
  }

  cancel() {
    this.cancelledSubject.next();
    this.close();
  }
}
