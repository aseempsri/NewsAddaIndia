import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HeaderComponent } from '../../components/header/header.component';
import { VideoBannerComponent } from '../../components/video-banner/video-banner.component';
import { NewsTickerComponent } from '../../components/news-ticker/news-ticker.component';
import { HeroSectionComponent } from '../../components/hero-section/hero-section.component';
import { NewsGridComponent } from '../../components/news-grid/news-grid.component';
import { CategorySectionComponent } from '../../components/category-section/category-section.component';
import { SidebarComponent } from '../../components/sidebar/sidebar.component';
import { FooterComponent } from '../../components/footer/footer.component';

@Component({
  selector: 'app-index',
  standalone: true,
  imports: [
    CommonModule,
    HeaderComponent,
    VideoBannerComponent,
    NewsTickerComponent,
    HeroSectionComponent,
    NewsGridComponent,
    CategorySectionComponent,
    SidebarComponent,
    FooterComponent
  ],
  template: `
    <!-- Full Page Loading Overlay - Show while images are loading -->
    @if (isPageLoading) {
      <div class="fixed inset-0 bg-background z-50 flex items-center justify-center">
        <div class="flex flex-col items-center gap-4">
          <div class="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
          <div class="text-center">
            <p class="text-lg font-semibold text-foreground mb-2">Loading News</p>
            <p class="text-sm text-muted-foreground">Fetching images based on headlines...</p>
          </div>
        </div>
      </div>
    }

    <div class="min-h-screen bg-background overflow-x-hidden w-full max-w-full" [class.opacity-0]="isPageLoading" [class.opacity-100]="!isPageLoading" [class.transition-opacity]="!isPageLoading" [class.duration-500]="!isPageLoading">
      <app-header />
      <app-video-banner [imagesLoaded]="!isPageLoading" />
      <app-news-ticker />
      
      <main>
        <app-hero-section (imagesLoaded)="onHeroImagesLoaded()" />
        
        <div class="container mx-auto px-4 py-8">
          <div class="grid lg:grid-cols-3 gap-8 lg:gap-12">
            <div class="lg:col-span-2">
              <app-news-grid (imagesLoaded)="onNewsGridImagesLoaded()" />
              <app-category-section />
            </div>
            <div class="order-first lg:order-last">
              <app-sidebar />
            </div>
          </div>
        </div>
      </main>

      <app-footer />
    </div>
  `,
  styles: []
})
export class IndexComponent implements OnInit {
  isPageLoading = true;
  heroImagesLoaded = false;
  newsGridImagesLoaded = false;

  ngOnInit() {
    // Maximum wait time of 30 seconds as fallback
    setTimeout(() => {
      this.isPageLoading = false;
    }, 30000);
  }

  onHeroImagesLoaded() {
    this.heroImagesLoaded = true;
    this.checkIfAllLoaded();
  }

  onNewsGridImagesLoaded() {
    this.newsGridImagesLoaded = true;
    this.checkIfAllLoaded();
  }

  checkIfAllLoaded() {
    if (this.heroImagesLoaded && this.newsGridImagesLoaded) {
      // Small delay to ensure smooth transition
      setTimeout(() => {
        this.isPageLoading = false;
      }, 300);
    }
  }
}

