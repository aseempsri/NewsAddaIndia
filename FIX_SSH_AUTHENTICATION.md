# 🔧 Fix SSH Authentication Error in GitHub Actions

## 🚨 Error Message

```
ssh: handshake failed: ssh: unable to authenticate, attempted methods [none], no supported methods remain
ssh.ParsePrivateKey: ssh: no key found
```

## ✅ Solution: Fix SSH Key in GitHub Secrets

The error indicates that GitHub Actions cannot authenticate with your VPS. This is usually because:

1. **SSH key secret is missing** in GitHub Secrets
2. **SSH key format is incorrect** (missing newlines, wrong format)
3. **Public key not added to VPS** `~/.ssh/authorized_keys`

---

## 📋 Step-by-Step Fix

### Step 1: Verify SSH Key Format

**Your private key must include:**
- `-----BEGIN RSA PRIVATE KEY-----` at the start
- `-----END RSA PRIVATE KEY-----` at the end
- All lines in between (usually many lines)
- **Proper line breaks** (each line should be on its own line)

**Common mistakes:**
- ❌ Copying key without BEGIN/END lines
- ❌ Copying key as one long line (no line breaks)
- ❌ Extra spaces or characters
- ❌ Missing newlines between lines

---

### Step 2: Get Your Private Key

**In PowerShell:**

```powershell
# Display your private key (copy everything)
Get-Content $env:USERPROFILE\.ssh\hostinger_github
```

**The output should look like:**

```
-----BEGIN RSA PRIVATE KEY-----
MIIEpAIBAAKCAQEAx/O3iQgAiCzX0cUnxbrqWETW6ej6UcC77/2192hc/OoLnWBP
iarwRfRKxwEGNTBfV2fTL1PE/3huhTBe22rBOp11rISSqPOFtqwpimh30AU/hlrb
... (many more lines) ...
-----END RSA PRIVATE KEY-----
```

**Important:** Copy the ENTIRE output, including:
- The `-----BEGIN RSA PRIVATE KEY-----` line
- All the middle lines
- The `-----END RSA PRIVATE KEY-----` line
- All line breaks (press Enter after each line when copying)

---

### Step 3: Update GitHub Secret

1. **Go to GitHub:**
   - Navigate to: `https://github.com/aseempsri/NewsAddaIndia/settings/secrets/actions`

2. **Find or Create Secret:**
   - Look for `HOSTINGER_VPS_SSH_KEY`
   - If it exists, click on it and then **Update**
   - If it doesn't exist, click **New repository secret**

3. **Add the Secret:**
   - **Name:** `HOSTINGER_VPS_SSH_KEY`
   - **Value:** Paste your ENTIRE private key (from Step 2)
   - Make sure to include:
     - `-----BEGIN RSA PRIVATE KEY-----`
     - All middle lines
     - `-----END RSA PRIVATE KEY-----`
     - Proper line breaks

4. **Click "Update secret"** or **"Add secret"**

---

### Step 4: Verify Public Key on VPS

**SSH into your VPS:**

```bash
ssh root@72.60.235.158
# Password: adrikA@2025#
```

**Check authorized_keys:**

```bash
cat ~/.ssh/authorized_keys
```

**You should see your public key there.** If not, add it:

```bash
# Get your public key (from your local machine)
# In PowerShell: Get-Content $env:USERPROFILE\.ssh\hostinger_github.pub

# On VPS, add it:
mkdir -p ~/.ssh
chmod 700 ~/.ssh
nano ~/.ssh/authorized_keys
# Paste your public key (one line, starts with ssh-rsa)
# Save: Ctrl+X, Y, Enter
chmod 600 ~/.ssh/authorized_keys
```

---

### Step 5: Test SSH Connection Locally

**Before testing in GitHub Actions, verify SSH works locally:**

```powershell
# Test SSH connection with your key
ssh -i $env:USERPROFILE\.ssh\hostinger_github root@72.60.235.158 "echo 'SSH connection successful!'"
```

**If this works, your SSH key is correct!**

---

### Step 6: Verify All Required Secrets

**Make sure these secrets are set in GitHub:**

| Secret Name | Required? | Example Value |
|------------|-----------|---------------|
| `HOSTINGER_VPS_HOST` | ✅ Yes | `72.60.235.158` |
| `HOSTINGER_VPS_USER` | ✅ Yes | `root` |
| `HOSTINGER_VPS_SSH_KEY` | ✅ Yes | *(your private key)* |
| `HOSTINGER_VPS_PORT` | ⚠️ Optional | `22` (default) |
| `MONGODB_URI` | ✅ Yes | `mongodb://...` |
| `JWT_SECRET` | ✅ Yes | *(random string)* |
| `ADMIN_PASSWORD` | ✅ Yes | *(your password)* |
| `FRONTEND_URL` | ⚠️ Optional | `http://72.60.235.158` |
| `BACKEND_API_URL` | ⚠️ Optional | `http://72.60.235.158` |

---

### Step 7: Re-run the Workflow

**After fixing the SSH key:**

1. Go to GitHub → **Actions** tab
2. Find the failed workflow run
3. Click **Re-run all jobs** (or **Re-run failed jobs**)

**Or trigger a new deployment:**

```bash
git commit --allow-empty -m "Fix SSH authentication"
git push origin main
```

---

## 🔍 Troubleshooting

### Issue: Still Getting "no key found"

**Possible causes:**
1. Secret not saved properly (check GitHub Secrets page)
2. Key format wrong (missing BEGIN/END lines)
3. Extra whitespace or characters

**Solution:**
- Delete the secret and recreate it
- Copy key directly from file (don't edit it)
- Make sure there are no extra spaces

### Issue: "unable to authenticate"

**Possible causes:**
1. Public key not on VPS
2. Wrong permissions on VPS
3. SSH service not running

**Solution:**
```bash
# On VPS, check permissions
ls -la ~/.ssh/
# Should show:
# drwx------ (700) for .ssh directory
# -rw------- (600) for authorized_keys

# Fix if needed:
chmod 700 ~/.ssh
chmod 600 ~/.ssh/authorized_keys

# Check SSH service
sudo systemctl status ssh
```

### Issue: Key Works Locally But Not in GitHub Actions

**Possible causes:**
1. Secret value has wrong format
2. Line breaks lost when copying

**Solution:**
- Use the exact output from `Get-Content` command
- Don't edit the key manually
- Make sure line breaks are preserved

---

## ✅ Verification Checklist

After fixing, verify:

- [ ] Private key includes `-----BEGIN RSA PRIVATE KEY-----`
- [ ] Private key includes `-----END RSA PRIVATE KEY-----`
- [ ] Secret `HOSTINGER_VPS_SSH_KEY` exists in GitHub
- [ ] Public key is in VPS `~/.ssh/authorized_keys`
- [ ] SSH connection works locally
- [ ] All required secrets are set
- [ ] Workflow re-runs successfully

---

## 🚀 Quick Fix Script

**Run this PowerShell script to get your key formatted correctly:**

```powershell
# Get private key
$key = Get-Content $env:USERPROFILE\.ssh\hostinger_github -Raw

# Display it (copy this entire output)
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Copy this ENTIRE key to GitHub Secrets:" -ForegroundColor Yellow
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host $key -ForegroundColor White
Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
```

**Then paste it into GitHub Secrets → `HOSTINGER_VPS_SSH_KEY`**

---

## 📚 Additional Resources

- **GitHub Secrets Docs:** https://docs.github.com/en/actions/security-guides/encrypted-secrets
- **SSH Key Format:** https://www.ssh.com/academy/ssh/key
- **Troubleshooting SSH:** https://docs.github.com/en/authentication/troubleshooting-ssh

---

**Once the SSH key is correctly set, your deployments should work!** 🎉

