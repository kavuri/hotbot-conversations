
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
    - read:user, read:hotel, read:device, read:order, read:facility, create:hotel, create:device, create:facility
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
   - Select all (read:user, read:hotel,read:device,read:facility,create:device,create:facility,create:hotel,read:order) 
   - Add Permission
 - Roles -> Create role
  - Name = 'consumer'
  - Description = 'Hotel front desk user'
  - Roles -> Permissions
   - Add Permissions -> Select KamamishuAPI
   - Select read:user,read:hotel,read:device,read:facility,read:order
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