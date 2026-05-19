import { Routes } from '@angular/router';
import { IndexComponent } from './pages/index/index.component';
import { NotFoundComponent } from './pages/not-found/not-found.component';
import { CategoryComponent } from './pages/category/category.component';
import { NewsDetailComponent } from './pages/news-detail/news-detail.component';
import { AdminAdsComponent } from './pages/admin/admin-ads/admin-ads.component';

export const routes: Routes = [
  { path: '', component: IndexComponent },
  { path: 'news/:id', component: NewsDetailComponent },
  { path: 'category/:category', component: CategoryComponent },
  { path: 'national', redirectTo: 'category/national', pathMatch: 'full' },
  { path: 'international', redirectTo: 'category/international', pathMatch: 'full' },
  { path: 'politics', redirectTo: 'category/politics', pathMatch: 'full' },
  { path: 'health', redirectTo: 'category/health', pathMatch: 'full' },
  { path: 'entertainment', redirectTo: 'category/entertainment', pathMatch: 'full' },
  { path: 'sports', redirectTo: 'category/sports', pathMatch: 'full' },
  { path: 'business', redirectTo: 'category/business', pathMatch: 'full' },
  { path: 'religious', redirectTo: 'category/religious', pathMatch: 'full' },
  { path: 'admin', redirectTo: 'admin/ads', pathMatch: 'full' },
  { path: 'admin/ads', component: AdminAdsComponent },
  { path: '**', component: NotFoundComponent }
];
