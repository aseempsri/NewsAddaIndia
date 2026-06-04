import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

const STORAGE_KEY = 'socialscreen_news_date';

@Injectable({
  providedIn: 'root'
})
export class NewsDateFilterService {
  private readonly selectedDateSubject = new BehaviorSubject<Date>(this.loadInitialDate());
  readonly selectedDate$ = this.selectedDateSubject.asObservable();

  getSelectedDate(): Date {
    return this.startOfDay(this.selectedDateSubject.value);
  }

  /** ISO date string (YYYY-MM-DD) in IST — API returns news published on or before this day */
  toApiParam(): string {
    return this.toIsoDateStringIST(this.getSelectedDate());
  }

  getMaxDate(): Date {
    return this.parseIsoDateIST(this.toIsoDateStringIST(new Date()));
  }

  getMaxDateIso(): string {
    return this.toIsoDateStringIST(new Date());
  }

  getSelectedDateIso(): string {
    return this.toIsoDateStringIST(this.getSelectedDate());
  }

  isSelectedToday(): boolean {
    return this.getSelectedDateIso() === this.getMaxDateIso();
  }

  setDate(date: Date): void {
    const normalized = this.startOfDay(date);
    const max = this.getMaxDate();
    if (normalized.getTime() > max.getTime()) {
      return;
    }
    this.selectedDateSubject.next(normalized);
    try {
      localStorage.setItem(STORAGE_KEY, this.toIsoDateStringIST(normalized));
      Object.keys(localStorage)
        .filter((key) => key.startsWith('news_cache_'))
        .forEach((key) => localStorage.removeItem(key));
    } catch {
      // ignore quota errors
    }
  }

  resetToToday(): void {
    this.setDate(new Date());
  }

  formatDisplay(locale: string): string {
    return this.getSelectedDate().toLocaleDateString(locale, {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  }

  private loadInitialDate(): Date {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored && /^\d{4}-\d{2}-\d{2}$/.test(stored)) {
        if (stored <= this.toIsoDateStringIST(new Date())) {
          return this.parseIsoDateIST(stored);
        }
      }
    } catch {
      // ignore
    }
    return this.startOfDay(new Date());
  }

  private toIsoDateStringIST(date: Date): string {
    const parts = new Intl.DateTimeFormat('en-CA', {
      timeZone: 'Asia/Kolkata',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).formatToParts(date);
    const y = parts.find((p) => p.type === 'year')?.value ?? '1970';
    const m = parts.find((p) => p.type === 'month')?.value ?? '01';
    const d = parts.find((p) => p.type === 'day')?.value ?? '01';
    return `${y}-${m}-${d}`;
  }

  private parseIsoDateIST(iso: string): Date {
    const [y, m, d] = iso.split('-').map(Number);
    return new Date(y, m - 1, d);
  }

  private startOfDay(date: Date): Date {
    return new Date(date.getFullYear(), date.getMonth(), date.getDate());
  }
}
