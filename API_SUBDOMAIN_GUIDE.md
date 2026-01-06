# 🌐 API Subdomain Guide

## What is an API Subdomain?

An API subdomain is a separate address for your backend API. It's typically:
- **Format:** `api.yourdomain.com`
- **Purpose:** Separates your frontend (`yourdomain.com`) from your backend API (`api.yourdomain.com`)

---

## 🎯 Examples

### If your domain is `newsaddaindia.com`:
- **Frontend:** `https://newsaddaindia.com` or `https://www.newsaddaindia.com`
- **Backend API:** `https://api.newsaddaindia.com`

### If your domain is `mynews.com`:
- **Frontend:** `https://mynews.com`
- **Backend API:** `https://api.mynews.com`

### If you don't have a domain yet (Your Current Situation):
- **Use your VPS IP address:** `http://72.60.235.158` (Your VPS IP)
- **Or claim Hostinger's free .cloud domain:** `srv1246615.cloud` → `api.srv1246615.cloud`
- **Or use Hostinger's free subdomain:** `https://your-site.hostingersite.com`

**📖 See `YOUR_VPS_CONFIG.md` for your specific VPS configuration!**

---

## 📋 How to Determine Your API Subdomain

### Step 1: Check What Domain You Have

**Option A: You have a domain registered**
- Check your Hostinger account → **Domains**
- Your domain might be: `newsaddaindia.com`, `mynews.in`, etc.
- **API subdomain will be:** `api.yourdomain.com`

**Option B: You don't have a domain yet**
- You can use your VPS IP address temporarily
- Or register a domain through Hostinger
- Or use Hostinger's free subdomain

---

## 🔧 Setting Up Your API Subdomain

### Method 1: Using Your Own Domain

**1. In Hostinger Control Panel (hPanel):**
   - Go to **Domains** → **Manage** → **DNS Zone Editor**
   - Find your domain (e.g., `newsaddaindia.com`)

**2. Add A Record for API Subdomain:**
   - **Type:** `A`
   - **Name:** `api` (this creates `api.yourdomain.com`)
   - **Value/Points to:** Your VPS IP address (e.g., `123.456.789.0`)
   - **TTL:** `3600` (or default)
   - Click **Add Record** or **Save**

**3. Wait for DNS Propagation:**
   - Usually takes 5-30 minutes
   - Check with: `nslookup api.yourdomain.com` or `dig api.yourdomain.com`

**4. Update Nginx Configuration:**
   ```bash
   sudo nano /etc/nginx/sites-available/news-adda-backend
   ```
   
   Change:
   ```nginx
   server_name api.yourdomain.com;  # Replace with YOUR actual domain
   ```
   
   To:
   ```nginx
   server_name api.newsaddaindia.com;  # Example: if your domain is newsaddaindia.com
   ```

---

### Method 2: Using VPS IP Address (Temporary)

If you don't have a domain yet, you can use your VPS IP:

**1. Update Nginx Configuration:**
   ```bash
   sudo nano /etc/nginx/sites-available/news-adda-backend
   ```
   
   Change:
   ```nginx
   server_name api.yourdomain.com;
   ```
   
   To:
   ```nginx
   server_name YOUR_VPS_IP;  # e.g., 123.456.789.0
   # OR use _ to accept any hostname
   server_name _;
   ```

**2. Access your API:**
   - `http://YOUR_VPS_IP/api/news`
   - `http://YOUR_VPS_IP/health`

**⚠️ Note:** This is temporary. Get a domain for production use.

---

### Method 3: Using Hostinger Free Subdomain

Hostinger provides free subdomains like `your-site.hostingersite.com`:

**1. Generate Free Subdomain:**
   - In Hostinger hPanel → **Domains** → **Free Subdomain**
   - Generate: `newsaddaindia.hostingersite.com`

**2. Use for API:**
   - **Frontend:** `https://newsaddaindia.hostingersite.com`
   - **Backend API:** `https://api-newsaddaindia.hostingersite.com` (or create another subdomain)

---

## 📝 Complete Example Setup

### Example: Domain is `newsaddaindia.com`

**1. DNS Records (in Hostinger):**
   ```
   Type    Name    Value              TTL
   A       @       123.456.789.0      3600    (Main domain)
   A       www     123.456.789.0      3600    (www subdomain)
   A       api     123.456.789.0      3600    (API subdomain)
   ```

**2. Nginx Backend Config:**
   ```nginx
   server {
       listen 80;
       server_name api.newsaddaindia.com;  # ✅ Your API subdomain
       
       location / {
           proxy_pass http://localhost:3000;
           # ... rest of config
       }
   }
   ```

**3. Nginx Frontend Config:**
   ```nginx
   server {
       listen 80;
       server_name newsaddaindia.com www.newsaddaindia.com;  # ✅ Your main domain
       
       root /var/www/html;
       # ... rest of config
   }
   ```

**4. Frontend Environment (`environment.prod.ts`):**
   ```typescript
   export const environment = {
     production: true,
     apiUrl: 'https://api.newsaddaindia.com'  // ✅ Your API subdomain
   };
   ```

**5. Backend `.env` file:**
   ```env
   FRONTEND_URL=https://newsaddaindia.com  # ✅ Your main domain
   ```

---

## 🔍 How to Find Your Domain

**Check Hostinger Account:**
1. Login to Hostinger hPanel
2. Go to **Domains** section
3. You'll see your registered domains listed

**Or check your VPS:**
- Some VPS plans come with a free subdomain
- Check Hostinger VPS dashboard

---

## ✅ Quick Checklist

- [ ] Determine your domain name (or use VPS IP temporarily)
- [ ] Add DNS A record: `api` → `YOUR_VPS_IP`
- [ ] Update Nginx config: `server_name api.yourdomain.com;`
- [ ] Update frontend: `apiUrl: 'https://api.yourdomain.com'`
- [ ] Update backend `.env`: `FRONTEND_URL=https://yourdomain.com`
- [ ] Test: `curl http://api.yourdomain.com/health`

---

## 🆘 Common Questions

**Q: Do I need a separate domain for API?**
A: No! Use a subdomain: `api.yourdomain.com` (free with your domain)

**Q: Can I use the same domain for both?**
A: Yes, but using a subdomain (`api.`) is recommended for better organization

**Q: What if I don't have a domain?**
A: Use your VPS IP temporarily, or get a free domain/subdomain from Hostinger

**Q: How long does DNS take to work?**
A: Usually 5-30 minutes, but can take up to 48 hours

**Q: Can I test before DNS propagates?**
A: Yes! Edit `/etc/hosts` on your local machine to test:
   ```
   123.456.789.0  api.yourdomain.com
   ```

---

## 🎯 Summary

**Your API subdomain format:**
```
api.YOUR_DOMAIN.com
```

**Examples:**
- Domain: `newsaddaindia.com` → API: `api.newsaddaindia.com`
- Domain: `mynews.in` → API: `api.mynews.in`
- Domain: `example.com` → API: `api.example.com`

**Replace in Nginx config:**
```nginx
server_name api.yourdomain.com;  # Change "yourdomain.com" to YOUR actual domain
```

---

**Need help?** Check your Hostinger account → Domains section to see what domains you have registered!

