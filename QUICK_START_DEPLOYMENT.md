# Quick Start: Hostinger Deployment

This is a condensed version of the full deployment guide. For detailed instructions, see [HOSTINGER_DEPLOYMENT_GUIDE.md](HOSTINGER_DEPLOYMENT_GUIDE.md).

## 🚀 Quick Deployment Steps

### 1. MongoDB Setup (5 minutes)

1. Create account at https://www.mongodb.com/cloud/atlas
2. Create free M0 cluster
3. Create database user (Database Access)
4. Whitelist VPS IP (Network Access)
5. Copy connection string

### 2. Backend Setup (15 minutes)

```bash
# SSH into VPS
ssh root@your-vps-ip

# Run setup script (optional)
chmod +x backend/deploy-setup.sh
sudo ./backend/deploy-setup.sh

# Or manual setup:
# Install Node.js 18
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install PM2
sudo npm install -g pm2

# Upload backend code and install dependencies
cd ~/news-adda-backend
npm install --production

# Create .env file (see backend/.env.example)
nano .env

# Start with PM2
pm2 start server.js --name news-adda-backend
pm2 save
pm2 startup

# Configure Nginx (copy backend/nginx-backend.conf)
sudo cp backend/nginx-backend.conf /etc/nginx/sites-available/news-adda-backend
sudo nano /etc/nginx/sites-available/news-adda-backend  # Edit domain
sudo ln -s /etc/nginx/sites-available/news-adda-backend /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

### 3. Frontend Setup (10 minutes)

**Option A: Shared Hosting**
```bash
# On local machine
cd Frontend
npm install
# Edit src/environments/environment.prod.ts (set apiUrl)
npm run build

# Upload dist/news-adda-india/browser/* to public_html via FTP
# Create .htaccess in public_html (see guide)
```

**Option B: Same VPS**
```bash
# On VPS
cd ~/NewsAddaIndia/Frontend
npm install
# Edit src/environments/environment.prod.ts (set apiUrl)
npm run build -- --configuration production

# Configure Nginx (copy backend/nginx-frontend.conf)
sudo cp backend/nginx-frontend.conf /etc/nginx/sites-available/news-adda-frontend
sudo nano /etc/nginx/sites-available/news-adda-frontend  # Edit domain and path
sudo ln -s /etc/nginx/sites-available/news-adda-frontend /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

### 4. SSL Setup (5 minutes)

```bash
# Install SSL certificates
sudo certbot --nginx -d api.yourdomain.com
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com

# Test auto-renewal
sudo certbot renew --dry-run
```

### 5. Verify Deployment

- ✅ Backend: `curl https://api.yourdomain.com/health`
- ✅ Frontend: Visit `https://yourdomain.com`
- ✅ Check PM2: `pm2 status`
- ✅ Check logs: `pm2 logs news-adda-backend`

## 📝 Required Environment Variables

Create `backend/.env`:

```env
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/newsaddaindia
PORT=3000
NODE_ENV=production
FRONTEND_URL=https://yourdomain.com
JWT_SECRET=<generate-random-string>
ADMIN_USERNAME=admin
ADMIN_PASSWORD=<secure-password>
```

Generate JWT secret:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

## 🔧 Common Commands

```bash
# Backend
pm2 restart news-adda-backend
pm2 logs news-adda-backend
pm2 status

# Nginx
sudo nginx -t
sudo systemctl reload nginx
sudo systemctl status nginx

# SSL
sudo certbot renew
sudo certbot certificates
```

## 📚 Full Documentation

- **Complete Guide:** [HOSTINGER_DEPLOYMENT_GUIDE.md](HOSTINGER_DEPLOYMENT_GUIDE.md)
- **Checklist:** [DEPLOYMENT_CHECKLIST.md](DEPLOYMENT_CHECKLIST.md)
- **Nginx Configs:** `backend/nginx-backend.conf`, `backend/nginx-frontend.conf`
- **PM2 Config:** `backend/ecosystem.config.js`

## ⚠️ Important Notes

1. **Change default admin credentials** before going live
2. **Use strong JWT_SECRET** (random 32+ character string)
3. **Restrict MongoDB IP access** to your VPS IP only
4. **Enable SSL** for both frontend and backend
5. **Set up backups** for MongoDB and code

## 🆘 Troubleshooting

**Backend not starting?**
```bash
pm2 logs news-adda-backend
# Check .env file exists and has correct values
```

**502 Bad Gateway?**
```bash
# Check if backend is running
pm2 status
# Check Nginx error logs
sudo tail -f /var/log/nginx/error.log
```

**CORS errors?**
- Update `FRONTEND_URL` in backend `.env`
- Restart backend: `pm2 restart news-adda-backend`

**MongoDB connection failed?**
- Verify connection string in `.env`
- Check MongoDB Atlas IP whitelist
- Verify database user credentials

---

**Need help?** Refer to the full deployment guide or Hostinger support.

