import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class UserTrackingService {
  private readonly TRACKING_KEY = 'user_tracked_today';
  private readonly API_URL = environment.apiUrl || 'http://localhost:3000';

  constructor(private http: HttpClient) {}

  /**
   * Track a new user visit and increment reader count
   * Only increments once per day per user
   */
  trackUser(): void {
    const today = new Date().toDateString();
    const lastTracked = localStorage.getItem(this.TRACKING_KEY);

    // Only track once per day
    if (lastTracked === today) {
      return;
    }

    // Mark as tracked for today
    localStorage.setItem(this.TRACKING_KEY, today);

    // Increment reader count on backend
    this.http.post(`${this.API_URL}/api/stats/increment`, {}).pipe(
      catchError(error => {
        console.error('Error tracking user:', error);
        return of(null);
      })
    ).subscribe();
  }
}

