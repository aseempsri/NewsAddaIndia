# PowerShell script to set up SSH key for GitHub Actions deployment
# This script helps you generate and configure SSH keys for automatic deployment

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "GitHub Actions SSH Key Setup" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

$sshKeyPath = "$env:USERPROFILE\.ssh\hostinger_github"
$publicKeyPath = "$sshKeyPath.pub"

# Step 1: Generate SSH key if it doesn't exist
if (Test-Path $sshKeyPath) {
    Write-Host "⚠️  SSH key already exists at: $sshKeyPath" -ForegroundColor Yellow
    $overwrite = Read-Host "Do you want to overwrite it? (y/N)"
    if ($overwrite -ne 'y' -and $overwrite -ne 'Y') {
        Write-Host "Keeping existing key." -ForegroundColor Green
    } else {
        Remove-Item $sshKeyPath -Force
        Remove-Item $publicKeyPath -Force -ErrorAction SilentlyContinue
        Write-Host "Generating new SSH key..." -ForegroundColor Green
        ssh-keygen -t rsa -b 4096 -C "github-actions-hostinger" -f $sshKeyPath -N '""' -q
        Write-Host "✅ SSH key generated!" -ForegroundColor Green
    }
} else {
    Write-Host "Generating SSH key pair..." -ForegroundColor Green
    ssh-keygen -t rsa -b 4096 -C "github-actions-hostinger" -f $sshKeyPath -N '""' -q
    Write-Host "✅ SSH key generated!" -ForegroundColor Green
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Step 2: Add Public Key to VPS" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Display public key
$publicKey = Get-Content $publicKeyPath -Raw
Write-Host "Your public key:" -ForegroundColor Yellow
Write-Host $publicKey -ForegroundColor White
Write-Host ""

Write-Host "Copy the public key above, then:" -ForegroundColor Yellow
Write-Host "1. SSH into your VPS: ssh root@72.60.235.158" -ForegroundColor White
Write-Host "2. Run these commands on VPS:" -ForegroundColor White
Write-Host "   mkdir -p ~/.ssh" -ForegroundColor Gray
Write-Host "   chmod 700 ~/.ssh" -ForegroundColor Gray
Write-Host "   nano ~/.ssh/authorized_keys" -ForegroundColor Gray
Write-Host "   (Paste the public key, then Ctrl+X, Y, Enter)" -ForegroundColor Gray
Write-Host "   chmod 600 ~/.ssh/authorized_keys" -ForegroundColor Gray
Write-Host ""

$continue = Read-Host "Press Enter after you've added the public key to VPS..."

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Step 3: Test SSH Connection" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "Testing SSH connection..." -ForegroundColor Yellow
$testResult = ssh -i $sshKeyPath -o ConnectTimeout=5 -o StrictHostKeyChecking=no root@72.60.235.158 "echo 'SSH connection successful!'" 2>&1

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ SSH connection successful!" -ForegroundColor Green
} else {
    Write-Host "⚠️  SSH connection test failed. Please verify:" -ForegroundColor Yellow
    Write-Host "   - Public key is added to VPS ~/.ssh/authorized_keys" -ForegroundColor White
    Write-Host "   - VPS IP is correct: 72.60.235.158" -ForegroundColor White
    Write-Host "   - SSH service is running on VPS" -ForegroundColor White
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Step 4: Add Private Key to GitHub" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Display private key
$privateKey = Get-Content $sshKeyPath -Raw
Write-Host "Your private key (copy everything):" -ForegroundColor Yellow
Write-Host "----------------------------------------" -ForegroundColor Gray
Write-Host $privateKey -ForegroundColor White
Write-Host "----------------------------------------" -ForegroundColor Gray
Write-Host ""

Write-Host "Instructions:" -ForegroundColor Yellow
Write-Host "1. Copy the entire private key above (including BEGIN and END lines)" -ForegroundColor White
Write-Host "2. Go to: https://github.com/aseempsri/NewsAddaIndia/settings/secrets/actions" -ForegroundColor White
Write-Host "3. Click 'New repository secret'" -ForegroundColor White
Write-Host "4. Name: HOSTINGER_VPS_SSH_KEY" -ForegroundColor White
Write-Host "5. Value: Paste the private key" -ForegroundColor White
Write-Host "6. Click 'Add secret'" -ForegroundColor White
Write-Host ""

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Next Steps" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "After adding the SSH key to GitHub Secrets:" -ForegroundColor Yellow
Write-Host "1. Add other required secrets (see GITHUB_SECRETS_SETUP.md)" -ForegroundColor White
Write-Host "2. Push code to main branch" -ForegroundColor White
Write-Host "3. Check GitHub Actions tab for deployment status" -ForegroundColor White
Write-Host ""
Write-Host "✅ Setup complete! Your code will now deploy automatically on push to main." -ForegroundColor Green
Write-Host ""

