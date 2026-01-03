# GitHub CI/CD Auto-Deployment to Hostinger
## Automate Your Deployments with GitHub Actions

This guide shows you how to set up automatic deployment from GitHub to Hostinger, so every push to your repository automatically deploys your changes.

---

## 🎯 Overview

**What You'll Get:**
- ✅ Automatic deployment on every push to `main` branch
- ✅ Deploy frontend, backend, or both
- ✅ No manual FTP/SSH uploads needed
- ✅ Deployment history and logs in GitHub
- ✅ Rollback capability

**Supported Hostinger Services:**
- ✅ VPS (via SSH)
- ✅ Shared Hosting (via FTP/SFTP)

---

## 📋 Prerequisites

1. **GitHub Repository** with your code
2. **Hostinger Account** (VPS or Shared Hosting)
3. **SSH Access** (for VPS) or **FTP Credentials** (for shared hosting)
4. **GitHub Actions** enabled (free for public repos, included in GitHub)

---

## 🚀 Option 1: Deploy to VPS (Recommended)

### Architecture:
```
GitHub Push → GitHub Actions → SSH to VPS → Pull Code → Restart Services
```

### Step 1: Set Up GitHub Secrets

1. Go to your GitHub repository
2. Click **Settings** → **Secrets and variables** → **Actions**
3. Click **New repository secret**
4. Add these secrets:

**Required Secrets:**

| Secret Name | Description | Example |
|------------|-------------|---------|
| `HOSTINGER_VPS_HOST` | Your VPS IP address | `123.456.789.0` |
| `HOSTINGER_VPS_USER` | SSH username | `root` or `username` |
| `HOSTINGER_VPS_SSH_KEY` | Private SSH key | `-----BEGIN RSA PRIVATE KEY-----...` |
| `HOSTINGER_VPS_PORT` | SSH port (optional) | `22` (default) |

**Optional Secrets:**

| Secret Name | Description |
|------------|-------------|
| `MONGODB_URI` | MongoDB connection string (if using) |
| `JWT_SECRET` | JWT secret for backend |
| `ADMIN_PASSWORD` | Admin password |
| `FRONTEND_URL` | Frontend URL for CORS |

### Step 2: Generate SSH Key Pair

**On your local machine:**

```bash
# Generate SSH key pair
ssh-keygen -t rsa -b 4096 -C "github-actions" -f ~/.ssh/hostinger_github

# This creates:
# ~/.ssh/hostinger_github (private key) - Add to GitHub Secrets
# ~/.ssh/hostinger_github.pub (public key) - Add to VPS
```

**Add public key to VPS:**

```bash
# SSH into your VPS
ssh root@your-vps-ip

# Add public key to authorized_keys
mkdir -p ~/.ssh
chmod 700 ~/.ssh
nano ~/.ssh/authorized_keys
# Paste the content of hostinger_github.pub
chmod 600 ~/.ssh/authorized_keys
```

**Add private key to GitHub:**
- Copy content of `~/.ssh/hostinger_github`
- Add as secret `HOSTINGER_VPS_SSH_KEY` in GitHub

### Step 3: Create GitHub Actions Workflow

Create `.github/workflows/deploy.yml` in your repository:

```yaml
name: Deploy to Hostinger VPS

on:
  push:
    branches:
      - main  # Deploy on push to main branch
  workflow_dispatch:  # Allow manual trigger

jobs:
  deploy:
    runs-on: ubuntu-latest
    
    steps:
      - name: Checkout code
        uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
      
      # Deploy Backend
      - name: Deploy Backend
        uses: appleboy/ssh-action@v0.1.7
        with:
          host: ${{ secrets.HOSTINGER_VPS_HOST }}
          username: ${{ secrets.HOSTINGER_VPS_USER }}
          key: ${{ secrets.HOSTINGER_VPS_SSH_KEY }}
          port: ${{ secrets.HOSTINGER_VPS_PORT || 22 }}
          script: |
            cd ~/news-adda-backend
            git pull origin main
            npm install --production
            pm2 restart news-adda-backend
            pm2 save
      
      # Deploy Frontend (if needed)
      - name: Deploy Frontend
        uses: appleboy/ssh-action@v0.1.7
        with:
          host: ${{ secrets.HOSTINGER_VPS_HOST }}
          username: ${{ secrets.HOSTINGER_VPS_USER }}
          key: ${{ secrets.HOSTINGER_VPS_SSH_KEY }}
          port: ${{ secrets.HOSTINGER_VPS_PORT || 22 }}
          script: |
            cd ~/NewsAddaIndia/Frontend
            git pull origin main
            npm install
            npm run build -- --configuration production
            sudo cp -r dist/news-adda-india/browser/* /var/www/html/
            sudo systemctl reload nginx
```

### Step 4: Advanced Workflow (With Environment Variables)

**For backend with environment variables:**

```yaml
name: Deploy to Hostinger VPS

on:
  push:
    branches:
      - main

jobs:
  deploy-backend:
    runs-on: ubuntu-latest
    
    steps:
      - name: Checkout code
        uses: actions/checkout@v3
      
      - name: Deploy Backend
        uses: appleboy/ssh-action@v0.1.7
        with:
          host: ${{ secrets.HOSTINGER_VPS_HOST }}
          username: ${{ secrets.HOSTINGER_VPS_USER }}
          key: ${{ secrets.HOSTINGER_VPS_SSH_KEY }}
          port: ${{ secrets.HOSTINGER_VPS_PORT || 22 }}
          script: |
            cd ~/news-adda-backend
            git pull origin main
            npm install --production
            
            # Update .env file
            cat > .env << EOF
            MONGODB_URI=${{ secrets.MONGODB_URI }}
            PORT=3000
            NODE_ENV=production
            FRONTEND_URL=${{ secrets.FRONTEND_URL }}
            JWT_SECRET=${{ secrets.JWT_SECRET }}
            ADMIN_USERNAME=admin
            ADMIN_PASSWORD=${{ secrets.ADMIN_PASSWORD }}
            EOF
            
            pm2 restart news-adda-backend
            pm2 save
            
            # Check deployment status
            pm2 status
            pm2 logs news-adda-backend --lines 20
```

---

## 🌐 Option 2: Deploy to Shared Hosting (FTP/SFTP)

### Architecture:
```
GitHub Push → GitHub Actions → FTP/SFTP Upload → Hostinger Shared Hosting
```

### Step 1: Set Up GitHub Secrets

Add these secrets to GitHub:

| Secret Name | Description | Example |
|------------|-------------|---------|
| `HOSTINGER_FTP_HOST` | FTP server address | `ftp.yourdomain.com` |
| `HOSTINGER_FTP_USER` | FTP username | `u775399893` |
| `HOSTINGER_FTP_PASSWORD` | FTP password | `your-ftp-password` |
| `HOSTINGER_FTP_PORT` | FTP port | `21` (FTP) or `22` (SFTP) |

### Step 2: Create GitHub Actions Workflow for Shared Hosting

Create `.github/workflows/deploy-shared.yml`:

```yaml
name: Deploy Frontend to Shared Hosting

on:
  push:
    branches:
      - main
    paths:
      - 'Frontend/**'  # Only deploy when Frontend changes

jobs:
  deploy-frontend:
    runs-on: ubuntu-latest
    
    steps:
      - name: Checkout code
        uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
      
      - name: Install dependencies
        run: |
          cd Frontend
          npm ci
      
      - name: Build Angular app
        run: |
          cd Frontend
          npm run build -- --configuration production
        env:
          # Set production API URL
          API_URL: ${{ secrets.BACKEND_API_URL }}
      
      - name: Deploy via FTP
        uses: SamKirkland/FTP-Deploy-Action@4.3.0
        with:
          server: ${{ secrets.HOSTINGER_FTP_HOST }}
          username: ${{ secrets.HOSTINGER_FTP_USER }}
          password: ${{ secrets.HOSTINGER_FTP_PASSWORD }}
          local-dir: ./Frontend/dist/news-adda-india/browser/
          server-dir: /public_html/
          exclude: |
            **/.git*
            **/.git*/**
            **/node_modules/**
```

### Step 3: SFTP Deployment (More Secure)

```yaml
name: Deploy via SFTP

on:
  push:
    branches:
      - main

jobs:
  deploy:
    runs-on: ubuntu-latest
    
    steps:
      - name: Checkout code
        uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
      
      - name: Build Frontend
        run: |
          cd Frontend
          npm ci
          npm run build -- --configuration production
      
      - name: Deploy via SFTP
        uses: appleboy/scp-action@v0.1.4
        with:
          host: ${{ secrets.HOSTINGER_FTP_HOST }}
          username: ${{ secrets.HOSTINGER_FTP_USER }}
          password: ${{ secrets.HOSTINGER_FTP_PASSWORD }}
          port: ${{ secrets.HOSTINGER_FTP_PORT || 22 }}
          source: "Frontend/dist/news-adda-india/browser/*"
          target: "/home/u775399893/domains/yourdomain.com/public_html"
```

---

## 🔄 Option 3: Deploy Both Frontend and Backend

### Complete Workflow for Full Stack Deployment

```yaml
name: Full Stack Deployment

on:
  push:
    branches:
      - main
  workflow_dispatch:

jobs:
  deploy-backend:
    name: Deploy Backend to VPS
    runs-on: ubuntu-latest
    if: contains(github.event.head_commit.message, '[backend]') || contains(github.event.head_commit.message, '[all]')
    
    steps:
      - name: Checkout code
        uses: actions/checkout@v3
      
      - name: Deploy Backend
        uses: appleboy/ssh-action@v0.1.7
        with:
          host: ${{ secrets.HOSTINGER_VPS_HOST }}
          username: ${{ secrets.HOSTINGER_VPS_USER }}
          key: ${{ secrets.HOSTINGER_VPS_SSH_KEY }}
          script: |
            cd ~/news-adda-backend
            git pull origin main
            npm install --production
            pm2 restart news-adda-backend
  
  deploy-frontend:
    name: Deploy Frontend
    runs-on: ubuntu-latest
    if: contains(github.event.head_commit.message, '[frontend]') || contains(github.event.head_commit.message, '[all]')
    
    steps:
      - name: Checkout code
        uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
      
      - name: Build Frontend
        run: |
          cd Frontend
          npm ci
          npm run build -- --configuration production
      
      - name: Deploy to Shared Hosting
        uses: SamKirkland/FTP-Deploy-Action@4.3.0
        with:
          server: ${{ secrets.HOSTINGER_FTP_HOST }}
          username: ${{ secrets.HOSTINGER_FTP_USER }}
          password: ${{ secrets.HOSTINGER_FTP_PASSWORD }}
          local-dir: ./Frontend/dist/news-adda-india/browser/
          server-dir: /public_html/
```

**Usage:** Add `[backend]`, `[frontend]`, or `[all]` to commit message to control what deploys.

---

## 🔐 Security Best Practices

### 1. Use SSH Keys (Not Passwords)

**For VPS:**
- ✅ Use SSH key authentication
- ✅ Never commit SSH keys to repository
- ✅ Use GitHub Secrets for sensitive data
- ✅ Rotate keys regularly

### 2. Limit SSH Access

```bash
# On VPS, restrict SSH to GitHub Actions IPs (optional)
# GitHub Actions IPs change, so this is optional
sudo ufw allow from github.com to any port 22
```

### 3. Use Environment-Specific Secrets

- ✅ Separate secrets for staging/production
- ✅ Use GitHub Environments feature
- ✅ Limit secret access to specific workflows

### 4. Enable Branch Protection

1. Go to repository **Settings** → **Branches**
2. Add rule for `main` branch:
   - ✅ Require pull request reviews
   - ✅ Require status checks to pass
   - ✅ Require branches to be up to date

---

## 📊 Deployment Strategies

### Strategy 1: Deploy on Every Push

```yaml
on:
  push:
    branches:
      - main
```

**Pros:** Always up-to-date  
**Cons:** May deploy broken code

### Strategy 2: Deploy on Tags

```yaml
on:
  push:
    tags:
      - 'v*'
```

**Usage:** `git tag v1.0.0 && git push --tags`

**Pros:** Control when to deploy  
**Cons:** Manual tagging required

### Strategy 3: Deploy on Pull Request Merge

```yaml
on:
  pull_request:
    types: [closed]
    branches:
      - main
```

**Pros:** Only deploy reviewed code  
**Cons:** Requires PR workflow

### Strategy 4: Manual Deployment

```yaml
on:
  workflow_dispatch:
```

**Pros:** Full control  
**Cons:** Manual trigger needed

---

## 🧪 Testing Before Deployment

### Add Tests to Workflow

```yaml
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      
      - name: Install dependencies
        run: |
          cd backend
          npm ci
      
      - name: Run tests
        run: |
          cd backend
          npm test
      
      - name: Lint code
        run: |
          cd backend
          npm run lint
  
  deploy:
    needs: test
    runs-on: ubuntu-latest
    # ... deployment steps
```

---

## 📝 Environment Variables Management

### Option 1: GitHub Secrets (Recommended)

Store sensitive data in GitHub Secrets:
- Go to **Settings** → **Secrets and variables** → **Actions**
- Add secrets
- Reference in workflow: `${{ secrets.SECRET_NAME }}`

### Option 2: Environment Files

```yaml
- name: Create .env file
  run: |
    cat > backend/.env << EOF
    MONGODB_URI=${{ secrets.MONGODB_URI }}
    PORT=3000
    NODE_ENV=production
    EOF
```

### Option 3: GitHub Environments

1. Go to **Settings** → **Environments**
2. Create environments: `staging`, `production`
3. Add environment-specific secrets
4. Reference in workflow:

```yaml
jobs:
  deploy:
    environment: production
    steps:
      # Secrets automatically loaded from production environment
```

---

## 🔍 Monitoring Deployments

### View Deployment Status

1. Go to **Actions** tab in GitHub
2. Click on workflow run
3. View logs and status

### Add Deployment Notifications

```yaml
- name: Notify on Success
  if: success()
  uses: 8398a7/action-slack@v3
  with:
    status: ${{ job.status }}
    text: 'Deployment successful!'
  env:
    SLACK_WEBHOOK_URL: ${{ secrets.SLACK_WEBHOOK_URL }}
```

---

## 🆘 Troubleshooting

### Common Issues

**1. SSH Connection Failed**
```bash
# Test SSH connection manually
ssh -i ~/.ssh/hostinger_github root@your-vps-ip

# Check SSH key format
# Should start with: -----BEGIN RSA PRIVATE KEY-----
```

**2. Permission Denied**
```bash
# On VPS, check permissions
ls -la ~/.ssh/authorized_keys
chmod 600 ~/.ssh/authorized_keys
```

**3. Git Pull Failed**
```bash
# On VPS, ensure git is configured
git config --global user.name "GitHub Actions"
git config --global user.email "actions@github.com"
```

**4. PM2 Not Found**
```bash
# On VPS, install PM2 globally
npm install -g pm2
```

**5. Build Failed**
```bash
# Check Node.js version matches
node --version
# Should match workflow version
```

---

## ✅ Complete Example: Full Stack Deployment

**`.github/workflows/deploy.yml`:**

```yaml
name: Deploy News Adda India

on:
  push:
    branches: [main]
  workflow_dispatch:

jobs:
  deploy-backend:
    name: Deploy Backend to VPS
    runs-on: ubuntu-latest
    
    steps:
      - name: Checkout code
        uses: actions/checkout@v3
      
      - name: Deploy Backend
        uses: appleboy/ssh-action@v0.1.7
        with:
          host: ${{ secrets.HOSTINGER_VPS_HOST }}
          username: ${{ secrets.HOSTINGER_VPS_USER }}
          key: ${{ secrets.HOSTINGER_VPS_SSH_KEY }}
          script: |
            echo "🚀 Starting backend deployment..."
            cd ~/news-adda-backend
            git pull origin main
            npm install --production
            
            # Update environment variables
            cat > .env << EOF
            MONGODB_URI=${{ secrets.MONGODB_URI }}
            PORT=3000
            NODE_ENV=production
            FRONTEND_URL=${{ secrets.FRONTEND_URL }}
            JWT_SECRET=${{ secrets.JWT_SECRET }}
            ADMIN_USERNAME=admin
            ADMIN_PASSWORD=${{ secrets.ADMIN_PASSWORD }}
            EOF
            
            # Restart application
            pm2 restart news-adda-backend || pm2 start server.js --name news-adda-backend
            pm2 save
            
            # Verify deployment
            sleep 5
            pm2 status
            echo "✅ Backend deployment complete!"
  
  deploy-frontend:
    name: Deploy Frontend to Shared Hosting
    runs-on: ubuntu-latest
    
    steps:
      - name: Checkout code
        uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'
          cache-dependency-path: Frontend/package-lock.json
      
      - name: Install dependencies
        run: |
          cd Frontend
          npm ci
      
      - name: Build Angular app
        run: |
          cd Frontend
          npm run build -- --configuration production
        env:
          API_URL: ${{ secrets.BACKEND_API_URL }}
      
      - name: Deploy to Hostinger
        uses: SamKirkland/FTP-Deploy-Action@4.3.0
        with:
          server: ${{ secrets.HOSTINGER_FTP_HOST }}
          username: ${{ secrets.HOSTINGER_FTP_USER }}
          password: ${{ secrets.HOSTINGER_FTP_PASSWORD }}
          local-dir: ./Frontend/dist/news-adda-india/browser/
          server-dir: /public_html/
          exclude: |
            **/.git*
            **/.git*/**
            **/node_modules/**
      
      - name: Deployment Success
        run: echo "✅ Frontend deployed successfully!"
```

---

## 📚 Additional Resources

- **GitHub Actions Documentation:** https://docs.github.com/en/actions
- **SSH Action:** https://github.com/appleboy/ssh-action
- **FTP Deploy Action:** https://github.com/SamKirkland/FTP-Deploy-Action
- **GitHub Secrets:** https://docs.github.com/en/actions/security-guides/encrypted-secrets

---

## ✅ Summary

**You now have:**
- ✅ Automatic deployment on every push
- ✅ Separate workflows for frontend and backend
- ✅ Secure credential management
- ✅ Deployment history and logs
- ✅ Easy rollback capability

**Next Steps:**
1. Set up GitHub Secrets
2. Create workflow file
3. Push to repository
4. Watch it deploy automatically! 🚀

---

**Need help?** Check the troubleshooting section or GitHub Actions documentation.

