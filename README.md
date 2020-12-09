
# Hotbot Conversations

## Deployment Setup
 0. Get a free certificate from letsencrypt.org
 1. Setup AWS ec2 instance
 2. Deploy MongoDB in Atlas (see below for details)
 3. Create Auth0 Kam-App (SPA) and Kam-machine-to-machine applications (see below for detailed steps)
 3. Sync code to ec2 instance using git
 4. Ensure .env.prod has settings pointing to the right Auth0 and MongoDB settings for `hotbot-conversations` and `api`

# Install MongoDB in the two EC2 nodes
 - Follow instructions here: https://docs.mongodb.com/manual/tutorial/install-mongodb-on-ubuntu/ to install MongoDB in Ubuntu EC2
 - Follow instructions here: https://docs.mongodb.com/manual/tutorial/deploy-replica-set-with-keyfile-access-control/#deploy-repl-set-with-auth to create a replica set
 - Start mongo from cmdline
    ```
        mkdir /var/lib/mongodb
        mkdir /var/log/mongodb
        mongod --keyFile /etc/mongod-keyfile --replSet rs0 --bind_ip 172.31.6.58,172.31.42.217 --dbpath /var/lib/mongodb
    ```
 - Exit from mongo shell. Run the command `mongo -u '****' -p --authenticationDatabase ****`
 - Create replica set and create admin and cluster users
    ```
	    rs.initiate({ _id:"rs0", members:[ {_id:0,host:"172.31.6.58:27017"}, {_id:1,host:"172.31.42.217:27017"} ] });
        rs0:PRIMARY> use ****
        rs0:PRIMARY> db.createUser({user:"****", pwd:"****", roles:[{role:"****", db:"****"}]})
        admin.createUser({user:"cluster",pwd:"****", roles:[{role:"****", db:"****"}]})
    ```
 - Create a app user: **** 
 ```
    use hotbot-prod
    db.createUser({user:"****",pwd:"****",roles:[{role:"readWrite",db:"mydb"}]})
 ```
        # Where and how to store data.
        storage:
            dbPath: /var/lib/mongodb
            journal:
            enabled: true
        #  engine:
        #  mmapv1:
        #  wiredTiger:

        # where to write logging data.
        systemLog:
            destination: file
            logAppend: true
            path: /var/log/mongodb/mongod.log

        # network interfaces
        net:
            port: 27017
            bindIp: 127.0.0.1,172.31.6.58

        # how the process runs
        processManagement:
            timeZoneInfo: /usr/share/zoneinfo

        security:
            keyFile: /etc/mongod-keyfile

        #operationProfiling:

        replication:
            replSetName: "rs0"

        #sharding:

		## Enterprise-Only Options:

		#auditLog:

		#snmp:
    ```

# MongoDB Atlas
  - Sign-in with **** 
  - Create a cluster: 'Clouster0'
  - Choose AWS sount-1 region
  - Create a mongodb user: ****/****
  - Create one more dbuser (Security -> Database Access)
  - username: ****, password: ****
  - Whitelist AWS EC2 instance address
  - Connection URL: mongodb+srv://<username>:<password>@<url>/<db>?retryWrites=true&w=majority

# AWS EC2 instance
 - Launch 2 micro instances (one for hotbot-conversations and another for hotbot-api)
## Port settings
 - Incoming ports
  - open ssh (22), https (443) ports
  - Start a EC2 instance in AWS. Use Ubuntu 18.04
 - Outgoing ports
  - 27017 for mongodb Atlas

# PM2 startup services at server start (https://pm2.keymetrics.io/docs/usage/startup/)
 - `sudo apt install authbind`
 - `pm2 startup` - this generates a script that enables starting the service at startup
 - `sudo env PATH=$PATH:/home/ubuntu/.nvm/versions/node/v14.2.0/bin /home/ubuntu/.nvm/versions/node/v14.2.0/lib/node_modules/pm2/bin/pm2 startup systemd -u ubuntu --hp /home/ubuntu`
 - output:
 ```
[PM2] Init System found: systemd
Platform systemd
Template
[Unit]
Description=PM2 process manager
Documentation=https://pm2.keymetrics.io/
After=network.target

[Service]
Type=forking
User=ubuntu
LimitNOFILE=infinity
LimitNPROC=infinity
LimitCORE=infinity
Environment=PATH=/home/ubuntu/.nvm/versions/node/v14.2.0/bin:/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin:/usr/games:/usr/local/games:/snap/bin:/home/ubuntu/.nvm/versions/node/v14.2.0/bin:/bin:/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin
Environment=PM2_HOME=/home/ubuntu/.pm2
PIDFile=/home/ubuntu/.pm2/pm2.pid
Restart=on-failure

ExecStart=/home/ubuntu/.nvm/versions/node/v14.2.0/lib/node_modules/pm2/bin/pm2 resurrect
ExecReload=/home/ubuntu/.nvm/versions/node/v14.2.0/lib/node_modules/pm2/bin/pm2 reload all
ExecStop=/home/ubuntu/.nvm/versions/node/v14.2.0/lib/node_modules/pm2/bin/pm2 kill

[Install]
WantedBy=multi-user.target

Target path
/etc/systemd/system/pm2-ubuntu.service
Command list
[ 'systemctl enable pm2-ubuntu' ]
[PM2] Writing init configuration in /etc/systemd/system/pm2-ubuntu.service
[PM2] Making script booting at startup...
[PM2] [-] Executing: systemctl enable pm2-ubuntu...
Created symlink /etc/systemd/system/multi-user.target.wants/pm2-ubuntu.service → /etc/systemd/system/pm2-ubuntu.service.
[PM2] [v] Command successfully executed.
+---------------------------------------+
[PM2] Freeze a process list on reboot via:
$ pm2 save

[PM2] Remove init script via:
$ pm2 unstartup systemd
 ```
# EC2 setup
  - Launch command-line shell in ec2 instance
  - `sudo apt update`
  - `sudo apt install gcc make g++`
  - Install MongoDB for Ubuntu 18.04. Instruction - https://docs.mongodb.com/manual/tutorial/install-mongodb-on-ubuntu/. Follow steps 1-4
  - Clone hotbot-conversations repository. `git clone https://hotbot@bitbucket.org/hotbotty/hotbbot-conversations.git`
  to the root directory
  - `npm install` in `hotbot-conversations` and `api/`
  - `cd hotbot-conversations/scripts`
  - Launch mongodb = `./start_db`
   - This will start two mongo DB instances with replica sets in directories rs01, rs02
  - Install NodeJS
   - Install NVM. Follow instruction here = `https://github.com/nvm-sh/nvm`
    - `wget -qO- https://raw.githubusercontent.com/nvm-sh/nvm/v0.35.3/install.sh | bash`
    - `nvm --version` should give `0.34.0`
    - `nvm install 12.13.0` (13.11.0 version)
   - `cd hotbot-conversations`
   - `npm install`
   - `cd hotbot-converstaions/api`
   - `npm install`
   - Ensure .env.prod have the correct settings
      ```
      # hotbot-conversations and api settings
        ##### MONGODB Settings #####
		DB_NAME = '****'
		DB_URI = 'mongodb+srv://<dbuser>:<password>@<db_url>/'
		DB_REPLSET_NAME = 'rs0'
		DB_POOLSIZE = 5
		DB_USE_NEW_URL_PARSER = true
		DB_AUTO_INDEX = false
		DB_AUTO_CREATE = true
		DB_RETRY_WRITES = true
		DB_W = majority
		DB_USE_UNIFIED_TOPOLOGY = true
		DB_USE_FIND_AND_MODIFY = false
		DB_STORAGE_ENGINE = wiredTiger

		##### Conversations settings #####
		LOG_COLLECTION_NAME = 'conversations'
		LOGGING = true

		# The Auth0 CLIENT_ID, SECRET are of the machine-machine admin API and not the KamApp (for web application)
		AUTH0_CLIENT_ID=****
		AUTH0_DOMAIN=****
		AUTH0_CLIENT_SECRET=****
		AUTH0_ADMIN_AUDIENCE=****
		AUTH0_CALLBACK_URL=****
		SESSION_SECRET='****'
      ```
  - Replace the Auth0 details above with the details from Auth0

## EC2 instance for Alexa conversations engine
 - Install node using nvm
 - Pull the code
 - Get certificate from letsencrypt

# Auth0 Setup
 1. Create an account in Auth0
    Setup a domain using which the applications can connect to Auth0
 2. Create a tenant (top right) in the Auth0 dashboard
 3. Create an application ( App)
 4. Add the following settings:
  - Allowed Callback URLs: http://localhost:3000/
  - Allowed Web Origins: http://localhost:3000
  Advanced Settings:
   - Grant Types: Implicit, Authorization Code, Refresh Token
   - Endpoints: Make a note of the endpoints
 5. APIs
  - + CreateAPI
  - Name:  API
  - Identifier: <url>
  - Signing Algorithm: RS256
  - Click 'Create'
 6. API -> Settings
  - RBAC Settings
   - Enable RBAC = enable it
   - Enable Permissions in Access token = enable it
   - Permissions. Add the following permissions
    - read:user, read:hotel, read:device, read:order, read:item, create:hotel, create:device, create:item, read:checkin, create:checkin, create:order, update:order
   - Machine to Machine Applications:
    - API(Test Application) = Authorized (enabled)
 7. Connections -> Database -> (+)Create DB Connection
  - Settings
   - Name: dev-db (prod-db for production tenant)
   - Requires User name = Disabled
   - Disable Sign Ups = enable
  - Applications
   - API(Test Application) = enabled
   - App = enabled
 8. Universal Login
  - Settings
   - Experience = New
   - Company logo = https://<url>/img.png
   - Primary color = #230c87
   - Page background color = #000000
   - Save changes
 9. Users & Roles
  - Roles -> Create role
   - Name = '****'
   - Description = 'Admin role'
   - Create
  - Roles -> Permissions
   - Add Permissions -> Select API
   - Select all (read:user, read:hotel,read:device,read:facility,create:device,create:facility,create:hotel,read:order, update:order, read:item, create:item) 
   - Add Permission
 - Roles -> Create role
  - Name = '****'
  - Description = 'Hotel front desk user'
  - Roles -> Permissions
   - Add Permissions -> Select API
   - Select read:user,read:hotel,read:device,read:item,read:order, create:checkin
 - Users -> Create User
  - Email: ****
  - Password: ****
  - Connection: dev-db
  - Roles -> Assign Role -> Select '****' 
 - Users -> Create User
  - Email: ****
  - Password: ****
  - Connection: ****
  - Roles -> Assign Role -> Select '****' 
 - Users -> **** -> Details
  - app_metadata: { "hotel_id": "000"}
   - This is the mapping between the hotel front desk user and the hotel that they belong to. Get the hotel_id from the API/database
 10. Applications -> (+) Create Application
  - Name = 'App Alexa'
  - Choose an application type = 'Machine to machine applications'
  - Select an API = Auth 0 Management API
  - 'App Alexa' -> Settings
   - Token Endpoint Authentication Method = 'Basic'
   - 'App Alexa' -> Advanced Settings -> OAuth
    - JsonWebToken Signature Algorithm = 'HS256'
  - Save Changes
  - Settings -> Advanced Settings -> Grant Types
   - Select Implicit, Authorization Code, Refresh Token, Client Credentials
 11. App-in-dev (drop down) -> Settings
  - API Authorization Settings -> Default Audience = '****'
  - 

# Alexa Skills Auth0 setup
 - Follow https://www.jovo.tech/tutorials/alexa-account-linking-auth0#tutorial
 - Alexa console -> Account Linking
  - Do you allow users to create an account or link to an existing account with you? = Enable
  - Allow users to enable skill without account linking = Disable
  - Allow users to link their account to your skill from within your application or website = Disable
  - Security Provider Information
   - Auth Code Grant = Enable
    - Authorization URI = ****
    - Access Token URI = ****
    - Your Client ID = ****
    - Your Secret = <Your Secret>
    - Your Authentication Scheme = HTTP Basic
    - Scope = openid, offline_access, profile, email
    - Domain list = ****
 - Save
