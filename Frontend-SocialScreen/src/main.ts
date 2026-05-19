import { bootstrapApplication } from '@angular/platform-browser';
import { provideRouter, withInMemoryScrolling } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { APP_INITIALIZER } from '@angular/core';
import { AppComponent } from './app/app.component';
import { routes } from './app/app.routes';
import { AnalyticsService } from './app/services/analytics.service';

function initializeAnalytics(analytics: AnalyticsService) {
  return () => analytics.initialize();
}

bootstrapApplication(AppComponent, {
  providers: [
    provideRouter(
      routes,
      withInMemoryScrolling({
        scrollPositionRestoration: 'disabled', // We handle scroll restoration manually
        anchorScrolling: 'enabled'
      })
    ),
    provideHttpClient(),
    {
      provide: APP_INITIALIZER,
      useFactory: initializeAnalytics,
      deps: [AnalyticsService],
      multi: true
    }
  ]
}).catch(err => console.error(err));

