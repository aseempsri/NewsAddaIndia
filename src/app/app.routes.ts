import { Routes } from '@angular/router';
import { IndexComponent } from './pages/index/index.component';
import { NotFoundComponent } from './pages/not-found/not-found.component';
import { CategoryComponent } from './pages/category/category.component';
import { AdminDashboardComponent } from './pages/admin/admin-dashboard/admin-dashboard.component';
import { AdminCreatePostComponent } from './pages/admin/admin-create-post/admin-create-post.component';
import { AdminReviewPostsComponent } from './pages/admin/admin-review-posts/admin-review-posts.component';
import { AdminReviewLivePostsComponent } from './pages/admin/admin-review-live-posts/admin-review-live-posts.component';
import { AdminEditPostComponent } from './pages/admin/admin-edit-post/admin-edit-post.component';
import { AdminEditLivePostComponent } from './pages/admin/admin-edit-live-post/admin-edit-live-post.component';

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
  { path: 'admin', component: AdminDashboardComponent },
  { path: 'admin/create', component: AdminCreatePostComponent },
  { path: 'admin/review', component: AdminReviewPostsComponent },
  { path: 'admin/review-live', component: AdminReviewLivePostsComponent },
  { path: 'admin/edit/:id', component: AdminEditPostComponent },
  { path: 'admin/edit-live/:id', component: AdminEditLivePostComponent },
  { path: '**', component: NotFoundComponent }
];

