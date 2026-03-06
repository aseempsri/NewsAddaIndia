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
  private readonly API_URL = (environment.apiUrl !== undefined && environment.apiUrl !== null && String(environment.apiUrl).trim() !== '')
    ? environment.apiUrl
    : (environment.production ? '' : 'http://localhost:3000');

  constructor(private http: HttpClient) {}

  /**
   * Track a user visit and increment reader count
   * Increments on every visit (no daily limit)
   */
  trackUser(): void {
    // Increment reader count on backend for every visit
    this.http.post(`${this.API_URL}/api/stats/increment`, {}).pipe(
      catchError(error => {
        console.error('Error tracking user:', error);
        return of(null);
      })
    ).subscribe();
  }
}

