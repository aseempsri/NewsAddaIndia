import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { Location } from '@angular/common';
import { ButtonComponent } from '../../ui/button/button.component';

interface NavLink {
  name: string;
  route: string;
}

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive, ButtonComponent],
  template: `
    <header class="sticky top-0 z-50">
      <!-- Top Bar -->
      <div class="bg-secondary/50 backdrop-blur-sm border-b border-border/50">
        <div class="container mx-auto px-4 py-2 flex items-center justify-between text-sm">
          <div class="flex items-center gap-4 text-muted-foreground">
            <span class="flex items-center gap-1.5">
              <svg class="w-3.5 h-3.5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {{ currentDate }}
            </span>
            <span class="hidden sm:flex items-center gap-1.5">
              <svg class="w-3.5 h-3.5 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              Delhi, India
            </span>
          </div>
          <div class="flex items-center gap-3">
            <span class="text-muted-foreground">21°C</span>
            <div class="w-px h-4 bg-border"></div>
            <span class="text-accent font-medium">04,320+ Readers</span>
          </div>
        </div>
      </div>

      <!-- Main Header -->
      <div class="glass-card border-b border-border/30">
        <div class="container mx-auto px-4 py-4">
          <div class="flex items-center justify-between">
            <!-- Logo -->
            <a [routerLink]="'/'" class="flex items-center gap-3 group">
              <div class="relative w-12 h-12 shrink-0">
                <img 
                  [src]="logoPath" 
                  alt="NewsAddaIndia Logo" 
                  class="w-full h-full rounded-xl object-cover transition-all duration-300"
                  style="box-shadow: 0 0 15px rgba(37, 99, 235, 0.6), 0 0 30px rgba(37, 99, 235, 0.4);"
                  loading="eager"
                  width="48"
                  height="48" />
                <div class="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-accent animate-pulse"></div>
              </div>
              <div>
                <h1 class="font-display text-base sm:text-xl font-bold tracking-tight">
                  <span style="color: #FF9933;">News</span>
                  <span style="color: #FFFFFF; -webkit-text-stroke: 2px #2563EB; text-stroke: 2px #2563EB; paint-order: stroke fill;">Adda</span>
                  <span style="color: #138808;">India</span>
                </h1>
                <p class="text-[10px] sm:text-xs text-muted-foreground -mt-0.5">Your Daily News Companion</p>
              </div>
            </a>

            <!-- Desktop Navigation -->
            <nav class="hidden lg:flex items-center gap-1">
              @for (link of navLinks; track link.name) {
                <a
                  [routerLink]="link.route"
                  routerLinkActive="text-primary font-semibold bg-primary/10"
                  [routerLinkActiveOptions]="{exact: link.route === '/'}"
                  class="nav-link px-4 py-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary/50 transition-all">
                  {{ link.name }}
                </a>
              }
            </nav>

            <!-- Actions -->
            <div class="flex items-center gap-3">
              <app-button variant="ghost" size="icon" class="text-muted-foreground hover:text-foreground">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </app-button>
              <app-button class="hidden sm:flex bg-primary hover:bg-primary/90 text-primary-foreground glow-primary rounded-xl">
                Subscribe
              </app-button>
              <app-button
                variant="ghost"
                size="icon"
                class="lg:hidden"
                (click)="toggleMenu()">
                @if (isMenuOpen) {
                  <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                } @else {
                  <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" />
                  </svg>
                }
              </app-button>
            </div>
          </div>
        </div>

        <!-- Mobile Menu -->
        @if (isMenuOpen) {
          <div class="lg:hidden border-t border-border/30 animate-slide-up">
            <nav class="container mx-auto px-4 py-4 flex flex-col gap-2">
              @for (link of navLinks; track link.name; let i = $index) {
                <a
                  [routerLink]="link.route"
                  routerLinkActive="text-primary font-semibold bg-primary/10 border-l-4 border-primary"
                  [routerLinkActiveOptions]="{exact: link.route === '/'}"
                  class="px-4 py-3 rounded-lg hover:bg-secondary/50 text-muted-foreground hover:text-foreground transition-all"
                  [style.animation-delay]="i * 50 + 'ms'"
                  (click)="closeMenu()">
                  {{ link.name }}
                </a>
              }
            </nav>
          </div>
        }
      </div>
    </header>
  `,
  styles: []
})
export class HeaderComponent {
  isMenuOpen = false;
  logoPath: string;

  constructor(private location: Location) {
    // Get the base href and construct the logo path
    const baseHref = this.location.prepareExternalUrl('/');
    this.logoPath = baseHref + 'assets/videos/slogo.png';
  }

  navLinks: NavLink[] = [
    { name: 'Home', route: '/' },
    { name: 'National', route: '/category/national' },
    { name: 'International', route: '/category/international' },
    { name: 'Politics', route: '/category/politics' },
    { name: 'Health', route: '/category/health' },
    { name: 'Entertainment', route: '/category/entertainment' },
    { name: 'Sports', route: '/category/sports' },
    { name: 'Business', route: '/category/business' },
  ];

  currentDate = new Date().toLocaleDateString('en-IN', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  toggleMenu() {
    this.isMenuOpen = !this.isMenuOpen;
  }

  closeMenu() {
    this.isMenuOpen = false;
  }
}

