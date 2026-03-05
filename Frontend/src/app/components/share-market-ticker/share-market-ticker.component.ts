import { Component, OnInit, AfterViewInit, ElementRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { ViewEncapsulation } from '@angular/core';

export interface MarketIndex {
  name: string;
  value: number;
  change: number;
  changePercent: number;
}

const FALLBACK_INDICES: MarketIndex[] = [
  { name: 'Sensex', value: 80015, change: 899.71, changePercent: 1.14 },
  { name: 'Nifty 50', value: 24765, change: 287, changePercent: 1.17 },
  { name: 'Nifty Bank', value: 52500, change: 450, changePercent: 0.86 },
  { name: 'Nifty IT', value: 38500, change: 200, changePercent: 0.52 },
  { name: 'Nifty Auto', value: 24500, change: 180, changePercent: 0.74 },
  { name: 'Nifty Pharma', value: 20200, change: -30, changePercent: -0.15 },
  { name: 'Nifty FMCG', value: 59500, change: 220, changePercent: 0.37 },
  { name: 'Nifty Midcap', value: 54800, change: 350, changePercent: 0.64 }
];

@Component({
  selector: 'app-share-market-ticker',
  standalone: true,
  imports: [CommonModule],
  encapsulation: ViewEncapsulation.None,
  template: `
    <div class="market-ticker-bar bg-gradient-to-r from-primary/20 via-accent/15 to-primary/20 dark:from-primary/25 dark:via-accent/20 dark:to-primary/25 border-y border-primary/40 dark:border-primary/50 overflow-hidden w-full max-w-full shadow-md">
      <div class="w-full max-w-full overflow-hidden">
        <div class="flex items-center py-1 md:py-2 overflow-hidden">
          <!-- Label - 30% thinner -->
          <div class="flex items-center justify-center gap-0.5 md:gap-1.5 md:border-r-2 md:border-primary/60 shrink-0 bg-gradient-to-r from-primary to-accent px-1.5 md:pl-3 md:pr-3.5 py-0.5 md:py-1.5 md:rounded-r-md md:shadow-lg w-auto overflow-hidden">
            <svg class="w-2.5 h-2.5 md:w-3.5 md:h-3.5 text-primary-foreground flex-shrink-0 drop-shadow-sm" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
            </svg>
            <span class="text-[9px] md:text-[10px] font-black text-primary-foreground uppercase whitespace-nowrap drop-shadow-sm" style="font-family: 'Arial Black', 'Helvetica Neue', sans-serif; letter-spacing: 0.04em; text-shadow: 1px 1px 2px rgba(0,0,0,0.2);">
              Markets
            </span>
          </div>

          <!-- Scrolling indices -->
          <div class="overflow-hidden flex-1 min-w-0 py-0 md:py-0.5 md:ml-3 pr-3 md:pr-0 w-[85%] md:w-auto">
            @if (loading) {
              <div class="text-[10px] md:text-xs text-muted-foreground font-medium">Loading market data...</div>
            } @else if (indices.length === 0) {
              <div class="text-[10px] md:text-xs text-muted-foreground font-medium">Market data unavailable</div>
            } @else {
              <div #tickerContainer class="market-ticker-scroll flex gap-2 md:gap-4 whitespace-nowrap items-center" style="will-change: transform;">
                @for (item of displayIndices; track item.name + $index) {
                  <div class="market-index-item group flex-shrink-0 flex items-center gap-1.5 md:gap-2 px-2 md:px-3 py-1 md:py-1.5 rounded-md md:rounded-lg bg-background/80 dark:bg-card/90 border border-primary/30 dark:border-primary/40 backdrop-blur-sm shadow-sm hover:shadow-md hover:border-primary/50 dark:hover:border-primary/50 transition-all duration-300">
                    <span class="text-[10px] md:text-xs font-semibold text-foreground">{{ item.name }}</span>
                    <span class="text-[10px] md:text-xs font-bold tabular-nums text-foreground">{{ formatValue(item.value) }}</span>
                    <span [class]="'market-change ' + (item.change >= 0 ? 'market-change-up' : 'market-change-down') + ' text-[10px] md:text-xs font-semibold tabular-nums'">
                      {{ item.change >= 0 ? '↑' : '↓' }} {{ item.change >= 0 ? '+' : '' }}{{ item.change.toFixed(2) }} ({{ item.change >= 0 ? '+' : '' }}{{ item.changePercent.toFixed(2) }}%)
                    </span>
                  </div>
                }
              </div>
            }
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .market-ticker-bar {
      color: hsl(var(--foreground));
    }
    .market-change-up {
      color: hsl(var(--accent));
    }
    .market-change-down {
      color: hsl(var(--destructive));
    }
    .market-ticker-scroll {
      display: inline-flex;
      animation: market-ticker-scroll 49s linear infinite;
      will-change: transform;
      backface-visibility: hidden;
      transform: translateZ(0);
      -webkit-transform: translateZ(0);
      -webkit-font-smoothing: antialiased;
    }
    @keyframes market-ticker-scroll {
      0% { transform: translateX(0) translateZ(0); }
      100% { transform: translateX(-50%) translateZ(0); }
    }
    .market-index-item {
      min-width: fit-content;
    }
    @media (prefers-reduced-motion: no-preference) {
      .market-ticker-scroll {
        animation: market-ticker-scroll 49s linear infinite;
      }
    }
  `]
})
export class ShareMarketTickerComponent implements OnInit, AfterViewInit {
  @ViewChild('tickerContainer') tickerContainer!: ElementRef<HTMLDivElement>;
  indices: MarketIndex[] = [];
  displayIndices: MarketIndex[] = [];
  loading = true;

  private apiBase = (environment.apiUrl !== undefined && environment.apiUrl !== null && String(environment.apiUrl).trim() !== '')
    ? environment.apiUrl.replace(/\/$/, '')
    : (environment.production ? '' : 'http://localhost:3000');

  constructor(private http: HttpClient) {}

  ngOnInit() {
    this.loadMarketData();
  }

  ngAfterViewInit() {
    setTimeout(() => this.ensureAnimation(), 500);
  }

  private get marketUrl(): string {
    return this.apiBase ? `${this.apiBase}/api/market` : '/api/market';
  }

  loadMarketData() {
    this.http.get<{ success: boolean; data: MarketIndex[] }>(this.marketUrl).subscribe({
      next: (res) => {
        const data = (res?.success && res?.data?.length) ? res.data : FALLBACK_INDICES;
        this.indices = data;
        this.displayIndices = [...this.indices, ...this.indices];
        setTimeout(() => this.ensureAnimation(), 100);
        this.loading = false;
      },
      error: () => {
        this.indices = FALLBACK_INDICES;
        this.displayIndices = [...this.indices, ...this.indices];
        setTimeout(() => this.ensureAnimation(), 100);
        this.loading = false;
      }
    });
  }

  formatValue(n: number): string {
    if (n >= 1000) return n.toLocaleString('en-IN', { maximumFractionDigits: 0 });
    return n.toFixed(2);
  }

  ensureAnimation() {
    const el = this.tickerContainer?.nativeElement;
    if (!el || this.indices.length === 0) return;
    const style = window.getComputedStyle(el);
    if (!style.animation || style.animation === 'none') {
      el.style.animation = 'market-ticker-scroll 49s linear infinite';
      el.style.willChange = 'transform';
    }
  }
}
