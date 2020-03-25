# All TODOs
  - Fix the intent conflicts - DONE
  - Implement hook for dynamic entities. This is for updataing the current session with the facilities that the hotel has (esp. menu items) during the session. https://github.com/FlorianHollandt/jovo-example-dynamicEntities/blob/master/src/hooks/dynamicEntitiesHook.js. Also here: https://www.jovo.tech/docs/hooks
  - Implement CanFulfillIntentRequest, where if a user invokes an intent that cannot be fulfilled by Amazon, it can be by our skill - https://www.jovo.tech/docs/amazon-alexa/canfulfill
  - Add ProactiveAPI to the project. This is to send notifications to the user. Useful with order fulfilment. https://www.jovo.tech/docs/amazon-alexa/proactive-events

# FIXMEs
  * Whenever a user app_metadata is changed in Auth0, the corresponding user has to be deleted from mongodb. This is because, getting the user with /api/v1/user api call first checks the user in the mongodb database. If the user exists, that user data is returned. So, whatever the changes are in Auth0 user, will not be reflected for the application. This is for the API project

  * Change launch keywords from 'hotel reception' to 'front desk', as the utterance 'launch hotel reception is hitting 'Enquiry_All_Facilities'
  * Add AMAZON.FallbackIntent and corresponding Google fallback intent for a catch-all intent
  * Can *App Data* in Jovo be used for storing hotel info, policies and facilities? https://www.jovo.tech/docs/data - DONE
  * Implement account linking - DONE
  * Implement global fallback intents for the final pieces in every conversation
  * Fix the conversations and their strings
  * Check-in & Check-out functionality has to implemented. How does the front desk tell the system on user check-in & check-out - Backend complete
  * Write a automation script to check the graph.js for data consistency - DONE
  * If a hotel changes the available facilities, they should be updated to the graph and the facilities node should be regenerated

# Go To Market

 1. Kamamishu Website
  - Build a site in wix.com. Buy domain kamamishu.com and kamamishu.in
  - Create emails. 1. contact@kamamishu.com, 2. admin@kamamishu.com
  - Large font, professional, videos, marketing stuff
 2. Design brochure that needs to be placed in the hotel room
  - The brochure should have invocations that the guests can refer to
  - A single pager on how it works
  - Brochure design - DONE
 3. Test kamamishu voice conversations
  - Write test plan with all the scenarios
  - Create jest unit test cases
  - Automate testing with every change
  - Create deployment package for hotbot-conversations, hotbot-api
   - Is PM2 used to deploy?
   - Create deployment script for mongodb
   - Create 2 EC2 instances in AWS
   - Deploy conversations and api servers
  -  Dev complete
   - Code review
   - Fix the conversation flow
   - Fix the messages that are sent to the guest
   - Build the app for hotel front desk
   - Family testing of the app
   - Ensure all certification needs are satisfied
 4. AWS Alexa certification process
  - Submit for certification
  - Meet Alexa certification team if required to speed up the certification process
 5. LinkedIn, Facebook, Twitter accounts & marketing
  - Create LinkedIn, Facebook, Twitter accounts for Kamamishu
 6. Start reaching out to hotels
  - Buy some Alexa device (~10) = Rs.30K
  - Deploy in 3 hotels (which ones?), 3 room each in pilot phase
  - Create list of hotels to pursue 
  - Maintain a CRM system
 7. Legal documents
  - Create Letter of Intent with Hotel
   - Create post pilot phase usage agreement
  - Create End user License agreement
  - Create device ownership agreement
  - Anything else?


# Provisioning for a new hotel
 - Create a kamamishu email id, like hotel@kamamishu.com
 - Create a Alexa account (https://alexa.amazon.com)
 - Have a phone number of the Hotel as part of the registration