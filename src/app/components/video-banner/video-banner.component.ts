import { Component, ViewChild, ElementRef, OnInit, AfterViewInit, ChangeDetectorRef, Input, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { InstagramService } from '../../services/instagram.service';
import { YouTubeService } from '../../services/youtube.service';

@Component({
  selector: 'app-video-banner',
  standalone: true,
  imports: [CommonModule],
  template: `
    <section class="relative w-full overflow-hidden bg-secondary/20">
      <div 
        class="relative w-full h-[264px] md:h-[396px] lg:h-[528px] cursor-pointer"
        (click)="redirectToYouTube()">
        <video
          #videoPlayer
          class="w-full h-full object-cover pointer-events-none transition-all duration-500"
          [class.opacity-0]="isLoading"
          autoplay
          muted
          playsinline
          preload="auto"
          (canplay)="onVideoCanPlay()"
          (playing)="onVideoPlaying()"
          (timeupdate)="onTimeUpdate()"
          (error)="onVideoError($event)"
          (loadeddata)="onVideoLoadedData()"
          (ended)="onVideoEnded()">
          <source [src]="videoUrl" type="video/mp4" />
          Your browser does not support the video tag.
        </video>
        
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
  styles: []
})
export class VideoBannerComponent implements OnInit, AfterViewInit, OnChanges {
  @ViewChild('videoPlayer') videoPlayer!: ElementRef<HTMLVideoElement>;
  @Input() imagesLoaded: boolean = false; // Input to know when images are loaded

  // Video URL - Fallback to local video file
  videoUrl = 'assets/videos/Video-279.mp4';

  // Audio state - starts muted for autoplay, then attempts to unmute
  isMuted = true;
  private shouldBeUnmuted = false; // Track desired unmuted state

  // Loading state
  isLoading = true;

  // Control when video can start (only after images are loaded)
  canStartVideo = false;
  private hasStartedPlaying = false; // Prevent multiple play attempts


  // Video loop control
  private readonly PAUSE_DURATION = 3000; // 3 seconds pause before looping
  private pauseTimer: any = null; // Timer for pause before looping back
  private isPausedForLoop = false; // Track if video is paused for looping
  private youtubeWindow: Window | null = null; // Track opened YouTube window to prevent duplicates

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
    // Keep video muted by default
    this.shouldBeUnmuted = false;

    // Attempt to fetch the latest Instagram reel
    this.instagramService.getLatestReelVideoUrl().subscribe(
      (reelVideoUrl) => {
        if (reelVideoUrl) {
          this.videoUrl = reelVideoUrl;
          this.isLoading = true; // Reset loading state when URL changes
          console.log('Using latest Instagram reel:', reelVideoUrl);
        } else {
          console.log('Using fallback video:', this.videoUrl);
        }
      }
    );

    // Fetch the latest YouTube video URL
    this.youtubeService.getLatestVideoUrl().subscribe(
      (latestVideoUrl) => {
        if (latestVideoUrl) {
          this.youtubeLatestVideoUrl = latestVideoUrl;
          console.log('Latest YouTube video URL:', latestVideoUrl);
        } else {
          // Fallback to channel URL if we can't fetch latest video
          this.youtubeLatestVideoUrl = this.youtubeUrl;
          console.log('Using channel URL as fallback:', this.youtubeUrl);
        }
      }
    );
  }

  ngAfterViewInit() {
    // Ensure video element is properly initialized
    if (this.videoPlayer?.nativeElement) {
      const video = this.videoPlayer.nativeElement;
      video.muted = true;
      this.isMuted = true;
      video.loop = false;

      // Load the video source
      video.load();

      console.log('Video element initialized, URL:', this.videoUrl);
      console.log('Video readyState:', video.readyState);
      console.log('Images loaded:', this.imagesLoaded);

      // If images are already loaded, start playback
      if (this.imagesLoaded && !this.hasStartedPlaying) {
        this.canStartVideo = true;
        // Small delay to ensure video is loaded
        setTimeout(() => {
          if (!this.hasStartedPlaying) {
            this.hasStartedPlaying = true;
            this.startVideoPlayback();
          }
        }, 500);
      } else {
        console.log('Waiting for images to load before starting video');
      }
    } else {
      console.error('Video player element not found in ngAfterViewInit');
    }
  }

  ngOnChanges(changes: SimpleChanges) {
    // When images are loaded, allow video to start
    if (changes['imagesLoaded'] && changes['imagesLoaded'].currentValue === true && !this.hasStartedPlaying) {
      this.canStartVideo = true;
      // Start the video if it's ready
      if (this.videoPlayer?.nativeElement) {
        const video = this.videoPlayer.nativeElement;
        // Ensure video is muted for autoplay
        video.muted = true;
        this.isMuted = true;

        // Check if video is ready to play
        if (video.readyState >= 3 && !this.hasStartedPlaying) { // HAVE_FUTURE_DATA or higher
          this.hasStartedPlaying = true;
          this.startVideoPlayback();
        }
        // Note: onVideoCanPlay() will handle the case when video becomes ready
      }
    }
  }

  toggleAudio(event: Event) {
    event.stopPropagation(); // Prevent triggering the click on the video container
    this.isMuted = !this.isMuted;
    if (this.videoPlayer?.nativeElement) {
      this.videoPlayer.nativeElement.muted = this.isMuted;
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

  onVideoLoadedData() {
    // Video data loaded, set initial time
    if (this.videoPlayer?.nativeElement) {
      const video = this.videoPlayer.nativeElement;
      // Ensure video is muted for autoplay
      video.muted = true;
      this.isMuted = true;

      // Explicitly disable looping (we handle looping manually)
      video.loop = false;

      // Clear any existing pause timer
      if (this.pauseTimer) {
        clearTimeout(this.pauseTimer);
        this.pauseTimer = null;
      }

      // Start from beginning
      video.currentTime = 0;
      console.log('Video loaded, ready to play from start');
    }
  }

  onVideoCanPlay() {
    // Video is ready to play - only start once
    if (this.hasStartedPlaying) {
      return; // Already started, prevent loop
    }

    console.log('Video can play');
    if (this.videoPlayer?.nativeElement) {
      const video = this.videoPlayer.nativeElement;

      // Ensure video is muted for autoplay
      video.muted = true;
      this.isMuted = true;

      // Explicitly disable automatic looping (we handle looping manually)
      video.loop = false;

      // Clear any existing pause timer
      if (this.pauseTimer) {
        clearTimeout(this.pauseTimer);
        this.pauseTimer = null;
      }

      // Start video if images are loaded and not already started
      if (this.imagesLoaded && this.canStartVideo && !this.hasStartedPlaying) {
        this.hasStartedPlaying = true; // Mark as started
        // Small delay to ensure everything is ready
        setTimeout(() => {
          this.startVideoPlayback();
        }, 100);
      }
    }
  }

  private startVideoPlayback() {
    if (!this.videoPlayer?.nativeElement) {
      console.warn('Video player element not found');
      return;
    }

    if (!this.imagesLoaded) {
      console.log('Waiting for images to load before starting video');
      return;
    }

    const video = this.videoPlayer.nativeElement;

    // Don't restart if already playing
    if (!video.paused && video.currentTime > 0) {
      console.log('Video is already playing, skipping restart');
      return;
    }

    // Ensure video is properly configured
    video.muted = true;
    this.isMuted = true;
    video.loop = false; // We handle looping manually

    // Ensure video starts from beginning
    if (video.currentTime > 0) {
      video.currentTime = 0;
    }

    // Try to play the video
    const playPromise = video.play();

    if (playPromise !== undefined) {
      playPromise
        .then(() => {
          console.log('Video playing from start - will loop after completion');
          this.isLoading = false;
          this.isPausedForLoop = false;
          this.canStartVideo = true;
        })
        .catch((error) => {
          console.error('Error playing video:', error);
          console.warn('Autoplay may be prevented by browser. Video will need user interaction to play.');
          // Reset flag on error so it can retry
          this.hasStartedPlaying = false;
          // Hide loading even if autoplay fails
          this.isLoading = false;
        });
    } else {
      // Fallback for older browsers
      console.log('Video play() returned undefined, using fallback');
      this.isLoading = false;
    }
  }

  onVideoPlaying() {
    // Video started playing, now attempt to unmute if desired
    if (this.shouldBeUnmuted && this.videoPlayer?.nativeElement) {
      const video = this.videoPlayer.nativeElement;
      // Attempt to unmute after video starts playing
      video.muted = false;
      this.isMuted = false;
    }
  }

  onTimeUpdate() {
    if (!this.videoPlayer?.nativeElement) return;

    const video = this.videoPlayer.nativeElement;
    const currentTime = video.currentTime;
    const duration = video.duration;

    // Check if video has reached the end (within 0.5 seconds of duration)
    if (duration > 0 && currentTime >= duration - 0.5 && !this.pauseTimer && !this.isPausedForLoop) {
      console.log('Video reached end, pausing for 3 seconds before looping');
      video.pause();
      this.isPausedForLoop = true;
      video.loop = false; // Ensure no automatic looping

      // Wait 3 seconds before looping back to start
      this.pauseTimer = setTimeout(() => {
        console.log('3-second pause completed, looping back to start');
        video.currentTime = 0;
        this.isPausedForLoop = false;
        video.play().catch((error) => {
          console.warn('Error playing video after pause:', error);
        });
        this.pauseTimer = null;
      }, this.PAUSE_DURATION);
    }
  }

  onVideoEnded() {
    // Video ended event - pause and restart after 3 seconds
    if (this.videoPlayer?.nativeElement && !this.pauseTimer) {
      const video = this.videoPlayer.nativeElement;
      video.loop = false;
      this.isPausedForLoop = true;

      console.log('Video ended, pausing for 3 seconds before looping');

      // Wait 3 seconds before looping back to start
      this.pauseTimer = setTimeout(() => {
        console.log('3-second pause completed, restarting video');
        video.currentTime = 0;
        this.isPausedForLoop = false;
        video.play().catch((error) => {
          console.warn('Error playing video after end:', error);
        });
        this.pauseTimer = null;
      }, this.PAUSE_DURATION);
    }
  }


  onVideoError(event: any) {
    // Handle video loading error
    const video = this.videoPlayer?.nativeElement;
    if (video) {
      console.error('Video error details:', {
        error: video.error,
        code: video.error?.code,
        message: video.error?.message,
        networkState: video.networkState,
        readyState: video.readyState,
        src: video.src || video.currentSrc,
        videoUrl: this.videoUrl
      });
    }
    console.warn('Video banner failed to load. Please check the video file path:', this.videoUrl);
    // Hide loading animation even on error
    this.isLoading = false;
  }
}

