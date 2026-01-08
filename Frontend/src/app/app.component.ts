import { Component, OnInit } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { NewsService } from './services/news.service';
import { UserTrackingService } from './services/user-tracking.service';
import { ThemeService } from './services/theme.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet],
  template: `<router-outlet></router-outlet>`,
  styles: []
})
export class AppComponent implements OnInit {
  title = 'news-adda-india';

  constructor(
    private newsService: NewsService,
    private userTrackingService: UserTrackingService,
    private themeService: ThemeService
  ) { 
    // Initialize theme service (applies theme on app startup)
  }

  ngOnInit() {
    // Track user visit (increments reader count once per day)
    this.userTrackingService.trackUser();
    
    // News now updates on each refresh/page load
    // No need for midnight checks or intervals
  }
}

