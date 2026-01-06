# 🖥️ Your VPS Configuration

## VPS Details
- **IP Address:** `72.60.235.158`
- **Hostname:** `srv1246615.hstgr.cloud`
- **Location:** Malaysia - Kuala Lumpur
- **OS:** Ubuntu 24.04 LTS
- **Plan:** KVM 2 (2 CPU, 8GB RAM, 100GB disk)

---

## 🌐 API Subdomain Options

### Option 1: Use VPS IP Address (Quick Start)

**For immediate testing, use your VPS IP:**

**Nginx Backend Config:**
```nginx
server {
    listen 80;
    server_name 72.60.235.158;  # Your VPS IP
    
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

**Frontend Environment (`environment.prod.ts`):**
```typescript
export const environment = {
  production: true,
  apiUrl: 'http://72.60.235.158'  // Your VPS IP
};
```

**Backend `.env`:**
```env
FRONTEND_URL=http://72.60.235.158
```

**Access your API:**
- `http://72.60.235.158/health`
- `http://72.60.235.158/api/news`

**Frontend Nginx Config (Same IP):**
```nginx
server {
    listen 80;
    server_name 72.60.235.158;  # Same VPS IP for frontend
    
    root /var/www/html;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    # Cache static assets
    location ~* \.(jpg|jpeg|png|gif|ico|css|js|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
```

**How it works:**
- **Frontend:** `http://72.60.235.158/` → Serves Angular app from `/var/www/html`
- **Backend API:** `http://72.60.235.158/api/*` → Proxied to `http://localhost:3000/api/*`
- **Backend Health:** `http://72.60.235.158/health` → Proxied to `http://localhost:3000/health`

**⚠️ Note:** Using the same IP for both works! Nginx routes based on the URL path. Get a domain name later for better security and SEO.

---

### Option 2: Claim Free .cloud Domain (Recommended)

Hostinger offers a **free .cloud domain** for your VPS hostname!

**Steps:**
1. In Hostinger hPanel, click **"Claim domain"** button (visible in your VPS overview)
2. You'll get: `srv1246615.cloud` (or similar)
3. Then create subdomain: `api.srv1246615.cloud`

**Nginx Backend Config:**
```nginx
server {
    listen 80;
    server_name api.srv1246615.cloud;  # Your API subdomain
    
    location / {
        proxy_pass http://localhost:3000;
        # ... rest of config
    }
}
```

**Frontend Environment:**
```typescript
apiUrl: 'http://api.srv1246615.cloud'
```

---

### Option 3: Use Your Own Domain

If you have a domain registered (check Hostinger → Domains):

**Example:** If your domain is `newsaddaindia.com`

**DNS Setup (in Hostinger DNS Manager):**
- Add A record: `api` → `72.60.235.158`

**Nginx Backend Config:**
```nginx
server {
    listen 80;
    server_name api.newsaddaindia.com;  # Your API subdomain
    
    location / {
        proxy_pass http://localhost:3000;
        # ... rest of config
    }
}
```

---

## 📝 Quick Setup Commands

### 1. Update Nginx Backend Config

```bash
sudo nano /etc/nginx/sites-available/news-adda-backend
```

**Paste this (using your VPS IP):**
```nginx
server {
    listen 80;
    server_name 72.60.235.158;  # Your VPS IP
    
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

**Save and enable:**
```bash
sudo ln -s /etc/nginx/sites-available/news-adda-backend /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

### 2. Update Frontend Environment

**File:** `Frontend/src/environments/environment.prod.ts`

```typescript
export const environment = {
  production: true,
  newsApiKey: 'NEWSAPI_KEY_PLACEHOLDER',
  apiUrl: 'http://72.60.235.158'  // Your VPS IP
};
```

### 3. Update Backend .env

**File:** `~/news-adda-backend/.env`

```env
FRONTEND_URL=http://72.60.235.158
```

---

## ✅ Test Your Setup

```bash
# Test backend health endpoint
curl http://72.60.235.158/health

# Should return: {"status":"OK","message":"Server is running"}
```

---

## 🔒 Next Steps (After Basic Setup)

1. **Get SSL Certificate (HTTPS):**
   ```bash
   sudo apt install certbot python3-certbot-nginx -y
   sudo certbot --nginx -d 72.60.235.158
   # Or if you have a domain: sudo certbot --nginx -d api.yourdomain.com
   ```

2. **Update URLs to HTTPS:**
   - Frontend: `apiUrl: 'https://72.60.235.158'`
   - Backend: `FRONTEND_URL=https://72.60.235.158`

3. **Register a Domain (Recommended):**
   - Get a domain from Hostinger
   - Point it to your VPS IP
   - Use proper subdomain: `api.yourdomain.com`

---

## 🎯 Summary

**For now (quick start):**
- **API URL:** `http://72.60.235.158`
- **Nginx server_name:** `72.60.235.158`
- **Frontend apiUrl:** `http://72.60.235.158`

**Later (production):**
- Claim free `.cloud` domain OR register a custom domain
- Set up proper subdomain: `api.yourdomain.com`
- Add SSL certificate for HTTPS

---

**✅ You're all set! Use `72.60.235.158` as your API address for now.**

