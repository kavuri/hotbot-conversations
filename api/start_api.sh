#pm2 start -l ./logs -n hotbot-api ./bin/www
pm2 start ecosystem.config.js
