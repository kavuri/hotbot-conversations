/* Copyright (C) Kamamishu Pvt. Ltd. - All Rights Reserved
 * Unauthorized copying of this file, via any medium is strictly prohibited
 * Proprietary and confidential
 */

'using strict';

require('isomorphic-fetch'); // required for graphql client
var appsync_config = require('./appsync_config.json');  // appsync configuration from aws

const AWSAppSyncClient = require('aws-appsync').default;

// Fetch the appsync config and create structure for AWSAppSyncClient
const cli_config = {
   url: appsync_config.graphqlApi.uris.GRAPHQL,
   region: appsync_config.graphqlApi.awsRegion,
   auth: {
      type: appsync_config.graphqlApi.authenticationType,
      apiKey: appsync_config.graphqlApi.apiKeys[0].id      // NOTE: Taking the first value of the array of keys
   },
   disableOffline: true,
   fetchPolicy: 'network-only'
};

console.log('cli_config=', cli_config);
const client = new AWSAppSyncClient(cli_config);

module.exports = client;