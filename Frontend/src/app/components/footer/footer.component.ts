import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { Location } from '@angular/common';
import { LanguageService } from '../../services/language.service';
import { Subscription } from 'rxjs';

interface FooterLink {
  name: string;
  route: string;
}

interface CompanyLink {
  name: string;
  href: string;
}

interface SocialLink {
  iconPath: string;
  href: string;
  label: string;
}

@Component({
  selector: 'app-footer',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive],
  template: `
    <footer class="bg-secondary/30 border-t border-border/30">
      <div class="container mx-auto px-4 py-12 lg:py-16">
        <div class="grid md:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-12">
          <!-- Brand -->
          <div class="lg:col-span-1">
            <a [routerLink]="'/'" class="flex items-center gap-3 mb-4">
              <div class="relative w-10 h-10 shrink-0">
                <img 
                  [src]="logoPath" 
                  alt="NewsAddaIndia Logo" 
                  class="w-full h-full rounded-xl object-cover"
                  style="box-shadow: 0 0 12px rgba(37, 99, 235, 0.6), 0 0 24px rgba(37, 99, 235, 0.4);"
                  loading="eager"
                  width="40"
                  height="40" />
              </div>
              <div>
                <h3 class="font-display text-lg font-bold">
                  <span style="color: #FF9933;">News</span>
                  <span style="color: #FFFFFF; -webkit-text-stroke: 2px #2563EB; text-stroke: 2px #2563EB; paint-order: stroke fill;">Adda</span>
                  <span style="color: #138808;">India</span>
                </h3>
              </div>
            </a>
            <p class="text-sm text-muted-foreground mb-6">
              {{ t.yourDailyNewsCompanion }}
            </p>
            <div class="flex gap-3">
              @for (social of socialLinks; track social.label) {
                <a
                  [href]="social.href"
                  class="w-10 h-10 rounded-lg bg-secondary hover:bg-primary/20 flex items-center justify-center text-muted-foreground hover:text-primary transition-all"
                  [attr.aria-label]="social.label">
                  <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path [attr.d]="social.iconPath" />
                  </svg>
                </a>
              }
            </div>
          </div>

          <!-- Categories -->
          <div>
            <h4 class="font-display font-semibold mb-4">{{ t.categories }}</h4>
            <ul class="space-y-2">
              @for (link of footerLinks.categories; track link.name) {
                <li>
                  <a
                    [routerLink]="link.route"
                    routerLinkActive="active"
                    [routerLinkActiveOptions]="{exact: false}"
                    class="footer-category-link text-sm text-muted-foreground hover:text-foreground transition-colors block">
                    {{ link.name }}
                  </a>
                </li>
              }
            </ul>
          </div>

          <!-- Company -->
          <div>
            <h4 class="font-display font-semibold mb-4">{{ t.company }}</h4>
            <ul class="space-y-2">
              @for (link of footerLinks.company; track link.name) {
                <li>
                  <a
                    [href]="link.href"
                    class="text-sm text-muted-foreground hover:text-foreground transition-colors">
                    {{ link.name }}
                  </a>
                </li>
              }
            </ul>
          </div>

          <!-- Contact -->
          <div>
            <h4 class="font-display font-semibold mb-4">{{ t.contactUs }}</h4>
            <ul class="space-y-3">
              <li class="flex items-start gap-3">
                <svg class="w-5 h-5 text-primary shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <span class="text-sm text-muted-foreground">
                  {{ t.newDelhiIndia }}
                </span>
              </li>
              <li class="flex items-center gap-3">
                <svg class="w-5 h-5 text-primary shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                <a
                  href="mailto:contact@newsaddaindia.com"
                  class="text-sm text-muted-foreground hover:text-foreground transition-colors">
                  contact&#64;newsaddaindia.com
                </a>
              </li>
              <li class="flex items-center gap-3">
                <svg class="w-5 h-5 text-primary shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                </svg>
                <a
                  href="tel:+911234567890"
                  class="text-sm text-muted-foreground hover:text-foreground transition-colors">
                  +91 123 456 7890
                </a>
              </li>
            </ul>
          </div>
        </div>

        <!-- Bottom Bar -->
        <div class="mt-12 pt-8 border-t border-border/30 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p class="text-sm text-muted-foreground">
            © 2025 NewsAddaIndia. {{ t.allRightsReserved }}
          </p>
          <div class="flex items-center gap-6 text-sm text-muted-foreground">
            <a href="#" class="hover:text-foreground transition-colors">
              {{ t.privacy }}
            </a>
            <a href="#" class="hover:text-foreground transition-colors">
              {{ t.terms }}
            </a>
            <a href="#" class="hover:text-foreground transition-colors">
              {{ t.cookies }}
            </a>
          </div>
        </div>
      </div>
    </footer>
  `,
  styles: [`
    .footer-category-link.active {
      color: hsl(var(--primary)) !important;
      font-weight: 600 !important;
    }
  `]
})
export class FooterComponent implements OnInit, OnDestroy {
  logoPath: string;
  t: any = {};
  footerLinks = {
    categories: [] as FooterLink[],
    company: [] as CompanyLink[],
  };
  private languageSubscription?: Subscription;

  constructor(
    private location: Location,
    private languageService: LanguageService
  ) {
    // Get the base href and construct the logo path
    const baseHref = this.location.prepareExternalUrl('/');
    this.logoPath = baseHref + 'assets/videos/slogo.png';
  }

  ngOnInit() {
    this.updateTranslations();
    this.updateFooterLinks();
    
    // Subscribe to language changes
    this.languageSubscription = this.languageService.currentLanguage$.subscribe(() => {
      this.updateTranslations();
      this.updateFooterLinks();
    });
  }

  ngOnDestroy() {
    this.languageSubscription?.unsubscribe();
  }

  updateTranslations() {
    this.t = this.languageService.getTranslations();
  }

  updateFooterLinks() {
    this.footerLinks = {
      categories: [
        { name: this.t.national, route: '/category/national' },
        { name: this.t.international, route: '/category/international' },
        { name: this.t.politics, route: '/category/politics' },
        { name: this.t.business, route: '/category/business' },
        { name: this.t.sports, route: '/category/sports' },
        { name: this.t.entertainment, route: '/category/entertainment' },
      ] as FooterLink[],
    company: [
      { name: 'About Us', href: '#' },
      { name: 'Contact', href: '#' },
      { name: 'Careers', href: '#' },
      { name: 'Advertise', href: '#' },
      { name: 'Privacy Policy', href: '#' },
      { name: 'Terms of Service', href: '#' },
    ] as CompanyLink[],
    };
  }

  socialLinks: SocialLink[] = [
    {
      iconPath: 'M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z',
      href: '#',
      label: 'Facebook'
    },
    {
      iconPath: 'M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z',
      href: '#',
      label: 'Twitter'
    },
    {
      iconPath: 'M12 0C8.74 0 8.333.015 7.053.072 5.775.132 4.905.333 4.14.63c-.789.306-1.459.717-2.126 1.384S.935 3.35.63 4.14C.333 4.905.131 5.775.072 7.053.012 8.333 0 8.74 0 12s.015 3.667.072 4.947c.06 1.277.261 2.148.558 2.913.306.788.717 1.459 1.384 2.126.667.666 1.336 1.079 2.126 1.384.766.296 1.636.499 2.913.558C8.333 23.988 8.74 24 12 24s3.667-.015 4.947-.072c1.277-.06 2.148-.262 2.913-.558.788-.306 1.459-.718 2.126-1.384.666-.667 1.079-1.335 1.384-2.126.296-.765.499-1.636.558-2.913.06-1.28.072-1.687.072-4.947s-.015-3.667-.072-4.947c-.06-1.277-.262-2.149-.558-2.913-.306-.789-.718-1.459-1.384-2.126C21.319 1.347 20.651.935 19.86.63c-.765-.297-1.636-.499-2.913-.558C15.667.012 15.26 0 12 0zm0 2.16c3.203 0 3.585.016 4.85.071 1.17.055 1.805.249 2.227.415.562.217.96.477 1.382.896.419.42.679.819.896 1.381.164.422.36 1.057.413 2.227.057 1.266.07 1.646.07 4.85s-.015 3.585-.074 4.85c-.061 1.17-.256 1.805-.421 2.227-.224.562-.479.96-.899 1.382-.419.419-.824.679-1.38.896-.42.164-1.065.36-2.235.413-1.274.057-1.649.07-4.859.07-3.211 0-3.586-.015-4.859-.074-1.171-.061-1.816-.256-2.236-.421-.569-.224-.96-.479-1.379-.899-.421-.419-.69-.824-.9-1.38-.165-.42-.359-1.065-.42-2.235-.045-1.26-.061-1.649-.061-4.844 0-3.196.016-3.586.061-4.861.061-1.17.255-1.814.42-2.234.21-.57.479-.96.9-1.381.419-.419.81-.689 1.379-.898.42-.166 1.051-.361 2.221-.421 1.275-.045 1.65-.06 4.859-.06l.045.03zm0 3.678c-3.405 0-6.162 2.76-6.162 6.162 0 3.405 2.76 6.162 6.162 6.162 3.405 0 6.162-2.76 6.162-6.162 0-3.405-2.76-6.162-6.162-6.162zM12 16c-2.21 0-4-1.79-4-4s1.79-4 4-4 4 1.79 4 4-1.79 4-4 4zm7.846-10.405c0 .795-.646 1.44-1.44 1.44-.795 0-1.44-.646-1.44-1.44 0-.794.646-1.439 1.44-1.439.793-.001 1.44.645 1.44 1.439z',
      href: '#',
      label: 'Instagram'
    },
    {
      iconPath: 'M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z',
      href: '#',
      label: 'Youtube'
    },
  ];
}

