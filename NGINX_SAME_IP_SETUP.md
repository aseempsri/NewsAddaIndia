# 🌐 Nginx Configuration: Using Same IP for Frontend and Backend

## ✅ Yes, Use the Same IP Address!

You can use **`72.60.235.158`** for both frontend and backend. Nginx will route requests correctly based on the URL path.

---

## 📋 Complete Nginx Configuration

### Backend Configuration

**File:** `/etc/nginx/sites-available/news-adda-backend`

```nginx
server {
    listen 80;
    server_name 72.60.235.158;  # Your VPS IP
    
    # API routes - proxy to backend
    location /api {
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
    
    # Health check - proxy to backend
    location /health {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

### Frontend Configuration

**File:** `/etc/nginx/sites-available/news-adda-frontend`

```nginx
server {
    listen 80;
    server_name 72.60.235.158;  # Same VPS IP
    
    root /var/www/html;
    index index.html;

    # Serve frontend for all other routes
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

---

## 🔄 How Routing Works

When someone visits `http://72.60.235.158`:

1. **`/api/*` routes** → Backend server block handles → Proxied to `localhost:3000`
   - Example: `http://72.60.235.158/api/news` → Backend
   - Example: `http://72.60.235.158/api/auth/login` → Backend

2. **`/health` route** → Backend server block handles → Proxied to `localhost:3000`
   - Example: `http://72.60.235.158/health` → Backend

3. **Everything else (`/`)** → Frontend server block handles → Serves Angular app
   - Example: `http://72.60.235.158/` → Frontend
   - Example: `http://72.60.235.158/admin` → Frontend
   - Example: `http://72.60.235.158/category/politics` → Frontend

---

## 🚀 Setup Commands

```bash
# 1. Create backend config
sudo nano /etc/nginx/sites-available/news-adda-backend
# Paste backend config above

# 2. Create frontend config
sudo nano /etc/nginx/sites-available/news-adda-frontend
# Paste frontend config above

# 3. Enable both sites
sudo ln -s /etc/nginx/sites-available/news-adda-backend /etc/nginx/sites-enabled/
sudo ln -s /etc/nginx/sites-available/news-adda-frontend /etc/nginx/sites-enabled/

# 4. Test configuration
sudo nginx -t

# 5. Reload Nginx
sudo systemctl reload nginx
```

---

## ✅ Test Your Setup

```bash
# Test backend health
curl http://72.60.235.158/health
# Should return: {"status":"OK","message":"Server is running"}

# Test backend API
curl http://72.60.235.158/api/news
# Should return news data

# Test frontend (in browser)
# Visit: http://72.60.235.158
# Should show your Angular app
```

---

## 📝 Environment Configuration

### Frontend (`environment.prod.ts`)
```typescript
export const environment = {
  production: true,
  apiUrl: 'http://72.60.235.158'  // Same IP, Angular will use /api routes
};
```

### Backend (`.env`)
```env
FRONTEND_URL=http://72.60.235.158
```

---

## 🎯 Summary

**✅ Use `72.60.235.158` for both:**
- **Backend server_name:** `72.60.235.158`
- **Frontend server_name:** `72.60.235.158`

**Nginx routing:**
- `/api/*` → Backend (port 3000)
- `/health` → Backend (port 3000)
- `/` → Frontend (static files)

**Access:**
- Frontend: `http://72.60.235.158/`
- Backend API: `http://72.60.235.158/api/news`
- Backend Health: `http://72.60.235.158/health`

---

**Later, when you get a domain:**
- Frontend: `yourdomain.com` → `http://yourdomain.com/`
- Backend: `api.yourdomain.com` → `http://api.yourdomain.com/api/news`

But for now, using the same IP works perfectly! ✅

