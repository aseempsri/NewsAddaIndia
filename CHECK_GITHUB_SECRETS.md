# 🔍 Check GitHub Secrets - Quick Diagnostic

## 🚨 Current Error

```
ssh.ParsePrivateKey: ssh: no key found
ssh: handshake failed: ssh: unable to authenticate
```

This means GitHub Actions **cannot find or parse your SSH key**.

---

## ✅ Step 1: Verify Secret Exists

1. **Go to GitHub Secrets:**
   - Open: `https://github.com/aseempsri/NewsAddaIndia/settings/secrets/actions`

2. **Check if `HOSTINGER_VPS_SSH_KEY` exists:**
   - Look for it in the list
   - If it's **missing** → You need to create it
   - If it **exists** → You need to update it (might be wrong format)

---

## ✅ Step 2: Get Your SSH Key (Correct Format)

**Run this in PowerShell:**

```powershell
# Get your private key
$key = Get-Content $env:USERPROFILE\.ssh\hostinger_github -Raw

# Display it
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Copy this ENTIRE key:" -ForegroundColor Yellow
Write-Host "========================================" -ForegroundColor Cyan
Write-Host $key -ForegroundColor White
Write-Host "========================================" -ForegroundColor Cyan
```

**OR use the verification script:**

```powershell
.\verify_ssh_key.ps1
```

---

## ✅ Step 3: Add/Update GitHub Secret

### Option A: Secret Doesn't Exist

1. Click **"New repository secret"**
2. **Name:** `HOSTINGER_VPS_SSH_KEY`
3. **Value:** Paste the ENTIRE key (from Step 2)
4. Click **"Add secret"**

### Option B: Secret Exists (Update It)

1. Click on `HOSTINGER_VPS_SSH_KEY`
2. Click **"Update"**
3. **Value:** Paste the ENTIRE key (from Step 2)
4. Click **"Update secret"**

---

## ⚠️ Common Mistakes

### ❌ Wrong: Missing BEGIN/END lines
```
MIIEpAIBAAKCAQEAx/O3iQgAiCzX0cUnxbrqWETW6ej6UcC77/2192hc/OoLnWBP
iarwRfRKxwEGNTBfV2fTL1PE/3huhTBe22rBOp11rISSqPOFtqwpimh30AU/hlrb
...
```

### ✅ Correct: Includes BEGIN/END lines
```
-----BEGIN RSA PRIVATE KEY-----
MIIEpAIBAAKCAQEAx/O3iQgAiCzX0cUnxbrqWETW6ej6UcC77/2192hc/OoLnWBP
iarwRfRKxwEGNTBfV2fTL1PE/3huhTBe22rBOp11rISSqPOFtqwpimh30AU/hlrb
... (many lines) ...
-----END RSA PRIVATE KEY-----
```

### ❌ Wrong: All on one line
```
-----BEGIN RSA PRIVATE KEY----- MIIEpAIBAAKCAQEA... -----END RSA PRIVATE KEY-----
```

### ✅ Correct: Each line on its own line
```
-----BEGIN RSA PRIVATE KEY-----
MIIEpAIBAAKCAQEA...
(many lines)
-----END RSA PRIVATE KEY-----
```

---

## ✅ Step 4: Verify All Required Secrets

**Make sure these exist:**

| Secret Name | Status | Action |
|------------|--------|--------|
| `HOSTINGER_VPS_HOST` | ✅/❌ | Should be `72.60.235.158` |
| `HOSTINGER_VPS_USER` | ✅/❌ | Should be `root` |
| `HOSTINGER_VPS_SSH_KEY` | ✅/❌ | **MUST include BEGIN/END lines** |
| `MONGODB_URI` | ✅/❌ | Your MongoDB connection string |
| `JWT_SECRET` | ✅/❌ | Random secret string |
| `ADMIN_PASSWORD` | ✅/❌ | Your admin password |

---

## ✅ Step 5: Test Locally First

**Before re-running GitHub Actions, test SSH locally:**

```powershell
# Test SSH connection
ssh -i $env:USERPROFILE\.ssh\hostinger_github root@72.60.235.158 "echo 'SSH works!'"
```

**If this works:**
- ✅ Your SSH key is correct
- ✅ Public key is on VPS
- ❌ Problem is in GitHub Secrets format

**If this fails:**
- ❌ SSH key might be wrong
- ❌ Public key not on VPS
- See `FIX_SSH_AUTHENTICATION.md` for details

---

## ✅ Step 6: Re-run Workflow

**After fixing the secret:**

1. Go to GitHub → **Actions** tab
2. Find the failed run
3. Click **"Re-run all jobs"**

**OR trigger new deployment:**

```bash
git commit --allow-empty -m "Fix SSH key secret"
git push origin main
```

---

## 🔍 Debugging Tips

### Check Secret Value Length

**Your SSH key should be:**
- **At least 1500 characters** (RSA 4096-bit key)
- **Usually 2000-3000 characters**
- **Multiple lines** (not one long line)

**If your secret is:**
- **Too short** (< 500 chars) → Wrong key or truncated
- **One line** → Missing line breaks
- **Missing BEGIN/END** → Wrong format

### Verify Key Format

**Run this PowerShell:**

```powershell
$key = Get-Content $env:USERPROFILE\.ssh\hostinger_github -Raw

# Check length
Write-Host "Key length: $($key.Length) characters" -ForegroundColor Yellow

# Check for BEGIN
if ($key -match "-----BEGIN RSA PRIVATE KEY-----") {
    Write-Host "✅ Has BEGIN marker" -ForegroundColor Green
} else {
    Write-Host "❌ Missing BEGIN marker" -ForegroundColor Red
}

# Check for END
if ($key -match "-----END RSA PRIVATE KEY-----") {
    Write-Host "✅ Has END marker" -ForegroundColor Green
} else {
    Write-Host "❌ Missing END marker" -ForegroundColor Red
}

# Check line count
$lines = ($key -split "`n").Count
Write-Host "Total lines: $lines" -ForegroundColor Yellow
if ($lines -gt 10) {
    Write-Host "✅ Has multiple lines (good)" -ForegroundColor Green
} else {
    Write-Host "⚠️  Very few lines (might be wrong format)" -ForegroundColor Yellow
}
```

---

## 🎯 Quick Fix Checklist

- [ ] Secret `HOSTINGER_VPS_SSH_KEY` exists in GitHub
- [ ] Secret includes `-----BEGIN RSA PRIVATE KEY-----`
- [ ] Secret includes `-----END RSA PRIVATE KEY-----`
- [ ] Secret has multiple lines (not one long line)
- [ ] Secret is at least 1500 characters long
- [ ] SSH works locally (`ssh -i key root@72.60.235.158`)
- [ ] Public key is on VPS (`cat ~/.ssh/authorized_keys`)
- [ ] Re-run workflow after fixing

---

## 🚀 Still Not Working?

**If you've verified everything and it still fails:**

1. **Delete the secret** and recreate it
2. **Use the exact output** from `Get-Content` command
3. **Don't edit** the key manually
4. **Check for hidden characters** (copy from file, not terminal)

**Or try generating a new key:**

```powershell
# Generate new key
ssh-keygen -t rsa -b 4096 -C "github-actions-hostinger" -f $env:USERPROFILE\.ssh\hostinger_github_new -N '""'

# Use the new key
.\verify_ssh_key.ps1
# (Update path in script to use hostinger_github_new)
```

---

**Once the secret is correctly formatted, your deployments will work!** 🎉

