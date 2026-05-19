# Social Screen Frontend (`socialscreen.in`)

Separate Angular app from `Frontend/` (NewsAddaIndia). Shares the same **backend API** and **MongoDB**; news is published from NewsAdda admin only.

## Differences from NewsAddaIndia

- Branding: Social Screen logo and name
- **No author/publisher** on news cards or article pages
- Ads: `site=socialscreen` via `/api/ads?site=socialscreen`
- Admin: **`/admin/ads` only** (login included) — manage Social Screen ad slots

## Local development

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
