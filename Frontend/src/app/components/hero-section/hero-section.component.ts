import { Component, OnInit, OnDestroy, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, NavigationEnd } from '@angular/router';
import { ButtonComponent } from '../../ui/button/button.component';
import { NewsService, NewsArticle } from '../../services/news.service';
import { ModalService } from '../../services/modal.service';
import { LanguageService } from '../../services/language.service';
import { DisplayedNewsService } from '../../services/displayed-news.service';
import { NewsDetailModalComponent } from '../news-detail-modal/news-detail-modal.component';
import { AdService } from '../../services/ad.service';
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
  trendingTitle?: string;
  tags?: string[];
  id?: string | number;
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
        <!-- Mobile Layout: Vertical Stack -->
        <div class="flex flex-col gap-6 lg:hidden">
          <!-- Featured News (1st News) -->
          <article class="group w-full relative overflow-hidden rounded-2xl bg-background shadow-lg hover:shadow-2xl transition-all duration-500 border border-border/50 flex flex-col">
            <div class="relative aspect-[16/10] overflow-hidden flex-shrink-0">
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
                  class="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                  loading="eager"
                  decoding="async"
                  style="filter: none !important; -webkit-filter: none !important; backdrop-filter: none !important; blur: none !important; image-rendering: auto !important; -webkit-font-smoothing: antialiased; -moz-osx-font-smoothing: grayscale; backface-visibility: hidden; transform: translateZ(0); will-change: transform;" />
              }
              <!-- Category Badge - Top Left -->
              @if (!isHomePage) {
                <div class="absolute top-5 left-5 z-20 flex gap-2 flex-wrap">
                  @if (featuredNews.isTrending) {
                    <span class="inline-flex items-center justify-center gap-1.5 px-4 py-2 text-xs font-black rounded-full bg-gradient-to-r from-purple-600 via-pink-500 to-fuchsia-600 text-white shadow-xl animate-pulse border-2 border-white/50 uppercase tracking-wider backdrop-blur-sm" style="font-family: 'Arial Black', 'Helvetica Neue', sans-serif; text-shadow: 2px 2px 4px rgba(0,0,0,0.5), 0 0 8px rgba(255,255,255,0.3); letter-spacing: 0.1em;">
                      <svg class="w-4 h-4 text-white flex-shrink-0" fill="currentColor" viewBox="0 0 24 24" style="filter: drop-shadow(0 2px 3px rgba(0,0,0,0.4));">
                        <path d="M13 10V3L4 14h7v7l9-11h-7z"/>
                      </svg>
                      <span class="text-sm leading-none">🔥</span>
                      <span>TRENDING</span>
                      <span class="text-sm leading-none">🔥</span>
                    </span>
                  }
                  @if (featuredNews.isBreaking) {
                    <span class="inline-flex items-center justify-center gap-1.5 px-4 py-2 text-xs font-black rounded-full bg-gradient-to-r from-red-600 to-red-700 text-white shadow-xl animate-pulse border-2 border-white/50 uppercase tracking-wider backdrop-blur-sm" style="font-family: 'Arial Black', 'Helvetica Neue', sans-serif; text-shadow: 2px 2px 4px rgba(0,0,0,0.5), 0 0 8px rgba(255,255,255,0.3); letter-spacing: 0.1em;">
                      <svg class="w-4 h-4 text-white flex-shrink-0" fill="currentColor" viewBox="0 0 24 24" style="filter: drop-shadow(0 2px 3px rgba(0,0,0,0.4));">
                        <path d="M13 10V3L4 14h7v7l9-11h-7z"/>
                      </svg>
                      <span>{{ t.breaking }}</span>
                    </span>
                  }
                  @if (featuredNews.isFeatured) {
                    <span class="inline-flex items-center justify-center gap-1.5 px-4 py-2 text-xs font-black rounded-full bg-gradient-to-r from-yellow-500 to-amber-500 text-white shadow-xl border-2 border-white/50 uppercase tracking-wider backdrop-blur-sm" style="font-family: 'Arial Black', 'Helvetica Neue', sans-serif; text-shadow: 2px 2px 4px rgba(0,0,0,0.5), 0 0 8px rgba(255,255,255,0.3); letter-spacing: 0.1em;">
                      <svg class="w-4 h-4 text-white flex-shrink-0" fill="currentColor" viewBox="0 0 24 24" style="filter: drop-shadow(0 2px 3px rgba(0,0,0,0.4));">
                        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                      </svg>
                      <span>FEATURED</span>
                    </span>
                  }
                  <span [class]="'inline-flex items-center justify-center px-4 py-1.5 text-xs font-bold rounded-full shadow-lg text-white ' + getCategoryColor(featuredNews.category)">
                    {{ getCategoryName(featuredNews.category) }}
                  </span>
                </div>
              }
            </div>

            <!-- Bottom Section with Headline and Read More -->
            <div class="p-5 pt-6 pb-6 bg-gradient-to-br from-background to-secondary/30 border-t border-border/50 flex flex-col flex-1 min-h-0">
              <div class="flex-1 min-w-0 mb-4 min-h-0">
                <h2
                  [class]="'font-display text-xl font-bold dark:font-normal leading-tight pb-1 min-h-[3.5rem] cursor-pointer hover:opacity-80 transition-all duration-300 hover:scale-[1.01] ' + (featuredNews.isTrending ? 'text-purple-700 dark:text-purple-300' : getHeadlineColor(featuredNews.category))"
                  (click)="openNewsModal(featuredNews)"
                  (touchstart)="onTouchStart($event, featuredNews)"
                  (touchend)="onTouchEnd($event, featuredNews)"
                  (touchmove)="onTouchMove($event)"
                  style="touch-action: pan-y;">
                  {{ getDisplayTitle(featuredNews) }}
                </h2>
                <p class="text-muted-foreground text-sm mb-4 mt-3 pt-1 line-clamp-3 min-h-[4rem] leading-relaxed">
                  {{ featuredNews.excerpt }}
                </p>
              </div>
              <!-- Author and Date - Bottom aligned -->
              <div class="flex items-center justify-between text-xs text-muted-foreground mt-auto pt-2 border-t border-border/30">
                <span class="flex items-center gap-1">
                  <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  <span class="text-left">{{ featuredNews.author || 'News Adda India' }}</span>
                </span>
                <span class="flex items-center gap-1">
                  <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span>{{ featuredNews.date || featuredNews.time || 'Just now' }}</span>
                </span>
              </div>
            </div>
          </article>
          
          <!-- Ad 1 - After Featured News (Mobile Only, Between 1st and 2nd News) -->
          @if (isAdEnabled('ad1')) {
            <div class="w-full min-h-[200px] sm:min-h-[250px] rounded-lg overflow-hidden border-4 border-blue-500 dark:border-blue-400 shadow-lg">
              <a
                [href]="getAdLink('ad1') || 'javascript:void(0)'"
                [target]="getAdLink('ad1') ? '_blank' : '_self'"
                [rel]="getAdLink('ad1') ? 'noopener noreferrer' : ''"
                class="block w-full h-full cursor-pointer">
                @if (hasAdMedia('ad1')) {
                  @if (getAdMediaType('ad1') === 'image') {
                    <img
                      [src]="getAdMediaUrl('ad1')"
                      [alt]="getAdAltText('ad1')"
                      class="w-full h-full object-cover"
                    />
                  } @else if (getAdMediaType('ad1') === 'video') {
                    <video
                      #ad1VideoMobile
                      [src]="getAdMediaUrl('ad1')"
                      autoplay
                      muted
                      loop
                      playsinline
                      preload="auto"
                      (canplay)="onAdVideoCanPlay('ad1', $event)"
                      (error)="onAdVideoError('ad1', $event)"
                      (loadeddata)="onAdVideoLoaded('ad1', $event)"
                      class="w-full h-full object-cover"
                    ></video>
                  }
                } @else {
                  <div class="w-full h-full bg-white dark:bg-gray-800 flex items-center justify-center">
                    <span class="text-purple-600 dark:text-purple-400 font-semibold text-base sm:text-lg">Ad 1</span>
                  </div>
                }
              </a>
            </div>
          }

          <!-- Side News Items (2nd and 3rd News) -->
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
                      class="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                      loading="lazy"
                      decoding="async"
                      style="filter: none !important; -webkit-filter: none !important; backdrop-filter: none !important; blur: none !important; image-rendering: auto !important; -webkit-font-smoothing: antialiased; -moz-osx-font-smoothing: grayscale; backface-visibility: hidden; transform: translateZ(0); will-change: transform;" />
                  }
                  
                  <!-- Category Badge -->
                  @if (!isHomePage) {
                    <div class="absolute top-4 left-4 z-20 flex gap-2 flex-wrap">
                      @if (news.isTrending) {
                        <span class="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-black rounded-full bg-gradient-to-r from-purple-600 via-pink-500 to-fuchsia-600 text-white shadow-xl animate-pulse border-2 border-white/50 uppercase tracking-wider backdrop-blur-sm" style="font-family: 'Arial Black', 'Helvetica Neue', sans-serif; text-shadow: 2px 2px 4px rgba(0,0,0,0.5), 0 0 8px rgba(255,255,255,0.3); letter-spacing: 0.1em;">
                          <svg class="w-3.5 h-3.5 text-white flex-shrink-0" fill="currentColor" viewBox="0 0 24 24" style="filter: drop-shadow(0 1px 2px rgba(0,0,0,0.4));">
                            <path d="M13 10V3L4 14h7v7l9-11h-7z"/>
                          </svg>
                          <span class="text-xs leading-none">🔥</span>
                          <span>TRENDING</span>
                          <span class="text-xs leading-none">🔥</span>
                        </span>
                      }
                      @if (news.isBreaking) {
                        <span class="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-black rounded-full bg-gradient-to-r from-red-600 to-red-700 text-white shadow-xl animate-pulse border-2 border-white/50 uppercase tracking-wider backdrop-blur-sm" style="font-family: 'Arial Black', 'Helvetica Neue', sans-serif; text-shadow: 2px 2px 4px rgba(0,0,0,0.5), 0 0 8px rgba(255,255,255,0.3); letter-spacing: 0.1em;">
                          <svg class="w-3.5 h-3.5 text-white flex-shrink-0" fill="currentColor" viewBox="0 0 24 24" style="filter: drop-shadow(0 1px 2px rgba(0,0,0,0.4));">
                            <path d="M13 10V3L4 14h7v7l9-11h-7z"/>
                          </svg>
                          <span>BREAKING</span>
                        </span>
                      }
                      @if (news.isFeatured) {
                        <span class="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-black rounded-full bg-gradient-to-r from-yellow-500 to-amber-500 text-white shadow-xl border-2 border-white/50 uppercase tracking-wider backdrop-blur-sm" style="font-family: 'Arial Black', 'Helvetica Neue', sans-serif; text-shadow: 2px 2px 4px rgba(0,0,0,0.5), 0 0 8px rgba(255,255,255,0.3); letter-spacing: 0.1em;">
                          <svg class="w-3.5 h-3.5 text-white flex-shrink-0" fill="currentColor" viewBox="0 0 24 24" style="filter: drop-shadow(0 1px 2px rgba(0,0,0,0.4));">
                            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                          </svg>
                          <span>FEATURED</span>
                        </span>
                      }
                      <span [class]="'inline-flex items-center justify-center px-3 py-1 text-xs font-bold rounded-full shadow-lg text-white ' + getCategoryColor(news.category)">
                        {{ getCategoryName(news.category) }}
                      </span>
                    </div>
                  }
                </div>

                <!-- Bottom Section with Headline -->
                <div class="p-4 pt-5 pb-5 bg-gradient-to-br from-background to-secondary/30 border-t border-border/50 flex flex-col flex-1">
                  <div class="flex-1 min-w-0 mb-3">
                    <h3 
                      [class]="'font-display text-lg font-bold dark:font-normal leading-tight line-clamp-3 pb-1 min-h-[4rem] cursor-pointer hover:opacity-80 transition-all duration-300 hover:scale-[1.01] ' + (news.isTrending ? 'text-purple-700 dark:text-purple-300' : getHeadlineColor(news.category))"
                      (click)="openNewsModalFromSide(news, $index)"
                      (touchstart)="onTouchStartSide($event, news, $index)"
                      (touchend)="onTouchEndSide($event, news, $index)"
                      (touchmove)="onTouchMove($event)"
                      style="touch-action: pan-y;">
                      {{ getDisplayTitleForSide(news) }}
                    </h3>
                  </div>
                  <!-- Author and Date - Bottom aligned -->
                  <div class="flex items-center justify-between text-xs text-muted-foreground mt-auto pt-2 border-t border-border/30">
                    <span class="flex items-center gap-1">
                      <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                      <span class="text-left">{{ news.author || 'News Adda India' }}</span>
                    </span>
                    <span class="flex items-center gap-1">
                      <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span>{{ news.date || news.time || 'Just now' }}</span>
                    </span>
                  </div>
                </div>
              </article>
              
              <!-- Ad 2 - After 1st Side News (Mobile Only, Between 2nd and 3rd News) -->
              @if (i === 0 && isAdEnabled('ad2')) {
                <div class="w-full min-h-[200px] sm:min-h-[250px] rounded-lg overflow-hidden border-4 border-blue-500 dark:border-blue-400 shadow-lg">
                  <a
                    [href]="getAdLink('ad2') || 'javascript:void(0)'"
                    [target]="getAdLink('ad2') ? '_blank' : '_self'"
                    [rel]="getAdLink('ad2') ? 'noopener noreferrer' : ''"
                    class="block w-full h-full cursor-pointer">
                    @if (hasAdMedia('ad2')) {
                      @if (getAdMediaType('ad2') === 'image') {
                        <img
                          [src]="getAdMediaUrl('ad2')"
                          [alt]="getAdAltText('ad2')"
                          class="w-full h-full object-cover"
                        />
                      } @else if (getAdMediaType('ad2') === 'video') {
                        <video
                          #ad2VideoMobile
                          [src]="getAdMediaUrl('ad2')"
                          autoplay
                          muted
                          loop
                          playsinline
                          preload="auto"
                          (canplay)="onAdVideoCanPlay('ad2', $event)"
                          (error)="onAdVideoError('ad2', $event)"
                          (loadeddata)="onAdVideoLoaded('ad2', $event)"
                          class="w-full h-full object-cover"
                        ></video>
                      }
                    } @else {
                      <div class="w-full h-full bg-white dark:bg-gray-800 flex items-center justify-center">
                        <span class="text-purple-600 dark:text-purple-400 font-semibold text-base sm:text-lg">Ad 2</span>
                      </div>
                    }
                  </a>
                </div>
              }
          }
        </div>

        <!-- Desktop Layout: Grid -->
        <div class="hidden lg:grid lg:grid-cols-3 gap-6">
          <!-- Main Featured Article -->
          <div class="lg:col-span-2">
            <article class="group h-full relative overflow-hidden rounded-2xl bg-background shadow-lg hover:shadow-2xl transition-all duration-500 border border-border/50 flex flex-col">
              <div class="relative aspect-[16/9] overflow-hidden flex-shrink-0">
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
                    class="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                    loading="eager"
                    decoding="async"
                    style="filter: none !important; -webkit-filter: none !important; backdrop-filter: none !important; blur: none !important; image-rendering: auto !important; -webkit-font-smoothing: antialiased; -moz-osx-font-smoothing: grayscale; backface-visibility: hidden; transform: translateZ(0); will-change: transform;" />
                }
                <!-- Category Badge - Top Left -->
                @if (!isHomePage) {
                  <div class="absolute top-5 left-5 z-20 flex gap-2 flex-wrap">
                    @if (featuredNews.isTrending) {
                      <span class="inline-flex items-center justify-center gap-1.5 px-4 py-2 text-xs font-black rounded-full bg-gradient-to-r from-purple-600 via-pink-500 to-fuchsia-600 text-white shadow-xl animate-pulse border-2 border-white/50 uppercase tracking-wider backdrop-blur-sm" style="font-family: 'Arial Black', 'Helvetica Neue', sans-serif; text-shadow: 2px 2px 4px rgba(0,0,0,0.5), 0 0 8px rgba(255,255,255,0.3); letter-spacing: 0.1em;">
                        <svg class="w-4 h-4 text-white flex-shrink-0" fill="currentColor" viewBox="0 0 24 24" style="filter: drop-shadow(0 2px 3px rgba(0,0,0,0.4));">
                          <path d="M13 10V3L4 14h7v7l9-11h-7z"/>
                        </svg>
                        <span class="text-sm leading-none">🔥</span>
                        <span>TRENDING</span>
                        <span class="text-sm leading-none">🔥</span>
                      </span>
                    }
                    @if (featuredNews.isBreaking) {
                      <span class="inline-flex items-center justify-center gap-1.5 px-4 py-2 text-xs font-black rounded-full bg-gradient-to-r from-red-600 to-red-700 text-white shadow-xl animate-pulse border-2 border-white/50 uppercase tracking-wider backdrop-blur-sm" style="font-family: 'Arial Black', 'Helvetica Neue', sans-serif; text-shadow: 2px 2px 4px rgba(0,0,0,0.5), 0 0 8px rgba(255,255,255,0.3); letter-spacing: 0.1em;">
                        <svg class="w-4 h-4 text-white flex-shrink-0" fill="currentColor" viewBox="0 0 24 24" style="filter: drop-shadow(0 2px 3px rgba(0,0,0,0.4));">
                          <path d="M13 10V3L4 14h7v7l9-11h-7z"/>
                        </svg>
                        <span>{{ t.breaking }}</span>
                      </span>
                    }
                    @if (featuredNews.isFeatured) {
                      <span class="inline-flex items-center justify-center gap-1.5 px-4 py-2 text-xs font-black rounded-full bg-gradient-to-r from-yellow-500 to-amber-500 text-white shadow-xl border-2 border-white/50 uppercase tracking-wider backdrop-blur-sm" style="font-family: 'Arial Black', 'Helvetica Neue', sans-serif; text-shadow: 2px 2px 4px rgba(0,0,0,0.5), 0 0 8px rgba(255,255,255,0.3); letter-spacing: 0.1em;">
                        <svg class="w-4 h-4 text-white flex-shrink-0" fill="currentColor" viewBox="0 0 24 24" style="filter: drop-shadow(0 2px 3px rgba(0,0,0,0.4));">
                          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                        </svg>
                        <span>FEATURED</span>
                      </span>
                    }
                    <span [class]="'inline-flex items-center justify-center px-4 py-1.5 text-xs font-bold rounded-full shadow-lg text-white ' + getCategoryColor(featuredNews.category)">
                      {{ getCategoryName(featuredNews.category) }}
                    </span>
                  </div>
                }
              </div>

              <!-- Bottom Section with Headline and Read More -->
              <div class="p-6 pt-7 pb-7 bg-gradient-to-br from-background to-secondary/30 border-t border-border/50 flex flex-col flex-1 min-h-0">
                <div class="flex-1 min-w-0 mb-4 min-h-0">
                  <h2
                    [class]="'font-display text-3xl font-bold dark:font-normal leading-tight pb-1 min-h-[5rem] cursor-pointer hover:opacity-80 transition-all duration-300 hover:scale-[1.01] ' + (featuredNews.isTrending ? 'text-purple-700 dark:text-purple-300' : getHeadlineColor(featuredNews.category))"
                    (click)="openNewsModal(featuredNews)"
                    (touchstart)="onTouchStart($event, featuredNews)"
                    (touchend)="onTouchEnd($event, featuredNews)"
                    (touchmove)="onTouchMove($event)"
                    style="touch-action: pan-y;">
                    {{ getDisplayTitle(featuredNews) }}
                  </h2>
                  <p class="text-muted-foreground text-base mb-4 mt-3 pt-1 line-clamp-3 min-h-[4rem] leading-relaxed">
                    {{ featuredNews.excerpt }}
                  </p>
                </div>
                <!-- Author and Date - Bottom aligned -->
                <div class="flex items-center justify-between text-xs text-muted-foreground mt-auto pt-2 border-t border-border/30">
                  <span class="flex items-center gap-1">
                    <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                    <span class="text-left">{{ featuredNews.author || 'News Adda India' }}</span>
                  </span>
                  <span class="flex items-center gap-1">
                    <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span>{{ featuredNews.date || featuredNews.time || 'Just now' }}</span>
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
                      class="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                      loading="lazy"
                      decoding="async"
                      style="filter: none !important; -webkit-filter: none !important; backdrop-filter: none !important; blur: none !important; image-rendering: auto !important; -webkit-font-smoothing: antialiased; -moz-osx-font-smoothing: grayscale; backface-visibility: hidden; transform: translateZ(0); will-change: transform;" />
                  }
                  
                  <!-- Category Badge -->
                  @if (!isHomePage) {
                    <div class="absolute top-4 left-4 z-20 flex gap-2 flex-wrap">
                      @if (news.isTrending) {
                        <span class="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-black rounded-full bg-gradient-to-r from-purple-600 via-pink-500 to-fuchsia-600 text-white shadow-xl animate-pulse border-2 border-white/50 uppercase tracking-wider backdrop-blur-sm" style="font-family: 'Arial Black', 'Helvetica Neue', sans-serif; text-shadow: 2px 2px 4px rgba(0,0,0,0.5), 0 0 8px rgba(255,255,255,0.3); letter-spacing: 0.1em;">
                          <svg class="w-3.5 h-3.5 text-white flex-shrink-0" fill="currentColor" viewBox="0 0 24 24" style="filter: drop-shadow(0 1px 2px rgba(0,0,0,0.4));">
                            <path d="M13 10V3L4 14h7v7l9-11h-7z"/>
                          </svg>
                          <span class="text-xs leading-none">🔥</span>
                          <span>TRENDING</span>
                          <span class="text-xs leading-none">🔥</span>
                        </span>
                      }
                      @if (news.isBreaking) {
                        <span class="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-black rounded-full bg-gradient-to-r from-red-600 to-red-700 text-white shadow-xl animate-pulse border-2 border-white/50 uppercase tracking-wider backdrop-blur-sm" style="font-family: 'Arial Black', 'Helvetica Neue', sans-serif; text-shadow: 2px 2px 4px rgba(0,0,0,0.5), 0 0 8px rgba(255,255,255,0.3); letter-spacing: 0.1em;">
                          <svg class="w-3.5 h-3.5 text-white flex-shrink-0" fill="currentColor" viewBox="0 0 24 24" style="filter: drop-shadow(0 1px 2px rgba(0,0,0,0.4));">
                            <path d="M13 10V3L4 14h7v7l9-11h-7z"/>
                          </svg>
                          <span>BREAKING</span>
                        </span>
                      }
                      @if (news.isFeatured) {
                        <span class="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-black rounded-full bg-gradient-to-r from-yellow-500 to-amber-500 text-white shadow-xl border-2 border-white/50 uppercase tracking-wider backdrop-blur-sm" style="font-family: 'Arial Black', 'Helvetica Neue', sans-serif; text-shadow: 2px 2px 4px rgba(0,0,0,0.5), 0 0 8px rgba(255,255,255,0.3); letter-spacing: 0.1em;">
                          <svg class="w-3.5 h-3.5 text-white flex-shrink-0" fill="currentColor" viewBox="0 0 24 24" style="filter: drop-shadow(0 1px 2px rgba(0,0,0,0.4));">
                            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                          </svg>
                          <span>FEATURED</span>
                        </span>
                      }
                      <span [class]="'inline-flex items-center justify-center px-3 py-1 text-xs font-bold rounded-full shadow-lg text-white ' + getCategoryColor(news.category)">
                        {{ getCategoryName(news.category) }}
                      </span>
                    </div>
                  }
                </div>

                <!-- Bottom Section with Headline -->
                <div class="p-4 pt-5 pb-5 bg-gradient-to-br from-background to-secondary/30 border-t border-border/50 flex flex-col flex-1">
                  <div class="flex-1 min-w-0 mb-3">
                    <h3 
                      [class]="'font-display text-lg font-bold dark:font-normal leading-tight line-clamp-3 pb-1 min-h-[4rem] cursor-pointer hover:opacity-80 transition-all duration-300 hover:scale-[1.01] ' + (news.isTrending ? 'text-purple-700 dark:text-purple-300' : getHeadlineColor(news.category))"
                      (click)="openNewsModalFromSide(news, $index)"
                      (touchstart)="onTouchStartSide($event, news, $index)"
                      (touchend)="onTouchEndSide($event, news, $index)"
                      (touchmove)="onTouchMove($event)"
                      style="touch-action: pan-y;">
                      {{ getDisplayTitleForSide(news) }}
                    </h3>
                  </div>
                  <!-- Author and Date - Bottom aligned -->
                  <div class="flex items-center justify-between text-xs text-muted-foreground mt-auto pt-2 border-t border-border/30">
                    <span class="flex items-center gap-1">
                      <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                      <span class="text-left">{{ news.author || 'News Adda India' }}</span>
                    </span>
                    <span class="flex items-center gap-1">
                      <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span>{{ news.date || news.time || 'Just now' }}</span>
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
      author: 'News Adda India',
      date: new Date().toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' }),
      time: 'Just now'
    },
    {
      category: 'Business',
      title: 'Loading...',
      image: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=600&q=80',
      author: 'News Adda India',
      date: new Date().toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' }),
      time: 'Just now'
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
    private displayedNewsService: DisplayedNewsService,
    private router: Router,
    private adService: AdService
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
    // Always use regular headline for cards (trendingTitle is only for ticker)
    return this.languageService.getDisplayTitle(news.title, news.titleEn);
  }

  getDisplayTitleForSide(news: SideNews): string {
    // Always use regular headline for cards (trendingTitle is only for ticker)
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

    // Load breaking news for hero section - ONLY shows news with isBreaking: true
    // If no breaking news found, shows default/empty news
    this.newsService.fetchBreakingNews().subscribe({
      next: (news) => {
        // Only display if it's actually breaking news (isBreaking: true)
        // If no breaking news found, news will be default/empty
        if (!news.isBreaking && news.id) {
          console.warn('[HeroSection] Non-breaking news received, skipping display:', {
            id: news.id,
            title: news.title,
            isBreaking: news.isBreaking
          });
          // Don't display non-breaking news in breaking news section
          return;
        }

        // Ensure titleEn is set (for translation)
        if (!news.titleEn) {
          news.titleEn = news.title;
        }

        // News is already translated by the service, so use it directly
        this.featuredNews = news;
        
        // Register this article as displayed to prevent duplicates
        if (news.id) {
          this.displayedNewsService.registerDisplayed(news.id);
        }
        
        // Log trending news in featured section
        if (news.isTrending) {
          console.log('🔥 HERO SECTION - Featured News is Trending:', {
            id: news.id,
            title: news.title,
            trendingTitle: news.trendingTitle || 'N/A',
            category: news.category,
            displayTitle: this.getDisplayTitle(news),
            isTrending: news.isTrending
          });
        }

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
        // Filter out already displayed articles
        const filteredNews = this.displayedNewsService.filterDisplayed(news);
        
        // Register side news articles as displayed
        const sideNewsIds = filteredNews.map(n => n.id).filter(id => id !== undefined) as (string | number)[];
        this.displayedNewsService.registerDisplayedMultiple(sideNewsIds);
        
        this.sideNews = filteredNews.map((n, index) => {
          const sideNewsItem = {
            category: n.category,
            title: n.title,
            image: '',
            tags: (n as any).tags || [],
            id: n.id,
            date: n.date,
            time: n.time,
            author: n.author,
            imageLoading: true,
            isTrending: n.isTrending || false,
            isBreaking: n.isBreaking || false,
            isFeatured: n.isFeatured || false,
            trendingTitle: (n as any).trendingTitle || undefined
          };
          
          // Log trending news in side news
          if (sideNewsItem.isTrending) {
            console.log('🔥 HERO SECTION - Side News is Trending:', {
              id: sideNewsItem.id,
              title: sideNewsItem.title,
              trendingTitle: sideNewsItem.trendingTitle || 'N/A',
              category: sideNewsItem.category,
              displayTitle: this.getDisplayTitleForSide(sideNewsItem),
              isTrending: sideNewsItem.isTrending
            });
          }

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

        // OPTIMIZATION: Reduced timeout from 15s to 8s
        const timeoutPromise = new Promise<void>((resolve) => {
          setTimeout(() => {
            console.warn('Hero section image loading timeout - showing page anyway');
            resolve();
          }, 8000); // 8 second timeout (reduced from 15s)
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
    const isBreaking = news.isBreaking || false;
    console.log('[HeroSection] Opening modal with featured news:', news);
    console.log('[HeroSection] Tags in featured news:', (news as any).tags);
    this.modalService.openModal(news, isBreaking);
  }

  openNewsModalFromSide(sideNews: SideNews, index: number) {
    // Convert SideNews to NewsArticle format
    const newsArticle: NewsArticle = {
      id: sideNews.id || (index + 1000), // Use actual ID if available, otherwise temporary ID
      category: sideNews.category,
      title: sideNews.title,
      titleEn: sideNews.title,
      excerpt: sideNews.title, // Use title as excerpt for side news
      image: sideNews.image,
      imageLoading: sideNews.imageLoading || false,
      time: sideNews.time || '2 hours ago',
      author: sideNews.author || 'News Adda India',
      date: sideNews.date || new Date().toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' }),
      isTrending: sideNews.isTrending,
      isBreaking: sideNews.isBreaking,
      isFeatured: sideNews.isFeatured,
      trendingTitle: sideNews.trendingTitle
    };
    // Include tags if available
    if (sideNews.tags && sideNews.tags.length > 0) {
      (newsArticle as any).tags = sideNews.tags;
    }
    console.log('[HeroSection] Opening modal with newsArticle:', newsArticle);
    console.log('[HeroSection] Tags in newsArticle:', (newsArticle as any).tags);
    this.modalService.openModal(newsArticle, sideNews.isBreaking || false);
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

  // Ad service helper methods
  isAdEnabled(adId: string): boolean {
    return this.adService.isAdEnabled(adId);
  }

  getAdMediaUrl(adId: string): string | null {
    return this.adService.getAdMediaUrl(adId);
  }

  getAdLink(adId: string): string | null {
    return this.adService.getAdLink(adId);
  }

  getAdAltText(adId: string): string {
    return this.adService.getAdAltText(adId);
  }

  getAdMediaType(adId: string): 'image' | 'video' | null {
    return this.adService.getAdMediaType(adId);
  }

  hasAdMedia(adId: string): boolean {
    return this.adService.hasAdMedia(adId);
  }

  onAdVideoCanPlay(adId: string, event: Event) {
    const video = event.target as HTMLVideoElement;
    if (video) {
      // Ensure video is muted for autoplay
      video.muted = true;
      // Try to play the video
      const playPromise = video.play();
      if (playPromise !== undefined) {
        playPromise.catch((error) => {
          console.warn(`[HeroSection] Autoplay prevented for ${adId}:`, error);
        });
      }
    }
  }

  onAdVideoLoaded(adId: string, event: Event) {
    const video = event.target as HTMLVideoElement;
    if (video) {
      // Ensure video is muted and try to play
      video.muted = true;
      video.play().catch((error) => {
        console.warn(`[HeroSection] Video play failed for ${adId}:`, error);
      });
    }
  }

  onAdVideoError(adId: string, event: Event) {
    const video = event.target as HTMLVideoElement;
    console.error(`[HeroSection] Video error for ${adId}:`, {
      error: video?.error,
      code: video?.error?.code,
      message: video?.error?.message,
      src: video?.src
    });
  }

}

