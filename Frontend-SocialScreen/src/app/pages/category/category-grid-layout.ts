import { NewsArticle } from '../../services/news.service';

/** Three cards per row, then an ad slot (4 rows × up to 12 cards). */
export type CategoryGridRow = {
  trackId: string;
  cards: NewsArticle[];
  adSlot: number;
};

const CARDS_PER_ROW = 3;
const MAX_AD_SLOTS = 4;
const MAX_CARDS = CARDS_PER_ROW * MAX_AD_SLOTS;

export function buildCategoryGridRows(news: NewsArticle[]): CategoryGridRow[] {
  const items = news.slice(0, MAX_CARDS);
  if (items.length === 0) return [];

  const rows: CategoryGridRow[] = [];
  for (let slot = 0; slot < MAX_AD_SLOTS; slot++) {
    const start = slot * CARDS_PER_ROW;
    const cards = items.slice(start, start + CARDS_PER_ROW);
    rows.push({
      trackId: `row-${slot}`,
      cards,
      adSlot: slot + 1,
    });
  }
  return rows;
}
