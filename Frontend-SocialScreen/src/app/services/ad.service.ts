import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { allSocialScreenAdIds } from '../config/ad-sections';
import { pickRotatedMediaIndex } from '../utils/ad-rotation';

export interface AdMediaItem {
  mediaType: 'image' | 'video';
  mediaUrl: string;
}

export interface Ad {
  _id?: string;
  adId: string;
  enabled: boolean;
  mediaType: 'image' | 'video' | null;
  mediaUrl: string | null;
  mediaItems?: AdMediaItem[];
  linkUrl: string | null;
  altText: string;
}

interface ActiveAdMedia {
  mediaType: 'image' | 'video';
  mediaUrl: string;
}

@Injectable({
  providedIn: 'root'
})
export class AdService {
  private adsSubject = new BehaviorSubject<Ad[]>([]);
  public ads$ = this.adsSubject.asObservable();
  private readonly adSite = environment.adSite || 'socialscreen';
  private apiUrl = (environment.apiUrl !== undefined && environment.apiUrl !== null && String(environment.apiUrl).trim() !== '')
    ? environment.apiUrl
    : (environment.production ? '' : '');
  /** Media chosen for this page load (rotates on refresh when multiple items exist). */
  private displayMediaByAdId = new Map<string, ActiveAdMedia>();

  constructor(private http: HttpClient) {
    this.loadAds();
  }

  loadAds() {
    this.http.get<{ success: boolean; data: Ad[] }>(`${this.apiUrl}/api/ads?site=${this.adSite}`).subscribe({
      next: (response) => {
        if (response.success) {
          const adIds = allSocialScreenAdIds();
          const existingAds = response.data || [];
          const allAds: Ad[] = adIds.map(adId => {
            const existing = existingAds.find(a => a.adId === adId);
            return existing || {
              adId,
              enabled: false,
              mediaType: null,
              mediaUrl: null,
              mediaItems: [],
              linkUrl: null,
              altText: ''
            };
          });
          this.applyDisplayRotation(allAds);
          this.adsSubject.next(allAds);
        } else {
          this.initializeDefaultAds();
        }
      },
      error: (error) => {
        console.error('Error loading ads:', error);
        this.initializeDefaultAds();
      }
    });
  }

  private initializeDefaultAds() {
    const defaultAds: Ad[] = allSocialScreenAdIds().map(adId => ({
      adId,
      enabled: false,
      mediaType: null,
      mediaUrl: null,
      mediaItems: [],
      linkUrl: null,
      altText: ''
    }));
    this.displayMediaByAdId.clear();
    this.adsSubject.next(defaultAds);
  }

  static getMediaItems(ad: Ad): AdMediaItem[] {
    if (ad.mediaItems && ad.mediaItems.length > 0) {
      return ad.mediaItems.filter((i) => i && i.mediaUrl);
    }
    if (ad.mediaUrl && ad.mediaType) {
      return [{ mediaType: ad.mediaType, mediaUrl: ad.mediaUrl }];
    }
    return [];
  }

  private applyDisplayRotation(ads: Ad[]) {
    this.displayMediaByAdId.clear();
    for (const ad of ads) {
      if (!ad.enabled) continue;
      const items = AdService.getMediaItems(ad);
      if (items.length === 0) continue;
      const index = pickRotatedMediaIndex(ad.adId, items.length);
      this.displayMediaByAdId.set(ad.adId, items[index]);
    }
  }

  private getActiveMedia(adId: string): ActiveAdMedia | null {
    return this.displayMediaByAdId.get(adId) ?? null;
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
    return this.isAdEnabled(adId) && this.getActiveMedia(adId) !== null;
  }

  getAdMediaUrl(adId: string): string | null {
    const active = this.getActiveMedia(adId);
    if (!active?.mediaUrl) return null;
    if (active.mediaUrl.startsWith('http')) return active.mediaUrl;
    return `${this.apiUrl}${active.mediaUrl}`;
  }

  getAdLink(adId: string): string | null {
    const ads = this.adsSubject.value;
    const ad = ads.find(a => a.adId === adId);
    if (!ad?.linkUrl) return null;
    const url = ad.linkUrl.trim();
    if (!url) return null;
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
    const active = this.getActiveMedia(adId);
    return active?.mediaType ?? null;
  }

  getAdMediaCount(adId: string): number {
    const ads = this.adsSubject.value;
    const ad = ads.find(a => a.adId === adId);
    if (!ad) return 0;
    return AdService.getMediaItems(ad).length;
  }
}
