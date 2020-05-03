
# Hotbot Conversations

 * Using Beame for launching a http proxy: https://github.com/beameio/beame-insta-ssl#table-of-contents
    * `beame-insta-ssl tunnel make --dst 3000 --proto http`
 * Using fusejs for fuzzy search. https://fusejs.io/

## Setup
 - To setup the system
      - Generate the AppSync configuration
            npm run appsync <appId>
      - Get the appId from the appsync aws console
      - This cmd generates the utils/appsync_config.json
      - Note that the region is hardcoded in the script to ap-south-1. Use appropriate region
      - 

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

 # Deployment steps
  - Start a EC2 instance in AWS. Use Ubuntu 18.04
  - Install MongoDB for Ubuntu 18.04. Instruction - https://docs.mongodb.com/manual/tutorial/install-mongodb-on-ubuntu/. Follow steps 1-4
  - Clone hotbot-conversations repository. `git clone https://hotbot@bitbucket.org/hotbotty/hotbbot-conversations.git`
  to the root directory
  - `cd hotbot-conversations/scripts`
  - Launch mongodb = `./start_db`
   - This will start two mongo DB instances with replica sets in directories rs01, rs02
  - Install NodeJS
   - Install NVM. Follow instruction here = `https://linuxize.com/post/how-to-install-node-js-on-ubuntu-18.04/`
    - `nvm --version` should give `0.34.0`
    - `nvm install 12.13.0` (13.11.0 version)
   - `cd hotbot-conversations`
   - `npm install`
   - `cd hotbot-converstaions/api`
   - `npm install`
   - Create a file `hotbot-conversations/api/.env` and add the following contents
      ```
      AUTH0_CLIENT_ID=
      AUTH0_DOMAIN=
      AUTH0_AUDIENCE=
      AUTH0_CLIENT_SECRET=
      AUTH0_CALLBACK_URL=
      SESSION_SECRET='bam bam baaam..rock..'
      AUTH0_ADMIN_AUDIENCE=https://kamamishu.eu.auth0.com/api/v2/
      ```
  - Replace the Auth0 details above with the details from Auth0
  - Create a file `hotbot-conversations/.env` and add the following contents
      ```
      MONGO_CLUSTER_URI=mongodb+srv://hotbbotuser:Abcd1234@cluster0-i07kz.mongodb.net/test?retryWrites=true&w=majority
      MONGO_DB_NAME=
      MONGO_USERNAME=
      MONGO_PASSWORD=
      MONGO_POOL_SIZE=5
      AUTH0_CLIENT_ID=CbQUvI1aHMwJewlcqnF3t38I9g9jUU1T
      AUTH0_DOMAIN=kamamishu-in-dev.auth0.com
      AUTH0_AUDIENCE=https://kamamishu-in-dev.auth0.com/api/v2/
      AUTH0_CLIENT_SECRET=IQHh1vemyo8J-p-yVQqIpEXIOr_C86FL_cHmMAnqZnBfmMIPOhg29J1dCylSRm6I
      AUTH0_CALLBACK_URL=https://pitangui.amazon.com/api/skill/link/MLHXQP7BSLB59, https://layla.amazon.com/api/skill/link/MLHXQP7BSLB59, https://alexa.amazon.co.jp/api/skill/link/MLHXQP7BSLB59
      SESSION_SECRET='bam bam baaam..rock..'
      AUTH0_ADMIN_AUDIENCE=https://kamamishu.eu.auth0.com/api/v2/
      ```
  - Replace the Auth0 details above with the details from Auth0

# Skill description in Alexa settings
## Skill preview:
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

## Privacy & Compliance
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

## Availability
 - Who should have access to this skill? *
  - Public
 - 

