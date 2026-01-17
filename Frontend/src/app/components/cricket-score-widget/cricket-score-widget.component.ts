import { Component, OnInit, OnDestroy, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { catchError } from 'rxjs/operators';
import { of } from 'rxjs';

interface Match {
  id: string;
  name: string;
  matchType: string;
  status: string;
  venue: string;
  date: string;
  dateTimeGMT: string;
  teams: string[];
  score: Array<{
    r: number;
    w: number;
    o: number;
    inning: string;
  }>;
}

@Component({
  selector: 'app-cricket-score-widget',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="glass-card rounded-xl p-2 sm:p-3 lg:p-4 float-animation">
      <div class="flex items-center justify-between mb-2 sm:mb-3 lg:mb-4 gap-2">
        <div class="flex items-center gap-1.5 sm:gap-2 min-w-0 flex-1">
          <svg class="w-5 h-5 sm:w-5 sm:h-5 text-primary flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <h3 class="font-display text-base sm:text-base font-semibold truncate">Live Cricket</h3>
        </div>
        <span class="text-xs sm:text-xs px-1.5 sm:px-2 py-0.5 sm:py-1 bg-green-500/20 text-green-500 rounded-full font-semibold flex-shrink-0">LIVE</span>
      </div>

      @if (isLoading) {
        <div class="flex items-center justify-center py-4 sm:py-5 lg:py-6">
          <div class="w-4 h-4 sm:w-5 sm:h-5 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
        </div>
      } @else if (error) {
        <div class="text-center py-2 sm:py-3">
          <p class="text-xs sm:text-sm text-muted-foreground">{{ error }}</p>
          <p class="text-[0.65rem] sm:text-xs text-muted-foreground mt-1">No live matches at the moment</p>
        </div>
      } @else if (liveMatches.length === 0) {
        <div class="text-center py-3 sm:py-4">
          <svg class="w-6 h-6 sm:w-8 sm:h-8 mx-auto text-muted-foreground mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p class="text-xs sm:text-sm text-muted-foreground">No live matches</p>
        </div>
      } @else {
        <div>
          @for (match of liveMatches.slice(0, 1); track match.id) {
            <div class="space-y-2 sm:space-y-2.5 lg:space-y-3">
              <!-- Match Type -->
              <div class="text-center">
                <span class="text-xs sm:text-xs font-semibold text-primary uppercase">{{ match.matchType }}</span>
              </div>
              
              <!-- Teams and Scores -->
              <div class="space-y-2 sm:space-y-2.5">
                @for (team of match.teams; track team; let i = $index) {
                  <div class="flex items-center justify-between p-1.5 sm:p-2 rounded-lg bg-secondary/30 border border-border/50 gap-2">
                    <span class="text-sm sm:text-sm font-semibold text-foreground truncate min-w-0 flex-1">{{ team }}</span>
                    @if (match.score && match.score[i]) {
                      <div class="text-right flex-shrink-0">
                        <span class="text-base sm:text-base font-bold text-foreground">
                          {{ match.score[i].r }}/{{ match.score[i].w }}
                        </span>
                        <span class="text-xs sm:text-xs text-muted-foreground ml-1">({{ match.score[i].o }} ov)</span>
                      </div>
                    } @else {
                      <span class="text-xs sm:text-xs text-muted-foreground font-medium flex-shrink-0">Yet to bat</span>
                    }
                  </div>
                }
              </div>

              <!-- Status -->
              <div class="pt-1.5 sm:pt-2 border-t border-border/50">
                <p class="text-sm sm:text-sm text-muted-foreground text-center break-words">{{ match.status }}</p>
                @if (match.venue) {
                  <p class="text-xs sm:text-xs text-muted-foreground text-center mt-1 break-words">📍 {{ match.venue }}</p>
                }
              </div>
            </div>
          }
        </div>
      }
    </div>
  `,
  styles: [`
    @media (max-width: 640px) {
      :host {
        display: block !important;
        width: 100% !important;
        max-width: 100% !important;
        margin: 0 !important;
        padding: 0 !important;
        box-sizing: border-box !important;
      }
      .glass-card {
        width: 100% !important;
        max-width: 100% !important;
        min-width: 0 !important;
        box-sizing: border-box !important;
        padding: 0.75rem !important;
        margin: 0 !important;
      }
      .glass-card * {
        max-width: 100% !important;
        box-sizing: border-box !important;
      }
      /* Force larger fonts for all text elements on mobile - matching panchang */
      .glass-card p,
      .glass-card span:not(.text-xl):not(.text-lg) {
        font-size: 1rem !important;
        line-height: 1.3 !important;
      }
      .glass-card .flex {
        flex-wrap: wrap !important;
        gap: 0.5rem !important;
      }
      /* Title (h3) - matching panchang h3 */
      .glass-card h3 {
        font-size: 1rem !important;
        line-height: 1.3 !important;
      }
      /* LIVE badge */
      .glass-card span.text-xs:first-of-type {
        font-size: 0.9375rem !important;
        line-height: 1.2 !important;
      }
      /* Match type */
      .glass-card > div > div > div > div > span.text-xs {
        font-size: 0.9375rem !important;
        line-height: 1.3 !important;
      }
      /* Team names */
      .glass-card span.text-sm:first-child {
        font-size: 1.0625rem !important;
        line-height: 1.3 !important;
      }
      /* Scores */
      .glass-card span.text-base {
        font-size: 1.125rem !important;
        line-height: 1.3 !important;
      }
      /* Overs and "Yet to bat" */
      .glass-card span.text-xs:not(:first-of-type) {
        font-size: 0.9375rem !important;
        line-height: 1.2 !important;
      }
      /* Status text */
      .glass-card p.text-sm {
        font-size: 1rem !important;
        line-height: 1.3 !important;
      }
      /* Venue */
      .glass-card p.text-xs:last-child {
        font-size: 0.9375rem !important;
        line-height: 1.2 !important;
      }
      /* Icons */
      .glass-card svg {
        width: 1.25rem !important;
        height: 1.25rem !important;
      }
    }
  `]
})
export class CricketScoreWidgetComponent implements OnInit, OnDestroy {
  @Output() dataLoaded = new EventEmitter<boolean>();
  liveMatches: Match[] = [];
  isLoading = true;
  error: string | null = null;
  private refreshInterval: any;

  constructor(private http: HttpClient) {}

  ngOnInit() {
    this.loadCricketScores();
    // Refresh every 2 minutes for live scores
    this.refreshInterval = setInterval(() => {
      this.loadCricketScores();
    }, 2 * 60 * 1000);
  }

  ngOnDestroy() {
    if (this.refreshInterval) {
      clearInterval(this.refreshInterval);
    }
  }

  loadCricketScores() {
    this.isLoading = true;
    this.error = null;

    // Using free cricket API - CricAPI (requires free API key from https://cricapi.com/)
    // Alternative: Use backend proxy to avoid CORS and API key exposure
    // For now, using sample data - configure API key in environment or backend
    
    // Option 1: Use backend proxy (recommended)
    // const cricketUrl = `${environment.apiUrl}/api/cricket/live`;
    
    // Option 2: Direct API call (requires API key in environment)
    // const apiKey = environment.cricketApiKey || 'YOUR_API_KEY';
    // const cricketUrl = `https://api.cricapi.com/v1/currentMatches?apikey=${apiKey}&offset=0`;
    
    // For now, using sample data until API is configured
    setTimeout(() => {
      this.loadSampleData();
      this.isLoading = false;
      this.dataLoaded.emit(true);
    }, 500);
    
    // Uncomment below when API is configured:
    /*
    this.http.get<any>(cricketUrl).pipe(
      catchError(err => {
        console.error('Cricket API error:', err);
        this.loadSampleData();
        return of(null);
      })
    ).subscribe(data => {
      if (data && data.data && data.data.length > 0) {
        this.processCricketData(data.data);
      } else {
        this.loadSampleData();
      }
      this.isLoading = false;
    });
    */
  }

  processCricketData(matches: any[]) {
    this.liveMatches = matches
      .filter(match => match.matchStarted && !match.matchEnded)
      .slice(0, 1)
      .map(match => ({
        id: match.id || match.unique_id,
        name: match.name || match.title,
        matchType: match.matchType || 'T20',
        status: match.status || 'Live',
        venue: match.venue || '',
        date: match.date || '',
        dateTimeGMT: match.dateTimeGMT || '',
        teams: match.teams || [],
        score: match.score || []
      }));
  }

  loadSampleData() {
    // Sample data when API is not available
    this.liveMatches = [
      {
        id: '1',
        name: 'India vs Australia',
        matchType: 'ODI',
        status: 'India need 45 runs in 30 balls',
        venue: 'Wankhede Stadium, Mumbai',
        date: new Date().toISOString(),
        dateTimeGMT: '',
        teams: ['India', 'Australia'],
        score: [
          { r: 245, w: 3, o: 45, inning: '1' },
          { r: 201, w: 2, o: 40, inning: '2' }
        ]
      },
      {
        id: '2',
        name: 'Mumbai Indians vs Chennai Super Kings',
        matchType: 'T20',
        status: 'CSK batting - 120/4 in 15 overs',
        venue: 'Wankhede Stadium, Mumbai',
        date: new Date().toISOString(),
        dateTimeGMT: '',
        teams: ['Mumbai Indians', 'Chennai Super Kings'],
        score: [
          { r: 180, w: 5, o: 20, inning: '1' },
          { r: 120, w: 4, o: 15, inning: '2' }
        ]
      }
    ];
    // Don't show error for sample data - it's acceptable fallback
  }
}

