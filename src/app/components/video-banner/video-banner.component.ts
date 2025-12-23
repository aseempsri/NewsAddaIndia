import { Component, OnInit, AfterViewInit, ChangeDetectorRef, Input, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { InstagramService } from '../../services/instagram.service';
import { YouTubeService } from '../../services/youtube.service';

// YouTube IFrame API types
declare var YT: any;

@Component({
  selector: 'app-video-banner',
  standalone: true,
  imports: [CommonModule],
  template: `
    <section class="relative w-full overflow-hidden bg-secondary/20">
      <div 
        class="relative w-full h-[264px] md:h-[396px] lg:h-[528px] cursor-pointer"
        (click)="redirectToYouTube()">
        <!-- YouTube iframe embed -->
        @if (youtubeVideoId) {
          <div 
            id="youtube-player"
            class="w-full h-full transition-all duration-500 pointer-events-none"
            [class.opacity-0]="isLoading"
            [class.blur-xl]="showBlurOverlay">
          </div>
        } @else if (!isLoading && !youtubeVideoId) {
          <!-- Fallback: Show channel link when video can't be loaded -->
          <div class="w-full h-full bg-gradient-to-br from-red-600 to-red-800 flex items-center justify-center">
            <div class="text-center text-white p-8">
              <svg class="w-16 h-16 mx-auto mb-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
              </svg>
              <h3 class="text-xl font-bold mb-2">Watch Latest News</h3>
              <p class="text-sm opacity-90">Click to visit our YouTube channel</p>
            </div>
          </div>
        } @else {
          <!-- Loading state -->
          <div class="w-full h-full bg-secondary/30 flex items-center justify-center">
            <div class="flex flex-col items-center gap-4">
              <div class="relative w-16 h-16">
                <div class="absolute inset-0 border-4 border-primary/20 rounded-full"></div>
                <div class="absolute inset-0 border-4 border-transparent border-t-primary rounded-full animate-spin"></div>
              </div>
              <p class="text-muted-foreground">Loading video...</p>
            </div>
          </div>
        }
        
        <!-- Loading Animation -->
        @if (isLoading) {
          <div class="absolute inset-0 flex items-center justify-center bg-secondary/30 backdrop-blur-sm z-20">
            <div class="flex flex-col items-center gap-4">
              <!-- Spinner -->
              <div class="relative w-16 h-16">
                <div class="absolute inset-0 border-4 border-primary/20 rounded-full"></div>
                <div class="absolute inset-0 border-4 border-transparent border-t-primary rounded-full animate-spin"></div>
              </div>
              <!-- Loading text (optional) -->
              <p class="text-sm text-foreground/70 font-medium">Loading video...</p>
            </div>
          </div>
        }
        
        <!-- Overlay gradient for visual depth -->
        <div class="absolute inset-0 bg-gradient-to-b from-background/30 via-transparent to-background/30 pointer-events-none"></div>
        
        <!-- Subtle shimmer effect -->
        <div class="absolute inset-0 opacity-5 bg-[radial-gradient(circle_at_50%_50%,rgba(255,255,255,0.2),transparent_70%)] pointer-events-none"></div>
        
        <!-- Blur Overlay Modal (shown after 20 seconds) - Only on video banner section -->
        @if (showBlurOverlay) {
          <div class="absolute inset-0 z-30 flex items-center justify-center" (click)="closeModal()">
            <!-- Backdrop -->
            <div class="absolute inset-0 bg-background/95 backdrop-blur-xl"></div>
            <!-- Modal Content -->
            <div class="relative z-40 bg-background border-2 border-primary rounded-xl p-8 max-w-md w-full mx-4 shadow-2xl" (click)="$event.stopPropagation()">
              <div class="text-center">
              <h3 class="text-2xl md:text-3xl font-bold text-foreground mb-4">
                Watch latest news on youtube
              </h3>
              <p class="text-muted-foreground mb-6">
                Continue watching on YouTube
              </p>
                <button 
                  (click)="closeModalAndRedirect($event)" 
                  class="w-full px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors font-semibold">
                  Watch on YouTube
                </button>
              </div>
            </div>
          </div>
        }
        
        <!-- Social Media Icons (Left side) -->
        <div class="absolute bottom-4 left-4 z-10 flex items-center gap-3" [class.opacity-0]="isLoading">
          <a [href]="instagramUrl" target="_blank" rel="noopener noreferrer" 
             (click)="$event.stopPropagation()"
             class="w-12 h-12 rounded-full bg-background/80 backdrop-blur-sm border border-border/50 flex items-center justify-center text-foreground hover:bg-background hover:border-primary transition-all duration-300 shadow-[0_0_15px_rgba(225,48,108,0.5)] hover:shadow-[0_0_20px_rgba(225,48,108,0.7)] group"
             title="Instagram">
            <svg class="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
            </svg>
          </a>
          <a [href]="youtubeUrl" target="_blank" rel="noopener noreferrer"
             (click)="$event.stopPropagation()"
             class="w-12 h-12 rounded-full bg-background/80 backdrop-blur-sm border border-border/50 flex items-center justify-center text-foreground hover:bg-background hover:border-primary transition-all duration-300 shadow-[0_0_15px_rgba(255,0,0,0.5)] hover:shadow-[0_0_20px_rgba(255,0,0,0.7)] group"
             title="YouTube">
            <svg class="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
              <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
            </svg>
          </a>
          <a [href]="twitterUrl" target="_blank" rel="noopener noreferrer"
             (click)="$event.stopPropagation()"
             class="w-12 h-12 rounded-full bg-background/80 backdrop-blur-sm border border-border/50 flex items-center justify-center text-foreground hover:bg-background hover:border-primary transition-all duration-300 shadow-[0_0_15px_rgba(29,161,242,0.5)] hover:shadow-[0_0_20px_rgba(29,161,242,0.7)] group"
             title="Twitter">
            <svg class="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
              <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z"/>
            </svg>
          </a>
          <a [href]="facebookUrl" target="_blank" rel="noopener noreferrer"
             (click)="$event.stopPropagation()"
             class="w-12 h-12 rounded-full bg-background/80 backdrop-blur-sm border border-border/50 flex items-center justify-center text-foreground hover:bg-background hover:border-primary transition-all duration-300 shadow-[0_0_15px_rgba(24,119,242,0.5)] hover:shadow-[0_0_20px_rgba(24,119,242,0.7)] group"
             title="Facebook">
            <svg class="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
              <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
            </svg>
          </a>
        </div>
        
        <!-- Audio Toggle Button -->
        <button
          (click)="toggleAudio($event)"
          class="absolute bottom-4 right-4 z-10 w-[67px] h-[67px] rounded-full bg-background/80 backdrop-blur-sm border border-border/50 flex items-center justify-center text-foreground hover:bg-background hover:border-primary transition-all duration-300 shadow-[0_0_20px_rgba(59,130,246,0.6)] hover:shadow-[0_0_25px_rgba(59,130,246,0.8)] group"
          [class.opacity-0]="isLoading"
          [attr.aria-label]="isMuted ? 'Unmute video' : 'Mute video'"
          title="{{ isMuted ? 'Unmute' : 'Mute' }}">
          @if (isMuted) {
            <svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2" />
            </svg>
          } @else {
            <svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 14.142M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
            </svg>
          }
        </button>
      </div>
    </section>
  `,
  styles: [`
    #youtube-player iframe {
      width: 100% !important;
      height: 100% !important;
      object-fit: cover;
    }
  `]
})
export class VideoBannerComponent implements OnInit, AfterViewInit, OnChanges {
  @Input() imagesLoaded: boolean = false; // Input to know when images are loaded

  // YouTube video ID and embed URL
  youtubeVideoId: string | null = null;
  youtubeEmbedUrl: string | null = null;

  // Audio state - starts muted for autoplay
  isMuted = true;

  // Loading state
  isLoading = true;
  
  // Control when video can start (only after images are loaded)
  canStartVideo = false;

  // Video segment control
  // Play from 4:19 (259s) to 4:28 (268s)
  private readonly VIDEO_START = 259; // 4:19 in seconds
  private readonly VIDEO_END = 268; // 4:28 in seconds
  private readonly PAUSE_DURATION = 3000; // 3 seconds pause before showing modal
  showBlurOverlay = false; // Track if we should show blur overlay (public for template access)
  private modalTimer: any = null; // Timer to show modal as fallback
  private pauseTimer: any = null; // Timer for 2-second pause before showing modal
  private youtubeWindow: Window | null = null; // Track opened YouTube window to prevent duplicates
  private youtubePlayer: any = null; // YouTube player instance

  // Social Media URLs
  instagramUrl = 'https://www.instagram.com/newsaddaindialive/';
  youtubeUrl = 'https://www.youtube.com/@newsaddaindialive';
  youtubeLatestVideoUrl: string | null = null; // Latest video URL (will be fetched)
  twitterUrl = 'https://twitter.com/NewsAddaIndia1';
  facebookUrl = 'https://facebook.com/InfoNewsaddaindia';

  constructor(
    private instagramService: InstagramService,
    private youtubeService: YouTubeService,
    private cdr: ChangeDetectorRef
  ) { }

  ngOnInit() {
    // Default video ID - update this when you upload a new video
    const defaultVideoId = 'yllJ8l6B6r8';
    
    // Fetch the latest YouTube video URL and set up embed
    this.youtubeService.getLatestVideoUrl().subscribe(
      (latestVideoUrl) => {
        if (latestVideoUrl) {
          this.youtubeLatestVideoUrl = latestVideoUrl;
          // Extract video ID from URL
          const videoId = this.extractVideoIdFromUrl(latestVideoUrl);
          if (videoId) {
            this.setupYouTubePlayer(videoId);
          } else {
            console.error('Could not extract video ID from URL:', latestVideoUrl);
            // Use default video as fallback
            this.setupYouTubePlayer(defaultVideoId);
          }
        } else {
          // Fallback: Use default video ID
          console.log('Could not fetch latest video, using default video ID:', defaultVideoId);
          this.youtubeLatestVideoUrl = `https://www.youtube.com/watch?v=${defaultVideoId}`;
          this.setupYouTubePlayer(defaultVideoId);
        }
      },
      (error) => {
        // On error, use default video ID
        console.warn('Error fetching latest video, using default video ID:', defaultVideoId);
        this.youtubeLatestVideoUrl = `https://www.youtube.com/watch?v=${defaultVideoId}`;
        this.setupYouTubePlayer(defaultVideoId);
      }
    );
  }

  /**
   * Setup YouTube player with given video ID
   */
  private setupYouTubePlayer(videoId: string) {
    this.youtubeVideoId = videoId;
    // Create embed URL with autoplay, mute, and start time
    this.youtubeEmbedUrl = `https://www.youtube.com/embed/${videoId}?autoplay=1&mute=1&start=${this.VIDEO_START}&end=${this.VIDEO_END}&controls=0&modestbranding=1&rel=0&playsinline=1&enablejsapi=1&origin=${window.location.origin}`;
    console.log('YouTube video ID:', videoId);
    console.log('YouTube embed URL:', this.youtubeEmbedUrl);
    
    // Load YouTube IFrame API
    this.loadYouTubeAPI();
  }

  /**
   * Extract video ID from YouTube URL
   */
  private extractVideoIdFromUrl(url: string): string | null {
    if (!url) return null;
    
    const patterns = [
      /[?&]v=([a-zA-Z0-9_-]{11})/,  // ?v=VIDEO_ID or &v=VIDEO_ID
      /youtu\.be\/([a-zA-Z0-9_-]{11})/,  // youtu.be/VIDEO_ID
      /\/embed\/([a-zA-Z0-9_-]{11})/,   // /embed/VIDEO_ID
    ];

    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match && match[1]) {
        return match[1];
      }
    }

    return null;
  }

  /**
   * Load YouTube IFrame API
   */
  private loadYouTubeAPI() {
    // Check if API is already loaded
    if ((window as any).YT && (window as any).YT.Player) {
      this.initializeYouTubePlayer();
      return;
    }

    // Load the API script
    const tag = document.createElement('script');
    tag.src = 'https://www.youtube.com/iframe_api';
    const firstScriptTag = document.getElementsByTagName('script')[0];
    firstScriptTag.parentNode?.insertBefore(tag, firstScriptTag);

    // Set up callback for when API is ready
    (window as any).onYouTubeIframeAPIReady = () => {
      this.initializeYouTubePlayer();
    };
  }

  /**
   * Initialize YouTube player
   */
  private initializeYouTubePlayer() {
    if (!this.youtubeVideoId) return;

    // Wait for images to load before initializing player
    if (!this.imagesLoaded) {
      // Check periodically if images are loaded
      const checkInterval = setInterval(() => {
        if (this.imagesLoaded) {
          clearInterval(checkInterval);
          this.createYouTubePlayer();
        }
      }, 100);
      return;
    }

    this.createYouTubePlayer();
  }

  /**
   * Create YouTube player instance
   */
  private createYouTubePlayer() {
    if (!this.youtubeVideoId || this.youtubePlayer) return;

    const YT = (window as any).YT;
    if (!YT || !YT.Player) {
      console.error('YouTube IFrame API not loaded');
      return;
    }

    this.youtubePlayer = new YT.Player('youtube-player', {
      videoId: this.youtubeVideoId,
      playerVars: {
        autoplay: 1,
        mute: 1,
        start: this.VIDEO_START,
        end: this.VIDEO_END,
        controls: 0,
        modestbranding: 1,
        rel: 0,
        playsinline: 1,
        enablejsapi: 1,
        origin: window.location.origin
      },
      events: {
        onReady: (event: any) => {
          console.log('YouTube player ready');
          this.isLoading = false;
          this.cdr.detectChanges();
          
          // Start video playback
          if (this.imagesLoaded) {
            event.target.playVideo();
            this.startVideoPlayback();
          }
        },
        onStateChange: (event: any) => {
          // YT.PlayerState.PLAYING = 1
          // YT.PlayerState.PAUSED = 2
          // YT.PlayerState.ENDED = 0
          if (event.data === 1) { // Playing
            this.isLoading = false;
            this.cdr.detectChanges();
          } else if (event.data === 0) { // Ended
            this.onVideoEnded();
          }
        },
        onError: (event: any) => {
          console.error('YouTube player error:', event.data);
          this.onVideoError();
        }
      }
    });
  }

  ngAfterViewInit() {
    // YouTube player will be initialized when API loads and video ID is available
  }

  ngOnChanges(changes: SimpleChanges) {
    // When images are loaded, allow video to start
    if (changes['imagesLoaded'] && changes['imagesLoaded'].currentValue === true) {
      this.canStartVideo = true;
      // Initialize YouTube player if video ID is available
      if (this.youtubeVideoId && !this.youtubePlayer) {
        this.initializeYouTubePlayer();
      } else if (this.youtubePlayer) {
        // Player already exists, start playback
        this.startVideoPlayback();
      }
    }
  }

  toggleAudio(event: Event) {
    event.stopPropagation(); // Prevent triggering the click on the video container
    this.isMuted = !this.isMuted;
    if (this.youtubePlayer) {
      if (this.isMuted) {
        this.youtubePlayer.mute();
      } else {
        this.youtubePlayer.unMute();
      }
    }
  }

  redirectToYouTube() {
    // Use latest video URL if available, otherwise fallback to channel URL
    const urlToOpen = this.youtubeLatestVideoUrl || this.youtubeUrl;
    
    // Open YouTube link in a new tab (only if not already opened)
    if (!this.youtubeWindow || this.youtubeWindow.closed) {
      this.youtubeWindow = window.open(urlToOpen, '_blank', 'noopener,noreferrer');
    }
  }


  private startVideoPlayback() {
    if (!this.youtubePlayer || !this.imagesLoaded) {
      return;
    }

    // Set a fallback timer to show modal after 9 seconds (video play) + 3 seconds (pause) = 12 seconds total
    this.modalTimer = setTimeout(() => {
      if (!this.showBlurOverlay && !this.pauseTimer && this.youtubePlayer) {
        console.log('Fallback timer: Showing modal after 12 seconds (9s play + 3s pause)');
        this.youtubePlayer.pauseVideo();
        this.showBlurOverlay = true;
        this.cdr.detectChanges();
      }
    }, 12000); // 12 seconds total (9 seconds video + 3 seconds pause)

    // YouTube player will handle playback automatically
    // The onStateChange event will handle the rest
  }

  onVideoEnded() {
    // Video ended (reached end time), pause and show modal after delay
    if (this.youtubePlayer && !this.showBlurOverlay && !this.pauseTimer) {
      console.log('Video reached end time, pausing for 3 seconds before showing modal');
      this.youtubePlayer.pauseVideo();

      // Clear the fallback timer since we're handling it now
      if (this.modalTimer) {
        clearTimeout(this.modalTimer);
        this.modalTimer = null;
      }

      // Wait 3 seconds before showing modal
      this.pauseTimer = setTimeout(() => {
        console.log('3-second pause completed, showing modal');
        this.showBlurOverlay = true;
        this.pauseTimer = null;
        this.cdr.detectChanges();
      }, this.PAUSE_DURATION);
    }
  }

  closeModal() {
    this.showBlurOverlay = false;
    this.cdr.detectChanges();
    // Clear timers if modal is closed manually
    if (this.modalTimer) {
      clearTimeout(this.modalTimer);
      this.modalTimer = null;
    }
    if (this.pauseTimer) {
      clearTimeout(this.pauseTimer);
      this.pauseTimer = null;
    }
  }

  closeModalAndRedirect(event: Event) {
    event.stopPropagation(); // Prevent event bubbling
    this.closeModal();
    this.redirectToYouTube();
  }

  onVideoError() {
    // Handle YouTube player error (handled in onError event callback)
    console.warn('YouTube video failed to load.');
    this.isLoading = false;
    this.cdr.detectChanges();
  }
}

