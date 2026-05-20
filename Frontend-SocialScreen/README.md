# Social Screen Frontend (`socialscreen.in`)

Separate Angular app from `Frontend/` (NewsAddaIndia). Shares the same **backend API** and **MongoDB**; news is published from NewsAdda admin only.

## Differences from NewsAddaIndia

- Branding: Social Screen logo and name
- **No author/publisher** on news cards or article pages
- Ads: `site=socialscreen` via `/api/ads?site=socialscreen`
- Admin: **`/admin/ads` only** — nine section cards (Home + 8 categories). **Home sidebar:** Weather → AD1 → Cricket → AD2 → Panchang → AD3 → AD4
- Ad IDs in DB: `home-ad1`, `national-ad1`, etc. (`site=socialscreen`)
- Category pages (`/category/national`, etc.): after every 3 story cards, **AD1–AD3** show centered (desktop 3-column rows; mobile stacked)

## Local development

**One-time (if `/admin/ads` shows "Failed to load ads")** — your MongoDB may still have the old `adId`-only unique index. From the repo root:

```bash
cd backend
node scripts/migrateAdsSiteField.js
```

Then restart the backend. This adds `site=socialscreen` ad slots and does not remove NewsAdda ad data.

```bash
cd Frontend-SocialScreen
npm install
npm start
```

Runs on http://localhost:4200 (use `environment.ts` → `apiUrl: 'http://localhost:3000'`).

- Public site: http://localhost:4200/
- Ad admin: http://localhost:4200/admin/ads

## Production build

```bash
npm run build:prod
```

Output: `dist/social-screen/browser/`

Deploy to VPS e.g. `/var/www/socialscreen` with Nginx `server_name socialscreen.in` and `location /api` proxied to the same backend as NewsAdda.

## Backend

Ensure `backend` is deployed with site-scoped ads. Existing NewsAdda ads default to `site=newsadda`. Social Screen slots are created automatically on first fetch.

Add to `backend/.env` (optional):

```env
FRONTEND_URL=https://newsaddaindia.com,https://socialscreen.in
```
