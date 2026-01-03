#!/bin/bash

# Hostinger VPS Backend Setup Script
# Run this script on your Hostinger VPS to automate backend setup

set -e

echo "=========================================="
echo "News Adda India - Backend Setup Script"
echo "=========================================="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if running as root
if [ "$EUID" -ne 0 ]; then 
    echo -e "${RED}Please run as root or with sudo${NC}"
    exit 1
fi

# Step 1: Update system
echo -e "${YELLOW}[1/8] Updating system packages...${NC}"
apt update && apt upgrade -y

# Step 2: Install Node.js 18.x
echo -e "${YELLOW}[2/8] Installing Node.js 18.x...${NC}"
if ! command -v node &> /dev/null; then
    curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
    apt-get install -y nodejs
else
    echo -e "${GREEN}Node.js already installed: $(node --version)${NC}"
fi

# Step 3: Install PM2
echo -e "${YELLOW}[3/8] Installing PM2...${NC}"
if ! command -v pm2 &> /dev/null; then
    npm install -g pm2
else
    echo -e "${GREEN}PM2 already installed: $(pm2 --version)${NC}"
fi

# Step 4: Install Nginx
echo -e "${YELLOW}[4/8] Installing Nginx...${NC}"
if ! command -v nginx &> /dev/null; then
    apt install nginx -y
    systemctl start nginx
    systemctl enable nginx
else
    echo -e "${GREEN}Nginx already installed${NC}"
fi

# Step 5: Install Certbot
echo -e "${YELLOW}[5/8] Installing Certbot for SSL...${NC}"
if ! command -v certbot &> /dev/null; then
    apt install certbot python3-certbot-nginx -y
else
    echo -e "${GREEN}Certbot already installed${NC}"
fi

# Step 6: Create backend directory structure
echo -e "${YELLOW}[6/8] Setting up backend directory...${NC}"
BACKEND_DIR="$HOME/news-adda-backend"
mkdir -p "$BACKEND_DIR"
mkdir -p "$BACKEND_DIR/uploads"
chmod 755 "$BACKEND_DIR/uploads"

# Step 7: Check if .env exists
echo -e "${YELLOW}[7/8] Checking environment configuration...${NC}"
if [ ! -f "$BACKEND_DIR/.env" ]; then
    echo -e "${YELLOW}Creating .env template...${NC}"
    cat > "$BACKEND_DIR/.env.example" << EOF
# MongoDB Connection
MONGODB_URI=mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/newsaddaindia?retryWrites=true&w=majority

# Server Configuration
PORT=3000
NODE_ENV=production

# Frontend URL
FRONTEND_URL=https://yourdomain.com

# JWT Secret (generate with: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))")
JWT_SECRET=your-super-secret-jwt-key-change-this

# Admin Credentials
ADMIN_USERNAME=admin
ADMIN_PASSWORD=change-this-password

# Optional: NewsAPI Key
NEWSAPI_KEY=your-newsapi-key-if-needed
EOF
    echo -e "${RED}IMPORTANT: Create .env file from .env.example and fill in your values!${NC}"
    echo -e "${YELLOW}Run: cp $BACKEND_DIR/.env.example $BACKEND_DIR/.env${NC}"
    echo -e "${YELLOW}Then edit: nano $BACKEND_DIR/.env${NC}"
else
    echo -e "${GREEN}.env file already exists${NC}"
fi

# Step 8: Generate JWT Secret
echo -e "${YELLOW}[8/8] Generating JWT secret...${NC}"
JWT_SECRET=$(node -e "console.log(require('crypto').randomBytes(32).toString('hex'))")
echo -e "${GREEN}Generated JWT Secret: ${JWT_SECRET}${NC}"
echo -e "${YELLOW}Add this to your .env file as JWT_SECRET${NC}"

# Summary
echo ""
echo "=========================================="
echo -e "${GREEN}Setup Complete!${NC}"
echo "=========================================="
echo ""
echo "Next steps:"
echo "1. Upload your backend code to: $BACKEND_DIR"
echo "2. Create .env file: cp $BACKEND_DIR/.env.example $BACKEND_DIR/.env"
echo "3. Edit .env file: nano $BACKEND_DIR/.env"
echo "4. Install dependencies: cd $BACKEND_DIR && npm install --production"
echo "5. Start with PM2: pm2 start server.js --name news-adda-backend"
echo "6. Save PM2 config: pm2 save && pm2 startup"
echo ""
echo "For detailed instructions, see: HOSTINGER_DEPLOYMENT_GUIDE.md"
echo ""

