import { Component, OnInit, OnDestroy, Output, EventEmitter, ViewChild, ElementRef, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { catchError } from 'rxjs/operators';
import { of } from 'rxjs';
import { environment } from '../../../environments/environment';

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
  matchStarted?: boolean;
  matchEnded?: boolean;
}

@Component({
  selector: 'app-cricket-score-widget',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="glass-card rounded-xl p-2 sm:p-3 lg:p-4 float-animation relative overflow-hidden" [style.background]="getBackgroundGradient()">
      <!-- Decorative gradient overlay -->
      <div class="absolute inset-0 opacity-10" [style.background]="getGradientOverlay()"></div>
      
      <div class="relative z-10">
        <div class="flex items-center justify-between mb-2 sm:mb-3 gap-2">
          <div class="flex items-center gap-1.5 sm:gap-2 min-w-0 flex-1">
            <svg class="w-5 h-5 sm:w-5 sm:h-5 lg:w-6 lg:h-6 text-yellow-500 dark:text-yellow-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <h3 class="font-display text-base sm:text-lg lg:text-xl font-semibold text-gray-800 dark:text-gray-100 truncate">Live Cricket</h3>
          </div>
          @if (selectedMatch && (selectedMatch.matchStarted && !selectedMatch.matchEnded)) {
            <span class="text-xs sm:text-sm lg:text-base px-2 sm:px-2.5 lg:px-3 py-1 sm:py-1.5 lg:py-2 bg-green-500/30 text-green-700 dark:text-green-300 rounded-full font-bold flex-shrink-0 animate-pulse">LIVE</span>
          } @else if (selectedMatch && selectedMatch.matchEnded) {
            <span class="text-xs sm:text-sm lg:text-base px-2 sm:px-2.5 lg:px-3 py-1 sm:py-1.5 lg:py-2 bg-gray-500/30 text-gray-700 dark:text-gray-300 rounded-full font-bold flex-shrink-0">ENDED</span>
          }
        </div>

        @if (isLoading) {
          <div class="flex items-center justify-center py-4 sm:py-5 lg:py-6">
            <div class="w-4 h-4 sm:w-5 sm:h-5 border-2 border-yellow-500 border-t-transparent rounded-full animate-spin"></div>
          </div>
        } @else if (error) {
          <div class="text-center py-2 sm:py-3">
            <p class="text-xs sm:text-sm text-red-500 font-medium">{{ error }}</p>
            <p class="text-[0.65rem] sm:text-xs text-red-400 mt-1">Unable to load matches</p>
          </div>
        } @else if (allMatches.length === 0) {
          <div class="text-center py-3 sm:py-4">
            <svg class="w-6 h-6 sm:w-8 sm:h-8 mx-auto text-gray-400 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p class="text-xs sm:text-sm text-gray-500">No matches available</p>
          </div>
        } @else {
          <!-- Match Selector Dropdown -->
          <div class="mb-2 sm:mb-3">
            <select 
              #matchSelect
              [ngModel]="selectedMatchId" 
              (ngModelChange)="onMatchChange($event)"
              [disabled]="isLoading"
              class="w-full px-2 py-1.5 sm:py-2 lg:py-2.5 text-xs sm:text-sm lg:text-base rounded-lg bg-white/90 dark:bg-gray-800/90 border-2 border-yellow-400/60 text-foreground focus:outline-none focus:border-yellow-500 focus:ring-2 focus:ring-yellow-300/50 disabled:opacity-50 disabled:cursor-not-allowed backdrop-blur-sm transition-all shadow-sm">
              @for (match of allMatches; track match.id) {
                <option [value]="match.id">{{ match.name }}</option>
              }
            </select>
          </div>

          @if (selectedMatch) {
            <div class="space-y-2 sm:space-y-2.5 lg:space-y-3">
              <!-- Match Type -->
              <div class="text-center">
                <span class="text-xs sm:text-sm lg:text-base font-bold px-3 sm:px-4 lg:px-5 py-1 sm:py-1.5 lg:py-2 rounded-full uppercase" [style.background]="getMatchTypeColor()" [style.color]="getMatchTypeTextColor()">{{ selectedMatch.matchType }}</span>
              </div>
              
              <!-- Teams and Scores -->
              <div class="space-y-2 sm:space-y-2.5">
                @for (team of selectedMatch.teams; track team; let i = $index) {
                  <div class="flex items-center justify-between p-2 sm:p-2.5 lg:p-3 rounded-lg border-2 gap-2 transition-all" [style.background]="getTeamCardColor(i)" [style.border-color]="getTeamBorderColor(i)">
                    <span class="text-sm sm:text-base lg:text-lg font-bold truncate min-w-0 flex-1" [style.color]="getTeamTextColor(i)">{{ team }}</span>
                    @if (selectedMatch.score && selectedMatch.score[i]) {
                      <div class="text-right flex-shrink-0">
                        <span class="text-base sm:text-lg lg:text-xl font-bold" [style.color]="getScoreColor(i)">
                          {{ selectedMatch.score[i].r }}/{{ selectedMatch.score[i].w }}
                        </span>
                        <span class="text-xs sm:text-sm lg:text-base ml-1 opacity-75" [style.color]="getScoreColor(i)">({{ selectedMatch.score[i].o }} ov)</span>
                      </div>
                    } @else {
                      <span class="text-xs sm:text-sm lg:text-base font-medium flex-shrink-0 opacity-70" [style.color]="getTeamTextColor(i)">Yet to bat</span>
                    }
                  </div>
                }
              </div>

              <!-- Status -->
              <div class="pt-1.5 sm:pt-2 lg:pt-3 border-t-2" [style.border-color]="getStatusBorderColor()">
                <p class="text-sm sm:text-base lg:text-lg font-semibold text-center break-words" [style.color]="getStatusColor()">{{ selectedMatch.status }}</p>
                @if (selectedMatch.venue) {
                  <p class="text-xs sm:text-sm lg:text-base text-gray-600 dark:text-gray-400 text-center mt-1.5 lg:mt-2 break-words flex items-center justify-center gap-1">
                    <span>📍</span>
                    <span>{{ selectedMatch.venue }}</span>
                  </p>
                }
              </div>
            </div>
          }
        }
      </div>
    </div>
  `,
  styles: [`
    /* Desktop/Web view - Larger fonts */
    @media (min-width: 1024px) {
      .glass-card h3 {
        font-size: 1.25rem !important;
        line-height: 1.4 !important;
      }
      .glass-card select {
        font-size: 1rem !important;
        padding: 0.625rem !important;
      }
      .glass-card span.text-base {
        font-size: 1.25rem !important;
      }
      .glass-card span.text-lg {
        font-size: 1.5rem !important;
      }
      .glass-card span.text-xl {
        font-size: 1.75rem !important;
      }
      .glass-card p.text-sm {
        font-size: 1rem !important;
      }
      .glass-card p.text-base {
        font-size: 1.125rem !important;
      }
      .glass-card p.text-lg {
        font-size: 1.25rem !important;
      }
      .glass-card svg {
        width: 1.5rem !important;
        height: 1.5rem !important;
      }
    }
    
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
      /* Match selector dropdown */
      .glass-card select {
        font-size: 0.9375rem !important;
        padding: 0.5rem !important;
      }
    }
  `]
})
export class CricketScoreWidgetComponent implements OnInit, OnDestroy, AfterViewInit {
  @Output() dataLoaded = new EventEmitter<boolean>();
  @ViewChild('matchSelect', { static: false }) matchSelectRef!: ElementRef<HTMLSelectElement>;
  allMatches: Match[] = [];
  selectedMatch: Match | null = null;
  selectedMatchId: string = '';
  isLoading = true;
  error: string | null = null;
  private refreshInterval: any;
  private isMobile = false;

  constructor(private http: HttpClient) { }

  ngOnInit() {
    // Detect mobile device
    this.isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent) || window.innerWidth <= 768;

    // Load saved match preference from localStorage
    const savedMatchId = localStorage.getItem('cricketWidgetMatchId');

    this.loadCricketScores(savedMatchId || '');

    // Refresh every 2 minutes for live scores
    this.refreshInterval = setInterval(() => {
      this.loadCricketScores(this.selectedMatchId);
    }, 2 * 60 * 1000);
  }

  ngAfterViewInit() {
    // Ensure select element closes on mobile after selection
    if (this.isMobile && this.matchSelectRef?.nativeElement) {
      const selectElement = this.matchSelectRef.nativeElement;
      selectElement.addEventListener('change', () => {
        setTimeout(() => {
          selectElement.blur();
        }, 100);
      });
    }
  }

  ngOnDestroy() {
    if (this.refreshInterval) {
      clearInterval(this.refreshInterval);
    }
  }

  loadCricketScores(savedMatchId: string = '') {
    this.isLoading = true;
    this.error = null;

    // Fetch from backend API (which gets data from database)
    // Backend service refreshes data every 2 minutes from CricAPI
    const cricketUrl = `${environment.apiUrl}/api/cricket/matches`;

    this.http.get<any>(cricketUrl).pipe(
      catchError(err => {
        console.error('Cricket API error:', err);
        this.error = 'Unable to load cricket scores';
        this.isLoading = false;
        this.dataLoaded.emit(true);
        return of(null);
      })
    ).subscribe(data => {
      if (data && data.status === 'success' && data.data && data.data.length > 0) {
        this.processCricketData(data.data, savedMatchId);
      } else {
        this.error = 'No matches available';
        this.allMatches = [];
        this.selectedMatch = null;
      }
      this.isLoading = false;
      this.dataLoaded.emit(true);
    });
  }

  processCricketData(matches: any[], savedMatchId: string = '') {
    // Process all matches
    this.allMatches = matches.map(match => ({
      id: match.id || match.unique_id,
      name: match.name || match.title,
      matchType: match.matchType || 'T20',
      status: match.status || 'Match not started',
      venue: match.venue || '',
      date: match.date || '',
      dateTimeGMT: match.dateTimeGMT || '',
      teams: match.teams || [],
      score: match.score || [],
      matchStarted: match.matchStarted || false,
      matchEnded: match.matchEnded || false
    }));

    // Select match: saved preference, or first match, or first live match
    let matchToSelect = null;

    if (savedMatchId) {
      matchToSelect = this.allMatches.find(m => m.id === savedMatchId);
    }

    if (!matchToSelect) {
      // Try to find a live match first
      matchToSelect = this.allMatches.find(m => m.matchStarted && !m.matchEnded);
    }

    if (!matchToSelect && this.allMatches.length > 0) {
      // Fallback to first match
      matchToSelect = this.allMatches[0];
    }

    if (matchToSelect) {
      this.selectedMatchId = matchToSelect.id;
      this.selectedMatch = matchToSelect;
      localStorage.setItem('cricketWidgetMatchId', matchToSelect.id);
    }
  }

  onMatchChange(matchId: string) {
    this.selectedMatchId = matchId;
    const match = this.allMatches.find(m => m.id === matchId);

    if (match) {
      this.selectedMatch = match;
      localStorage.setItem('cricketWidgetMatchId', matchId);

      // Force close dropdown on mobile after selection
      if (this.isMobile && this.matchSelectRef?.nativeElement) {
        setTimeout(() => {
          this.matchSelectRef.nativeElement.blur();
        }, 200);
      }
    }
  }

  getBackgroundGradient(): string {
    if (!this.selectedMatch) return 'linear-gradient(135deg, #fef3c7 0%, #fde68a 50%, #fcd34d 100%)';

    if (this.selectedMatch.matchStarted && !this.selectedMatch.matchEnded) {
      // Live match - green gradient
      return 'linear-gradient(135deg, #d1fae5 0%, #a7f3d0 50%, #6ee7b7 100%)';
    } else if (this.selectedMatch.matchEnded) {
      // Ended match - gray gradient
      return 'linear-gradient(135deg, #f3f4f6 0%, #e5e7eb 50%, #d1d5db 100%)';
    } else {
      // Upcoming match - yellow/orange gradient
      return 'linear-gradient(135deg, #fef3c7 0%, #fde68a 50%, #fcd34d 100%)';
    }
  }

  getGradientOverlay(): string {
    if (!this.selectedMatch) return 'radial-gradient(circle at top right, #fbbf24, transparent)';

    if (this.selectedMatch.matchStarted && !this.selectedMatch.matchEnded) {
      return 'radial-gradient(circle at top right, #10b981, transparent)';
    } else if (this.selectedMatch.matchEnded) {
      return 'radial-gradient(circle at top right, #6b7280, transparent)';
    }
    return 'radial-gradient(circle at top right, #fbbf24, transparent)';
  }

  getMatchTypeColor(): string {
    if (!this.selectedMatch) return '#fef3c7';
    const matchType = this.selectedMatch.matchType.toLowerCase();

    if (matchType.includes('t20')) return '#fef3c7'; // Yellow
    if (matchType.includes('odi')) return '#dbeafe'; // Blue
    if (matchType.includes('test')) return '#e0e7ff'; // Indigo
    return '#f3f4f6'; // Gray default
  }

  getMatchTypeTextColor(): string {
    if (!this.selectedMatch) return '#92400e';
    const matchType = this.selectedMatch.matchType.toLowerCase();

    if (matchType.includes('t20')) return '#92400e'; // Dark yellow
    if (matchType.includes('odi')) return '#1e40af'; // Dark blue
    if (matchType.includes('test')) return '#4338ca'; // Dark indigo
    return '#374151'; // Dark gray
  }

  getTeamCardColor(index: number): string {
    if (!this.selectedMatch) return '#f3f4f6';

    // Different colors for each team
    if (index === 0) {
      // First team - blue tones
      return this.selectedMatch.matchStarted && !this.selectedMatch.matchEnded
        ? 'rgba(59, 130, 246, 0.15)'
        : 'rgba(59, 130, 246, 0.1)';
    } else {
      // Second team - red/orange tones
      return this.selectedMatch.matchStarted && !this.selectedMatch.matchEnded
        ? 'rgba(239, 68, 68, 0.15)'
        : 'rgba(239, 68, 68, 0.1)';
    }
  }

  getTeamBorderColor(index: number): string {
    if (index === 0) {
      return 'rgba(59, 130, 246, 0.4)'; // Blue border
    } else {
      return 'rgba(239, 68, 68, 0.4)'; // Red border
    }
  }

  getTeamTextColor(index: number): string {
    if (index === 0) {
      return '#1e40af'; // Dark blue
    } else {
      return '#991b1b'; // Dark red
    }
  }

  getScoreColor(index: number): string {
    if (index === 0) {
      return '#2563eb'; // Blue
    } else {
      return '#dc2626'; // Red
    }
  }

  getStatusColor(): string {
    if (!this.selectedMatch) return '#6b7280';

    const status = this.selectedMatch.status.toLowerCase();

    if (this.selectedMatch.matchStarted && !this.selectedMatch.matchEnded) {
      return '#059669'; // Green for live
    } else if (this.selectedMatch.matchEnded) {
      return '#6b7280'; // Gray for ended
    } else if (status.includes('won')) {
      return '#2563eb'; // Blue for winner
    } else if (status.includes('tie') || status.includes('draw')) {
      return '#7c3aed'; // Purple for tie
    }
    return '#92400e'; // Yellow for upcoming
  }

  getStatusBorderColor(): string {
    if (!this.selectedMatch) return 'rgba(251, 191, 36, 0.3)';

    if (this.selectedMatch.matchStarted && !this.selectedMatch.matchEnded) {
      return 'rgba(16, 185, 129, 0.3)'; // Green
    } else if (this.selectedMatch.matchEnded) {
      return 'rgba(107, 114, 128, 0.3)'; // Gray
    }
    return 'rgba(251, 191, 36, 0.3)'; // Yellow
  }

}

