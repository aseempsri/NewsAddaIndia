import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { HeaderComponent } from '../../components/header/header.component';
import { FooterComponent } from '../../components/footer/footer.component';

interface NewsItem {
  id: number;
  category: string;
  title: string;
  excerpt: string;
  image: string;
  time: string;
}

@Component({
  selector: 'app-category',
  standalone: true,
  imports: [CommonModule, RouterLink, HeaderComponent, FooterComponent],
  template: `
    <div class="min-h-screen bg-background">
      <app-header />
      
      <main>
        <section class="py-12 lg:py-16">
          <div class="container mx-auto px-4">
            <!-- Category Header -->
            <div class="mb-8">
              <div class="flex items-center gap-3 mb-4">
                <div [class]="'w-1 h-12 rounded-full bg-gradient-to-b ' + getCategoryAccentColor(categoryName)"></div>
                <div>
                  <h1 class="font-display text-3xl lg:text-4xl font-bold">
                    {{ categoryName }} <span class="gradient-text">News</span>
                  </h1>
                  <p class="text-muted-foreground mt-2">Latest updates from {{ categoryName }} category</p>
                </div>
              </div>
            </div>

            <!-- News Grid -->
            <div class="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              @for (news of filteredNews; track news.id; let i = $index) {
                <article
                  class="news-card group opacity-0 animate-fade-in"
                  [style.animation-delay]="i * 100 + 'ms'">
                  <div class="relative aspect-[16/10] overflow-hidden rounded-t-xl">
                    <img
                      [src]="news.image"
                      [alt]="news.title"
                      class="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                    <div class="absolute top-4 left-4">
                      <span [class]="'px-3 py-1 text-xs font-semibold rounded-full ' + getCategoryColor(news.category)">
                        {{ news.category }}
                      </span>
                    </div>
                  </div>

                  <div class="p-5">
                    <h3 class="font-display text-lg font-semibold leading-tight mb-2 group-hover:text-primary transition-colors line-clamp-2">
                      {{ news.title }}
                    </h3>
                    <p class="text-muted-foreground text-sm line-clamp-2 mb-4">
                      {{ news.excerpt }}
                    </p>
                    <div class="flex items-center justify-between">
                      <span class="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        {{ news.time }}
                      </span>
                      <svg class="w-4 h-4 text-primary opacity-0 group-hover:opacity-100 transition-all transform group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                      </svg>
                    </div>
                  </div>
                </article>
              }
            </div>

            @if (filteredNews.length === 0) {
              <div class="text-center py-16">
                <p class="text-muted-foreground text-lg">No news found in {{ categoryName }} category.</p>
              </div>
            }
          </div>
        </section>
      </main>

      <app-footer />
    </div>
  `,
  styles: []
})
export class CategoryComponent implements OnInit {
  categoryName: string = '';
  filteredNews: NewsItem[] = [];

  // All news data - in a real app, this would come from a service
  private allNews: NewsItem[] = [
    // National
    {
      id: 1,
      category: 'National',
      title: 'Putin\'s India Visit: Five-Year Partnership Plan Finalized',
      excerpt: 'Russian President Vladimir Putin and PM Modi discuss strengthening trade and economic ties, finalizing a comprehensive five-year partnership plan during the state visit.',
      image: 'assets/videos/Putin_in_India_.webp',
      time: '2 hours ago',
    },
    {
      id: 5,
      category: 'National',
      title: 'IndiGo Cancels Over 170 Flights Due to Pilot Rest Regulations',
      excerpt: 'Major flight disruptions across India as IndiGo Airlines cancels flights nationwide due to stricter pilot-rest regulations.',
      image: 'https://images.unsplash.com/photo-1436491865332-7a61a109cc05?w=600&q=80',
      time: '6 hours ago',
    },
    {
      id: 7,
      category: 'National',
      title: 'BSF Marks 60 Years of Service to the Nation',
      excerpt: 'The Border Security Force commemorates its 60th anniversary, with Inspector General Shashank Anand highlighting its pivotal role in national border security.',
      image: 'https://images.unsplash.com/photo-1541339907198-e08756dedf3f?w=600&q=80',
      time: '8 hours ago',
    },
    {
      id: 8,
      category: 'National',
      title: 'Cyclone Ditwah Approaches Tamil Nadu and Andhra Pradesh Coasts',
      excerpt: 'Very heavy rain forecasts as Cyclone Ditwah approaches, placing Tamil Nadu and Andhra Pradesh on high alert with authorities taking precautionary safety measures.',
      image: 'https://images.unsplash.com/photo-1504608524841-42fe6f032b4b?w=600&q=80',
      time: '1 hour ago',
    },
    // International
    {
      id: 9,
      category: 'International',
      title: 'Pope Francis Visits Lebanon, Urges Leaders to Prioritize Peace',
      excerpt: 'Pope Francis embarks on his first overseas trip to Lebanon, urging political leaders to prioritize peace amid regional instability and conflicts.',
      image: 'https://images.unsplash.com/photo-1511632765486-a01980e01a18?w=600&q=80',
      time: '3 hours ago',
    },
    {
      id: 10,
      category: 'International',
      title: 'UN Observes International Day of Persons with Disabilities',
      excerpt: 'The United Nations observes the International Day of Persons with Disabilities, promoting awareness and inclusion globally.',
      image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=600&q=80',
      time: '5 hours ago',
    },
    {
      id: 11,
      category: 'International',
      title: 'India Strengthens Diplomatic Ties with Global Partners',
      excerpt: 'High-level diplomatic meetings focus on enhancing trade relations and strategic partnerships with key nations worldwide.',
      image: 'https://images.unsplash.com/photo-1556761175-5973dc0f32e7?w=600&q=80',
      time: '7 hours ago',
    },
    // Politics
    {
      id: 12,
      category: 'Politics',
      title: 'India Invited to Chair Global Election Body IDEA',
      excerpt: 'India has been invited to chair the International Institute for Democracy and Electoral Assistance, reflecting global recognition of its electoral standards.',
      image: 'https://images.unsplash.com/photo-1450101499163-c8848c66ca85?w=600&q=80',
      time: '2 hours ago',
    },
    {
      id: 13,
      category: 'Politics',
      title: 'Lok Sabha Adjourned Following Opposition Protests',
      excerpt: 'The Lok Sabha session was adjourned following opposition protests demanding a debate on the Special Intensive Revision (SIR) of electoral rolls.',
      image: 'https://images.unsplash.com/photo-1556761175-5973dc0f32e7?w=600&q=80',
      time: '4 hours ago',
    },
    {
      id: 14,
      category: 'Politics',
      title: 'Key Political Developments Shape National Discourse',
      excerpt: 'Recent political events and policy decisions are generating significant discussion across the political spectrum.',
      image: 'https://images.unsplash.com/photo-1521737604893-d14cc237f11d?w=600&q=80',
      time: '6 hours ago',
    },
    // Health
    {
      id: 15,
      category: 'Health',
      title: 'India Records Significant Drop in HIV Cases and AIDS Deaths',
      excerpt: 'Union Health Ministry data shows a significant decline in new HIV infections and AIDS-related deaths across the country.',
      image: 'https://images.unsplash.com/photo-1559757148-5c350d0d3c56?w=600&q=80',
      time: '1 hour ago',
    },
    {
      id: 16,
      category: 'Health',
      title: 'Delhi Air Quality Remains in Severe Category',
      excerpt: 'Delhi\'s air quality remains in the "severe" category, with the Air Quality Index (AQI) around 380–400, despite the easing of GRAP restrictions.',
      image: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600&q=80',
      time: '3 hours ago',
    },
    {
      id: 17,
      category: 'Health',
      title: 'New Healthcare Scheme Launched to Improve Rural Medical Services',
      excerpt: 'The government introduces a comprehensive healthcare initiative aimed at enhancing medical facilities in rural and remote areas.',
      image: 'https://images.unsplash.com/photo-1582719471384-894fbb16e074?w=600&q=80',
      time: '5 hours ago',
    },
    // Entertainment
    {
      id: 4,
      category: 'Entertainment',
      title: 'Real Kashmir Football Club Series Premieres on SonyLIV',
      excerpt: 'New sports drama series inspired by the real-life story of the football club from Jammu and Kashmir set to premiere on December 9.',
      image: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=600&q=80',
      time: '5 hours ago',
    },
    {
      id: 6,
      category: 'Entertainment',
      title: 'Netflix Releases India vs Pakistan Cricket Documentary',
      excerpt: 'Three-part documentary series exploring the cricketing rivalry between India and Pakistan, featuring archived match footage and player interviews.',
      image: 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=600&q=80',
      time: '7 hours ago',
    },
    {
      id: 18,
      category: 'Entertainment',
      title: 'Bollywood Stars Attend Major Film Festival in Mumbai',
      excerpt: 'The Indian film industry celebrates excellence as top actors and filmmakers gather for the annual awards ceremony.',
      image: 'https://images.unsplash.com/photo-1511578314322-379afb476865?w=600&q=80',
      time: '9 hours ago',
    },
    // Sports
    {
      id: 2,
      category: 'Sports',
      title: 'India Secures 3-2 T20 Series Victory Against New Zealand',
      excerpt: 'Thrilling cricket action as India wins the T20 series with standout performances from emerging players in the final match.',
      image: 'assets/videos/indianz.avif',
      time: '3 hours ago',
    },
    {
      id: 19,
      category: 'Sports',
      title: 'Virat Kohli Scores Back-to-Back ODI Centuries Against South Africa',
      excerpt: 'Kohli\'s back-to-back centuries spark massive fan interest, leading to sold-out tickets for the third ODI match in the series.',
      image: 'https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=600&q=80',
      time: '2 hours ago',
    },
    {
      id: 20,
      category: 'Sports',
      title: 'India\'s Junior Hockey Team Faces Belgium in World Cup Quarterfinals',
      excerpt: 'India\'s men\'s junior hockey team faces Belgium in the quarterfinals of the FIH Junior Hockey World Cup 2025 in Chennai.',
      image: 'https://images.unsplash.com/photo-1551698618-1dfe5d97d256?w=600&q=80',
      time: '4 hours ago',
    },
    {
      id: 21,
      category: 'Sports',
      title: 'Formula One: Abu Dhabi Grand Prix Set for Three-Way Title Showdown',
      excerpt: 'The Abu Dhabi Grand Prix is set for a rare three-way title showdown, with McLaren\'s Lando Norris leading Max Verstappen and teammate Oscar Piastri.',
      image: 'https://images.unsplash.com/photo-1551958219-acbc608c6377?w=600&q=80',
      time: '6 hours ago',
    },
    // Business
    {
      id: 3,
      category: 'Business',
      title: 'RBI Reduces Repo Rate to 5.25% Citing Low Inflation',
      excerpt: 'Reserve Bank of India cuts repo rate by 25 basis points, citing low inflation and strong economic growth indicators.',
      image: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=600&q=80',
      time: '4 hours ago',
    },
    {
      id: 22,
      category: 'Business',
      title: 'GST Collection Rises Above ₹1.70 Lakh Crore in November',
      excerpt: 'Gross GST collection in November surpasses ₹1.70 lakh crore, indicating marginal growth amid mixed market sentiment and economic indicators.',
      image: 'https://images.unsplash.com/photo-1553729459-efe14ef6055d?w=600&q=80',
      time: '3 hours ago',
    },
    {
      id: 23,
      category: 'Business',
      title: 'Jio Platforms IPO: Reliance Begins Drafting Prospectus',
      excerpt: 'Reliance Industries begins drafting a prospectus for the planned Jio Platforms IPO, signaling a significant move in India\'s telecom and digital services market.',
      image: 'https://images.unsplash.com/photo-1556761175-b413da4baf72?w=600&q=80',
      time: '5 hours ago',
    },
    {
      id: 24,
      category: 'Business',
      title: 'Indian Stock Markets Reach New Milestones Amid Economic Growth',
      excerpt: 'Sensex and Nifty hit record highs as investors show strong confidence in India\'s economic trajectory and corporate performance.',
      image: 'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=600&q=80',
      time: '7 hours ago',
    },
  ];

  categoryColors: Record<string, string> = {
    National: 'bg-primary/20 text-primary',
    International: 'bg-purple-500/20 text-purple-400',
    Politics: 'bg-red-500/20 text-red-400',
    Health: 'bg-green-500/20 text-green-400',
    Sports: 'bg-orange-500/20 text-orange-400',
    Business: 'bg-blue-500/20 text-blue-400',
    Entertainment: 'bg-pink-500/20 text-pink-400',
    Technology: 'bg-cyan-500/20 text-cyan-400',
  };

  categoryAccentColors: Record<string, string> = {
    National: 'from-primary to-primary/80',
    International: 'from-purple-500 to-purple-600',
    Politics: 'from-red-500 to-red-600',
    Health: 'from-green-500 to-green-600',
    Sports: 'from-orange-500 to-amber-500',
    Business: 'from-blue-500 to-blue-600',
    Entertainment: 'from-pink-500 to-rose-500',
  };

  constructor(private route: ActivatedRoute) { }

  ngOnInit() {
    this.route.params.subscribe(params => {
      const categoryParam = params['category'];
      // Capitalize first letter
      this.categoryName = categoryParam.charAt(0).toUpperCase() + categoryParam.slice(1);
      this.filterNews();
    });
  }

  filterNews() {
    this.filteredNews = this.allNews.filter(
      news => news.category.toLowerCase() === this.categoryName.toLowerCase()
    );
  }

  getCategoryColor(category: string): string {
    return this.categoryColors[category] || 'bg-primary/20 text-primary';
  }

  getCategoryAccentColor(category: string): string {
    return this.categoryAccentColors[category] || 'from-primary to-primary/80';
  }
}
