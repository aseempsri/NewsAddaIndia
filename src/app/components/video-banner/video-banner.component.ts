import { Component, ViewChild, ElementRef, OnInit, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { InstagramService } from '../../services/instagram.service';

@Component({
  selector: 'app-video-banner',
  standalone: true,
  imports: [CommonModule],
  template: `
    <section class="relative w-full overflow-hidden bg-secondary/20">
      <div 
        class="relative w-full h-[264px] md:h-[396px] lg:h-[528px] cursor-pointer"
        (click)="redirectToInstagram()">
        <video
          #videoPlayer
          class="w-full h-full object-cover pointer-events-none"
          [class.opacity-0]="isLoading"
          autoplay
          muted
          playsinline
          (canplay)="onVideoCanPlay()"
          (playing)="onVideoPlaying()"
          (timeupdate)="onTimeUpdate()"
          (error)="onVideoError()"
          (loadeddata)="onVideoLoadedData()">
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
        
        <!-- Social Media Links Modal (shown if pop-ups are blocked) -->
        @if (showSocialModal) {
          <div class="absolute inset-0 bg-background/95 backdrop-blur-md z-30 flex items-center justify-center p-4" (click)="closeModal($event)">
            <div class="bg-background border border-border rounded-xl p-6 max-w-md w-full shadow-2xl" (click)="$event.stopPropagation()">
              <h3 class="text-xl font-bold mb-4 text-center">Follow Us on Social Media</h3>
              <div class="space-y-3">
                <a [href]="instagramUrl" target="_blank" rel="noopener noreferrer" 
                   class="block w-full px-4 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:opacity-90 transition-opacity text-center font-medium">
                  Instagram
                </a>
                <a [href]="youtubeUrl" target="_blank" rel="noopener noreferrer"
                   class="block w-full px-4 py-3 bg-red-600 text-white rounded-lg hover:opacity-90 transition-opacity text-center font-medium">
                  YouTube
                </a>
                <a [href]="twitterUrl" target="_blank" rel="noopener noreferrer"
                   class="block w-full px-4 py-3 bg-blue-500 text-white rounded-lg hover:opacity-90 transition-opacity text-center font-medium">
                  Twitter
                </a>
                <a [href]="facebookUrl" target="_blank" rel="noopener noreferrer"
                   class="block w-full px-4 py-3 bg-blue-700 text-white rounded-lg hover:opacity-90 transition-opacity text-center font-medium">
                  Facebook
                </a>
              </div>
              <button (click)="closeModal($event)" 
                      class="mt-4 w-full px-4 py-2 bg-secondary hover:bg-secondary/80 rounded-lg transition-colors">
                Close
              </button>
            </div>
          </div>
        }
        
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
export class VideoBannerComponent implements OnInit, AfterViewInit {
  @ViewChild('videoPlayer') videoPlayer!: ElementRef<HTMLVideoElement>;

  // Video URL - Fallback to local video file
  videoUrl = 'assets/videos/Video-279.mp4';

  // Audio state - starts muted for autoplay, then attempts to unmute
  isMuted = true;
  private shouldBeUnmuted = false; // Track desired unmuted state

  // Loading state
  isLoading = true;

  // Social media modal state
  showSocialModal = false;

  // Video segment control
  // First play: 4:19 (259s) to 4:28 (268s)
  // Then loop: 0:00 (0s) to 4:28 (268s)
  private readonly SEGMENT1_START = 259; // 4:19 in seconds
  private readonly SEGMENT1_END = 268; // 4:28 in seconds
  private readonly SEGMENT2_START = 0; // 0:00 in seconds
  private readonly SEGMENT2_END = 268; // 4:28 in seconds
  private isSegment1 = true; // Start with segment 1 (4:19 to 4:28)
  private hasPlayedFirstSegment = false; // Track if first segment has been played

  // Social Media URLs
  instagramUrl = 'https://www.instagram.com/newsaddaindialive/';
  youtubeUrl = 'https://www.youtube.com/@newsaddaindialive';
  twitterUrl = 'https://twitter.com/NewsAddaIndia1';
  facebookUrl = 'https://facebook.com/InfoNewsaddaindia';

  constructor(private instagramService: InstagramService) { }

  ngOnInit() {
    // Keep video muted by default
    this.shouldBeUnmuted = false;

    // Attempt to fetch the latest Instagram reel
    this.instagramService.getLatestReelVideoUrl().subscribe(
      (reelVideoUrl) => {
        if (reelVideoUrl) {
          this.videoUrl = reelVideoUrl;
          this.isLoading = true; // Reset loading state when URL changes
          this.isSegment1 = true; // Reset to segment 1 when URL changes
          this.hasPlayedFirstSegment = false; // Reset first segment flag
          console.log('Using latest Instagram reel:', reelVideoUrl);
        } else {
          console.log('Using fallback video:', this.videoUrl);
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

      // Load the video source
      video.load();
    }
  }

  toggleAudio(event: Event) {
    event.stopPropagation(); // Prevent triggering the click on the video container
    this.isMuted = !this.isMuted;
    if (this.videoPlayer?.nativeElement) {
      this.videoPlayer.nativeElement.muted = this.isMuted;
    }
  }

  closeModal(event?: Event) {
    if (event) {
      event.stopPropagation();
    }
    this.showSocialModal = false;
  }

  redirectToInstagram() {
    // Try to open all social media pages in separate tabs
    const urls = [
      this.instagramUrl,
      this.youtubeUrl,
      this.twitterUrl,
      this.facebookUrl
    ];

    // Open tabs after 1 second delay
    // Note: This delay may cause pop-up blockers to activate, as browsers require
    // window.open() to be directly triggered by a user gesture
    setTimeout(() => {
      const windows: (Window | null)[] = [];

      // Open all tabs synchronously in the same call stack
      urls.forEach((url) => {
        const win = window.open(url, '_blank', 'noopener,noreferrer');
        windows.push(win);
      });

      // Check if pop-ups were blocked
      // Blocked windows will be null, but some browsers return a window object that's immediately closed
      const openedCount = windows.filter(w => {
        if (w === null) return false;
        try {
          // Check if window is still accessible (not blocked)
          return !w.closed;
        } catch (e) {
          // Cross-origin or blocked window will throw
          return false;
        }
      }).length;

      // If less than 2 tabs opened successfully, show modal as fallback
      // This ensures users can still access all social media links
      if (openedCount < 2) {
        this.showSocialModal = true;
      }
    }, 1000); // 1 second delay
  }

  onVideoLoadedData() {
    // Video data loaded, set initial time
    if (this.videoPlayer?.nativeElement) {
      const video = this.videoPlayer.nativeElement;
      // Ensure video is muted for autoplay
      video.muted = true;
      this.isMuted = true;

      // Reset flags for new video load
      this.isSegment1 = true;
      this.hasPlayedFirstSegment = false;

      // Set initial time to segment 1 start (4:19)
      video.currentTime = this.SEGMENT1_START;
    }
  }

  onVideoCanPlay() {
    // Video is ready to play
    console.log('Video can play');
    if (this.videoPlayer?.nativeElement) {
      const video = this.videoPlayer.nativeElement;

      // Ensure video is muted for autoplay (but preserve user's mute preference if they changed it)
      if (!this.hasPlayedFirstSegment) {
        video.muted = true;
        this.isMuted = true;
      }

      // Only set segment start time if we haven't played the first segment yet
      // This prevents resetting when jumping to 0:00 after first segment
      if (!this.hasPlayedFirstSegment) {
        if (video.currentTime < this.SEGMENT1_START || video.currentTime > this.SEGMENT1_END) {
          this.isSegment1 = true;
          video.currentTime = this.SEGMENT1_START;
        }
      } else {
        // If first segment already played, ensure we're in the loop segment (0:00 to 4:28)
        if (video.currentTime < this.SEGMENT2_START || video.currentTime > this.SEGMENT2_END) {
          this.isSegment1 = false;
          video.currentTime = this.SEGMENT2_START;
        }
      }

      // Try to play the video
      const playPromise = video.play();

      if (playPromise !== undefined) {
        playPromise
          .then(() => {
            console.log('Video playing');
            this.isLoading = false;
          })
          .catch((error) => {
            console.warn('Autoplay prevented:', error);
            // Hide loading even if autoplay fails
            this.isLoading = false;
          });
      } else {
        // Fallback for older browsers
        this.isLoading = false;
      }
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

    if (this.isSegment1 && !this.hasPlayedFirstSegment) {
      // First segment: 4:19 to 4:28 (play once only)
      if (currentTime >= this.SEGMENT1_END) {
        this.hasPlayedFirstSegment = true;
        this.isSegment1 = false;
        // Preserve mute state when jumping
        const wasMuted = video.muted;
        video.currentTime = this.SEGMENT2_START; // Jump to 0:00
        video.muted = wasMuted; // Restore mute state
        this.isMuted = wasMuted;
      }
    } else if (!this.isSegment1 || this.hasPlayedFirstSegment) {
      // Loop segment: 0:00 to 4:28 (repeating)
      if (currentTime >= this.SEGMENT2_END) {
        // Preserve mute state when looping
        const wasMuted = video.muted;
        video.currentTime = this.SEGMENT2_START; // Loop back to 0:00
        video.muted = wasMuted; // Restore mute state
        this.isMuted = wasMuted;
      }
    }
  }

  onVideoError() {
    // Handle video loading error
    console.warn('Video banner failed to load. Please check the video file path.');
    // Hide loading animation even on error
    this.isLoading = false;
  }
}

