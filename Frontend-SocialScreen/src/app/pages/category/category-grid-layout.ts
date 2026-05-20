import { NewsArticle } from '../../services/news.service';

/** Four cards in 2×2 with a tall ad in the third column spanning two rows */
export type CategoryGridBlock = {
  type: 'quad-with-ad';
  trackId: string;
  cards: NewsArticle[];
  adSlot: number;
};

const CARDS_PER_BLOCK = 4;
const MAX_AD_SLOTS = 3;

export function buildCategoryGridBlocks(news: NewsArticle[]): CategoryGridBlock[] {
  const blocks: CategoryGridBlock[] = [];
  for (let i = 0; i < news.length; i += CARDS_PER_BLOCK) {
    const cards = news.slice(i, i + CARDS_PER_BLOCK);
    const adSlot = Math.floor(i / CARDS_PER_BLOCK) + 1;
    if (adSlot <= MAX_AD_SLOTS) {
      blocks.push({
        type: 'quad-with-ad',
        trackId: `quad-${i}`,
        cards,
        adSlot,
      });
    }
  }
  return blocks;
}

/** Tailwind grid placement for desktop 3×2 layout (cols 1–2 = cards, col 3 = ad). */
export function cardGridPlacement(index: number): string {
  const placements = [
    'lg:col-start-1 lg:row-start-1',
    'lg:col-start-2 lg:row-start-1',
    'lg:col-start-1 lg:row-start-2',
    'lg:col-start-2 lg:row-start-2',
  ];
  return placements[index] ?? '';
}
