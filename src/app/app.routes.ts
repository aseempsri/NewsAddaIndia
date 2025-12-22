import { Routes } from '@angular/router';
import { IndexComponent } from './pages/index/index.component';
import { NotFoundComponent } from './pages/not-found/not-found.component';
import { CategoryComponent } from './pages/category/category.component';
import { AdminComponent } from './pages/admin/admin.component';

export const routes: Routes = [
  { path: '', component: IndexComponent },
  { path: 'category/:category', component: CategoryComponent },
  { path: 'national', redirectTo: 'category/national', pathMatch: 'full' },
  { path: 'international', redirectTo: 'category/international', pathMatch: 'full' },
  { path: 'politics', redirectTo: 'category/politics', pathMatch: 'full' },
  { path: 'health', redirectTo: 'category/health', pathMatch: 'full' },
  { path: 'entertainment', redirectTo: 'category/entertainment', pathMatch: 'full' },
  { path: 'sports', redirectTo: 'category/sports', pathMatch: 'full' },
  { path: 'business', redirectTo: 'category/business', pathMatch: 'full' },
  { path: 'admin', component: AdminComponent },
  { path: '**', component: NotFoundComponent }
];

