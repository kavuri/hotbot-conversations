/* Copyright (C) Kamamishu Pvt. Ltd. - All Rights Reserved
 * Unauthorized copying of this file, via any medium is strictly prohibited
 * Proprietary and confidential
 */

 var _ = require('lodash');

 var config = {
    // AWS AppSync AppId for the skill. Used for publishing orders
    // Change this to an AppId for the target environment (dev, production) by looking at console.aws.amazon.com in appsync
    aws_appsync_appid: 'nd3shnl6izb4revgvvehhte4iu'
 };

 function run(appId) {
    if (_.isUndefined(appId)) {
        console.error('appId of AppSync not provided. Bailing out');
        return -1;
    }

    // Generate the appsync config using the command
    var appsync_cmd = 'aws appsync get-graphql-api --api-id ' + appId;

    var out = require('child_process').execSync(appsync_cmd);
    console.log(out.toString());
    if (_.isUndefined(out) || _.isNull(out)) {
        // No output from aws
        console.log('error in fetching appsync data');
        return -1;
    }

    // Store config file to utils/ directory
    try {
        require('fs').writeFileSync('./src/utils/appsync_config.json', out);
    } catch(error) {
        console.log('error in writing to appsync_config.json.', error);
    }
 }

 var appId = process.argv[2];
 if (_.isUndefined(appId)) {
     // Pick the appId from above
     appId = config.aws_appsync_appid;
 }

 run(appId);