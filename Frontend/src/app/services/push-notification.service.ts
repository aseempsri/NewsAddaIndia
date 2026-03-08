import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({ providedIn: 'root' })
export class PushNotificationService {
  private apiUrl = environment.apiUrl || '';
  private swRegistration: ServiceWorkerRegistration | null = null;
  private subscribedSubject = new BehaviorSubject<boolean>(false);
  subscribed$: Observable<boolean> = this.subscribedSubject.asObservable();

  constructor(private http: HttpClient) {}

  async isSupported(): Promise<boolean> {
    return 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window;
  }

  async getPermission(): Promise<NotificationPermission> {
    return Notification.permission;
  }

  async isSubscribed(): Promise<boolean> {
    if (!(await this.isSupported())) return false;
    const reg = await this.getRegistration();
    if (!reg) return false;
    const sub = await reg.pushManager.getSubscription();
    const subscribed = !!sub;
    this.subscribedSubject.next(subscribed);
    return subscribed;
  }

  private lastError: string = '';

  private async getRegistration(): Promise<ServiceWorkerRegistration | null> {
    if (this.swRegistration) return this.swRegistration;
    try {
      this.swRegistration = await navigator.serviceWorker.register('/push-sw.js', { scope: '/' });
      this.lastError = '';
      return this.swRegistration;
    } catch (err: unknown) {
      this.lastError = err instanceof Error ? err.message : String(err);
      console.error('[PushNotification] Service worker registration failed:', err);
      return null;
    }
  }

  getLastError(): string {
    return this.lastError;
  }

  async subscribe(): Promise<{ success: boolean; message: string }> {
    if (!(await this.isSupported())) {
      return { success: false, message: 'Push notifications are not supported' };
    }
    let permission = Notification.permission;
    if (permission === 'default') {
      permission = await Notification.requestPermission();
    }
    if (permission !== 'granted') {
      return { success: false, message: 'Permission denied' };
    }
    try {
      const publicKey = await this.getPublicKey();
      if (!publicKey) {
        return { success: false, message: 'Push notifications are not configured' };
      }
      const reg = await this.getRegistration();
      if (!reg) {
        return { success: false, message: 'Service worker registration failed' };
      }
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: this.urlBase64ToUint8Array(publicKey)
      });
      const payload = {
        endpoint: sub.endpoint,
        keys: {
          p256dh: this.arrayBufferToBase64(sub.getKey('p256dh')!),
          auth: this.arrayBufferToBase64(sub.getKey('auth')!)
        }
      };
      await this.http.post(`${this.apiUrl}/api/push/subscribe`, payload).toPromise();
      this.subscribedSubject.next(true);
      return { success: true, message: 'Subscribed to notifications' };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Subscription failed';
      console.error('[PushNotification] Subscribe error:', err);
      return { success: false, message: msg };
    }
  }

  async unsubscribe(): Promise<{ success: boolean }> {
    if (!(await this.isSupported())) return { success: false };
    try {
      const reg = await this.getRegistration();
      const sub = reg ? await reg.pushManager.getSubscription() : null;
      if (sub) await sub.unsubscribe();
      return { success: true };
    } catch {
      return { success: false };
    }
  }

  private async getPublicKey(): Promise<string | null> {
    try {
      const res = await this.http.get<{ publicKey: string }>(`${this.apiUrl}/api/push/vapid-public`).toPromise();
      return res?.publicKey ?? null;
    } catch {
      return null;
    }
  }

  private urlBase64ToUint8Array(base64String: string): Uint8Array {
    const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);
    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  }

  private arrayBufferToBase64(buffer: ArrayBuffer): string {
    const bytes = new Uint8Array(buffer);
    let binary = '';
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
  }
}
