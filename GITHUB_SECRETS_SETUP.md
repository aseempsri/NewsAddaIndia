# 🔐 GitHub Secrets Setup Guide

This guide will help you set up GitHub Secrets so that your code automatically deploys to Hostinger VPS on every push to the `main` branch.

---

## 📋 Step-by-Step Instructions

### Step 1: Generate SSH Key Pair

**On your local machine (Windows PowerShell):**

```powershell
# Generate SSH key pair for GitHub Actions
ssh-keygen -t rsa -b 4096 -C "github-actions-hostinger" -f $env:USERPROFILE\.ssh\hostinger_github

# This creates:
# C:\Users\YourUsername\.ssh\hostinger_github (private key) - Add to GitHub Secrets
# C:\Users\YourUsername\.ssh\hostinger_github.pub (public key) - Add to VPS
```

**Note:** When prompted for a passphrase, press Enter twice (leave it empty for automated deployments).

---

### Step 2: Add Public Key to Your VPS

**Option A: Using SSH with Password (Manual)**

```powershell
# Copy the public key content
Get-Content $env:USERPROFILE\.ssh\hostinger_github.pub

# SSH into your VPS
ssh root@72.60.235.158
# Enter password: adrikA@2025#

# On VPS, run these commands:
mkdir -p ~/.ssh
chmod 700 ~/.ssh
nano ~/.ssh/authorized_keys
# Paste the public key content (from hostinger_github.pub)
# Press Ctrl+X, then Y, then Enter to save
chmod 600 ~/.ssh/authorized_keys
exit
```

**Option B: Using PowerShell Script (Automated)**

I'll create a script to help you add the key automatically.

---

### Step 3: Add Secrets to GitHub

1. **Go to your GitHub repository**
   - Navigate to: `https://github.com/YOUR_USERNAME/NewsAddaIndia`

2. **Open Settings**
   - Click on **Settings** tab (top menu)

3. **Go to Secrets**
   - Click **Secrets and variables** → **Actions** (left sidebar)
   - Click **New repository secret**

4. **Add Each Secret One by One:**

#### Required Secrets:

| Secret Name | Value | Description |
|------------|-------|-------------|
| `HOSTINGER_VPS_HOST` | `72.60.235.158` | Your VPS IP address |
| `HOSTINGER_VPS_USER` | `root` | SSH username |
| `HOSTINGER_VPS_SSH_KEY` | *(see below)* | Private SSH key content |
| `MONGODB_URI` | `mongodb://newsadda_user:YOUR_PASSWORD@localhost:27017/newsaddaindia?authSource=newsaddaindia` | MongoDB connection string |
| `JWT_SECRET` | `your-random-secret-key-here` | JWT secret (generate a random string) |
| `ADMIN_PASSWORD` | `your-admin-password` | Admin panel password (hashed) |

#### Optional Secrets (Recommended):

| Secret Name | Value | Description |
|------------|-------|-------------|
| `HOSTINGER_VPS_PORT` | `22` | SSH port (default: 22) |
| `FRONTEND_URL` | `http://72.60.235.158` | Frontend URL for CORS |
| `BACKEND_API_URL` | `http://72.60.235.158` | Backend API URL |
| `ADMIN_USERNAME` | `admin` | Admin username (default: admin) |
| `NEWSAPI_KEY` | `your-newsapi-key` | NewsAPI key (if using) |

---

### Step 4: Get Your Private SSH Key

**In PowerShell:**

```powershell
# Display the private key (copy everything including BEGIN and END lines)
Get-Content $env:USERPROFILE\.ssh\hostinger_github
```

**Copy the entire output**, which should look like:

```
-----BEGIN RSA PRIVATE KEY-----
MIIEpAIBAAKCAQEAx/O3iQgAiCzX0cUnxbrqWETW6ej6UcC77/2192hc/OoLnWBP
... (many lines) ...
iarwRfRKxwEGNTBfV2fTL1PE/3huhTBe22rBOp11rISSqPOFtqwpimh30AU/hlrb
-----END RSA PRIVATE KEY-----
```

**Important:** Copy everything from `-----BEGIN RSA PRIVATE KEY-----` to `-----END RSA PRIVATE KEY-----`

---

### Step 5: Add SSH Key to GitHub Secrets

1. In GitHub → **Settings** → **Secrets and variables** → **Actions**
2. Click **New repository secret**
3. **Name:** `HOSTINGER_VPS_SSH_KEY`
4. **Value:** Paste the entire private key (from Step 4)
5. Click **Add secret**

---

### Step 6: Get MongoDB URI

**If you already have MongoDB set up on your VPS:**

```bash
# SSH into VPS
ssh root@72.60.235.158

# Check MongoDB connection string format
# It should be: mongodb://username:password@localhost:27017/database?authSource=authDatabase
```

**Example:**
```
mongodb://newsadda_user:your-password@localhost:27017/newsaddaindia?authSource=newsaddaindia
```

**If you don't have MongoDB set up yet:**
- See `MONGODB_VPS_DEPLOYMENT.md` for setup instructions
- Or use the default value in the workflow (will need to be updated later)

---

### Step 7: Generate JWT Secret

**Generate a random secret:**

```powershell
# In PowerShell, generate a random string
-join ((65..90) + (97..122) + (48..57) | Get-Random -Count 32 | ForEach-Object {[char]$_})
```

**Or use an online generator:**
- Visit: https://www.random.org/strings/
- Generate a 32-character random string

**Add as secret:** `JWT_SECRET` with the generated value

---

## ✅ Verification Checklist

After setting up all secrets, verify:

- [ ] `HOSTINGER_VPS_HOST` = `72.60.235.158`
- [ ] `HOSTINGER_VPS_USER` = `root`
- [ ] `HOSTINGER_VPS_SSH_KEY` = (your private key)
- [ ] `MONGODB_URI` = (your MongoDB connection string)
- [ ] `JWT_SECRET` = (random secret string)
- [ ] `ADMIN_PASSWORD` = (your admin password)
- [ ] `FRONTEND_URL` = `http://72.60.235.158` (optional but recommended)
- [ ] `BACKEND_API_URL` = `http://72.60.235.158` (optional but recommended)

---

## 🧪 Test SSH Connection

**Before testing GitHub Actions, verify SSH works:**

```powershell
# Test SSH connection with the key
ssh -i $env:USERPROFILE\.ssh\hostinger_github root@72.60.235.158

# If it connects without password prompt, you're good!
# Type 'exit' to disconnect
```

---

## 🚀 Test Deployment

**Once all secrets are set up:**

1. **Make a small change** to your code
2. **Commit and push:**
   ```bash
   git add .
   git commit -m "Test automatic deployment"
   git push origin main
   ```
3. **Check GitHub Actions:**
   - Go to your repository → **Actions** tab
   - You should see "Deploy to Hostinger VPS" workflow running
   - Click on it to see the deployment progress

---

## 🎯 How It Works

**When you push to `main` branch:**

1. ✅ GitHub Actions detects the push
2. ✅ Checks out your code
3. ✅ Connects to VPS via SSH (using your SSH key)
4. ✅ **Backend:** Pulls latest code, installs dependencies, restarts PM2
5. ✅ **Frontend:** Builds Angular app, uploads to `/var/www/html`, reloads Nginx
6. ✅ Verifies deployment status

**Deployment Control:**

- **Deploy both:** Just push normally
- **Deploy only backend:** Add `[backend-only]` to commit message
- **Deploy only frontend:** Add `[frontend-only]` to commit message

**Examples:**
```bash
git commit -m "Update backend API"           # Deploys both
git commit -m "[backend-only] Fix bug"       # Deploys only backend
git commit -m "[frontend-only] Update UI"    # Deploys only frontend
```

---

## 🆘 Troubleshooting

### Issue: SSH Connection Failed

**Solution:**
```bash
# Test SSH manually
ssh -i ~/.ssh/hostinger_github root@72.60.235.158

# Check SSH key format in GitHub Secrets
# Should include: -----BEGIN RSA PRIVATE KEY-----
```

### Issue: Permission Denied

**Solution:**
```bash
# On VPS, check permissions
ssh root@72.60.235.158
ls -la ~/.ssh/authorized_keys
chmod 600 ~/.ssh/authorized_keys
```

### Issue: Git Pull Failed

**Solution:**
```bash
# On VPS, ensure git is configured
ssh root@72.60.235.158
cd ~/news-adda-backend
git config --global user.name "GitHub Actions"
git config --global user.email "actions@github.com"
```

### Issue: PM2 Not Found

**Solution:**
```bash
# On VPS, install PM2 globally
ssh root@72.60.235.158
npm install -g pm2
```

---

## 📚 Additional Resources

- **GitHub Actions Docs:** https://docs.github.com/en/actions
- **SSH Key Generation:** https://docs.github.com/en/authentication/connecting-to-github-with-ssh/generating-a-new-ssh-key-and-adding-it-to-the-ssh-agent
- **GitHub Secrets:** https://docs.github.com/en/actions/security-guides/encrypted-secrets

---

## ✅ Summary

**What you need to do:**

1. ✅ Generate SSH key pair
2. ✅ Add public key to VPS (`~/.ssh/authorized_keys`)
3. ✅ Add private key to GitHub Secrets (`HOSTINGER_VPS_SSH_KEY`)
4. ✅ Add other required secrets (VPS host, user, MongoDB URI, etc.)
5. ✅ Push code to `main` branch
6. ✅ Watch it deploy automatically! 🚀

**Once set up, every push to `main` will automatically deploy to your Hostinger VPS!**

