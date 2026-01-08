# PowerShell script to verify and format SSH key for GitHub Secrets

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "SSH Key Verification for GitHub Actions" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

$sshKeyPath = "$env:USERPROFILE\.ssh\hostinger_github"

# Check if key exists
if (-not (Test-Path $sshKeyPath)) {
    Write-Host "❌ SSH key not found at: $sshKeyPath" -ForegroundColor Red
    Write-Host ""
    Write-Host "Generate it first:" -ForegroundColor Yellow
    Write-Host "  ssh-keygen -t rsa -b 4096 -C `"github-actions-hostinger`" -f `"$sshKeyPath`" -N '""'" -ForegroundColor White
    exit 1
}

Write-Host "✅ SSH key found: $sshKeyPath" -ForegroundColor Green
Write-Host ""

# Read the key
$privateKey = Get-Content $sshKeyPath -Raw
$keyLines = Get-Content $sshKeyPath

# Verify key format
Write-Host "Checking key format..." -ForegroundColor Yellow

$hasBegin = $privateKey -match "-----BEGIN RSA PRIVATE KEY-----"
$hasEnd = $privateKey -match "-----END RSA PRIVATE KEY-----"
$lineCount = $keyLines.Count

if ($hasBegin -and $hasEnd) {
    Write-Host "✅ Key format looks correct" -ForegroundColor Green
    Write-Host "   - Has BEGIN marker" -ForegroundColor Gray
    Write-Host "   - Has END marker" -ForegroundColor Gray
    Write-Host "   - Total lines: $lineCount" -ForegroundColor Gray
} else {
    Write-Host "❌ Key format is incorrect!" -ForegroundColor Red
    if (-not $hasBegin) {
        Write-Host "   - Missing: -----BEGIN RSA PRIVATE KEY-----" -ForegroundColor Red
    }
    if (-not $hasEnd) {
        Write-Host "   - Missing: -----END RSA PRIVATE KEY-----" -ForegroundColor Red
    }
    Write-Host ""
    Write-Host "This key cannot be used. Please regenerate it." -ForegroundColor Yellow
    exit 1
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Key Content (for GitHub Secrets)" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Copy the ENTIRE content below to GitHub Secrets → HOSTINGER_VPS_SSH_KEY" -ForegroundColor Yellow
Write-Host ""
Write-Host "----------------------------------------" -ForegroundColor Gray
Write-Host $privateKey -ForegroundColor White
Write-Host "----------------------------------------" -ForegroundColor Gray
Write-Host ""

# Check public key
$publicKeyPath = "$sshKeyPath.pub"
if (Test-Path $publicKeyPath) {
    Write-Host "========================================" -ForegroundColor Cyan
    Write-Host "Public Key (for VPS)" -ForegroundColor Cyan
    Write-Host "========================================" -ForegroundColor Cyan
    Write-Host ""
    $publicKey = Get-Content $publicKeyPath -Raw
    Write-Host "Copy this to VPS ~/.ssh/authorized_keys:" -ForegroundColor Yellow
    Write-Host ""
    Write-Host $publicKey -ForegroundColor White
    Write-Host ""
}

# Test SSH connection
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Testing SSH Connection" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

$testHost = "72.60.235.158"
Write-Host "Testing connection to $testHost..." -ForegroundColor Yellow

try {
    $result = ssh -i $sshKeyPath -o ConnectTimeout=5 -o StrictHostKeyChecking=no root@$testHost "echo 'SSH connection successful!'" 2>&1
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ SSH connection successful!" -ForegroundColor Green
        Write-Host "   Your SSH key is working correctly." -ForegroundColor Gray
    } else {
        Write-Host "❌ SSH connection failed!" -ForegroundColor Red
        Write-Host ""
        Write-Host "Possible issues:" -ForegroundColor Yellow
        Write-Host "   1. Public key not added to VPS ~/.ssh/authorized_keys" -ForegroundColor White
        Write-Host "   2. Wrong permissions on VPS (should be 600 for authorized_keys)" -ForegroundColor White
        Write-Host "   3. SSH service not running on VPS" -ForegroundColor White
        Write-Host ""
        Write-Host "To fix:" -ForegroundColor Yellow
        Write-Host "   ssh root@$testHost" -ForegroundColor White
        Write-Host "   # Then add public key to ~/.ssh/authorized_keys" -ForegroundColor Gray
    }
} catch {
    Write-Host "⚠️  Could not test SSH connection" -ForegroundColor Yellow
    Write-Host "   Error: $_" -ForegroundColor Gray
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Next Steps" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "1. Copy the private key above to GitHub Secrets" -ForegroundColor White
Write-Host "   → https://github.com/aseempsri/NewsAddaIndia/settings/secrets/actions" -ForegroundColor Gray
Write-Host "   → Secret name: HOSTINGER_VPS_SSH_KEY" -ForegroundColor Gray
Write-Host ""
Write-Host "2. Make sure public key is on VPS:" -ForegroundColor White
Write-Host "   → ~/.ssh/authorized_keys" -ForegroundColor Gray
Write-Host ""
Write-Host "3. Re-run the GitHub Actions workflow" -ForegroundColor White
Write-Host ""
Write-Host "✅ Ready to deploy!" -ForegroundColor Green
Write-Host ""

