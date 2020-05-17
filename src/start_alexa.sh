//PORT=443 NODE_ENV=prod pm2 start -n 'hotbot-conversations' ./index.js -l ./logs
PORT=443 NODE_ENV=prod pm2 start pm2-alexa.config.js -l ./logs
