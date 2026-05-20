/** Social Screen ad slots per nav section (matches header categories + Home). */
export interface AdSectionConfig {
  id: string;
  title: string;
  slots: number[];
}

export const AD_SECTIONS: AdSectionConfig[] = [
  { id: 'home', title: 'Home', slots: [1, 2, 3, 4] },
  { id: 'national', title: 'National', slots: [1, 2, 3] },
  { id: 'international', title: 'International', slots: [1, 2, 3] },
  { id: 'religious', title: 'Religious', slots: [1, 2, 3] },
  { id: 'politics', title: 'Politics', slots: [1, 2, 3] },
  { id: 'health', title: 'Health', slots: [1, 2, 3] },
  { id: 'entertainment', title: 'Entertainment', slots: [1, 2, 3] },
  { id: 'sports', title: 'Sports', slots: [1, 2, 3] },
  { id: 'business', title: 'Business', slots: [1, 2, 3] }
];

export function sectionAdId(sectionId: string, slot: number): string {
  return `${sectionId}-ad${slot}`;
}

export function allSocialScreenAdIds(): string[] {
  return AD_SECTIONS.flatMap(s => s.slots.map(n => sectionAdId(s.id, n)));
}

/** Home sidebar: Weather → AD1 → Cricket → AD2 → Panchang → AD3 → AD4 */
export const HOME_PAGE_AD_MAP = {
  sidebar1: sectionAdId('home', 1),
  sidebar2: sectionAdId('home', 2),
  sidebar3: sectionAdId('home', 3),
  sidebar4: sectionAdId('home', 4)
} as const;
