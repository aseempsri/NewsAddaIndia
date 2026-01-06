# 🚀 Deploy Frontend - Build Complete!

Your frontend build is ready! Output location: `/root/NewsAddaIndia/Frontend/dist/news-adda-india`

---

## ✅ Deploy Frontend Files

Run these commands to deploy your built frontend:

```bash
# 1. Copy built files to web root
sudo rm -rf /var/www/html/*
sudo cp -r /root/NewsAddaIndia/Frontend/dist/news-adda-india/browser/* /var/www/html/

# 2. Set proper permissions (Nginx runs as www-data)
sudo chown -R www-data:www-data /var/www/html
sudo chmod -R 755 /var/www/html
sudo find /var/www/html -type f -exec chmod 644 {} \;
sudo find /var/www/html -type d -exec chmod 755 {} \;

# 3. Verify files are deployed
ls -la /var/www/html
# Should see: index.html, main-*.js, styles-*.css, etc.

# 4. Reload Nginx
sudo systemctl reload nginx

# 5. Test in browser
curl http://72.60.235.158/
# Should return HTML content (not 403)
```

---

## 🌐 Test Your Site

**In browser, visit:**
- `http://72.60.235.158/` → Should show your Angular app
- `http://72.60.235.158/health` → Backend health check
- `http://72.60.235.158/api/news` → Backend API

---

## ✅ Verify Deployment

```bash
# Check if index.html exists
ls -la /var/www/html/index.html

# Check file permissions
ls -la /var/www/html/ | head -10

# Test file access as www-data (Nginx user)
sudo -u www-data cat /var/www/html/index.html | head -5

# Check Nginx error logs (should be empty or no errors)
sudo tail -20 /var/log/nginx/error.log
```

---

## 🎯 Expected Result

After deployment:
- ✅ `http://72.60.235.158/` → Shows your Angular app (not 403)
- ✅ Frontend loads and connects to backend API
- ✅ No 403 Forbidden errors

---

## 📝 Note About Build Warnings

The build warnings are normal:
- **Bundle size warning:** Your app is 661KB (budget is 512KB) - this is fine for production
- **CSS warning:** `:lang(hi)` selector - doesn't affect functionality

These warnings don't prevent deployment. Your app will work fine!

---

## 🚀 Next Steps

1. **Deploy frontend** (commands above)
2. **Test in browser** → `http://72.60.235.158/`
3. **Set up GitHub Actions** for automatic deployments
4. **Get SSL certificate** for HTTPS (later)

---

**Run the deployment commands above and your site should be live!** 🎉

