import { inject } from '@angular/core';
import { CanDeactivateFn } from '@angular/router';
import { UnsavedChangesModalService } from '../services/unsaved-changes-modal.service';

export interface CanDeactivate {
  canDeactivate(): boolean;
}

const WARNING_MESSAGE = 'You have unsaved changes. If you leave or reload now, your work will be lost. Are you sure you want to leave?';

export const canDeactivateGuard: CanDeactivateFn<CanDeactivate> = (component, _currentRoute, _currentState, nextState) => {
  if (!component?.canDeactivate?.()) {
    const modalService = inject(UnsavedChangesModalService);
    const nextUrl = nextState?.url ?? '/admin';
    return new Promise<boolean>((resolve) => {
      modalService.show(WARNING_MESSAGE, nextUrl).then((leave) => {
        resolve(leave);
      });
    });
  }
  return true;
};
