# Social Screen deployment (socialscreen.in)

## Project layout

| Path | Purpose |
|------|---------|
| `Frontend/` | newsaddaindia.com (unchanged) |
| `Frontend-SocialScreen/` | socialscreen.in |
| `backend/` | Shared API + MongoDB |

## URLs

| Site | Public | Ad admin |
|------|--------|----------|
| NewsAddaIndia | https://newsaddaindia.com | https://newsaddaindia.com/admin/ads |
| Social Screen | https://socialscreen.in | https://socialscreen.in/admin/ads |

Same admin username/password as NewsAdda (shared `/api/auth`).

## Architecture on the VPS

Both domains point to the **same server IP**. One PM2 process runs the backend on **port 3000**. Nginx chooses the site by `server_name` and serves the correct Angular build:

| Domain | Static files | API |
|--------|----------------|-----|
| `newsaddaindia.com` | `/var/www/html` | `proxy_pass` → `localhost:3000` |
| `socialscreen.in` | `/var/www/socialscreen` | same backend |

Social Screen’s `environment.prod.ts` uses `apiUrl: ''` so the browser calls `/api/...` on **socialscreen.in** (same-origin). No separate API subdomain is required.

---

## VPS deploy (manual)

```bash
cd /root/NewsAddaIndia
git pull origin main

# Backend (site-scoped ads — run migration once after first deploy of this code)
cd backend
npm install --production
node scripts/migrateAdsSiteField.js   # safe to re-run
pm2 restart news-adda-backend

# NewsAdda frontend (unchanged)
cd ../Frontend
npm install && npm run build:prod
sudo cp -r dist/news-adda-india/browser/* /var/www/html/

# Social Screen frontend
cd ../Frontend-SocialScreen
npm install && npm run build:prod
sudo mkdir -p /var/www/socialscreen
sudo cp -r dist/social-screen/browser/* /var/www/socialscreen/
sudo chown -R www-data:www-data /var/www/socialscreen
sudo chmod -R 755 /var/www/socialscreen
```

### Backend `.env` (recommended)

Allow both frontends in CORS and for push/link helpers (comma-separated):

```env
FRONTEND_URL=https://newsaddaindia.com,https://www.newsaddaindia.com,https://socialscreen.in,https://www.socialscreen.in
```

Restart after editing: `pm2 restart news-adda-backend`

---

## DNS

At your registrar, add **A records** (same VPS IP as NewsAdda):

| Host | Type | Value |
|------|------|--------|
| `@` (or `socialscreen.in`) | A | `72.60.235.158` (your VPS IP) |
| `www` | A | same IP |

Optional: CNAME `www` → `socialscreen.in` if your DNS provider supports it.

Wait for DNS to propagate (`dig socialscreen.in` or `nslookup socialscreen.in`) before running Certbot.

---

## Nginx

A ready-made config is in the repo: **`nginx-socialscreen.conf`** (mirror of NewsAdda’s `nginx-news-adda-fixed.conf`, with `root /var/www/socialscreen` and `server_name socialscreen.in`).

### 1. Install the site config (HTTP first — required before SSL)

**Do not** copy `nginx-socialscreen.conf` until Certbot has created certificates. That file references `/etc/letsencrypt/live/socialscreen.in/` and `nginx -t` will fail if those files are missing.

```bash
cd /root/NewsAddaIndia
sudo cp nginx-socialscreen-http-only.conf /etc/nginx/sites-available/socialscreen
sudo ln -sf /etc/nginx/sites-available/socialscreen /etc/nginx/sites-enabled/socialscreen
sudo nginx -t && sudo systemctl reload nginx
```

Keep your existing NewsAdda config enabled (e.g. `/etc/nginx/sites-enabled/news-adda`). **Do not** remove it — both sites run in parallel.

Test: `curl -I http://socialscreen.in/` and `curl http://socialscreen.in/api/news?limit=1`

### 2. HTTP-only test (optional manual block)

If you prefer editing by hand instead of `nginx-socialscreen-http-only.conf`, use a simple static server:

```nginx
server {
    listen 80;
    server_name socialscreen.in www.socialscreen.in;
    root /var/www/socialscreen;
    index index.html;
    client_max_body_size 100M;

    location /api { proxy_pass http://localhost:3000; }
    location /health { proxy_pass http://localhost:3000; }
    location /uploads { proxy_pass http://localhost:3000; }
    location / { try_files $uri $uri/ /index.html; }
}
```

Then:

```bash
sudo nginx -t
sudo systemctl reload nginx
curl -I http://socialscreen.in/
curl http://socialscreen.in/api/news?limit=1
```

### 3. SSL with Let’s Encrypt (Certbot)

Ensure DNS points to the VPS, `/var/www/socialscreen` exists, and **step 1 HTTP config is active** (`nginx -t` passes).

**Recommended — Certbot nginx plugin:**

```bash
sudo certbot --nginx -d socialscreen.in -d www.socialscreen.in
```

**Option B — webroot:**

```bash
sudo certbot certonly --webroot -w /var/www/socialscreen \
  -d socialscreen.in -d www.socialscreen.in
```

Then install the full HTTPS config and reload:

```bash
sudo cp /root/NewsAddaIndia/nginx-socialscreen.conf /etc/nginx/sites-available/socialscreen
sudo nginx -t
sudo systemctl reload nginx
```

Auto-renewal is usually already set up via `certbot.timer`. Test renewal:

```bash
sudo certbot renew --dry-run
```

### 4. What each `location` does

| Path | Behavior |
|------|----------|
| `/` | Angular SPA (`try_files` → `index.html`) |
| `/api` | Proxied to `http://localhost:3000` (shared backend) |
| `/health` | Backend health check |
| `/uploads` | Images/files from backend |
| `/news/:slug` | Crawler bots → backend OG HTML; browsers → Angular |
| `*.js`, `assets/*`, `push-sw.js` | Long cache (1 year) |
| `index.html` | No cache (fresh deploys) |

### 5. Verify after go-live

```bash
curl -I https://socialscreen.in/
curl -s https://socialscreen.in/api/news?limit=1 | head
curl -s "https://socialscreen.in/api/ads?site=socialscreen" | head
```

In a browser:

- https://socialscreen.in — home page loads
- https://socialscreen.in/admin/ads — ad admin (Social Screen ads only)
- https://newsaddaindia.com — unchanged

### 6. Troubleshooting

| Symptom | Check |
|---------|--------|
| 502 on `/api` | `pm2 status` — is `news-adda-backend` running on port 3000? |
| Wrong site / NewsAdda HTML on socialscreen.in | `server_name` in enabled configs; `sudo nginx -T \| grep socialscreen` |
| SSL errors | Cert paths in config match `ls /etc/letsencrypt/live/` |
| Blank page after deploy | Files in `/var/www/socialscreen/index.html`; `chown www-data:www-data` |
| CORS errors from browser | `FRONTEND_URL` in `backend/.env` includes `https://socialscreen.in` |

---

## Quick reference

```bash
# Rebuild Social Screen only
cd /root/NewsAddaIndia/Frontend-SocialScreen && npm run build:prod
sudo cp -r dist/social-screen/browser/* /var/www/socialscreen/
sudo systemctl reload nginx

# Logs
sudo tail -f /var/log/nginx/error.log
pm2 logs news-adda-backend
```
