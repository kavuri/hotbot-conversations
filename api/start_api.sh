#pm2 start -l ./logs -n hotbot-api ./bin/www
PORT=443 NODE_ENV=prod pm2 start ecosystem.config.js -l ./logs
