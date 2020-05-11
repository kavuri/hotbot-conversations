module.exports = {
  apps : [{
    name: 'hotbot-api',
    script: './bin/www',
    watch: true,
    env:{
      PORT: 443,
      NODE_ENV:'prod'
    },
    env_dev:{
      PORT: 3000,
      NODE_ENV: 'dev'
    }
  }, 
  ],

  deploy : {
    production : {
      user : 'SSH_USERNAME',
      host : 'SSH_HOSTMACHINE',
      ref  : 'origin/master',
      repo : 'GIT_REPOSITORY',
      path : 'DESTINATION_PATH',
      'pre-deploy-local': '',
      'post-deploy' : 'npm install && pm2 reload ecosystem.config.js --env production',
      'pre-setup': ''
    }
  }
};
