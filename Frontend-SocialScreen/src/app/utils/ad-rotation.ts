const ROTATION_KEY_PREFIX = 'ss-ad-rot-';

/** Pick media index for this page load; advances stored index for the next refresh. */
export function pickRotatedMediaIndex(adId: string, itemCount: number): number {
  if (itemCount <= 1) return 0;

  const key = `${ROTATION_KEY_PREFIX}${adId}`;
  try {
    const raw = sessionStorage.getItem(key);
    let stored = raw !== null ? parseInt(raw, 10) : 0;
    if (Number.isNaN(stored) || stored < 0) stored = 0;
    const index = stored % itemCount;
    sessionStorage.setItem(key, String((stored + 1) % itemCount));
    return index;
  } catch {
    return Math.floor(Math.random() * itemCount);
  }
}
