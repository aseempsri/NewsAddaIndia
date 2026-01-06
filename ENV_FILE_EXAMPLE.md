# 📝 Complete .env File Contents

This file contains all the environment variables needed for your News Adda India backend.

---

## 📄 Complete .env File Template

Create the file at: `~/news-adda-backend/.env`

```env
# ============================================
# MongoDB Configuration
# ============================================
# MongoDB Atlas connection string (recommended)
# Format: mongodb+srv://username:password@cluster.mongodb.net/database-name?retryWrites=true&w=majority
MONGODB_URI=mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/newsaddaindia?retryWrites=true&w=majority

# OR if using local MongoDB on VPS:
# MONGODB_URI=mongodb://localhost:27017/newsaddaindia

# ============================================
# Server Configuration
# ============================================
PORT=3000
NODE_ENV=production

# ============================================
# Frontend URL (for CORS)
# ============================================
# Your frontend domain (update with your actual domain)
FRONTEND_URL=https://yourdomain.com

# ============================================
# JWT Secret Key
# ============================================
# Generate a secure random key (see instructions below)
JWT_SECRET=your-super-secret-jwt-key-change-this-to-random-string-minimum-32-characters

# ============================================
# Admin Credentials
# ============================================
# Change these to secure values!
ADMIN_USERNAME=admin
ADMIN_PASSWORD=your-secure-admin-password-change-this

# ============================================
# NewsAPI Key (Optional)
# ============================================
# Only needed if you're using NewsAPI service
# Leave empty if not using: NEWSAPI_KEY=
NEWSAPI_KEY=your-newsapi-key-if-needed
```

---

## 🔑 How to Fill Each Value

### 1. MONGODB_URI

**Option A: MongoDB Atlas (Recommended - Free Tier Available)**
1. Go to https://www.mongodb.com/cloud/atlas
2. Create a free account
3. Create a cluster (choose FREE tier M0)
4. Go to **Database Access** → Create database user
5. Go to **Network Access** → Add your VPS IP address (or `0.0.0.0/0` for testing)
6. Go to **Database** → **Connect** → **Connect your application**
7. Copy the connection string
8. Replace `<password>` with your database user password
9. Replace `<dbname>` with `newsaddaindia`

**Example:**
```env
MONGODB_URI=mongodb+srv://newsadda_user:MySecurePassword123@cluster0.abc123.mongodb.net/newsaddaindia?retryWrites=true&w=majority
```

**Option B: Local MongoDB on VPS**
```env
MONGODB_URI=mongodb://localhost:27017/newsaddaindia
```

---

### 2. PORT

Usually `3000`. Change only if port 3000 is already in use.

```env
PORT=3000
```

---

### 3. NODE_ENV

Set to `production` for production deployment.

```env
NODE_ENV=production
```

---

### 4. FRONTEND_URL

Your frontend website URL. This is used for CORS (Cross-Origin Resource Sharing).

**Examples:**
```env
# If using a domain
FRONTEND_URL=https://newsaddaindia.com

# If using a subdomain
FRONTEND_URL=https://www.newsaddaindia.com

# If using IP address (not recommended for production)
FRONTEND_URL=http://123.456.789.0
```

**Important:** 
- Use `https://` if you have SSL certificate
- Use `http://` only for testing
- Include `www.` if your domain uses it

---

### 5. JWT_SECRET

A secure random string used to sign JWT tokens. **Must be at least 32 characters long.**

**Generate a secure JWT secret:**

**On your VPS:**
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

**On Windows (PowerShell):**
```powershell
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

**On Mac/Linux:**
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

**Example output:**
```
a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6
```

**Use it in .env:**
```env
JWT_SECRET=a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6
```

**⚠️ Important:** 
- Never share this secret
- Use a different secret for each environment
- Keep it secure and don't commit to git

---

### 6. ADMIN_USERNAME

Your admin login username. Can be anything you want.

```env
ADMIN_USERNAME=admin
```

**Or use a custom username:**
```env
ADMIN_USERNAME=myadmin
```

---

### 7. ADMIN_PASSWORD

Your admin login password. **Use a strong password!**

**Requirements:**
- At least 8 characters
- Mix of uppercase, lowercase, numbers, and symbols
- Don't use common passwords

**Examples:**
```env
ADMIN_PASSWORD=MySecurePass123!
ADMIN_PASSWORD=Admin@2024#Secure
```

**⚠️ Important:** 
- Change the default password!
- Use a strong, unique password
- Don't use the same password as other services

---

### 8. NEWSAPI_KEY (Optional)

Only needed if you're using NewsAPI service. If not using, you can leave it empty or omit it.

```env
# If using NewsAPI
NEWSAPI_KEY=your-actual-newsapi-key-here

# If NOT using NewsAPI (leave empty)
NEWSAPI_KEY=
```

---

## 📝 Complete Example .env File

Here's a complete example with sample values (replace with your actual values):

```env
# MongoDB Atlas Connection
MONGODB_URI=mongodb+srv://newsadda_user:SecurePassword123@cluster0.abc123.mongodb.net/newsaddaindia?retryWrites=true&w=majority

# Server Settings
PORT=3000
NODE_ENV=production

# Frontend URL
FRONTEND_URL=https://newsaddaindia.com

# JWT Secret (generated secure key)
JWT_SECRET=7f3a9b2c4d6e8f1a3b5c7d9e1f3a5b7c9d1e3f5a7b9c1d3e5f7a9b1c3d5e7f9a

# Admin Credentials
ADMIN_USERNAME=admin
ADMIN_PASSWORD=Admin@Secure2024!

# NewsAPI (optional)
NEWSAPI_KEY=
```

---

## 🚀 How to Create the .env File on VPS

**Step 1: SSH into your VPS**
```bash
ssh root@your-vps-ip
```

**Step 2: Navigate to backend directory**
```bash
cd ~/news-adda-backend
```

**Step 3: Create .env file**
```bash
nano .env
```

**Step 4: Paste the contents**
- Copy the template above
- Paste into nano editor
- Replace all placeholder values with your actual values

**Step 5: Save and exit**
- Press `Ctrl + O` to save
- Press `Enter` to confirm
- Press `Ctrl + X` to exit

**Step 6: Verify the file**
```bash
cat .env
```

**Step 7: Set proper permissions (optional but recommended)**
```bash
chmod 600 .env
```

---

## ✅ Verification Checklist

After creating the .env file, verify:

- [ ] `MONGODB_URI` is set and correct
- [ ] `JWT_SECRET` is at least 32 characters long
- [ ] `ADMIN_PASSWORD` is changed from default
- [ ] `FRONTEND_URL` matches your actual domain
- [ ] File is saved at `~/news-adda-backend/.env`
- [ ] File permissions are secure (`chmod 600 .env`)

---

## 🔒 Security Best Practices

1. **Never commit .env to git**
   - Already in `.gitignore` ✅

2. **Use strong passwords**
   - Admin password: Mix of letters, numbers, symbols
   - JWT secret: At least 32 random characters

3. **Restrict file permissions**
   ```bash
   chmod 600 .env  # Only owner can read/write
   ```

4. **Use environment-specific values**
   - Different values for development and production
   - Never reuse production secrets in development

5. **Rotate secrets regularly**
   - Change JWT_SECRET periodically
   - Change admin password regularly

---

## 🐛 Troubleshooting

**Problem: Backend can't connect to MongoDB**
- Check `MONGODB_URI` is correct
- Verify MongoDB Atlas network access includes your VPS IP
- Check database user credentials

**Problem: CORS errors in browser**
- Verify `FRONTEND_URL` matches your actual frontend URL exactly
- Include `https://` or `http://` protocol
- Restart backend after changing: `pm2 restart news-adda-backend`

**Problem: Admin login not working**
- Check `ADMIN_USERNAME` and `ADMIN_PASSWORD` are correct
- Verify no extra spaces in .env file
- Restart backend: `pm2 restart news-adda-backend`

**Problem: JWT token errors**
- Verify `JWT_SECRET` is set and not empty
- Make sure it's at least 32 characters
- Restart backend after changing JWT_SECRET

---

## 📚 Related Files

- **Backend code:** `backend/server.js` - Uses these environment variables
- **Auth routes:** `backend/routes/auth.js` - Uses ADMIN_USERNAME, ADMIN_PASSWORD, JWT_SECRET
- **Git ignore:** `.gitignore` - Ensures .env is not committed

---

**✅ Your .env file is ready! Now you can start your backend with `pm2 start server.js --name news-adda-backend`**

