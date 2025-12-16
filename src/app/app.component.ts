import { Component, OnInit } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { NewsService } from './services/news.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet],
  template: `<router-outlet></router-outlet>`,
  styles: []
})
export class AppComponent implements OnInit {
  title = 'news-adda-india';

  constructor(private newsService: NewsService) { }

  ngOnInit() {
    // Check if it's a new day (after midnight) and clear cache if needed
    this.newsService.checkAndRefreshAtMidnight();

    // Set up interval to check for midnight (check every hour)
    setInterval(() => {
      this.newsService.checkAndRefreshAtMidnight();
    }, 3600000); // Check every hour
  }
}

