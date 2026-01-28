import { Component, OnInit, OnDestroy, AfterViewInit, Output, EventEmitter, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
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

interface IndianCity {
  name: string;
  latitude: number;
  longitude: number;
}

@Component({
  selector: 'app-weather-widget',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="glass-card rounded-lg p-2 sm:p-3 float-animation relative overflow-hidden" [style.background]="getBackgroundGradient()">
      <!-- Decorative gradient overlay -->
      <div class="absolute inset-0 opacity-10" [style.background]="getGradientOverlay()"></div>
      
      <div class="relative z-10">
        <!-- City Selector - Always visible -->
        <div class="mb-1.5 sm:mb-2">
          <select 
            #citySelect
            [ngModel]="selectedCityName" 
            (ngModelChange)="onCityChange($event)"
            (blur)="onSelectBlur()"
            [disabled]="isLoading"
            class="w-full px-2 py-1.5 sm:py-2 text-sm sm:text-base rounded-lg bg-white/80 dark:bg-gray-800/80 border-2 border-blue-400/50 text-foreground focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-300/50 disabled:opacity-50 disabled:cursor-not-allowed backdrop-blur-sm transition-all">
            @for (city of indianCities; track city.name) {
              <option [value]="city.name">{{ city.name }}</option>
            }
          </select>
        </div>

        @if (isLoading) {
          <div class="flex items-center justify-center py-2 sm:py-3">
            <div class="w-4 h-4 sm:w-5 sm:h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
          </div>
        } @else if (error) {
          <div class="text-center py-2">
            <p class="text-sm sm:text-base text-red-500 font-medium">{{ error }}</p>
          </div>
        } @else if (weatherData) {

          <!-- Top Row: Location and Description -->
          <div class="flex items-center justify-between mb-1 sm:mb-1.5 gap-2">
            <div class="min-w-0 flex-1">
              <h3 class="font-display text-lg sm:text-xl font-semibold text-gray-800 dark:text-gray-100 leading-tight truncate">{{ weatherData.city }}</h3>
              <p class="text-sm sm:text-base text-gray-600 dark:text-gray-300 truncate">{{ weatherData.country }}</p>
            </div>
            <p class="text-sm sm:text-base font-medium capitalize text-right flex-shrink-0 ml-2" [style.color]="getDescriptionColor()">{{ weatherData.description }}</p>
          </div>

          <!-- Main Row: Temperature, Icon, and Stats -->
          <div class="flex items-center justify-between gap-2 sm:gap-2.5">
            <!-- Temperature -->
            <div class="flex items-end gap-0.5 sm:gap-1 flex-shrink-0">
              <span class="font-display text-4xl sm:text-5xl lg:text-6xl font-bold leading-none transition-colors" [style.color]="getTemperatureColor()">{{ weatherData.temperature }}</span>
              <span class="text-xl sm:text-2xl lg:text-3xl text-gray-600 dark:text-gray-400 mb-0.5">°C</span>
            </div>

            <!-- Icon and Stats -->
            <div class="flex items-center gap-1.5 sm:gap-2 min-w-0 flex-1 justify-end">
              <div [innerHTML]="getWeatherIcon(weatherData.icon)" class="flex-shrink-0 weather-icon-container"></div>
              
              <!-- Stats -->
              <div class="flex items-center gap-1.5 sm:gap-2">
                <div class="flex items-center gap-1 sm:gap-1.5 bg-blue-50 dark:bg-blue-900/30 px-2 py-1 rounded-lg">
                  <svg class="w-5 h-5 sm:w-6 sm:h-6 text-blue-500 dark:text-blue-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                  </svg>
                  <div class="min-w-0">
                    <span class="text-base sm:text-lg font-semibold block leading-tight text-blue-600 dark:text-blue-400">{{ weatherData.humidity }}%</span>
                    <p class="text-xs sm:text-sm text-blue-500 dark:text-blue-400/80 leading-tight">Humidity</p>
                  </div>
                </div>
                <div class="flex items-center gap-1 sm:gap-1.5 bg-green-50 dark:bg-green-900/30 px-2 py-1 rounded-lg">
                  <svg class="w-5 h-5 sm:w-6 sm:h-6 text-green-500 dark:text-green-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                  <div class="min-w-0">
                    <span class="text-base sm:text-lg font-semibold block leading-tight text-green-600 dark:text-green-400">{{ weatherData.windSpeed }}</span>
                    <p class="text-xs sm:text-sm text-green-500 dark:text-green-400/80 leading-tight">km/h</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        }
      </div>
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
      /* City name (h3) - larger on mobile */
      .glass-card h3 {
        font-size: 1.125rem !important;
        line-height: 1.3 !important;
      }
      /* Country and description text */
      .glass-card p.text-sm {
        font-size: 0.9375rem !important;
        line-height: 1.3 !important;
      }
      .glass-card p.text-base {
        font-size: 1rem !important;
        line-height: 1.3 !important;
      }
      /* Temperature - larger for prominence */
      .glass-card .text-4xl {
        font-size: 2rem !important;
        line-height: 1.1 !important;
      }
      /* Temperature unit (°C) */
      .glass-card .text-xl {
        font-size: 1.25rem !important;
        line-height: 1.2 !important;
      }
      .glass-card .text-2xl {
        font-size: 1.5rem !important;
        line-height: 1.2 !important;
      }
      /* Stats labels (Humidity, km/h) */
      .glass-card p.text-xs {
        font-size: 0.75rem !important;
        line-height: 1.2 !important;
      }
      /* Stats values (humidity %, wind speed) */
      .glass-card span.text-base {
        font-size: 1rem !important;
        line-height: 1.3 !important;
      }
      /* Weather icon */
      .glass-card .weather-icon-container svg {
        width: 2rem !important;
        height: 2rem !important;
      }
      /* Stats icons */
      .glass-card svg.w-5 {
        width: 1.25rem !important;
        height: 1.25rem !important;
      }
      /* City selector dropdown */
      .glass-card select {
        font-size: 0.9375rem !important;
        padding: 0.5rem !important;
      }
    }
  `]
})
export class WeatherWidgetComponent implements OnInit, OnDestroy, AfterViewInit {
  @Output() dataLoaded = new EventEmitter<boolean>();
  @ViewChild('citySelect', { static: false }) citySelectRef!: ElementRef<HTMLSelectElement>;
  weatherData: WeatherData | null = null;
  isLoading = true;
  error: string | null = null;
  private refreshInterval: any;
  private isMobile = false;

  // Indian cities with coordinates
  indianCities: IndianCity[] = [
    { name: 'Delhi', latitude: 28.6139, longitude: 77.2090 },
    { name: 'Mumbai', latitude: 19.0760, longitude: 72.8777 },
    { name: 'Bangalore', latitude: 12.9716, longitude: 77.5946 },
    { name: 'Kolkata', latitude: 22.5726, longitude: 88.3639 },
    { name: 'Chennai', latitude: 13.0827, longitude: 80.2707 },
    { name: 'Hyderabad', latitude: 17.3850, longitude: 78.4867 },
    { name: 'Pune', latitude: 18.5204, longitude: 73.8567 },
    { name: 'Ahmedabad', latitude: 23.0225, longitude: 72.5714 },
    { name: 'Jaipur', latitude: 26.9124, longitude: 75.7873 },
    { name: 'Surat', latitude: 21.1702, longitude: 72.8311 },
    { name: 'Lucknow', latitude: 26.8467, longitude: 80.9462 },
    { name: 'Kanpur', latitude: 26.4499, longitude: 80.3319 },
    { name: 'Agra', latitude: 27.1767, longitude: 78.0081 },
    { name: 'Varanasi', latitude: 25.3176, longitude: 82.9739 },
    { name: 'Meerut', latitude: 28.9845, longitude: 77.7064 },
    { name: 'Ghaziabad', latitude: 28.6692, longitude: 77.4538 },
    { name: 'Prayagraj', latitude: 25.4358, longitude: 81.8463 },
    { name: 'Noida', latitude: 28.5355, longitude: 77.3910 },
    { name: 'Bareilly', latitude: 28.3670, longitude: 79.4304 },
    { name: 'Aligarh', latitude: 27.8974, longitude: 78.0880 },
    { name: 'Moradabad', latitude: 28.8389, longitude: 78.7768 },
    { name: 'Gorakhpur', latitude: 26.7588, longitude: 83.3697 },
    { name: 'Jhansi', latitude: 25.4484, longitude: 78.5685 },
    { name: 'Mathura', latitude: 27.4924, longitude: 77.6737 },
    { name: 'Firozabad', latitude: 27.1590, longitude: 78.3958 },
    { name: 'Saharanpur', latitude: 29.9670, longitude: 77.5500 },
    { name: 'Muzaffarnagar', latitude: 29.4709, longitude: 77.7033 },
    { name: 'Ayodhya', latitude: 26.7922, longitude: 82.1943 },
    { name: 'Etawah', latitude: 26.7855, longitude: 79.0214 },
    { name: 'Sitapur', latitude: 27.5615, longitude: 80.6826 },
    { name: 'Shahjahanpur', latitude: 27.8814, longitude: 79.9108 },
    { name: 'Rampur', latitude: 28.8006, longitude: 79.0264 },
    { name: 'Banda', latitude: 25.4776, longitude: 80.3319 },
    { name: 'Pilibhit', latitude: 28.6312, longitude: 79.8044 },
    { name: 'Bahraich', latitude: 27.5742, longitude: 81.5942 },
    { name: 'Orai', latitude: 25.9898, longitude: 79.4500 },
    { name: 'Nagpur', latitude: 21.1458, longitude: 79.0882 },
    { name: 'Indore', latitude: 22.7196, longitude: 75.8577 },
    { name: 'Thane', latitude: 19.2183, longitude: 72.9781 },
    { name: 'Bhopal', latitude: 23.2599, longitude: 77.4126 },
    { name: 'Visakhapatnam', latitude: 17.6868, longitude: 83.2185 },
    { name: 'Patna', latitude: 25.5941, longitude: 85.1376 },
    { name: 'Vadodara', latitude: 22.3072, longitude: 73.1812 },
    { name: 'Ludhiana', latitude: 30.9010, longitude: 75.8573 },
    { name: 'Nashik', latitude: 19.9975, longitude: 73.7898 },
    { name: 'Faridabad', latitude: 28.4089, longitude: 77.3178 },
    { name: 'Rajkot', latitude: 22.3039, longitude: 70.8022 },
    { name: 'Srinagar', latitude: 34.0837, longitude: 74.7973 },
    { name: 'Amritsar', latitude: 31.6340, longitude: 74.8723 },
    { name: 'Chandigarh', latitude: 30.7333, longitude: 76.7794 },
    { name: 'Kochi', latitude: 9.9312, longitude: 76.2673 },
    { name: 'Coimbatore', latitude: 11.0168, longitude: 76.9558 },
    { name: 'Goa', latitude: 15.2993, longitude: 74.1240 },
    { name: 'Shimla', latitude: 31.1048, longitude: 77.1734 },
    { name: 'Dehradun', latitude: 30.3165, longitude: 78.0322 }
  ];

  selectedCityName: string = 'Delhi';
  private latitude = 28.6139;
  private longitude = 77.2090;

  constructor(private http: HttpClient) {}

  ngOnInit() {
    // Detect mobile device
    this.isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent) || window.innerWidth <= 768;
    
    // Load saved city preference from localStorage
    const savedCity = localStorage.getItem('weatherWidgetCity');
    if (savedCity) {
      const city = this.indianCities.find(c => c.name === savedCity);
      if (city) {
        this.selectedCityName = city.name;
        this.latitude = city.latitude;
        this.longitude = city.longitude;
      }
    }
    
    this.loadWeather();
    // Refresh weather every 30 minutes
    this.refreshInterval = setInterval(() => {
      this.loadWeather();
    }, 30 * 60 * 1000);
  }

  ngAfterViewInit() {
    // Ensure select element is available and add mobile-specific handling
    if (this.isMobile && this.citySelectRef?.nativeElement) {
      const selectElement = this.citySelectRef.nativeElement;
      
      // Add click handler to force close after selection on mobile
      selectElement.addEventListener('change', () => {
        setTimeout(() => {
          selectElement.blur();
        }, 100);
      });
    }
  }

  onCityChange(newCityName: string) {
    // Update the selected city name
    this.selectedCityName = newCityName;
    
    const selectedCity = this.indianCities.find(c => c.name === newCityName);
    if (selectedCity) {
      this.latitude = selectedCity.latitude;
      this.longitude = selectedCity.longitude;
      // Save preference to localStorage
      localStorage.setItem('weatherWidgetCity', selectedCity.name);
      // Reload weather for new city
      this.loadWeather();
      
      // Force close dropdown on mobile after selection
      if (this.isMobile && this.citySelectRef?.nativeElement) {
        // Use setTimeout to ensure the native picker closes
        setTimeout(() => {
          const selectElement = this.citySelectRef.nativeElement;
          if (selectElement) {
            selectElement.blur();
          }
        }, 200);
      }
    }
  }

  onSelectBlur() {
    // Ensure dropdown closes on mobile
    if (this.isMobile && this.citySelectRef?.nativeElement) {
      this.citySelectRef.nativeElement.blur();
    }
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
        this.dataLoaded.emit(true);
        return of(null);
      })
    ).subscribe(data => {
      if (data) {
        this.processWeatherData(data);
      }
      this.isLoading = false;
      this.dataLoaded.emit(true);
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
      city: this.selectedCityName,
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
    const iconColors: Record<string, string> = {
      'sun': 'text-yellow-500 dark:text-yellow-400',
      'cloud': 'text-gray-600 dark:text-gray-300',
      'rain': 'text-cyan-600 dark:text-cyan-400',
      'partly-cloudy': 'text-cyan-500 dark:text-cyan-400'
    };
    const color = iconColors[iconType] || 'text-gray-600 dark:text-gray-300';
    
    const icons: Record<string, string> = {
      'sun': `<svg class="w-8 h-8 sm:w-10 sm:h-10 lg:w-12 lg:h-12 ${color}" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" /></svg>`,
      'cloud': `<svg class="w-8 h-8 sm:w-10 sm:h-10 lg:w-12 lg:h-12 ${color}" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4 4 0 003 15z" /></svg>`,
      'rain': `<svg class="w-8 h-8 sm:w-10 sm:h-10 lg:w-12 lg:h-12 ${color}" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4 4 0 003 15z" /><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 19v-2m4 2v-4m4 4v-2" /></svg>`,
      'partly-cloudy': `<svg class="w-8 h-8 sm:w-10 sm:h-10 lg:w-12 lg:h-12 ${color}" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4 4 0 003 15z" /><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" /></svg>`
    };
    return icons[iconType] || icons['cloud'];
  }

  getTemperatureColor(): string {
    const isDark = this.isDarkMode();
    if (!this.weatherData) return isDark ? '#22d3ee' : '#0e7490'; // Cyan
    const temp = this.weatherData.temperature;
    // Use cyan/purple theme for weather widget
    if (temp >= 35) return isDark ? '#fca5a5' : '#dc2626'; // Red
    if (temp >= 30) return isDark ? '#fb923c' : '#ea580c'; // Orange
    if (temp >= 25) return isDark ? '#fcd34d' : '#f59e0b'; // Amber
    if (temp >= 20) return isDark ? '#22d3ee' : '#06b6d4'; // Cyan
    if (temp >= 15) return isDark ? '#06b6d4' : '#0891b2'; // Darker cyan
    if (temp >= 10) return isDark ? '#a78bfa' : '#7c3aed'; // Purple
    return isDark ? '#818cf8' : '#6366f1'; // Indigo
  }

  getDescriptionColor(): string {
    const isDark = this.isDarkMode();
    if (!this.weatherData) return isDark ? '#22d3ee' : '#0891b2'; // Cyan
    const desc = this.weatherData.description.toLowerCase();
    // Use cyan/purple theme
    if (desc.includes('rain') || desc.includes('drizzle') || desc.includes('shower')) return isDark ? '#22d3ee' : '#0891b2'; // Cyan
    if (desc.includes('cloud') || desc.includes('overcast')) return isDark ? '#a78bfa' : '#7c3aed'; // Purple
    if (desc.includes('clear') || desc.includes('sun')) return isDark ? '#fcd34d' : '#f59e0b'; // Amber
    if (desc.includes('thunder') || desc.includes('storm')) return isDark ? '#818cf8' : '#6366f1'; // Indigo
    if (desc.includes('fog')) return isDark ? '#67e8f9' : '#06b6d4'; // Light cyan
    return isDark ? '#22d3ee' : '#0891b2'; // Default cyan
  }

  isDarkMode(): boolean {
    return document.documentElement.classList.contains('dark');
  }

  getBackgroundGradient(): string {
    const isDark = this.isDarkMode();
    if (!this.weatherData) {
      return isDark 
        ? 'linear-gradient(135deg, #164e63 0%, #155e75 50%, #0e7490 100%)' // Dark cyan
        : 'linear-gradient(135deg, #ecfeff 0%, #cffafe 50%, #a5f3fc 100%)'; // Light cyan
    }
    const temp = this.weatherData.temperature;
    const icon = this.weatherData.icon;
    
    // Weather-based gradients - Cyan/Purple theme
    if (icon === 'rain') {
      return isDark
        ? 'linear-gradient(135deg, #164e63 0%, #155e75 50%, #0e7490 100%)' // Dark cyan
        : 'linear-gradient(135deg, #cffafe 0%, #a5f3fc 50%, #67e8f9 100%)'; // Light cyan
    }
    if (icon === 'sun') {
      return isDark
        ? 'linear-gradient(135deg, #78350f 0%, #92400e 50%, #b45309 100%)' // Dark yellow
        : 'linear-gradient(135deg, #fef3c7 0%, #fde68a 50%, #fcd34d 100%)'; // Light yellow
    }
    if (icon === 'cloud') {
      return isDark
        ? 'linear-gradient(135deg, #581c87 0%, #6b21a8 50%, #7c3aed 100%)' // Dark purple
        : 'linear-gradient(135deg, #e9d5ff 0%, #ddd6fe 50%, #c4b5fd 100%)'; // Light purple
    }
    if (icon === 'partly-cloudy') {
      return isDark
        ? 'linear-gradient(135deg, #155e75 0%, #0e7490 50%, #0891b2 100%)' // Dark light cyan
        : 'linear-gradient(135deg, #e0f2fe 0%, #bae6fd 50%, #7dd3fc 100%)'; // Light cyan
    }
    
    // Temperature-based gradients - Cyan/Purple theme
    if (temp >= 35) {
      return isDark
        ? 'linear-gradient(135deg, #7f1d1d 0%, #991b1b 50%, #b91c1c 100%)' // Dark red
        : 'linear-gradient(135deg, #fee2e2 0%, #fecaca 50%, #fca5a5 100%)'; // Light red
    }
    if (temp >= 30) {
      return isDark
        ? 'linear-gradient(135deg, #7c2d12 0%, #9a3412 50%, #c2410c 100%)' // Dark orange
        : 'linear-gradient(135deg, #fed7aa 0%, #fdba74 50%, #fb923c 100%)'; // Light orange
    }
    if (temp >= 25) {
      return isDark
        ? 'linear-gradient(135deg, #78350f 0%, #92400e 50%, #b45309 100%)' // Dark yellow
        : 'linear-gradient(135deg, #fef3c7 0%, #fde68a 50%, #fcd34d 100%)'; // Light yellow
    }
    if (temp >= 20) {
      return isDark
        ? 'linear-gradient(135deg, #164e63 0%, #155e75 50%, #0e7490 100%)' // Dark cyan
        : 'linear-gradient(135deg, #cffafe 0%, #a5f3fc 50%, #67e8f9 100%)'; // Light cyan
    }
    if (temp >= 15) {
      return isDark
        ? 'linear-gradient(135deg, #155e75 0%, #0e7490 50%, #0891b2 100%)' // Dark light cyan
        : 'linear-gradient(135deg, #e0f2fe 0%, #bae6fd 50%, #7dd3fc 100%)'; // Light cyan
    }
    if (temp >= 10) {
      return isDark
        ? 'linear-gradient(135deg, #581c87 0%, #6b21a8 50%, #7c3aed 100%)' // Dark purple
        : 'linear-gradient(135deg, #e9d5ff 0%, #ddd6fe 50%, #c4b5fd 100%)'; // Light purple
    }
    return isDark
      ? 'linear-gradient(135deg, #581c87 0%, #6b21a8 50%, #7c3aed 100%)' // Dark purple
      : 'linear-gradient(135deg, #ede9fe 0%, #ddd6fe 50%, #c4b5fd 100%)'; // Light purple
  }

  getGradientOverlay(): string {
    if (!this.weatherData) return 'radial-gradient(circle at top right, #06b6d4, transparent)'; // Cyan
    const icon = this.weatherData.icon;
    
    if (icon === 'sun') {
      return 'radial-gradient(circle at top right, #fbbf24, transparent)'; // Yellow
    }
    if (icon === 'rain') {
      return 'radial-gradient(circle at top right, #06b6d4, transparent)'; // Cyan
    }
    if (icon === 'cloud') {
      return 'radial-gradient(circle at top right, #7c3aed, transparent)'; // Purple
    }
    return 'radial-gradient(circle at top right, #22d3ee, transparent)'; // Light cyan
  }

}
