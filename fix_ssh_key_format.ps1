# PowerShell script to fix SSH key format for GitHub Actions
# Converts OpenSSH format to RSA format if needed

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "SSH Key Format Fixer for GitHub Actions" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

$keyPath = "$env:USERPROFILE\.ssh\hostinger_github"
$publicKeyPath = "$keyPath.pub"

# Check if key exists
if (-not (Test-Path $keyPath)) {
    Write-Host "❌ SSH key not found at: $keyPath" -ForegroundColor Red
    Write-Host ""
    Write-Host "Generating new RSA format key..." -ForegroundColor Yellow
    ssh-keygen -t rsa -b 4096 -C "github-actions-hostinger" -f $keyPath -m PEM -N '""'
    Write-Host "✅ New RSA key generated!" -ForegroundColor Green
} else {
    Write-Host "✅ SSH key found: $keyPath" -ForegroundColor Green
    
    # Check current format
    $firstLine = Get-Content $keyPath -First 1
    Write-Host ""
    Write-Host "Current format: $firstLine" -ForegroundColor Yellow
    
    if ($firstLine -match "OPENSSH") {
        Write-Host ""
        Write-Host "⚠️  OpenSSH format detected!" -ForegroundColor Yellow
        Write-Host "GitHub Actions requires RSA format. Converting..." -ForegroundColor Yellow
        Write-Host ""
        
        # Try to convert
        Write-Host "Converting to RSA format..." -ForegroundColor Cyan
        $convertResult = ssh-keygen -p -m PEM -f $keyPath -N '""' 2>&1
        
        if ($LASTEXITCODE -eq 0) {
            # Verify conversion
            $newFirstLine = Get-Content $keyPath -First 1
            if ($newFirstLine -match "RSA") {
                Write-Host "✅ Successfully converted to RSA format!" -ForegroundColor Green
            } else {
                Write-Host "❌ Conversion failed - generating new key..." -ForegroundColor Red
                Remove-Item $keyPath -Force -ErrorAction SilentlyContinue
                Remove-Item $publicKeyPath -Force -ErrorAction SilentlyContinue
                ssh-keygen -t rsa -b 4096 -C "github-actions-hostinger" -f $keyPath -m PEM -N '""'
                Write-Host "✅ New RSA key generated!" -ForegroundColor Green
            }
        } else {
            Write-Host "❌ Conversion failed: $convertResult" -ForegroundColor Red
            Write-Host "Generating new RSA key instead..." -ForegroundColor Yellow
            Remove-Item $keyPath -Force -ErrorAction SilentlyContinue
            Remove-Item $publicKeyPath -Force -ErrorAction SilentlyContinue
            ssh-keygen -t rsa -b 4096 -C "github-actions-hostinger" -f $keyPath -m PEM -N '""'
            Write-Host "✅ New RSA key generated!" -ForegroundColor Green
        }
    } elseif ($firstLine -match "RSA") {
        Write-Host "✅ Key is already in RSA format!" -ForegroundColor Green
    } else {
        Write-Host "⚠️  Unknown key format. Generating new RSA key..." -ForegroundColor Yellow
        Remove-Item $keyPath -Force -ErrorAction SilentlyContinue
        Remove-Item $publicKeyPath -Force -ErrorAction SilentlyContinue
        ssh-keygen -t rsa -b 4096 -C "github-actions-hostinger" -f $keyPath -m PEM -N '""'
        Write-Host "✅ New RSA key generated!" -ForegroundColor Green
    }
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Verifying Key Format" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

$finalKey = Get-Content $keyPath -Raw
$finalFirstLine = Get-Content $keyPath -First 1

Write-Host "Key format: $finalFirstLine" -ForegroundColor White
Write-Host "Key length: $($finalKey.Length) characters" -ForegroundColor White

if ($finalFirstLine -match "RSA") {
    Write-Host "✅ Key is in correct RSA format for GitHub Actions!" -ForegroundColor Green
} else {
    Write-Host "❌ Key format is still incorrect!" -ForegroundColor Red
    Write-Host "Please check manually." -ForegroundColor Yellow
    exit 1
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Private Key (for GitHub Secrets)" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Copy this ENTIRE key to GitHub Secrets → HOSTINGER_VPS_SSH_KEY:" -ForegroundColor Yellow
Write-Host ""
Write-Host "----------------------------------------" -ForegroundColor Gray
Get-Content $keyPath
Write-Host "----------------------------------------" -ForegroundColor Gray
Write-Host ""

if (Test-Path $publicKeyPath) {
    Write-Host "========================================" -ForegroundColor Cyan
    Write-Host "Public Key (for VPS)" -ForegroundColor Cyan
    Write-Host "========================================" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "Copy this to VPS ~/.ssh/authorized_keys:" -ForegroundColor Yellow
    Write-Host ""
    $publicKey = Get-Content $publicKeyPath -Raw
    Write-Host $publicKey -ForegroundColor White
    Write-Host ""
    Write-Host "To add to VPS, run:" -ForegroundColor Yellow
    Write-Host "  ssh root@72.60.235.158" -ForegroundColor White
    Write-Host "  mkdir -p ~/.ssh && chmod 700 ~/.ssh" -ForegroundColor Gray
    Write-Host "  nano ~/.ssh/authorized_keys" -ForegroundColor Gray
    Write-Host "  # Paste the public key above" -ForegroundColor Gray
    Write-Host "  chmod 600 ~/.ssh/authorized_keys" -ForegroundColor Gray
    Write-Host ""
}

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Next Steps" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "1. Copy private key above to GitHub Secrets" -ForegroundColor White
Write-Host "   → https://github.com/aseempsri/NewsAddaIndia/settings/secrets/actions" -ForegroundColor Gray
Write-Host "   → Secret name: HOSTINGER_VPS_SSH_KEY" -ForegroundColor Gray
Write-Host ""
Write-Host "2. Add public key to VPS (if not already added)" -ForegroundColor White
Write-Host ""
Write-Host "3. Re-run GitHub Actions workflow" -ForegroundColor White
Write-Host ""
Write-Host "✅ Ready to deploy!" -ForegroundColor Green
Write-Host ""

