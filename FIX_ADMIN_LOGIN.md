# 🔐 Fix Admin Login - 401 Unauthorized Error

## 🚨 Problem

Getting `401 Unauthorized` when trying to login with:
- Username: `admin`
- Password: `adrikA@2025#`

Even though `.env` file has:
```
ADMIN_USERNAME=admin
ADMIN_PASSWORD=adrikA@2025#
```

---

## ✅ Solutions

### Solution 1: Restart Backend (Most Common Fix)

The backend needs to be restarted to load the new `.env` values:

```bash
# On VPS
cd ~/news-adda-backend

# Restart PM2 process
pm2 restart news-adda-backend

# Check logs to verify it loaded .env
pm2 logs news-adda-backend --lines 20
```

### Solution 2: Check .env File Format

**Issue:** The `#` character in passwords can cause issues in some shells.

**Fix:** Wrap password in quotes or escape special characters:

```bash
# On VPS, edit .env file
cd ~/news-adda-backend
nano .env
```

**Option A: Use quotes (recommended):**
```env
ADMIN_USERNAME=admin
ADMIN_PASSWORD="adrikA@2025#"
```

**Option B: Escape special characters:**
```env
ADMIN_USERNAME=admin
ADMIN_PASSWORD=adrikA@2025\#
```

**Option C: Use different password without #:**
```env
ADMIN_USERNAME=admin
ADMIN_PASSWORD=adrikA@2025
```

After editing, restart backend:
```bash
pm2 restart news-adda-backend
```

### Solution 3: Verify .env File is Being Read

```bash
# On VPS, check if .env file exists and has correct values
cd ~/news-adda-backend
cat .env | grep ADMIN

# Test if Node.js can read the values
node -e "require('dotenv').config(); console.log('Username:', process.env.ADMIN_USERNAME); console.log('Password:', process.env.ADMIN_PASSWORD);"
```

**Expected output:**
```
Username: admin
Password: adrikA@2025#
```

If password shows as `undefined` or wrong, there's a parsing issue.

### Solution 4: Check for Extra Spaces

Make sure there are no spaces around the `=` sign:

**Wrong:**
```env
ADMIN_USERNAME = admin
ADMIN_PASSWORD = adrikA@2025#
```

**Correct:**
```env
ADMIN_USERNAME=admin
ADMIN_PASSWORD=adrikA@2025#
```

---

## 🔍 Debug Steps

### Step 1: Verify Backend is Reading .env

```bash
# On VPS
cd ~/news-adda-backend

# Test environment variables
node -e "require('dotenv').config(); console.log('ADMIN_USERNAME:', process.env.ADMIN_USERNAME); console.log('ADMIN_PASSWORD:', process.env.ADMIN_PASSWORD ? 'SET' : 'NOT SET');"
```

### Step 2: Check Backend Logs

```bash
# View recent logs
pm2 logs news-adda-backend --lines 50

# Look for any errors or warnings about environment variables
```

### Step 3: Test Login via API Directly

```bash
# Test login endpoint directly
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"adrikA@2025#"}'

# Or test via public IP
curl -X POST http://72.60.235.158/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"adrikA@2025#"}'
```

**Expected response (success):**
```json
{
  "success": true,
  "token": "eyJhbGc...",
  "message": "Login successful"
}
```

**If still 401:**
- Check password in .env matches exactly
- Verify no extra spaces or quotes
- Restart backend again

---

## 🎯 Complete Fix Procedure

**Run these commands on your VPS:**

```bash
# 1. Navigate to backend directory
cd ~/news-adda-backend

# 2. Check current .env values
cat .env | grep ADMIN

# 3. Edit .env file (use quotes for password with special characters)
nano .env
# Make sure it looks like:
# ADMIN_USERNAME=admin
# ADMIN_PASSWORD="adrikA@2025#"

# 4. Save and exit (Ctrl+O, Enter, Ctrl+X)

# 5. Verify .env is readable
node -e "require('dotenv').config(); console.log('Username:', process.env.ADMIN_USERNAME); console.log('Password:', process.env.ADMIN_PASSWORD);"

# 6. Restart backend
pm2 restart news-adda-backend

# 7. Wait a few seconds, then check logs
sleep 3
pm2 logs news-adda-backend --lines 10

# 8. Test login
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"adrikA@2025#"}'
```

---

## 🔧 Alternative: Update Password Without Special Characters

If the `#` character continues to cause issues, use a password without it:

```bash
# Edit .env
cd ~/news-adda-backend
nano .env

# Change to:
ADMIN_USERNAME=admin
ADMIN_PASSWORD=adrikA2025

# Restart backend
pm2 restart news-adda-backend
```

Then login with:
- Username: `admin`
- Password: `adrikA2025`

---

## ✅ Verify Fix

After restarting backend:

1. **Test in browser:** `http://72.60.235.158/admin`
   - Username: `admin`
   - Password: `adrikA@2025#` (or new password)

2. **Check Network tab:** Should see `200 OK` instead of `401 Unauthorized`

3. **Check response:** Should receive a token and redirect to admin dashboard

---

## 🐛 Common Issues

**Issue:** Password with `#` not working
- **Fix:** Wrap in quotes: `ADMIN_PASSWORD="adrikA@2025#"`

**Issue:** Backend not reading .env
- **Fix:** Restart PM2: `pm2 restart news-adda-backend`

**Issue:** Extra spaces in .env
- **Fix:** Remove spaces: `ADMIN_USERNAME=admin` (not `ADMIN_USERNAME = admin`)

**Issue:** .env file not in correct location
- **Fix:** Ensure `.env` is in `~/news-adda-backend/.env`

---

**Most likely fix: Restart the backend after setting .env values!** 🔄

Run: `pm2 restart news-adda-backend` on your VPS.

