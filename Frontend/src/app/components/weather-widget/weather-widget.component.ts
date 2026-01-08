import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { catchError } from 'rxjs/operators';
import { of } from 'rxjs';

interface ForecastItem {
  day: string;
  temp: string;
  iconType: 'sun' | 'cloud' | 'rain' | 'partly-cloudy';
}

interface WeatherData {
  city: string;
  country: string;
  temperature: number;
  description: string;
  humidity: number;
  windSpeed: number;
  cloudCover: number;
  icon: string;
  forecast: ForecastItem[];
}

@Component({
  selector: 'app-weather-widget',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="glass-card rounded-lg p-3 float-animation">
      @if (isLoading) {
        <div class="flex items-center justify-center py-4">
          <div class="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
        </div>
      } @else if (error) {
        <div class="text-center py-2">
          <p class="text-xs text-muted-foreground">{{ error }}</p>
        </div>
      } @else if (weatherData) {
        <!-- Top Row: Location and Description -->
        <div class="flex items-center justify-between mb-3">
          <div>
            <h3 class="font-display text-base font-semibold text-foreground leading-tight">{{ weatherData.city }}</h3>
            <p class="text-xs text-muted-foreground">{{ weatherData.country }}</p>
          </div>
          <p class="text-sm text-muted-foreground capitalize text-right">{{ weatherData.description }}</p>
        </div>

        <!-- Main Row: Temperature, Icon, and Stats -->
        <div class="flex items-center justify-between">
          <!-- Temperature -->
          <div class="flex items-end gap-1">
            <span class="font-display text-4xl font-bold text-foreground leading-none">{{ weatherData.temperature }}</span>
            <span class="text-xl text-muted-foreground mb-0.5">°C</span>
          </div>

          <!-- Icon and Stats -->
          <div class="flex items-center gap-3">
            <div [innerHTML]="getWeatherIcon(weatherData.icon)" class="w-10 h-10 text-accent flex-shrink-0"></div>
            
            <!-- Stats -->
            <div class="flex items-center gap-3">
              <div class="flex items-center gap-1.5">
                <svg class="w-4 h-4 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                </svg>
                <div>
                  <span class="text-sm font-semibold block leading-tight">{{ weatherData.humidity }}%</span>
                  <p class="text-xs text-muted-foreground leading-tight">Humidity</p>
                </div>
              </div>
              <div class="flex items-center gap-1.5">
                <svg class="w-4 h-4 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
                <div>
                  <span class="text-sm font-semibold block leading-tight">{{ weatherData.windSpeed }}</span>
                  <p class="text-xs text-muted-foreground leading-tight">km/h</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      }
    </div>
  `,
  styles: []
})
export class WeatherWidgetComponent implements OnInit, OnDestroy {
  weatherData: WeatherData | null = null;
  isLoading = true;
  error: string | null = null;
  private refreshInterval: any;

  // Default location: Delhi, India
  private latitude = 28.6139;
  private longitude = 77.2090;

  constructor(private http: HttpClient) {}

  ngOnInit() {
    this.loadWeather();
    // Refresh weather every 30 minutes
    this.refreshInterval = setInterval(() => {
      this.loadWeather();
    }, 30 * 60 * 1000);
  }

  ngOnDestroy() {
    if (this.refreshInterval) {
      clearInterval(this.refreshInterval);
    }
  }

  loadWeather() {
    this.isLoading = true;
    this.error = null;

    // Open-Meteo API (free, no API key required)
    const currentWeatherUrl = `https://api.open-meteo.com/v1/forecast?latitude=${this.latitude}&longitude=${this.longitude}&current=temperature_2m,relative_humidity_2m,weather_code,wind_speed_10m,cloud_cover&hourly=temperature_2m,weather_code&daily=weather_code,temperature_2m_max,temperature_2m_min&timezone=Asia/Kolkata`;

    this.http.get<any>(currentWeatherUrl).pipe(
      catchError(err => {
        console.error('Weather API error:', err);
        this.error = 'Unable to load weather data';
        this.isLoading = false;
        return of(null);
      })
    ).subscribe(data => {
      if (data) {
        this.processWeatherData(data);
      }
      this.isLoading = false;
    });
  }

  processWeatherData(data: any) {
    const current = data.current;
    const daily = data.daily;

    // Get weather description from weather code
    const weatherCode = current.weather_code;
    const description = this.getWeatherDescription(weatherCode);
    const iconType = this.getIconTypeFromCode(weatherCode);

    // Process forecast
    const forecast: ForecastItem[] = [];
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    
    for (let i = 1; i <= 5 && i < daily.time.length; i++) {
      const date = new Date(daily.time[i]);
      const dayName = days[date.getDay()];
      const maxTemp = Math.round(daily.temperature_2m_max[i]);
      const forecastCode = daily.weather_code[i];
      const forecastIconType = this.getIconTypeFromCode(forecastCode);
      
      forecast.push({
        day: dayName,
        temp: `${maxTemp}°`,
        iconType: forecastIconType
      });
    }

    this.weatherData = {
      city: 'Delhi',
      country: 'India',
      temperature: Math.round(current.temperature_2m),
      description: description,
      humidity: current.relative_humidity_2m,
      windSpeed: Math.round(current.wind_speed_10m * 3.6), // Convert m/s to km/h
      cloudCover: current.cloud_cover,
      icon: iconType,
      forecast: forecast
    };
  }

  getWeatherDescription(code: number): string {
    // WMO Weather interpretation codes (WW)
    const codes: Record<number, string> = {
      0: 'Clear sky',
      1: 'Mainly clear',
      2: 'Partly cloudy',
      3: 'Overcast',
      45: 'Foggy',
      48: 'Depositing rime fog',
      51: 'Light drizzle',
      53: 'Moderate drizzle',
      55: 'Dense drizzle',
      56: 'Light freezing drizzle',
      57: 'Dense freezing drizzle',
      61: 'Slight rain',
      63: 'Moderate rain',
      65: 'Heavy rain',
      66: 'Light freezing rain',
      67: 'Heavy freezing rain',
      71: 'Slight snow fall',
      73: 'Moderate snow fall',
      75: 'Heavy snow fall',
      77: 'Snow grains',
      80: 'Slight rain showers',
      81: 'Moderate rain showers',
      82: 'Violent rain showers',
      85: 'Slight snow showers',
      86: 'Heavy snow showers',
      95: 'Thunderstorm',
      96: 'Thunderstorm with slight hail',
      99: 'Thunderstorm with heavy hail'
    };
    return codes[code] || 'Unknown';
  }

  getIconTypeFromCode(code: number): 'sun' | 'cloud' | 'rain' | 'partly-cloudy' {
    if (code === 0 || code === 1) return 'sun';
    if (code === 2) return 'partly-cloudy';
    if (code >= 45 && code <= 48) return 'cloud';
    if (code >= 51 && code <= 67 || code >= 80 && code <= 86 || code >= 95 && code <= 99) return 'rain';
    return 'cloud';
  }

  getWeatherIcon(iconType: string): string {
    const icons: Record<string, string> = {
      'sun': '<svg class="w-10 h-10 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" /></svg>',
      'cloud': '<svg class="w-10 h-10 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4 4 0 003 15z" /></svg>',
      'rain': '<svg class="w-10 h-10 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4 4 0 003 15z" /><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 19v-2m4 2v-4m4 4v-2" /></svg>',
      'partly-cloudy': '<svg class="w-10 h-10 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4 4 0 003 15z" /><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" /></svg>'
    };
    return icons[iconType] || icons['cloud'];
  }

}
