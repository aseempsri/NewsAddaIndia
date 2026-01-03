# Hostinger Deployment Checklist

Use this checklist to track your deployment progress.

## Pre-Deployment

- [ ] Hostinger VPS account created
- [ ] Domain name registered/configured
- [ ] MongoDB Atlas account created (or MongoDB installed on VPS)
- [ ] SSH access to VPS configured
- [ ] FTP/File Manager access configured (if using shared hosting)

## MongoDB Setup

- [ ] MongoDB Atlas cluster created
- [ ] Database user created with read/write permissions
- [ ] Network access configured (IP whitelist)
- [ ] Connection string copied and saved securely
- [ ] Database name decided (e.g., `newsaddaindia`)

## Backend Deployment

- [ ] Connected to VPS via SSH
- [ ] Node.js 18+ installed
- [ ] PM2 installed globally
- [ ] Nginx installed and running
- [ ] Backend code uploaded to VPS
- [ ] Backend dependencies installed (`npm install`)
- [ ] `.env` file created with all required variables:
  - [ ] MONGODB_URI
  - [ ] PORT
  - [ ] FRONTEND_URL
  - [ ] JWT_SECRET (strong random string)
  - [ ] ADMIN_USERNAME
  - [ ] ADMIN_PASSWORD
- [ ] `uploads` directory created with proper permissions
- [ ] Backend tested locally (`npm start`)
- [ ] Backend started with PM2
- [ ] PM2 configured to start on boot
- [ ] Nginx reverse proxy configured for backend
- [ ] Firewall configured (ports 80, 443, 22)
- [ ] Backend health check passed (`/health` endpoint)

## Frontend Deployment

- [ ] Frontend built locally (`npm run build`)
- [ ] `environment.prod.ts` updated with backend API URL
- [ ] Frontend code uploaded to hosting
- [ ] `.htaccess` file created (if using shared hosting)
- [ ] Nginx configured for frontend (if using VPS)
- [ ] Static files served correctly
- [ ] Angular routing working (no 404 errors)

## Domain & SSL

- [ ] Domain DNS configured (A records)
- [ ] Subdomain created for API (api.yourdomain.com)
- [ ] SSL certificate installed for backend
- [ ] SSL certificate installed for frontend
- [ ] HTTPS working on both frontend and backend
- [ ] Auto-renewal configured for SSL certificates

## Post-Deployment Testing

- [ ] Frontend loads at https://yourdomain.com
- [ ] Backend API accessible at https://api.yourdomain.com
- [ ] Health check endpoint working
- [ ] News articles loading on frontend
- [ ] API calls successful (check browser console)
- [ ] Admin login working
- [ ] MongoDB connection verified (check backend logs)
- [ ] Image uploads working (if applicable)
- [ ] No CORS errors in browser console
- [ ] Mobile responsiveness tested

## Security

- [ ] Default admin credentials changed
- [ ] Strong JWT_SECRET set
- [ ] MongoDB network access restricted
- [ ] Firewall rules configured
- [ ] SSL certificates valid
- [ ] Environment variables secured (not in Git)
- [ ] Regular backup strategy planned

## Monitoring & Maintenance

- [ ] PM2 monitoring setup
- [ ] Log rotation configured
- [ ] Backup schedule planned
- [ ] Update procedure documented
- [ ] Error monitoring setup (optional)

## Notes

- Backend URL: _______________________
- Frontend URL: _______________________
- MongoDB URI: _______________________
- Admin Username: _______________________
- VPS IP: _______________________

---

**Deployment Date:** _______________
**Deployed By:** _______________

