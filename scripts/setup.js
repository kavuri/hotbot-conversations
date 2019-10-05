/* Copyright (C) Kamamishu Pvt. Ltd. - All Rights Reserved
 * Unauthorized copying of this file, via any medium is strictly prohibited
 * Proprietary and confidential
 */

 var _ = require('lodash');

 var config = {
    // AWS AppSync AppId for the skill. Used for publishing orders
    // Change this to an AppId for the target environment (dev, production) by looking at console.aws.amazon.com in appsync
    aws_appsync_appid: 'byy55wz7rfc53ockhjrd6vjmcm',
    awsRegion: 'ap-south-1'
 };

 function run(appId, awsRegion) {
    if (_.isUndefined(appId)) {
        console.error('appId of AppSync not provided. Bailing out');
        return -1;
    }

    // Generate the appsync config using the command
    var appsync_cmd = 'aws appsync get-graphql-api --api-id ' + appId;

    var graphql = JSON.parse(require('child_process').execSync(appsync_cmd).toString());
    console.log(graphql.toString());
    if (_.isUndefined(graphql) || _.isNull(graphql)) {
        // No output from aws
        console.log('error in fetching appsync data');
        return -1;
    }

    // API keys are not returned as part of the above call. Need to use a different one
    var get_api_keys = 'aws appsync list-api-keys --api-id ' + appId;
    var api_keys = require('child_process').execSync(get_api_keys);
    console.log('appsync api keys=', api_keys.toString());
    if (_.isUndefined(api_keys) || _.isNull(api_keys)) {
        // Keys are missing
        console.log('graphql api keys are missing. Not generated or appId wrong?');
        return -1;
    }

    var v = JSON.parse(api_keys.toString());
    // Set the keys as part of the graphql object
    graphql.graphqlApi[Object.keys(v)[0]] = v[Object.keys(v)[0]];

    // FIXME: Find out if it is possible to get the region from aws appsync cli
    graphql.graphqlApi['awsRegion'] = awsRegion;

    // Store config file to utils/ directory
    try {
        require('fs').writeFileSync('./src/appsync/config.json', JSON.stringify(graphql, null, 4));
    } catch(error) {
        console.log('error in writing to config.json.', error);
    }
 }

 var appId = process.argv[2];
 if (_.isUndefined(appId)) {
     // Pick the appId from above
     appId = config.aws_appsync_appid;
 }

 run(appId, config.awsRegion);