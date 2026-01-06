# ⚡ Quick Install - Node.js, PM2, and Nginx

**Copy and paste these commands into your VPS terminal:**

```bash
# 1. Update system
sudo apt update && sudo apt upgrade -y

# 2. Install Node.js 20.x (LTS - Long Term Support)
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# 3. Verify Node.js (should show v20.x.x)
node --version
npm --version

# 4. Install PM2
sudo npm install -g pm2

# 5. Verify PM2 (should show version number)
pm2 --version

# 6. Install Nginx
sudo apt install nginx -y
sudo systemctl start nginx
sudo systemctl enable nginx

# 7. Verify Nginx (should show "active (running)")
sudo systemctl status nginx

# 8. Install Git (if not installed)
sudo apt install git -y

# 9. Done! ✅
echo "✅ Installation complete!"
```

---

## 🎯 What Each Command Does

1. **`sudo apt update`** - Updates package list
2. **`curl ... setup_18.x`** - Adds Node.js 18 repository
3. **`sudo apt-get install -y nodejs`** - Installs Node.js
4. **`sudo npm install -g pm2`** - Installs PM2 globally
5. **`sudo apt install nginx`** - Installs Nginx web server
6. **`sudo systemctl start nginx`** - Starts Nginx
7. **`sudo systemctl enable nginx`** - Makes Nginx start on boot

---

## ✅ Verify Installation

After running the commands, verify everything is installed:

```bash
# Check versions
node --version   # Should show: v20.x.x
npm --version    # Should show: 9.x.x
pm2 --version    # Should show: 5.x.x
nginx -v         # Should show: nginx version 1.x.x

# Check if services are running
sudo systemctl status nginx  # Should show "active (running)"
```

---

## 🐛 Troubleshooting

**If `curl` command fails:**
```bash
sudo apt install curl -y
```

**If Node.js version is wrong:**
```bash
sudo apt remove nodejs npm -y
sudo apt autoremove -y
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs
```

**If PM2 installation fails:**
```bash
# Make sure Node.js is installed first
node --version

# Try with sudo
sudo npm install -g pm2
```

---

## 📚 Next Steps

After installation:
1. See `VPS_INSTALLATION_GUIDE.md` for detailed guide
2. Continue with `DEPLOYMENT_SETUP.md` Step 1
3. Set up GitHub Secrets (Step 3 in DEPLOYMENT_SETUP.md)

---

**🚀 Ready to install? Copy the commands above and paste into your VPS terminal!**

