/** Social Screen ad slots per nav section (matches header categories + Home). */
export interface AdSectionConfig {
  id: string;
  title: string;
  slots: number[];
}

export const AD_SECTIONS: AdSectionConfig[] = [
  { id: 'home', title: 'Home', slots: [1, 2, 3, 4, 5, 6] },
  { id: 'article', title: 'Article', slots: [1, 2] },
  { id: 'national', title: 'National', slots: [1, 2, 3, 4] },
  { id: 'international', title: 'International', slots: [1, 2, 3, 4] },
  { id: 'religious', title: 'Religious', slots: [1, 2, 3, 4] },
  { id: 'politics', title: 'Politics', slots: [1, 2, 3, 4] },
  { id: 'health', title: 'Health', slots: [1, 2, 3, 4] },
  { id: 'entertainment', title: 'Entertainment', slots: [1, 2, 3, 4] },
  { id: 'sports', title: 'Sports', slots: [1, 2, 3, 4] },
  { id: 'business', title: 'Business', slots: [1, 2, 3, 4] }
];

export function sectionAdId(sectionId: string, slot: number): string {
  return `${sectionId}-ad${slot}`;
}

export function allSocialScreenAdIds(): string[] {
  return AD_SECTIONS.flatMap(s => s.slots.map(n => sectionAdId(s.id, n)));
}

/** Article detail page: AD1 above Share; AD2 above footer */
export const ARTICLE_PAGE_AD_MAP = {
  aboveShare: sectionAdId('article', 1),
  aboveFooter: sectionAdId('article', 2)
} as const;

/** Home sidebar: AD1 → Weather → AD2 → Cricket → AD3 → Panchang → AD4 */
/** Home main column: AD5 between Politics & Health; AD6 before footer */
export const HOME_PAGE_AD_MAP = {
  sidebar1: sectionAdId('home', 1),
  sidebar2: sectionAdId('home', 2),
  sidebar3: sectionAdId('home', 3),
  sidebar4: sectionAdId('home', 4),
  betweenPoliticsHealth: sectionAdId('home', 5),
  beforeFooter: sectionAdId('home', 6)
} as const;
