import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

export type AdminTheme = 'light' | 'dark';

@Injectable({
  providedIn: 'root'
})
export class AdminThemeService {
  private themeSubject = new BehaviorSubject<AdminTheme>(this.getInitialTheme());
  public theme$: Observable<AdminTheme> = this.themeSubject.asObservable();
  private readonly STORAGE_KEY = 'admin_theme';

  constructor() {
    // Initialize theme on service creation
    this.applyTheme(this.getInitialTheme());
  }

  private getInitialTheme(): AdminTheme {
    // Check localStorage first (admin-specific key)
    const savedTheme = localStorage.getItem(this.STORAGE_KEY) as AdminTheme;
    if (savedTheme === 'light' || savedTheme === 'dark') {
      return savedTheme;
    }
    
    // Check system preference
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      return 'dark';
    }
    
    // Default to light
    return 'light';
  }

  getCurrentTheme(): AdminTheme {
    return this.themeSubject.value;
  }

  setTheme(theme: AdminTheme): void {
    this.themeSubject.next(theme);
    localStorage.setItem(this.STORAGE_KEY, theme);
    this.applyTheme(theme);
  }

  toggleTheme(): void {
    const newTheme = this.themeSubject.value === 'light' ? 'dark' : 'light';
    this.setTheme(newTheme);
  }

  private applyTheme(theme: AdminTheme): void {
    // Only apply theme if we're on an admin page
    if (typeof window !== 'undefined' && window.location.pathname.startsWith('/admin')) {
      const htmlElement = document.documentElement;
      // Store the main site theme before applying admin theme
      const mainSiteHasDark = htmlElement.classList.contains('dark') && !htmlElement.hasAttribute('data-admin-theme');
      
      // Remove main site dark class if it exists (we'll restore it when leaving admin)
      if (mainSiteHasDark) {
        htmlElement.setAttribute('data-main-site-theme', 'dark');
        htmlElement.classList.remove('dark');
      } else {
        htmlElement.setAttribute('data-main-site-theme', 'light');
      }
      
      // Apply admin theme
      if (theme === 'dark') {
        htmlElement.classList.add('dark');
        htmlElement.setAttribute('data-admin-theme', 'dark');
      } else {
        htmlElement.classList.remove('dark');
        htmlElement.setAttribute('data-admin-theme', 'light');
      }
    }
  }

  // Method to check if we're on admin page and apply theme
  checkAndApplyTheme(): void {
    if (typeof window !== 'undefined' && window.location.pathname.startsWith('/admin')) {
      this.applyTheme(this.themeSubject.value);
    } else {
      // Restore main site theme when leaving admin page
      const htmlElement = document.documentElement;
      const mainSiteTheme = htmlElement.getAttribute('data-main-site-theme');
      htmlElement.removeAttribute('data-admin-theme');
      htmlElement.removeAttribute('data-main-site-theme');
      
      // Restore main site theme
      if (mainSiteTheme === 'dark') {
        htmlElement.classList.add('dark');
      } else {
        htmlElement.classList.remove('dark');
      }
    }
  }
}

