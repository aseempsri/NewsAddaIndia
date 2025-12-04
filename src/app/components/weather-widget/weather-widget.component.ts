import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

interface ForecastItem {
  day: string;
  temp: string;
  iconType: 'sun' | 'cloud' | 'rain';
}

@Component({
  selector: 'app-weather-widget',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="glass-card rounded-2xl p-6 float-animation">
      <div class="flex items-start justify-between mb-6">
        <div>
          <h3 class="font-display text-lg font-semibold text-foreground">Delhi</h3>
          <p class="text-sm text-muted-foreground">India</p>
        </div>
        <svg class="w-12 h-12 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4 4 0 003 15z" />
        </svg>
      </div>

      <div class="flex items-end gap-2 mb-6">
        <span class="font-display text-5xl font-bold text-foreground">21.1</span>
        <span class="text-2xl text-muted-foreground mb-1">°C</span>
      </div>

      <p class="text-muted-foreground mb-6">Haze</p>

      <div class="grid grid-cols-3 gap-4 mb-6 py-4 border-y border-border/50">
        <div class="text-center">
          <svg class="w-5 h-5 text-accent mx-auto mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
          </svg>
          <span class="text-sm font-medium">37%</span>
          <p class="text-xs text-muted-foreground">Humidity</p>
        </div>
        <div class="text-center">
          <svg class="w-5 h-5 text-accent mx-auto mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
          </svg>
          <span class="text-sm font-medium">4.1 km/h</span>
          <p class="text-xs text-muted-foreground">Wind</p>
        </div>
        <div class="text-center">
          <svg class="w-5 h-5 text-accent mx-auto mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4 4 0 003 15z" />
          </svg>
          <span class="text-sm font-medium">20%</span>
          <p class="text-xs text-muted-foreground">Clouds</p>
        </div>
      </div>

      <!-- Forecast -->
      <div class="flex justify-between">
        @for (item of forecast; track item.day) {
          <div class="text-center">
            <span class="text-xs text-muted-foreground">{{ item.day }}</span>
            <svg class="w-5 h-5 mx-auto my-2 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              @if (item.iconType === 'sun') {
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
              } @else if (item.iconType === 'cloud') {
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4 4 0 003 15z" />
              } @else if (item.iconType === 'rain') {
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4 4 0 003 15z" />
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 19v-2m4 2v-4m4 4v-2" />
              }
            </svg>
            <span class="text-sm font-medium">{{ item.temp }}</span>
          </div>
        }
      </div>
    </div>
  `,
  styles: []
})
export class WeatherWidgetComponent {
  forecast: ForecastItem[] = [
    { day: 'Thu', temp: '23°', iconType: 'sun' },
    { day: 'Fri', temp: '24°', iconType: 'cloud' },
    { day: 'Sat', temp: '25°', iconType: 'rain' },
    { day: 'Sun', temp: '26°', iconType: 'sun' },
    { day: 'Mon', temp: '27°', iconType: 'cloud' },
  ];
}

