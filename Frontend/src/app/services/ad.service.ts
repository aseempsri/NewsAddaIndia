import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface Ad {
  _id?: string;
  adId: string;
  enabled: boolean;
  mediaType: 'image' | 'video' | null;
  mediaUrl: string | null;
  linkUrl: string | null;
  altText: string;
}

@Injectable({
  providedIn: 'root'
})
export class AdService {
  private adsSubject = new BehaviorSubject<Ad[]>([]);
  public ads$ = this.adsSubject.asObservable();
  private apiUrl = environment.apiUrl || 'http://localhost:3000';

  constructor(private http: HttpClient) {
    this.loadAds();
  }

  loadAds() {
    this.http.get<{ success: boolean; data: Ad[] }>(`${this.apiUrl}/api/ads`).subscribe({
      next: (response) => {
        if (response.success) {
          // Ensure all 5 ads exist, initialize missing ones
          const adIds = ['ad1', 'ad2', 'ad3', 'ad4', 'ad5'];
          const existingAds = response.data || [];
          const existingAdIds = existingAds.map(ad => ad.adId);
          
          const allAds: Ad[] = adIds.map(adId => {
            const existing = existingAds.find(a => a.adId === adId);
            return existing || {
              adId,
              enabled: false,
              mediaType: null,
              mediaUrl: null,
              linkUrl: null,
              altText: ''
            };
          });
          
          this.adsSubject.next(allAds);
        } else {
          // Initialize with default ads if response is not successful
          this.initializeDefaultAds();
        }
      },
      error: (error) => {
        console.error('Error loading ads:', error);
        // Initialize with default ads if API fails
        this.initializeDefaultAds();
      }
    });
  }

  private initializeDefaultAds() {
    const defaultAds: Ad[] = [
      { adId: 'ad1', enabled: false, mediaType: null, mediaUrl: null, linkUrl: null, altText: '' },
      { adId: 'ad2', enabled: false, mediaType: null, mediaUrl: null, linkUrl: null, altText: '' },
      { adId: 'ad3', enabled: false, mediaType: null, mediaUrl: null, linkUrl: null, altText: '' },
      { adId: 'ad4', enabled: false, mediaType: null, mediaUrl: null, linkUrl: null, altText: '' },
      { adId: 'ad5', enabled: false, mediaType: null, mediaUrl: null, linkUrl: null, altText: '' }
    ];
    this.adsSubject.next(defaultAds);
  }

  getAd(adId: string): Observable<Ad | null> {
    return new Observable(observer => {
      this.ads$.subscribe(ads => {
        const ad = ads.find(a => a.adId === adId);
        observer.next(ad || null);
      });
    });
  }

  isAdEnabled(adId: string): boolean {
    const ads = this.adsSubject.value;
    const ad = ads.find(a => a.adId === adId);
    return ad?.enabled === true;
  }

  hasAdMedia(adId: string): boolean {
    const ads = this.adsSubject.value;
    const ad = ads.find(a => a.adId === adId);
    return ad?.enabled === true && ad?.mediaUrl !== null;
  }

  getAdMediaUrl(adId: string): string | null {
    const ads = this.adsSubject.value;
    const ad = ads.find(a => a.adId === adId);
    if (!ad || !ad.mediaUrl) return null;
    if (ad.mediaUrl.startsWith('http')) return ad.mediaUrl;
    return `${this.apiUrl}${ad.mediaUrl}`;
  }

  getAdLink(adId: string): string | null {
    const ads = this.adsSubject.value;
    const ad = ads.find(a => a.adId === adId);
    if (!ad?.linkUrl) return null;
    
    const url = ad.linkUrl.trim();
    if (!url) return null;
    
    // If URL doesn't start with http:// or https://, prefix it with https://
    if (!url.match(/^https?:\/\//i)) {
      return `https://${url}`;
    }
    
    return url;
  }

  getAdAltText(adId: string): string {
    const ads = this.adsSubject.value;
    const ad = ads.find(a => a.adId === adId);
    return ad?.altText || adId.toUpperCase();
  }

  getAdMediaType(adId: string): 'image' | 'video' | null {
    const ads = this.adsSubject.value;
    const ad = ads.find(a => a.adId === adId);
    return ad?.mediaType || null;
  }
}
