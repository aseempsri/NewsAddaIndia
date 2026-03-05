/**
 * Slug utilities for news URLs.
 * URL format: /news/headline-slug (no id at the end)
 */

/**
 * Convert headline (English) to URL-safe slug.
 * Latin-only so all links work like the first post (no encoding/404 issues).
 * Returns empty if headline is non-Latin (caller should use slug from API).
 */
export function slugify(headline: string): string {
  if (!headline || typeof headline !== 'string') return '';
  const latin = headline
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9\-]/gi, '')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 50);
  return latin || '';
}

/**
 * Build share path: /news/{slug}. Use only Latin slugs (from API) for same link config as first post.
 */
export function getNewsSharePath(slugOrTitle: string): string {
  const s = (slugOrTitle || '').trim();
  if (!s) return '/news';
  // Use as-is only if already Latin; otherwise slugify (returns '' for non-Latin)
  const slug = s.length <= 90 && /^[a-z0-9\-]+$/i.test(s) ? s : slugify(s);
  if (!slug) return '/news';
  return `/news/${slug}`;
}

/**
 * Route param can be slug or legacy slug-id or plain id.
 * Backend accepts all; use as-is for API.
 */
export function getRouteParamForApi(param: string): string {
  if (!param || typeof param !== 'string') return '';
  return decodeURIComponent(param).trim().replace(/[\s\u00A0]/g, '');
}
