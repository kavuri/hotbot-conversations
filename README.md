
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