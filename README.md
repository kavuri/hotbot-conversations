
# Hotbot Conversations

 * Using Beame for launching a http proxy: https://github.com/beameio/beame-insta-ssl#table-of-contents
    * `beame-insta-ssl tunnel make --dst 3000 --proto http`
 * Using fusejs for fuzzy search. https://fusejs.io/

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
 - Exit from mongo shell. Run the command `mongo -u 'admin' -p --authenticationDatabase admin`
 - Create replica set and create admin and cluster users
    ```
	    rs.initiate({ _id:"rs0", members:[ {_id:0,host:"172.31.6.58:27017"}, {_id:1,host:"172.31.42.217:27017"} ] });
        rs0:PRIMARY> use admin
        rs0:PRIMARY> db.createUser({user:"admin", pwd:"Admin#123", roles:[{role:"userAdminAnyDatabase", db:"admin"}]})
        admin.createUser({user:"cluster",pwd:"Cluster#123", roles:[{role:"clusterAdmin", db:"admin"}]})
    ```
 - Create a app user: dbuser 
 ```
    use hotbot-prod
    db.createUser({user:"dbuser",pwd:"HotbotUser",roles:[{role:"readWrite",db:"hotbot-prod"}]})
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
  - Sign-in with kamamishu@gmail.com (Google login)
  - Create a cluster: 'Clouster0'
  - Choose AWS sount-1 region
  - Create a mongodb user: hotbotuser/HotbotUser
  - Create one more dbuser (Security -> Database Access)
  - username: dbuser, password: HotbotUser
  - Whitelist AWS EC2 instance address
  - Connection URL: mongodb+srv://<username>:<password>@cluster0-jolus.mongodb.net/test?retryWrites=true&w=majority

# Herouku account for API (saving money) - IGNORE (not using anymore)
 - Account created (kamamishu@gmail.com)
 - Folow instrctions here - https://dashboard.heroku.com/apps/hotbot-api/deploy/heroku-git

# AWS EC2 instance
 - Launch 2 micro instances (one for hotbot-conversations and another for hotbot-api)
## Port settings
 - Incoming ports
  - open ssh (22), https (443) ports
  - Start a EC2 instance in AWS. Use Ubuntu 18.04
 - Outgoing ports
  - 27017 for mongodb Atlas

## Other setup
# Get Letsencrypt SSL certificate
 - https://certbot.eff.org/lets-encrypt/ubuntubionic-other (or https://itnext.io/node-express-letsencrypt-generate-a-free-ssl-certificate-and-run-an-https-server-in-5-minutes-a730fbe528ca)
    ```
    sudo add-apt-repository ppa:certbot/certbot
    sudo apt-get update
    sudo apt-get install certbot
    ```
 - Open port 80 (temporarily) in EC2 inbound rules. This is to just create a certificate
 - Start server from letsencrypt
   ```
   cd letsencrypt
   node server.js
   ```
 - Open URL `http://alexa.kamamishu.online/.well-known/acme-challenge/a291fa84-d117-4a87-94b0-aaa75eb25755` to verify if everything is working fine
 - `certbot certonly --manual`
 - Details:
   ```
   Enter domain names: alexa.kamamishu.online
   ```
 - Follow the rest of the instructions to create a file
 - Shutdown the temporary server in letsencrypt directory (ctrl+c)

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
		DB_NAME = 'hotbot-prod'
		DB_URI = 'mongodb+srv://<dbuser>:<password>@cluster0-jolus.mongodb.net/'
		DB_REPLSET_NAME = 'Cluster0-shard-0'
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
		AUTH0_CLIENT_ID=rG2lXE6UdXfgpe1HLWVnpSlcsuvp6jtm
		AUTH0_DOMAIN=kamamishu-in.auth0.com
		AUTH0_CLIENT_SECRET=JcQ6DBRF03bARYxDuqsudNInqZdV4i7kDt1fJ4ZlGK-HpAhQIBYm0KcGAYWvSMFR
		AUTH0_ADMIN_AUDIENCE=https://kamamishu-in.auth0.com/api/v2/
		AUTH0_CALLBACK_URL=https://app.kamamishu.online
		SESSION_SECRET='digi digi bam bam baaam..rock..'
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
 3. Create an application (Kamamishu App)
 4. Add the following settings:
  - Allowed Callback URLs: http://localhost:3000/
  - Allowed Web Origins: http://localhost:3000
  Advanced Settings:
   - Grant Types: Implicit, Authorization Code, Refresh Token
   - Endpoints: Make a note of the endpoints
 5. APIs
  - + CreateAPI
  - Name: Kamamishu API
  - Identifier: https://kamamishu.com
  - Signing Algorithm: RS256
  - Click 'Create'
 6. KamamishuAPI -> Settings
  - RBAC Settings
   - Enable RBAC = enable it
   - Enable Permissions in Access token = enable it
   - Permissions. Add the following permissions
    - read:user, read:hotel, read:device, read:order, read:item, create:hotel, create:device, create:item, read:checkin, create:checkin, create:order, update:order
   - Machine to Machine Applications:
    - KamamishuAPI(Test Application) = Authorized (enabled)
 7. Connections -> Database -> (+)Create DB Connection
  - Settings
   - Name: dev-db (prod-db for production tenant)
   - Requires User name = Disabled
   - Disable Sign Ups = enable
  - Applications
   - KamamishuAPI(Test Application) = enabled
   - KamamishuApp = enabled
 8. Universal Login
  - Settings
   - Experience = New
   - Company logo = https://kamamishu.s3.ap-south-1.amazonaws.com/kamamishu-800x600.png
   - Primary color = #230c87
   - Page background color = #000000
   - Save changes
 9. Users & Roles
  - Roles -> Create role
   - Name = 'admin'
   - Description = 'Admin role'
   - Create
  - Roles -> Permissions
   - Add Permissions -> Select KamamishuAPI
   - Select all (read:user, read:hotel,read:device,read:facility,create:device,create:facility,create:hotel,read:order, update:order, read:item, create:item) 
   - Add Permission
 - Roles -> Create role
  - Name = 'consumer'
  - Description = 'Hotel front desk user'
  - Roles -> Permissions
   - Add Permissions -> Select KamamishuAPI
   - Select read:user,read:hotel,read:device,read:item,read:order, create:checkin
 - Users -> Create User
  - Email: sateesh.kavuri@gmail.com
  - Password: Abcd1234#
  - Connection: dev-db
  - Roles -> Assign Role -> Select 'admin' 
 - Users -> Create User
  - Email: testuser@kamamishu.com
  - Password: Abcd1234#
  - Connection: dev-db
  - Roles -> Assign Role -> Select 'consumer' 
 - Users -> testuser@kamamishu.com -> Details
  - app_metadata: { "hotel_id": "000"}
   - This is the mapping between the hotel front desk user and the hotel that they belong to. Get the hotel_id from the API/database
 10. Applications -> (+) Create Application
  - Name = 'Kamamishu Alexa'
  - Choose an application type = 'Machine to machine applications'
  - Select an API = Auth 0 Management API
  - 'Kamamishu Alexa' -> Settings
   - Token Endpoint Authentication Method = 'Basic'
   - 'Kamamishu Alexa' -> Advanced Settings -> OAuth
    - JsonWebToken Signature Algorithm = 'HS256'
  - Save Changes
  - Settings -> Advanced Settings -> Grant Types
   - Select Implicit, Authorization Code, Refresh Token, Client Credentials
 11. kamamishu-in-dev (drop down) -> Settings
  - API Authorization Settings -> Default Audience = 'https://kamamishu-in-dev.auth0.com/api/v2/'
  - 

# Alexa Skills Auth0 setup
 - Follow https://www.jovo.tech/tutorials/alexa-account-linking-auth0#tutorial
 - Alexa console -> Account Linking
  - Do you allow users to create an account or link to an existing account with you? = Enable
  - Allow users to enable skill without account linking = Disable
  - Allow users to link their account to your skill from within your application or website = Disable
  - Security Provider Information
   - Auth Code Grant = Enable
    - Authorization URI = https://kamamishu-in-dev.auth0.com/authorize
    - Access Token URI = https://kamamishu-in-dev.auth0.com/oauth/token
    - Your Client ID = CbQUvI1aHMwJewlcqnF3t38I9g9jUU1T
    - Your Secret = <Your Secret>
    - Your Authentication Scheme = HTTP Basic
    - Scope = openid, offline_access, profile, email
    - Domain list = kamamishu-in-dev.auth0.com
 - Save

## Skill description in Alexa settings
### Skill preview:
 - Public name: Kamamishu - The Hotel Bot
 - One sentence description: Make your guests to experience the ultimate hotel experience
 - Detailed description: The Kamamishu hotel bot is for the guests of a hotel to interact with the hotel. Guests can interact with the hotel by asking for information about the hotel, placing orders.
The Kamamishu mobile and web application provides a real-time information on the orders placed by the guests including facility not working, menu orders, room item orders (like towels, soap etc.). The app also enables the hotel management to have a real-time view of the inventory of the hotel to enable them to have a crystal clear view of the usage of the hotel resources.
More information at: https://kamamishu.com
- Example phrases
 - Alexa, talk to Front Desk.
 - Alexa, open Front Desk.
 - Alexa, launch Front Desk.
- Category
 - Productivity - Organizers & Assistants
- Keywords
 - hotel, digital, assistant, guest, hotel, management
- Privacy policy URL: https://kamamishu.s3.ap-south-1.amazonaws.com/Kamamishu_Privacy_Policy.pdf
- Terms of use URL: https://kamamishu.s3.ap-south-1.amazonaws.com/Kamamishu_Privacy_Policy.pdf

### Privacy & Compliance
 - Does this skill allow users to make purchases or spend real money? 
  - No
 - Does this Alexa skill collect users' personal information? *
  - No
 - Is this skill directed to or does it target children under the age of 13? *
  - No
 - Does this skill contain advertising? *
  - No
 - Export compliance: Check
 - Testing instructions
  - 

### Availability
 - Who should have access to this skill? *
  - Public
 - 

# Alexa certification testing instructions
Kamamishu provides a web application to manage the hotel details, its services (for customization), manage the check-in and checkout process. The web application is available at https://app.kamamishu.online
Before a hotel guest can start to interact with the conversational bot, the hotel has to be onboarded. For the sake of Alexa certification, a dummy hotel with 3 rooms are created. Following are the instructions to be followed for registering a device

The device also requires accont linking. In the alexa app, https://alexa.amazon.in, link to the account using the credentials kamamishu@gmail.com/Abcd1234#

 1. Invoke the skill by saying "Alexa, launch front desk"
 2. If the account is not linked, a message to link the account will be asked. Link the account in Alexa app. If possible, also give permissions to read the address of the device
 3. If the device address read permissions is not given, a message to give permission will be asked. Give permissions from your Alexa app
 4. The device needs to be registered with the correct hotel and the room. In the next invocation, the skill will ask to register  the device, like "This device is not registered. Would you like to register this device? "
 5. Say Yes
 6. Alexa says: " Device successfully registered. From the web application, add the device to hotel . "
 7. Launch https://app.kamamishu.online. Enter the username: kamamishu@gmail.com, password: Abcd1234#
 8. Register the device by clicking ? at the top right of the dashboard. Or Here they are
   - Go to Device Management -> UNASSIGNED. Select "Device " option from drop down -> select hotel -> select room (say 100) -> Click "Assign Device". Select ASSIGNED -> Select "Fantastic Hotel" -> Change Status to "Inactive"
 9. Checkin a dummy guest. Go to Checkin-Checkout -> CHECKIN-CHECKOUT -> Enter Guest name, guest number -> Click "Checkin" button. You should see the guest details are moved to the Checkout section
 10. Go back to launching the skill again by invoking "Alexa, launch front desk".
 11. Continue with using the service
