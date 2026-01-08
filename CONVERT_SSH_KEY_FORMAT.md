# 🔄 Convert OpenSSH Key to RSA Format for GitHub Actions

## 🚨 The Problem

You have an **OpenSSH format** key:
```
-----BEGIN OPENSSH PRIVATE KEY-----
```

But GitHub Actions needs an **RSA format** key:
```
-----BEGIN RSA PRIVATE KEY-----
```

**This is why you're getting:** `ssh.ParsePrivateKey: ssh: no key found`

---

## ✅ Solution: Convert or Generate New Key

### Option 1: Convert Existing OpenSSH Key to RSA (Recommended)

**If you want to keep using your existing key:**

```powershell
# Convert OpenSSH key to RSA format
ssh-keygen -p -m PEM -f $env:USERPROFILE\.ssh\hostinger_github

# When prompted for passphrase:
# - If key has no passphrase: Press Enter twice
# - If key has passphrase: Enter it, then press Enter twice for new passphrase (leave empty)
```

**This will convert your key to RSA format.**

**Then verify:**

```powershell
Get-Content $env:USERPROFILE\.ssh\hostinger_github | Select-Object -First 1
```

**Should now show:** `-----BEGIN RSA PRIVATE KEY-----`

---

### Option 2: Generate New RSA Format Key (Easier)

**If conversion doesn't work, generate a new key:**

```powershell
# Generate new RSA format key
ssh-keygen -t rsa -b 4096 -C "github-actions-hostinger" -f $env:USERPROFILE\.ssh\hostinger_github -m PEM -N '""'

# Verify format
Get-Content $env:USERPROFILE\.ssh\hostinger_github | Select-Object -First 1
# Should show: -----BEGIN RSA PRIVATE KEY-----
```

**Then add the NEW public key to VPS:**

```powershell
# Display new public key
Get-Content $env:USERPROFILE\.ssh\hostinger_github.pub

# SSH into VPS and add it
ssh root@72.60.235.158
# Password: adrikA@2025#

# On VPS:
mkdir -p ~/.ssh
chmod 700 ~/.ssh
nano ~/.ssh/authorized_keys
# Paste the NEW public key (replace old one or add as new line)
# Save: Ctrl+X, Y, Enter
chmod 600 ~/.ssh/authorized_keys
exit
```

---

## ✅ Step-by-Step: Fix GitHub Actions

### Step 1: Get RSA Format Key

**After converting or generating, get your key:**

```powershell
Get-Content $env:USERPROFILE\.ssh\hostinger_github
```

**Verify it starts with:**
```
-----BEGIN RSA PRIVATE KEY-----
```

**NOT:**
```
-----BEGIN OPENSSH PRIVATE KEY-----
```

---

### Step 2: Add to GitHub Secrets

1. **Go to:** `https://github.com/aseempsri/NewsAddaIndia/settings/secrets/actions`

2. **Find `HOSTINGER_VPS_SSH_KEY`:**
   - If exists: Click → **Update**
   - If missing: Click **New repository secret**

3. **Set:**
   - **Name:** `HOSTINGER_VPS_SSH_KEY`
   - **Value:** Paste the ENTIRE RSA format key (from Step 1)
     - Must start with: `-----BEGIN RSA PRIVATE KEY-----`
     - Must end with: `-----END RSA PRIVATE KEY-----`
     - Include ALL lines

4. **Save**

---

### Step 3: Verify Public Key on VPS

**Make sure the matching public key is on VPS:**

```bash
ssh root@72.60.235.158
cat ~/.ssh/authorized_keys
# Should see your public key (starts with ssh-rsa)
```

**If not, add it:**

```bash
# On VPS
mkdir -p ~/.ssh
chmod 700 ~/.ssh
nano ~/.ssh/authorized_keys
# Paste public key from: Get-Content $env:USERPROFILE\.ssh\hostinger_github.pub
# Save: Ctrl+X, Y, Enter
chmod 600 ~/.ssh/authorized_keys
```

---

### Step 4: Test Locally

**Before testing in GitHub Actions:**

```powershell
ssh -i $env:USERPROFILE\.ssh\hostinger_github root@72.60.235.158 "echo 'SSH works!'"
```

**If this works, your key is correct!**

---

### Step 5: Re-run GitHub Actions

**After fixing the secret:**

1. Go to: `https://github.com/aseempsri/NewsAddaIndia/actions`
2. Click **"Re-run all jobs"** on failed run

**OR trigger new deployment:**

```bash
git commit --allow-empty -m "Fix SSH key format"
git push origin main
```

---

## 🔍 Key Format Comparison

### OpenSSH Format (❌ Not compatible with GitHub Actions)
```
-----BEGIN OPENSSH PRIVATE KEY-----
b3BlbnNzaC1rZXktdjEAAAAABG5vbmUAAAAEbm9uZQAAAAAAAAABAAACFwAAAAdzc2gtcn
...
-----END OPENSSH PRIVATE KEY-----
```

### RSA Format (✅ Compatible with GitHub Actions)
```
-----BEGIN RSA PRIVATE KEY-----
MIIEpAIBAAKCAQEAx/O3iQgAiCzX0cUnxbrqWETW6ej6UcC77/2192hc/OoLnWBP
iarwRfRKxwEGNTBfV2fTL1PE/3huhTBe22rBOp11rISSqPOFtqwpimh30AU/hlrb
...
-----END RSA PRIVATE KEY-----
```

---

## 🎯 Quick Fix Script

**Run this PowerShell script to fix everything:**

```powershell
# Check current key format
$keyPath = "$env:USERPROFILE\.ssh\hostinger_github"
$firstLine = Get-Content $keyPath -First 1

if ($firstLine -match "OPENSSH") {
    Write-Host "⚠️  OpenSSH format detected - converting to RSA..." -ForegroundColor Yellow
    
    # Try to convert
    ssh-keygen -p -m PEM -f $keyPath -N '""' 2>&1 | Out-Null
    
    # Verify conversion
    $newFirstLine = Get-Content $keyPath -First 1
    if ($newFirstLine -match "RSA") {
        Write-Host "✅ Converted to RSA format!" -ForegroundColor Green
    } else {
        Write-Host "❌ Conversion failed - generating new key..." -ForegroundColor Red
        Remove-Item $keyPath -Force -ErrorAction SilentlyContinue
        Remove-Item "$keyPath.pub" -Force -ErrorAction SilentlyContinue
        ssh-keygen -t rsa -b 4096 -C "github-actions-hostinger" -f $keyPath -m PEM -N '""'
        Write-Host "✅ New RSA key generated!" -ForegroundColor Green
    }
} else {
    Write-Host "✅ Key is already in RSA format!" -ForegroundColor Green
}

# Display key for GitHub Secrets
Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Copy this key to GitHub Secrets:" -ForegroundColor Yellow
Write-Host "========================================" -ForegroundColor Cyan
Get-Content $keyPath
Write-Host "========================================" -ForegroundColor Cyan
```

---

## ✅ Verification Checklist

After fixing:

- [ ] Key starts with `-----BEGIN RSA PRIVATE KEY-----`
- [ ] Key ends with `-----END RSA PRIVATE KEY-----`
- [ ] Key is in GitHub Secrets (`HOSTINGER_VPS_SSH_KEY`)
- [ ] Public key is on VPS (`~/.ssh/authorized_keys`)
- [ ] SSH works locally (`ssh -i key root@72.60.235.158`)
- [ ] GitHub Actions workflow runs successfully

---

## 📚 Why This Matters

**GitHub Actions uses older SSH libraries** that don't support the newer OpenSSH format. They require the traditional RSA PEM format.

**The `appleboy/ssh-action` and `appleboy/scp-action` actions** specifically need RSA format keys, not OpenSSH format.

---

**Once you convert to RSA format and update GitHub Secrets, your deployments will work!** 🎉

