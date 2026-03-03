cd /root/NewsAddaIndia

git config pull.rebase false

git pull origin main

cd /root/NewsAddaIndia/backend

npm install --production

pm2 delete news-adda-backend 2>/dev/null || echo "No existing process"

pm2 start server.js --name news-adda-backend

pm2 save

pm2 status

cd /root/NewsAddaIndia/Frontend

npm install

npm run build:prod

sudo rm -rf /var/www/html/*

sudo cp -r dist/news-adda-india/browser/* /var/www/html/

sudo chown -R www-data:www-data /var/www/html
sudo chmod -R 755 /var/www/html

sudo rm -f /etc/nginx/sites-enabled/*

sudo rm -f /etc/nginx/sites-available/news-adda-backend
sudo rm -f /etc/nginx/sites-available/news-adda-frontend

sudo ln -sf /etc/nginx/sites-available/news-adda /etc/nginx/sites-enabled/news-adda

ls -la /etc/nginx/sites-enabled/

sudo nginx -t

sudo systemctl reload nginx

sudo systemctl status nginx

curl http://72.60.235.158/api/news