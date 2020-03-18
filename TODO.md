# All TODOs
  - Fix the intent conflicts - DONE
  - Implement hook for dynamic entities. This is for updataing the current session with the facilities that the hotel has (esp. menu items) during the session. https://github.com/FlorianHollandt/jovo-example-dynamicEntities/blob/master/src/hooks/dynamicEntitiesHook.js. Also here: https://www.jovo.tech/docs/hooks
  - Implement CanFulfillIntentRequest, where if a user invokes an intent that cannot be fulfilled by Amazon, it can be by our skill - https://www.jovo.tech/docs/amazon-alexa/canfulfill
  - Add ProactiveAPI to the project. This is to send notifications to the user. Useful with order fulfilment. https://www.jovo.tech/docs/amazon-alexa/proactive-events

# FIXMEs
  - Whenever a user app_metadata is changed in Auth0, the corresponding user has to be deleted from mongodb. This is because, getting the user with /api/v1/user api call first checks the user in the mongodb database. If the user exists, that user data is returned. So, whatever the changes are in Auth0 user, will not be reflected for the application. This is for the API project

  * Change launch keywords from 'hotel reception' to 'front desk', as the utterance 'launch hotel reception is hitting 'Enquiry_All_Facilities'
  * Add AMAZON.FallbackIntent and corresponding Google fallback intent for a catch-all intent
  * Can *App Data* in Jovo be used for storing hotel info, policies and facilities? https://www.jovo.tech/docs/data - DONE
  * Implement account linking
  * Implement global fallback intents for the final pieces in every conversation
  * Fix the conversations and their strings
  * Check-in & Check-out functionality has to implemented. How does the front desk tell the system on user check-in & check-out - Backend complete