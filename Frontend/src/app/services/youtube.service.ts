import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { environment } from '../../environments/environment';

export interface YoutubeLatestVideo {
  videoId: string;
  title: string;
  watchUrl: string;
  embedUrl: string;
  channelHandle?: string;
}

@Injectable({
  providedIn: 'root'
})
export class YoutubeService {
  private readonly backendApiUrl = (environment.apiUrl !== undefined && environment.apiUrl !== null && String(environment.apiUrl).trim() !== '')
    ? environment.apiUrl
    : (environment.production ? '' : '');

  constructor(private http: HttpClient) { }

  /**
   * Latest upload from /api/youtube/latest (YouTube Data API on server).
   * Returns null if not configured, unavailable, or on error.
   */
  getLatestVideo(): Observable<YoutubeLatestVideo | null> {
    const url = `${this.backendApiUrl}/api/youtube/latest`;
    return this.http.get<YoutubeLatestVideo>(url).pipe(
      map((body) => {
        if (!body?.videoId || !/^[\w-]{11}$/.test(body.videoId)) {
          return null;
        }
        return body;
      }),
      catchError(() => of(null))
    );
  }
}
