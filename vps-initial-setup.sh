#!/bin/bash

# Hostinger VPS Initial Setup Script
# This script installs Node.js, PM2, Nginx, and Git on your VPS
# Run this script once before your first deployment

set -e  # Exit on error

echo "🚀 Starting VPS Initial Setup..."
echo ""

# Update system packages
echo "📦 Updating system packages..."
sudo apt update && sudo apt upgrade -y

# Install Git (if not already installed)
echo "📥 Installing Git..."
sudo apt install git -y

# Install Node.js 20.x (LTS - Long Term Support)
echo "📦 Installing Node.js 20.x (LTS)..."
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# Verify Node.js installation
echo "✅ Verifying Node.js installation..."
node_version=$(node --version)
npm_version=$(npm --version)
echo "   Node.js version: $node_version"
echo "   npm version: $npm_version"

# Install PM2 globally
echo "📦 Installing PM2..."
sudo npm install -g pm2

# Verify PM2 installation
echo "✅ Verifying PM2 installation..."
pm2_version=$(pm2 --version)
echo "   PM2 version: $pm2_version"

# Install Nginx
echo "📦 Installing Nginx..."
sudo apt install nginx -y

# Start and enable Nginx
echo "🔄 Starting Nginx..."
sudo systemctl start nginx
sudo systemctl enable nginx

# Verify Nginx status
echo "✅ Verifying Nginx status..."
sudo systemctl status nginx --no-pager -l | head -n 5

# Install additional useful tools
echo "📦 Installing additional tools..."
sudo apt install -y curl wget nano ufw

# Setup PM2 startup script
echo "⚙️ Setting up PM2 startup..."
pm2 startup

echo ""
echo "✅ VPS Initial Setup Complete!"
echo ""
echo "📋 Next Steps:"
echo "1. Clone your repository:"
echo "   cd ~"
echo "   git clone https://github.com/YOUR_USERNAME/NewsAddaIndia.git"
echo ""
echo "2. Setup backend directory:"
echo "   mkdir -p ~/news-adda-backend"
echo "   cp -r ~/NewsAddaIndia/backend/* ~/news-adda-backend/"
echo "   cd ~/news-adda-backend"
echo "   npm install --production"
echo ""
echo "3. Create .env file:"
echo "   nano ~/news-adda-backend/.env"
echo ""
echo "4. Start backend with PM2:"
echo "   cd ~/news-adda-backend"
echo "   pm2 start server.js --name news-adda-backend"
echo "   pm2 save"
echo ""
echo "5. Configure Nginx (see DEPLOYMENT_SETUP.md)"
echo ""
echo "🎉 You're ready to deploy!"

