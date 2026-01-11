import { Component, OnInit, OnDestroy, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, NavigationEnd } from '@angular/router';
import { ButtonComponent } from '../../ui/button/button.component';
import { NewsService, NewsArticle } from '../../services/news.service';
import { ModalService } from '../../services/modal.service';
import { LanguageService } from '../../services/language.service';
import { NewsDetailModalComponent } from '../news-detail-modal/news-detail-modal.component';
import { Subscription } from 'rxjs';
import { filter } from 'rxjs/operators';

interface SideNews {
  category: string;
  title: string;
  image: string;
  date?: string;
  time?: string;
  author?: string;
  imageLoading?: boolean;
  isTrending?: boolean;
  isBreaking?: boolean;
  isFeatured?: boolean;
}

@Component({
  selector: 'app-hero-section',
  standalone: true,
  imports: [CommonModule, ButtonComponent, NewsDetailModalComponent],
  template: `
    <section class="relative py-8 lg:py-12">
      <!-- Background Glow -->
      <div class="absolute top-0 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl pointer-events-none"></div>
      <div class="absolute bottom-0 right-1/4 w-96 h-96 bg-accent/10 rounded-full blur-3xl pointer-events-none"></div>

      <div class="container mx-auto px-4 relative">
        <div class="grid lg:grid-cols-3 gap-6">
          <!-- Main Featured Article -->
          <div class="lg:col-span-2">
            <article class="group h-full relative overflow-hidden rounded-2xl bg-background shadow-lg hover:shadow-2xl transition-all duration-500 border border-border/50">
              <div class="relative aspect-[16/10] lg:aspect-[16/9] overflow-hidden">
                <!-- Loading Animation - Show while image is loading -->
                @if (featuredNews.imageLoading || !featuredNews.image) {
                  <div class="absolute inset-0 flex items-center justify-center bg-secondary/50 z-10">
                    <div class="flex flex-col items-center gap-3">
                      <div class="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
                      <span class="text-sm text-muted-foreground">Loading image...</span>
                    </div>
                  </div>
                }
                <!-- Image - Only show when loaded -->
                @if (featuredNews.image && !featuredNews.imageLoading) {
                  <img
                    [src]="featuredNews.image"
                    [alt]="featuredNews.title"
                    class="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                }
                <!-- Category Badge - Top Left -->
                <div class="absolute top-5 left-5 z-20 flex gap-2 flex-wrap">
                  @if (featuredNews.isTrending) {
                    <span class="inline-flex items-center justify-center gap-1.5 px-4 py-2 text-xs font-black rounded-full bg-gradient-to-r from-purple-600 via-pink-500 to-fuchsia-600 text-white shadow-xl animate-pulse border-2 border-white/50 uppercase tracking-wider backdrop-blur-sm" style="font-family: 'Arial Black', 'Helvetica Neue', sans-serif; text-shadow: 2px 2px 4px rgba(0,0,0,0.5), 0 0 8px rgba(255,255,255,0.3); letter-spacing: 0.1em;">
                      @if (!isHomePage) {
                        <svg class="w-4 h-4 text-white flex-shrink-0" fill="currentColor" viewBox="0 0 24 24" style="filter: drop-shadow(0 2px 3px rgba(0,0,0,0.4));">
                          <path d="M13 10V3L4 14h7v7l9-11h-7z"/>
                        </svg>
                        <span class="text-sm leading-none">🔥</span>
                      }
                      <span>TRENDING</span>
                      @if (!isHomePage) {
                        <span class="text-sm leading-none">🔥</span>
                      }
                    </span>
                  }
                  @if (featuredNews.isBreaking) {
                    <span class="inline-flex items-center justify-center gap-1.5 px-4 py-2 text-xs font-black rounded-full bg-gradient-to-r from-red-600 to-red-700 text-white shadow-xl animate-pulse border-2 border-white/50 uppercase tracking-wider backdrop-blur-sm" style="font-family: 'Arial Black', 'Helvetica Neue', sans-serif; text-shadow: 2px 2px 4px rgba(0,0,0,0.5), 0 0 8px rgba(255,255,255,0.3); letter-spacing: 0.1em;">
                      @if (!isHomePage) {
                        <svg class="w-4 h-4 text-white flex-shrink-0" fill="currentColor" viewBox="0 0 24 24" style="filter: drop-shadow(0 2px 3px rgba(0,0,0,0.4));">
                          <path d="M13 10V3L4 14h7v7l9-11h-7z"/>
                        </svg>
                      }
                      <span>{{ t.breaking }}</span>
                    </span>
                  }
                  @if (featuredNews.isFeatured) {
                    <span class="inline-flex items-center justify-center gap-1.5 px-4 py-2 text-xs font-black rounded-full bg-gradient-to-r from-yellow-500 to-amber-500 text-white shadow-xl border-2 border-white/50 uppercase tracking-wider backdrop-blur-sm" style="font-family: 'Arial Black', 'Helvetica Neue', sans-serif; text-shadow: 2px 2px 4px rgba(0,0,0,0.5), 0 0 8px rgba(255,255,255,0.3); letter-spacing: 0.1em;">
                      @if (!isHomePage) {
                        <svg class="w-4 h-4 text-white flex-shrink-0" fill="currentColor" viewBox="0 0 24 24" style="filter: drop-shadow(0 2px 3px rgba(0,0,0,0.4));">
                          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                        </svg>
                      }
                      <span>FEATURED</span>
                    </span>
                  }
                  <span [class]="'inline-flex items-center justify-center px-4 py-1.5 text-xs font-bold rounded-full shadow-lg text-white ' + getCategoryColor(featuredNews.category)">
                    {{ getCategoryName(featuredNews.category) }}
                  </span>
                </div>
              </div>

              <!-- Bottom Section with Headline and Read More -->
              <div class="p-5 lg:p-6 pt-6 lg:pt-7 pb-6 lg:pb-7 bg-gradient-to-br from-background to-secondary/30 border-t border-border/50">
                <div class="flex items-start gap-3 mb-4">
                  @if (!isHomePage) {
                    <div class="flex-shrink-0" style="margin-top: 0.88rem; line-height: 1;">
                      @if (featuredNews.category === 'National') {
                        <svg class="w-7 h-7 text-blue-500 drop-shadow-lg" viewBox="0 0 24 24" fill="currentColor" style="filter: drop-shadow(0 2px 4px rgba(59,130,246,0.4)); vertical-align: baseline;"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/></svg>
                      } @else if (featuredNews.category === 'International') {
                        <svg class="w-7 h-7 text-purple-500 drop-shadow-lg" viewBox="0 0 24 24" fill="currentColor" style="filter: drop-shadow(0 2px 4px rgba(168,85,247,0.4)); vertical-align: baseline;"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.94-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z"/></svg>
                      } @else if (featuredNews.category === 'Politics') {
                        <svg class="w-7 h-7 text-red-500 drop-shadow-lg" viewBox="0 0 24 24" fill="currentColor" style="filter: drop-shadow(0 2px 4px rgba(239,68,68,0.4)); vertical-align: baseline;"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
                      } @else if (featuredNews.category === 'Health') {
                        <svg class="w-7 h-7 text-green-500 drop-shadow-lg" viewBox="0 0 24 24" fill="currentColor" style="filter: drop-shadow(0 2px 4px rgba(34,197,94,0.4)); vertical-align: baseline;"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/></svg>
                      } @else if (featuredNews.category === 'Sports') {
                        <svg class="w-7 h-7 text-orange-500 drop-shadow-lg" viewBox="0 0 24 24" fill="currentColor" style="filter: drop-shadow(0 2px 4px rgba(251,146,60,0.4)); vertical-align: baseline;"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1.41 16.09V20h-2.67v-1.93c-1.71-.36-3.16-1.46-3.27-3.4h1.96c.1 1.05.82 1.87 2.65 1.87 1.96 0 2.4-.98 2.4-1.59 0-.83-.44-1.61-2.67-2.14-2.48-.6-4.18-1.62-4.18-3.67 0-1.72 1.39-2.84 3.11-3.21V4h2.67v1.95c1.86.45 2.79 1.86 2.85 3.39H14.3c-.05-1.11-.64-1.87-2.22-1.87-1.5 0-2.4.68-2.4 1.64 0 .84.65 1.39 2.67 1.91s4.18 1.39 4.18 3.91c-.01 1.83-1.38 2.83-3.12 3.16z"/></svg>
                      } @else if (featuredNews.category === 'Business') {
                        <svg class="w-7 h-7 text-blue-500 drop-shadow-lg" viewBox="0 0 24 24" fill="currentColor" style="filter: drop-shadow(0 2px 4px rgba(59,130,246,0.4)); vertical-align: baseline;"><path d="M11.8 10.9c-2.27-.59-3-1.2-3-2.15 0-1.09 1.01-1.85 2.7-1.85 1.78 0 2.44.85 2.5 2.1h2.21c-.07-1.72-1.12-3.3-3.21-3.81V3h-3v2.16c-1.94.42-3.5 1.68-3.5 3.61 0 2.31 1.91 3.46 4.7 4.13 2.5.6 3 1.48 3 2.41 0 .69-.49 1.79-2.7 1.79-2.06 0-2.87-.92-2.98-2.1h-2.2c.12 2.19 1.76 3.42 3.68 3.83V21h3v-2.15c1.95-.37 3.5-1.5 3.5-3.55 0-2.84-2.43-3.81-4.7-4.4z"/></svg>
                      } @else if (featuredNews.category === 'Entertainment') {
                        <svg class="w-7 h-7 text-pink-500 drop-shadow-lg" viewBox="0 0 24 24" fill="currentColor" style="filter: drop-shadow(0 2px 4px rgba(236,72,153,0.4)); vertical-align: baseline;"><path d="M8 5v14l11-7z"/></svg>
                      } @else if (featuredNews.category === 'Religious') {
                        <svg class="w-7 h-7 text-indigo-500 drop-shadow-lg" viewBox="0 0 24 24" fill="currentColor" style="filter: drop-shadow(0 2px 4px rgba(99,102,241,0.4)); vertical-align: baseline;"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/></svg>
                      } @else if (featuredNews.category === 'Technology') {
                        <svg class="w-7 h-7 text-cyan-500 drop-shadow-lg" viewBox="0 0 24 24" fill="currentColor" style="filter: drop-shadow(0 2px 4px rgba(6,182,212,0.4)); vertical-align: baseline;"><path d="M20 6h-2.18c.11-.31.18-.65.18-1a2.996 2.996 0 0 0-5.5-1.65l-.5.67-.5-.68C10.96 2.54 10 2 9 2 7.34 2 6 3.34 6 5c0 .35.07.69.18 1H4c-1.11 0-1.99.89-1.99 2L2 19c0 1.11.89 2 2 2h16c1.11 0 2-.89 2-2V8c0-1.11-.89-2-2-2zm-5-2c.55 0 1 .45 1 1s-.45 1-1 1-1-.45-1-1 .45-1 1-1zM9 4c.55 0 1 .45 1 1s-.45 1-1 1-1-.45-1-1 .45-1 1-1zm11 15H4v-2h16v2zm0-5H4V8h5.08L7 10.83 8.62 12 11 8.76l1-1.36 1 1.36L15.38 12 17 10.83 14.92 8H20v6z"/></svg>
                      } @else {
                        <svg class="w-7 h-7 text-purple-500 drop-shadow-lg" viewBox="0 0 24 24" fill="currentColor" style="filter: drop-shadow(0 2px 4px rgba(168,85,247,0.4)); vertical-align: baseline;"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
                      }
                    </div>
                  }
                  <h2 
                    [class]="'font-display text-xl lg:text-3xl font-bold dark:font-normal leading-tight pb-1 min-h-[3.5rem] lg:min-h-[5rem] cursor-pointer hover:opacity-80 transition-all duration-300 hover:scale-[1.01] flex-1 ' + (featuredNews.isTrending ? 'text-purple-700 dark:text-purple-300' : getHeadlineColor(featuredNews.category))"
                    (click)="openNewsModal(featuredNews)"
                    (touchstart)="onTouchStart($event, featuredNews)"
                    (touchend)="onTouchEnd($event, featuredNews)"
                    (touchmove)="onTouchMove($event)"
                    style="touch-action: pan-y;">
                    @if (featuredNews.isTrending && !isHomePage) {
                      <span class="inline-block mr-2 text-xl leading-none">🔥</span>
                    }
                    {{ getDisplayTitle(featuredNews) }}
                  </h2>
                </div>
                <p class="text-muted-foreground text-sm lg:text-base mb-4 mt-3 pt-1 line-clamp-3 min-h-[4rem] leading-relaxed">
                  {{ featuredNews.excerpt }}
                </p>
                <div class="flex items-center justify-between text-xs text-muted-foreground">
                  <span class="flex items-center gap-1.5">
                    <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                    <span>{{ featuredNews.author || 'News Adda India' }}</span>
                  </span>
                  <span class="flex items-center gap-1.5">
                    <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span>{{ featuredNews.date || featuredNews.time }}</span>
                  </span>
                </div>
              </div>
            </article>
          </div>

          <!-- Side Articles -->
          <div class="flex flex-col gap-6">
            @for (news of sideNews; track $index; let i = $index) {
              <article
                class="group flex-1 relative overflow-hidden rounded-2xl bg-background shadow-lg hover:shadow-2xl transition-all duration-500 border border-border/50 hover:-translate-y-1"
                [style.animation-delay]="i * 100 + 'ms'">
                <div class="relative aspect-[16/10] overflow-hidden">
                  <!-- Loading Animation - Show while image is loading -->
                  @if (news.imageLoading || !news.image) {
                    <div class="absolute inset-0 flex items-center justify-center bg-secondary/50 z-10">
                      <div class="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                    </div>
                  }
                  <!-- Image - Only show when loaded -->
                  @if (news.image && !news.imageLoading) {
                    <img
                      [src]="news.image"
                      [alt]="news.title"
                      class="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                  }
                  
                  <!-- Category Badge -->
                  <div class="absolute top-4 left-4 z-20 flex gap-2 flex-wrap">
                    @if (news.isTrending) {
                      <span class="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-black rounded-full bg-gradient-to-r from-purple-600 via-pink-500 to-fuchsia-600 text-white shadow-xl animate-pulse border-2 border-white/50 uppercase tracking-wider backdrop-blur-sm" style="font-family: 'Arial Black', 'Helvetica Neue', sans-serif; text-shadow: 2px 2px 4px rgba(0,0,0,0.5), 0 0 8px rgba(255,255,255,0.3); letter-spacing: 0.1em;">
                        @if (!isHomePage) {
                          <svg class="w-3.5 h-3.5 text-white flex-shrink-0" fill="currentColor" viewBox="0 0 24 24" style="filter: drop-shadow(0 1px 2px rgba(0,0,0,0.4));">
                            <path d="M13 10V3L4 14h7v7l9-11h-7z"/>
                          </svg>
                          <span class="text-xs leading-none">🔥</span>
                        }
                        <span>TRENDING</span>
                        @if (!isHomePage) {
                          <span class="text-xs leading-none">🔥</span>
                        }
                      </span>
                    }
                    @if (news.isBreaking) {
                      <span class="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-black rounded-full bg-gradient-to-r from-red-600 to-red-700 text-white shadow-xl animate-pulse border-2 border-white/50 uppercase tracking-wider backdrop-blur-sm" style="font-family: 'Arial Black', 'Helvetica Neue', sans-serif; text-shadow: 2px 2px 4px rgba(0,0,0,0.5), 0 0 8px rgba(255,255,255,0.3); letter-spacing: 0.1em;">
                        @if (!isHomePage) {
                          <svg class="w-3.5 h-3.5 text-white flex-shrink-0" fill="currentColor" viewBox="0 0 24 24" style="filter: drop-shadow(0 1px 2px rgba(0,0,0,0.4));">
                            <path d="M13 10V3L4 14h7v7l9-11h-7z"/>
                          </svg>
                        }
                        <span>BREAKING</span>
                      </span>
                    }
                    @if (news.isFeatured) {
                      <span class="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-black rounded-full bg-gradient-to-r from-yellow-500 to-amber-500 text-white shadow-xl border-2 border-white/50 uppercase tracking-wider backdrop-blur-sm" style="font-family: 'Arial Black', 'Helvetica Neue', sans-serif; text-shadow: 2px 2px 4px rgba(0,0,0,0.5), 0 0 8px rgba(255,255,255,0.3); letter-spacing: 0.1em;">
                        @if (!isHomePage) {
                          <svg class="w-3.5 h-3.5 text-white flex-shrink-0" fill="currentColor" viewBox="0 0 24 24" style="filter: drop-shadow(0 1px 2px rgba(0,0,0,0.4));">
                            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                          </svg>
                        }
                        <span>FEATURED</span>
                      </span>
                    }
                    <span [class]="'inline-flex items-center justify-center px-3 py-1 text-xs font-bold rounded-full shadow-lg text-white ' + getCategoryColor(news.category)">
                      {{ getCategoryName(news.category) }}
                    </span>
                  </div>
                </div>

                <!-- Bottom Section with Headline -->
                <div class="p-4 pt-5 pb-5 bg-gradient-to-br from-background to-secondary/30 border-t border-border/50">
                  <div class="flex items-start gap-3 mb-3">
                    @if (!isHomePage) {
                      <div class="flex-shrink-0" style="margin-top: 0.76rem; line-height: 1;">
                        @if (news.category === 'Sports') {
                          <svg class="w-6 h-6 text-orange-500 drop-shadow-lg" viewBox="0 0 24 24" fill="currentColor" style="filter: drop-shadow(0 2px 4px rgba(251,146,60,0.4)); vertical-align: baseline;"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1.41 16.09V20h-2.67v-1.93c-1.71-.36-3.16-1.46-3.27-3.4h1.96c.1 1.05.82 1.87 2.65 1.87 1.96 0 2.4-.98 2.4-1.59 0-.83-.44-1.61-2.67-2.14-2.48-.6-4.18-1.62-4.18-3.67 0-1.72 1.39-2.84 3.11-3.21V4h2.67v1.95c1.86.45 2.79 1.86 2.85 3.39H14.3c-.05-1.11-.64-1.87-2.22-1.87-1.5 0-2.4.68-2.4 1.64 0 .84.65 1.39 2.67 1.91s4.18 1.39 4.18 3.91c-.01 1.83-1.38 2.83-3.12 3.16z"/></svg>
                        } @else if (news.category === 'Business') {
                          <svg class="w-6 h-6 text-blue-500 drop-shadow-lg" viewBox="0 0 24 24" fill="currentColor" style="filter: drop-shadow(0 2px 4px rgba(59,130,246,0.4)); vertical-align: baseline;"><path d="M11.8 10.9c-2.27-.59-3-1.2-3-2.15 0-1.09 1.01-1.85 2.7-1.85 1.78 0 2.44.85 2.5 2.1h2.21c-.07-1.72-1.12-3.3-3.21-3.81V3h-3v2.16c-1.94.42-3.5 1.68-3.5 3.61 0 2.31 1.91 3.46 4.7 4.13 2.5.6 3 1.48 3 2.41 0 .69-.49 1.79-2.7 1.79-2.06 0-2.87-.92-2.98-2.1h-2.2c.12 2.19 1.76 3.42 3.68 3.83V21h3v-2.15c1.95-.37 3.5-1.5 3.5-3.55 0-2.84-2.43-3.81-4.7-4.4z"/></svg>
                        } @else if (news.category === 'Religious') {
                          <svg class="w-6 h-6 text-indigo-500 drop-shadow-lg" viewBox="0 0 24 24" fill="currentColor" style="filter: drop-shadow(0 2px 4px rgba(99,102,241,0.4)); vertical-align: baseline;"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/></svg>
                        } @else {
                          <svg class="w-6 h-6 text-purple-500 drop-shadow-lg" [class]="getCategoryIconColor(news.category)" viewBox="0 0 24 24" fill="currentColor" style="filter: drop-shadow(0 2px 4px rgba(168,85,247,0.4)); vertical-align: baseline;"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
                        }
                      </div>
                    }
                    <h3 
                      [class]="'font-display text-lg font-bold dark:font-normal leading-tight line-clamp-3 pb-1 min-h-[4rem] cursor-pointer hover:opacity-80 transition-all duration-300 hover:scale-[1.01] flex-1 ' + (news.isTrending ? 'text-purple-700 dark:text-purple-300' : getHeadlineColor(news.category))"
                      (click)="openNewsModalFromSide(news, $index)"
                      (touchstart)="onTouchStartSide($event, news, $index)"
                      (touchend)="onTouchEndSide($event, news, $index)"
                      (touchmove)="onTouchMove($event)"
                      style="touch-action: pan-y;">
                      @if (news.isTrending && !isHomePage) {
                        <span class="inline-block mr-2 text-lg leading-none">🔥</span>
                      }
                      {{ getDisplayTitleForSide(news) }}
                    </h3>
                  </div>
                  <div class="flex items-center justify-between text-xs text-muted-foreground mt-2">
                    <span class="flex items-center gap-1.5">
                      <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                      <span>{{ news.author || 'News Adda India' }}</span>
                    </span>
                    <span class="flex items-center gap-1.5">
                      <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span>{{ news.date || news.time }}</span>
                    </span>
                  </div>
                </div>
              </article>
            }
          </div>
        </div>
      </div>
    </section>

    <!-- News Detail Modal -->
    @if (modalState.isOpen && modalState.news) {
      <app-news-detail-modal
        [news]="modalState.news"
        [isOpen]="modalState.isOpen"
        [isBreaking]="modalState.isBreaking || false"
        (closeModal)="closeModal()">
      </app-news-detail-modal>
    }
  `,
  styles: []
})
export class HeroSectionComponent implements OnInit, OnDestroy {
  @Output() imagesLoaded = new EventEmitter<boolean>();
  modalState: { isOpen: boolean; news: NewsArticle | null; isBreaking?: boolean } = {
    isOpen: false,
    news: null,
    isBreaking: false
  };
  featuredNews: NewsArticle = {
    category: 'National',
    title: 'Loading latest news...',
    titleEn: 'Loading latest news...',
    excerpt: 'Please wait while we fetch the latest news.',
    author: 'News Adda India',
    date: new Date().toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' }),
    image: 'assets/videos/Putin_in_India_.webp',
    time: 'Just now'
  };

  sideNews: SideNews[] = [
    {
      category: 'Sports',
      title: 'Loading...',
      image: 'assets/videos/indianz.avif',
    },
    {
      category: 'Business',
      title: 'Loading...',
      image: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=600&q=80',
    },
  ];

  isLoading = true;
  t: any = {};
  isHomePage = false;
  private languageSubscription?: Subscription;

  constructor(
    private newsService: NewsService,
    private modalService: ModalService,
    private languageService: LanguageService,
    private router: Router
  ) {
    // Subscribe to modal state changes
    this.modalService.getModalState().subscribe(state => {
      this.modalState = state;
    });
  }

  ngOnInit() {
    this.updateTranslations();
    this.loadNews();
    
    // Check if we're on the home page
    this.checkIfHomePage();
    
    // Subscribe to route changes
    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe(() => {
      this.checkIfHomePage();
    });

    // Subscribe to language changes
    console.log('[HeroSection] Subscribing to language changes...');
    this.languageSubscription = this.languageService.currentLanguage$.subscribe(async (lang) => {
      console.log('[HeroSection] Language changed to:', lang);
      this.updateTranslations();
      // Re-translate featured and side news titles when language changes
      console.log('[HeroSection] Starting translation...');
      await this.translateNewsContent();
      console.log('[HeroSection] Translation complete');
    });
    console.log('[HeroSection] Language subscription set up');
  }

  ngOnDestroy() {
    this.languageSubscription?.unsubscribe();
  }

  private checkIfHomePage() {
    const url = this.router.url;
    this.isHomePage = url === '/' || url === '' || url === '/home';
  }

  updateTranslations() {
    this.t = this.languageService.getTranslations();
  }

  async translateNewsContent() {
    console.log('[HeroSection] translateNewsContent called');
    try {
      // Translate featured news title
      if (this.featuredNews && this.featuredNews.title) {
        console.log('[HeroSection] Translating featured news title:', this.featuredNews.title.substring(0, 30) + '...');
        this.featuredNews.title = await this.languageService.translateToCurrentLanguage(this.featuredNews.title);
        console.log('[HeroSection] Translated featured news title:', this.featuredNews.title.substring(0, 30) + '...');
      }
      
      // Translate side news titles
      if (this.sideNews && this.sideNews.length > 0) {
        console.log('[HeroSection] Translating', this.sideNews.length, 'side news titles...');
        for (const news of this.sideNews) {
          if (news.title) {
            news.title = await this.languageService.translateToCurrentLanguage(news.title);
          }
        }
        console.log('[HeroSection] Side news titles translated');
      }
    } catch (error) {
      console.error('[HeroSection] Error translating news content:', error);
    }
  }

  getDisplayTitle(news: NewsArticle): string {
    return this.languageService.getDisplayTitle(news.title, news.titleEn);
  }

  getDisplayTitleForSide(news: SideNews): string {
    // For side news, we only have title, so just return it
    // In a real scenario, you'd want to store both title and titleEn
    return news.title;
  }

  getCategoryName(category: string): string {
    return this.languageService.translateCategory(category);
  }

  getCategoryColor(category: string): string {
    const colors: Record<string, string> = {
      'Health': 'bg-green-500',
      'Sports': 'bg-orange-500',
      'Business': 'bg-blue-500',
      'Entertainment': 'bg-pink-500',
      'International': 'bg-purple-500',
      'Technology': 'bg-cyan-500',
      'National': 'bg-blue-500',
      'Politics': 'bg-red-500',
      'Religious': 'bg-indigo-500',
    };
    return colors[category] || 'bg-primary';
  }

  loadNews() {
    const imagePromises: Promise<void>[] = [];

    // Load breaking news for hero section (falls back to featured if no breaking news)
    this.newsService.fetchBreakingNews().subscribe({
      next: (news) => {
        // Ensure titleEn is set (for translation)
        if (!news.titleEn) {
          news.titleEn = news.title;
        }

        // News is already translated by the service, so use it directly
        this.featuredNews = news;

        // Verify image loads, or fetch if missing/invalid
        if (news.image && news.image.trim() !== '' && !news.imageLoading) {
          // Image URL exists, verify it loads
          const featuredImagePromise = new Promise<void>((resolve) => {
            const img = new Image();
            img.onload = () => {
              this.featuredNews.imageLoading = false;
              resolve();
            };
            img.onerror = () => {
              // Image failed to load - use placeholder (no external API calls)
              console.warn(`Featured image failed to load, using placeholder...`);
              this.featuredNews.image = this.newsService.getPlaceholderImage(news.title);
              this.featuredNews.imageLoading = false;
              resolve();
            };
            img.src = news.image;
          });
          imagePromises.push(featuredImagePromise);
        } else if (news.imageLoading || !news.image || news.image.trim() === '') {
          // No image in database - use placeholder (no external API calls)
          this.featuredNews.imageLoading = true;
          const featuredImagePromise = new Promise<void>((resolve) => {
            this.featuredNews.image = this.newsService.getPlaceholderImage(news.title);
            this.featuredNews.imageLoading = false;
            resolve();
          });
          imagePromises.push(featuredImagePromise);
        } else {
          imagePromises.push(Promise.resolve());
        }
      },
      error: (error) => {
        console.error('Error loading featured news:', error);
        imagePromises.push(Promise.resolve());
      }
    });

    // Load side news
    this.newsService.fetchSideNews(['Sports', 'Business']).subscribe({
      next: (news) => {
        this.sideNews = news.map((n, index) => {
          const sideNewsItem = {
            category: n.category,
            title: n.title,
            image: '',
            date: n.date,
            time: n.time,
            author: n.author,
            imageLoading: true,
            isTrending: n.isTrending || false,
            isBreaking: n.isBreaking || false,
            isFeatured: n.isFeatured || false
          };

          // Use image from database or placeholder (no external API calls)
          const sideImagePromise = new Promise<void>((resolve) => {
            if (n.image && n.image.trim() !== '') {
              // Use image from database
              const img = new Image();
              img.onload = () => {
                sideNewsItem.image = n.image;
                sideNewsItem.imageLoading = false;
                resolve();
              };
              img.onerror = () => {
                sideNewsItem.image = this.newsService.getPlaceholderImage(n.title);
                sideNewsItem.imageLoading = false;
                resolve();
              };
              img.src = n.image;
            } else {
              // No image in database - use placeholder
              sideNewsItem.image = this.newsService.getPlaceholderImage(n.title);
              sideNewsItem.imageLoading = false;
              resolve();
            }
          });
          imagePromises.push(sideImagePromise);

          return sideNewsItem;
        });

        // Wait for all images to load before showing page
        // Add timeout to prevent infinite loading
        const timeoutPromise = new Promise<void>((resolve) => {
          setTimeout(() => {
            console.warn('Hero section image loading timeout - showing page anyway');
            resolve();
          }, 15000); // 15 second timeout
        });

        Promise.race([Promise.all(imagePromises), timeoutPromise]).then(() => {
          this.isLoading = false;
          this.imagesLoaded.emit(true);
          console.log('All hero section images loaded');
        });
      },
      error: (error) => {
        console.error('Error loading side news:', error);
        this.isLoading = false;
      }
    });
  }

  openNewsModal(news: NewsArticle) {
    // Check if this is breaking news (you might want to add a property to NewsArticle)
    const isBreaking = false; // You can determine this based on your data
    this.modalService.openModal(news, isBreaking);
  }

  openNewsModalFromSide(sideNews: SideNews, index: number) {
    // Convert SideNews to NewsArticle format
    const newsArticle: NewsArticle = {
      id: index + 1000, // Temporary ID
      category: sideNews.category,
      title: sideNews.title,
      titleEn: sideNews.title,
      excerpt: sideNews.title, // Use title as excerpt for side news
      image: sideNews.image,
      imageLoading: sideNews.imageLoading || false,
      time: '2 hours ago',
      author: 'News Adda India',
      date: new Date().toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' })
    };
    this.modalService.openModal(newsArticle, false);
  }

  // Touch handling to prevent accidental opens on mobile
  private touchStartTime: number = 0;
  private touchStartX: number = 0;
  private touchStartY: number = 0;
  private touchMoved: boolean = false;
  private touchTargetNews: NewsArticle | null = null;
  private touchTargetSideNews: { news: SideNews; index: number } | null = null;

  onTouchStart(event: TouchEvent, news: NewsArticle) {
    this.touchStartTime = Date.now();
    this.touchStartX = event.touches[0].clientX;
    this.touchStartY = event.touches[0].clientY;
    this.touchMoved = false;
    this.touchTargetNews = news;
    this.touchTargetSideNews = null;
  }

  onTouchStartSide(event: TouchEvent, news: SideNews, index: number) {
    this.touchStartTime = Date.now();
    this.touchStartX = event.touches[0].clientX;
    this.touchStartY = event.touches[0].clientY;
    this.touchMoved = false;
    this.touchTargetNews = null;
    this.touchTargetSideNews = { news, index };
  }

  onTouchMove(event: TouchEvent) {
    if (this.touchStartTime > 0) {
      const deltaX = Math.abs(event.touches[0].clientX - this.touchStartX);
      const deltaY = Math.abs(event.touches[0].clientY - this.touchStartY);
      // If touch moved more than 10px, consider it a scroll
      if (deltaX > 10 || deltaY > 10) {
        this.touchMoved = true;
      }
    }
  }

  onTouchEnd(event: TouchEvent, news: NewsArticle) {
    const touchDuration = Date.now() - this.touchStartTime;
    const deltaX = Math.abs(event.changedTouches[0].clientX - this.touchStartX);
    const deltaY = Math.abs(event.changedTouches[0].clientY - this.touchStartY);
    
    // Only open modal if:
    // 1. Touch didn't move much (not a scroll) - less than 10px
    // 2. Touch was quick (less than 300ms) - deliberate tap
    // 3. Touch target matches
    if (!this.touchMoved && deltaX < 10 && deltaY < 10 && touchDuration < 300 && this.touchTargetNews === news) {
      event.preventDefault();
      event.stopPropagation();
      this.openNewsModal(news);
    }
    
    // Reset touch state
    this.touchStartTime = 0;
    this.touchMoved = false;
    this.touchTargetNews = null;
    this.touchTargetSideNews = null;
  }

  onTouchEndSide(event: TouchEvent, news: SideNews, index: number) {
    const touchDuration = Date.now() - this.touchStartTime;
    const deltaX = Math.abs(event.changedTouches[0].clientX - this.touchStartX);
    const deltaY = Math.abs(event.changedTouches[0].clientY - this.touchStartY);
    
    // Only open modal if:
    // 1. Touch didn't move much (not a scroll) - less than 10px
    // 2. Touch was quick (less than 300ms) - deliberate tap
    // 3. Touch target matches
    if (!this.touchMoved && deltaX < 10 && deltaY < 10 && touchDuration < 300 && 
        this.touchTargetSideNews && this.touchTargetSideNews.news === news && this.touchTargetSideNews.index === index) {
      event.preventDefault();
      event.stopPropagation();
      this.openNewsModalFromSide(news, index);
    }
    
    // Reset touch state
    this.touchStartTime = 0;
    this.touchMoved = false;
    this.touchTargetNews = null;
    this.touchTargetSideNews = null;
  }

  closeModal() {
    this.modalService.closeModal();
  }

  getHeadlineColor(category: string): string {
    const colors: Record<string, string> = {
      'National': 'bg-gradient-to-r from-blue-600 to-blue-800 bg-clip-text text-transparent dark:bg-none dark:text-blue-300',
      'International': 'bg-gradient-to-r from-purple-600 to-purple-800 bg-clip-text text-transparent dark:bg-none dark:text-purple-300',
      'Politics': 'bg-gradient-to-r from-red-600 to-red-800 bg-clip-text text-transparent dark:bg-none dark:text-red-300',
      'Health': 'bg-gradient-to-r from-green-600 to-green-800 bg-clip-text text-transparent dark:bg-none dark:text-green-300',
      'Sports': 'bg-gradient-to-r from-orange-600 to-orange-800 bg-clip-text text-transparent dark:bg-none dark:text-orange-300',
      'Business': 'bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent dark:bg-none dark:text-cyan-300',
      'Entertainment': 'bg-gradient-to-r from-pink-600 to-rose-600 bg-clip-text text-transparent dark:bg-none dark:text-pink-300',
      'Technology': 'bg-gradient-to-r from-cyan-600 to-blue-600 bg-clip-text text-transparent dark:bg-none dark:text-cyan-300',
    };
    return colors[category] || 'bg-gradient-to-r from-primary to-primary/80 bg-clip-text text-transparent dark:bg-none dark:text-primary-foreground';
  }

  getCategoryIconColor(category: string): string {
    const colors: Record<string, string> = {
      'National': 'text-blue-600',
      'International': 'text-purple-600',
      'Politics': 'text-red-600',
      'Health': 'text-green-600',
      'Sports': 'text-orange-600',
      'Business': 'text-blue-600',
      'Entertainment': 'text-pink-600',
      'Technology': 'text-cyan-600',
    };
    return colors[category] || 'text-primary';
  }

}

