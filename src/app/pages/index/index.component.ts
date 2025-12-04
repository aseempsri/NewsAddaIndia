import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HeaderComponent } from '../../components/header/header.component';
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
    NewsTickerComponent,
    HeroSectionComponent,
    NewsGridComponent,
    CategorySectionComponent,
    SidebarComponent,
    FooterComponent
  ],
  template: `
    <div class="min-h-screen bg-background">
      <app-header />
      <app-news-ticker />
      
      <main>
        <app-hero-section />
        
        <div class="container mx-auto px-4 py-8">
          <div class="grid lg:grid-cols-3 gap-8 lg:gap-12">
            <div class="lg:col-span-2">
              <app-news-grid />
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
export class IndexComponent {
}

