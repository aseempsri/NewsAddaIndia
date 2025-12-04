import { Component, ViewChild, ElementRef, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { InstagramService } from '../../services/instagram.service';

@Component({
  selector: 'app-video-banner',
  standalone: true,
  imports: [CommonModule],
  template: `
    <section class="relative w-full overflow-hidden bg-secondary/20">
      <div 
        class="relative w-full h-[200px] md:h-[300px] lg:h-[400px] cursor-pointer"
        (click)="redirectToInstagram()">
        <video
          #videoPlayer
          class="w-full h-full object-cover pointer-events-none"
          autoplay
          loop
          [muted]="isMuted"
          playsinline
          (loadedmetadata)="onVideoLoaded()"
          (error)="onVideoError()">
          <source [src]="videoUrl" type="video/mp4" />
          Your browser does not support the video tag.
        </video>
        
        <!-- Overlay gradient for visual depth -->
        <div class="absolute inset-0 bg-gradient-to-b from-background/30 via-transparent to-background/30 pointer-events-none"></div>
        
        <!-- Subtle shimmer effect -->
        <div class="absolute inset-0 opacity-5 bg-[radial-gradient(circle_at_50%_50%,rgba(255,255,255,0.2),transparent_70%)] pointer-events-none"></div>
        
        <!-- Audio Toggle Button -->
        <button
          (click)="toggleAudio($event)"
          class="absolute bottom-4 right-4 z-10 w-12 h-12 rounded-full bg-background/80 backdrop-blur-sm border border-border/50 flex items-center justify-center text-foreground hover:bg-background hover:border-primary transition-all duration-300 shadow-lg hover:shadow-primary/20 group"
          [attr.aria-label]="isMuted ? 'Unmute video' : 'Mute video'"
          title="{{ isMuted ? 'Unmute' : 'Mute' }}">
          @if (isMuted) {
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2" />
            </svg>
          } @else {
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 14.142M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
            </svg>
          }
        </button>
      </div>
    </section>
  `,
  styles: []
})
export class VideoBannerComponent implements OnInit {
  @ViewChild('videoPlayer') videoPlayer!: ElementRef<HTMLVideoElement>;

  // Video URL - Fallback to local video file
  videoUrl = 'assets/videos/Video-279.mp4';

  // Audio state - starts muted by default (required for autoplay)
  isMuted = true;

  // Instagram URL
  instagramUrl = 'https://www.instagram.com/newsaddaindialive/';

  constructor(private instagramService: InstagramService) { }

  ngOnInit() {
    // Attempt to fetch the latest Instagram reel
    this.instagramService.getLatestReelVideoUrl().subscribe(
      (reelVideoUrl) => {
        if (reelVideoUrl) {
          this.videoUrl = reelVideoUrl;
          console.log('Using latest Instagram reel:', reelVideoUrl);
        } else {
          console.log('Using fallback video:', this.videoUrl);
        }
      }
    );
  }

  toggleAudio(event: Event) {
    event.stopPropagation(); // Prevent triggering the click on the video container
    this.isMuted = !this.isMuted;
    if (this.videoPlayer?.nativeElement) {
      this.videoPlayer.nativeElement.muted = this.isMuted;
    }
  }

  redirectToInstagram() {
    window.open(this.instagramUrl, '_blank');
  }

  onVideoLoaded() {
    // Video loaded successfully
    console.log('Video banner loaded');
    // Ensure video starts muted (required for autoplay in most browsers)
    if (this.videoPlayer?.nativeElement) {
      this.videoPlayer.nativeElement.muted = this.isMuted;
    }
  }

  onVideoError() {
    // Handle video loading error
    console.warn('Video banner failed to load. Please check the video file path.');
  }
}

