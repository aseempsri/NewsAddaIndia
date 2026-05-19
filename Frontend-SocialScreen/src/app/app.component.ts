import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet } from '@angular/router';
import { NewsService } from './services/news.service';
import { UserTrackingService } from './services/user-tracking.service';
import { ThemeService } from './services/theme.service';
import { UnsavedChangesModalComponent } from './components/unsaved-changes-modal/unsaved-changes-modal.component';
import { UnsavedChangesModalService } from './services/unsaved-changes-modal.service';
import { ImageGalleryPickerComponent } from './components/image-gallery-picker/image-gallery-picker.component';
import { ImageGalleryPickerService } from './services/image-gallery-picker.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet, UnsavedChangesModalComponent, ImageGalleryPickerComponent],
  template: `
    <router-outlet></router-outlet>
    <app-unsaved-changes-modal
      [isOpen]="unsavedModalState.isOpen"
      [message]="unsavedModalState.message || ''"
      (leaveConfirmed)="onUnsavedLeave()"
      (stayClicked)="onUnsavedStay()">
    </app-unsaved-changes-modal>
    <app-image-gallery-picker
      [isOpen]="galleryPickerConfig !== null"
      [maxSelectable]="galleryPickerConfig?.maxSelectable ?? 3"
      [authToken]="galleryPickerConfig?.authToken ?? ''"
      (selected)="onGallerySelected($event)"
      (cancelled)="onGalleryCancelled()">
    </app-image-gallery-picker>
  `,
  styles: []
})
export class AppComponent implements OnInit, OnDestroy {
  title = 'news-adda-india';
  unsavedModalState: { isOpen: boolean; message?: string } = { isOpen: false };
  galleryPickerConfig: { maxSelectable: number; authToken: string } | null = null;
  private unsavedModalSub?: Subscription;
  private galleryPickerSub?: Subscription;

  constructor(
    private newsService: NewsService,
    private userTrackingService: UserTrackingService,
    private themeService: ThemeService,
    private unsavedChangesModal: UnsavedChangesModalService,
    private imageGalleryPicker: ImageGalleryPickerService
  ) { }

  ngOnInit() {
    this.userTrackingService.trackUser();
    this.unsavedModalSub = this.unsavedChangesModal.getState().subscribe(state => {
      this.unsavedModalState = { isOpen: state.isOpen, message: state.message };
    });
    this.galleryPickerSub = this.imageGalleryPicker.state$.subscribe(config => {
      this.galleryPickerConfig = config;
    });
  }

  ngOnDestroy() {
    this.unsavedModalSub?.unsubscribe();
    this.galleryPickerSub?.unsubscribe();
  }

  onGallerySelected(paths: string[]) {
    this.imageGalleryPicker.confirmSelected(paths);
  }

  onGalleryCancelled() {
    this.imageGalleryPicker.cancel();
  }

  onUnsavedLeave() {
    this.unsavedChangesModal.close(true);
  }

  onUnsavedStay() {
    this.unsavedChangesModal.close(false);
  }
}

