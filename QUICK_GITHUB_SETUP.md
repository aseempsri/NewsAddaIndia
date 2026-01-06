# ⚡ Quick GitHub Setup Guide

**Get automatic deployment working in 5 minutes!**

---

## 🚀 Quick Steps

### 1. Generate SSH Key (2 minutes)

**Run this PowerShell script:**
```powershell
.\setup_github_ssh.ps1
```

**Or manually:**
```powershell
ssh-keygen -t rsa -b 4096 -C "github-actions-hostinger" -f $env:USERPROFILE\.ssh\hostinger_github -N '""'
```

---

### 2. Add Public Key to VPS (1 minute)

**Copy your public key:**
```powershell
Get-Content $env:USERPROFILE\.ssh\hostinger_github.pub
```

**SSH into VPS and add it:**
```bash
ssh root@72.60.235.158
# Password: adrikA@2025#

mkdir -p ~/.ssh
chmod 700 ~/.ssh
nano ~/.ssh/authorized_keys
# Paste public key, save (Ctrl+X, Y, Enter)
chmod 600 ~/.ssh/authorized_keys
exit
```

---

### 3. Add Secrets to GitHub (2 minutes)

**Go to:** `https://github.com/YOUR_USERNAME/NewsAddaIndia/settings/secrets/actions`

**Add these secrets:**

| Secret Name | Value |
|------------|-------|
| `HOSTINGER_VPS_HOST` | `72.60.235.158` |
| `HOSTINGER_VPS_USER` | `root` |
| `HOSTINGER_VPS_SSH_KEY` | *(copy from `Get-Content $env:USERPROFILE\.ssh\hostinger_github`)* |
| `MONGODB_URI` | `mongodb://newsadda_user:YOUR_PASSWORD@localhost:27017/newsaddaindia?authSource=newsaddaindia` |
| `JWT_SECRET` | *(generate random 32-char string)* |
| `ADMIN_PASSWORD` | *(your admin password)* |
| `FRONTEND_URL` | `http://72.60.235.158` |
| `BACKEND_API_URL` | `http://72.60.235.158` |

---

### 4. Test Deployment

**Push a change:**
```bash
git add .
git commit -m "Test automatic deployment"
git push origin main
```

**Check GitHub Actions:**
- Go to your repo → **Actions** tab
- Watch the deployment run!

---

## ✅ That's It!

**Now every push to `main` automatically deploys to your Hostinger VPS!**

---

## 📚 Need More Details?

See `GITHUB_SECRETS_SETUP.md` for detailed instructions and troubleshooting.

---

## 🎯 Deployment Control

**Control what deploys:**

- **Deploy both:** `git commit -m "Update code"`
- **Backend only:** `git commit -m "[backend-only] Fix API"`
- **Frontend only:** `git commit -m "[frontend-only] Update UI"`

