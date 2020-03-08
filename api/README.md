# Steps to run application
* Clone the repository
* Run the server
   `npm run`
   Server will start on port 3000
* Open Postman and make the API request
   `GET http://localhost:3000/api/v1/device`
* Set the authorization header; "Authorization" "Bearer: ...."
* If no devices exist, should get []

# Auth0 Settings
 - Two Applications
	 1. Kamamishu Alexa
		 - Type: Machine to machine
		 - Domain: kamamishu.eu.auth0.com
		 - Callback URL: https://kamamishu.com
		 - 
	 2. Kamamishu App
		 - Type: Single page application
		 - Domain: kamamishu.eu.auth0.com
		 - Callback URL: https://kamamishu.com
 - Two APIs
	 1. Kamamishu API
		 - Identifer: https://kamamishu.com
		 - Permissions: read:users
	 2. Auth0 Management API
	    - Identifer: https://kamamishu.eu.auth0.com/api/v2/
		 - Permissions: All permissions
 - Roles
    - admin
      - Permissions: read:users
    - consumer