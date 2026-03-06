# Google Analytics (GA4) Setup Guide for NewsAddaIndia

## Step 1: Create Google Analytics Account

1. Go to [Google Analytics](https://analytics.google.com/)
2. Sign in with your Google account
3. Click **"Start measuring"** or **"Admin"** → **"Create Account"**
4. Fill in account details:
   - Account name: `NewsAddaIndia`
   - Click **"Next"**
5. Create a Property:
   - Property name: `NewsAddaIndia Website`
   - Reporting time zone: `(GMT+05:30) India Standard Time`
   - Currency: `INR (Indian Rupee)`
   - Click **"Next"**
6. Fill in business information:
   - Industry category: `News & Media`
   - Business size: Select appropriate
   - Click **"Next"**
7. Choose data stream:
   - Select **"Web"**
   - Website URL: `https://newsaddaindia.com`
   - Stream name: `NewsAddaIndia Web`
   - Click **"Create stream"**

## Step 2: Get Your Measurement ID

1. After creating the stream, you'll see your **Measurement ID** (format: `G-XXXXXXXXXX`)
2. Copy this ID - you'll need it in the next steps
3. Example: `G-ABC123XYZ456`

## Step 3: Install Google Analytics in Angular

### 3.1 Add gtag script to index.html

Add the Google Analytics script to `Frontend/src/index.html` in the `<head>` section:

```html
<!doctype html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>NewsAddaIndia - Your Daily News Companion | Latest News from India</title>
  
  <!-- Google Analytics (GA4) -->
  <script async src="https://www.googletagmanager.com/gtag/js?id=G-XXXXXXXXXX"></script>
  <script>
    window.dataLayer = window.dataLayer || [];
    function gtag(){dataLayer.push(arguments);}
    gtag('js', new Date());
    gtag('config', 'G-XXXXXXXXXX');
  </script>
  
  <!-- Rest of your meta tags -->
  ...
</head>
```

**Replace `G-XXXXXXXXXX` with your actual Measurement ID**

### 3.2 Create Analytics Service

Create a new service file: `Frontend/src/app/services/analytics.service.ts`

```typescript
import { Injectable } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';

declare let gtag: Function;

@Injectable({
  providedIn: 'root'
})
export class AnalyticsService {
  private measurementId: string = 'G-XXXXXXXXXX'; // Replace with your Measurement ID

  constructor(private router: Router) {
    // Track page views on route changes
    this.router.events
      .pipe(filter(event => event instanceof NavigationEnd))
      .subscribe((event: NavigationEnd) => {
        this.trackPageView(event.urlAfterRedirects);
      });
  }

  /**
   * Initialize Google Analytics
   */
  initialize(): void {
    if (typeof gtag !== 'undefined') {
      gtag('config', this.measurementId, {
        page_path: window.location.pathname,
        page_title: document.title,
        page_location: window.location.href
      });
    }
  }

  /**
   * Track page view
   */
  trackPageView(url: string): void {
    if (typeof gtag !== 'undefined') {
      gtag('config', this.measurementId, {
        page_path: url,
        page_title: document.title,
        page_location: window.location.origin + url
      });
    }
  }

  /**
   * Track custom event
   */
  trackEvent(eventName: string, eventParams?: any): void {
    if (typeof gtag !== 'undefined') {
      gtag('event', eventName, eventParams);
    }
  }

  /**
   * Track news article view
   */
  trackNewsView(articleId: string, articleTitle: string, category: string): void {
    this.trackEvent('view_article', {
      article_id: articleId,
      article_title: articleTitle,
      category: category,
      content_type: 'news_article'
    });
  }

  /**
   * Track news share
   */
  trackNewsShare(articleId: string, shareMethod: string): void {
    this.trackEvent('share_article', {
      article_id: articleId,
      method: shareMethod // 'whatsapp', 'facebook', 'twitter', etc.
    });
  }

  /**
   * Track category view
   */
  trackCategoryView(category: string): void {
    this.trackEvent('view_category', {
      category: category
    });
  }

  /**
   * Track search
   */
  trackSearch(searchTerm: string, resultsCount?: number): void {
    this.trackEvent('search', {
      search_term: searchTerm,
      results_count: resultsCount
    });
  }

  /**
   * Track language change
   */
  trackLanguageChange(language: string): void {
    this.trackEvent('language_change', {
      language: language
    });
  }

  /**
   * Track video play
   */
  trackVideoPlay(videoId: string, videoTitle: string): void {
    this.trackEvent('video_play', {
      video_id: videoId,
      video_title: videoTitle
    });
  }

  /**
   * Track ad click
   */
  trackAdClick(adId: string, adPosition: string): void {
    this.trackEvent('ad_click', {
      ad_id: adId,
      ad_position: adPosition
    });
  }
}
```

### 3.3 Update main.ts

Add the AnalyticsService initialization in `Frontend/src/main.ts`:

```typescript
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
        scrollPositionRestoration: 'disabled',
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
```

### 3.4 Use Analytics Service in Components

**Example: Track news article views**

In `news-detail.component.ts`:
```typescript
import { AnalyticsService } from '../../services/analytics.service';

constructor(
  private analytics: AnalyticsService,
  // ... other services
) {}

ngOnInit() {
  // ... existing code
  
  // Track article view
  if (this.news) {
    this.analytics.trackNewsView(
      this.news.id?.toString() || '',
      this.news.title || '',
      this.news.category || ''
    );
  }
}
```

**Example: Track shares**

In `news-detail.component.ts`:
```typescript
shareArticle(method: string) {
  // ... existing share logic
  
  this.analytics.trackNewsShare(
    this.news.id?.toString() || '',
    method
  );
}
```

**Example: Track category views**

In `category.component.ts`:
```typescript
import { AnalyticsService } from '../../services/analytics.service';

constructor(
  private analytics: AnalyticsService,
  // ... other services
) {}

ngOnInit() {
  // ... existing code
  
  this.analytics.trackCategoryView(this.category);
}
```

**Example: Track language changes**

In `header.component.ts` or wherever language toggle is:
```typescript
import { AnalyticsService } from '../../services/analytics.service';

changeLanguage(lang: 'en' | 'hi') {
  this.languageService.setLanguage(lang);
  this.analytics.trackLanguageChange(lang);
}
```

## Step 4: Environment Configuration (Optional but Recommended)

Create environment-specific configuration:

**Frontend/src/environments/environment.ts:**
```typescript
export const environment = {
  production: false,
  googleAnalyticsId: 'G-XXXXXXXXXX' // Development/Test ID
};
```

**Frontend/src/environments/environment.prod.ts:**
```typescript
export const environment = {
  production: true,
  googleAnalyticsId: 'G-XXXXXXXXXX' // Production ID
};
```

Then update `analytics.service.ts`:
```typescript
import { environment } from '../../environments/environment';

export class AnalyticsService {
  private measurementId: string = environment.googleAnalyticsId;
  // ... rest of the code
}
```

## Step 5: Verify Installation

1. **Build and deploy your application**
2. **Visit your website** and navigate through a few pages
3. **Check Google Analytics Real-Time Reports**:
   - Go to Google Analytics dashboard
   - Click **"Reports"** → **"Realtime"**
   - You should see active users and page views

## Step 6: Test Events

Test custom events using browser console:
```javascript
// In browser console
gtag('event', 'test_event', {
  test_param: 'test_value'
});
```

Check in Google Analytics → Reports → Realtime → Events

## Step 7: Set Up Custom Reports (Optional)

1. Go to Google Analytics → **"Reports"** → **"Engagement"** → **"Events"**
2. Create custom reports for:
   - Most viewed articles
   - Most shared articles
   - Popular categories
   - Language preferences
   - Video engagement

## Important Notes

1. **Replace Measurement ID**: Replace all instances of `G-XXXXXXXXXX` with your actual Measurement ID
2. **Privacy Compliance**: Ensure you comply with GDPR/privacy laws - add cookie consent if required
3. **Testing**: Test in development before deploying to production
4. **Data Delay**: Google Analytics data may take 24-48 hours to appear in standard reports (real-time is immediate)

## Troubleshooting

- **No data appearing**: Check browser console for errors, verify Measurement ID is correct
- **Events not tracking**: Ensure `gtag` is loaded before calling tracking functions
- **Page views not tracking**: Verify router events are properly subscribed

## Next Steps

1. Set up conversion goals (e.g., newsletter signups, article reads)
2. Create custom dashboards
3. Set up email reports
4. Configure audience segments
5. Set up Google Search Console integration
