import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet } from '@angular/router';
import { NewsService } from './services/news.service';
import { UserTrackingService } from './services/user-tracking.service';
import { ThemeService } from './services/theme.service';
import { UnsavedChangesModalComponent } from './components/unsaved-changes-modal/unsaved-changes-modal.component';
import { UnsavedChangesModalService } from './services/unsaved-changes-modal.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet, UnsavedChangesModalComponent],
  template: `
    <router-outlet></router-outlet>
    <app-unsaved-changes-modal
      [isOpen]="unsavedModalState.isOpen"
      [message]="unsavedModalState.message || ''"
      (leaveConfirmed)="onUnsavedLeave()"
      (stayClicked)="onUnsavedStay()">
    </app-unsaved-changes-modal>
  `,
  styles: []
})
export class AppComponent implements OnInit, OnDestroy {
  title = 'news-adda-india';
  unsavedModalState: { isOpen: boolean; message?: string } = { isOpen: false };
  private unsavedModalSub?: Subscription;

  constructor(
    private newsService: NewsService,
    private userTrackingService: UserTrackingService,
    private themeService: ThemeService,
    private unsavedChangesModal: UnsavedChangesModalService
  ) { }

  ngOnInit() {
    this.userTrackingService.trackUser();
    this.unsavedModalSub = this.unsavedChangesModal.getState().subscribe(state => {
      this.unsavedModalState = { isOpen: state.isOpen, message: state.message };
    });
  }

  ngOnDestroy() {
    this.unsavedModalSub?.unsubscribe();
  }

  onUnsavedLeave() {
    this.unsavedChangesModal.close(true);
  }

  onUnsavedStay() {
    this.unsavedChangesModal.close(false);
  }
}

