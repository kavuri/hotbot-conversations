/* Copyright (C) Kamamishu Pvt. Ltd. - All Rights Reserved
 * Unauthorized copying of this file, via any medium is strictly prohibited
 * Proprietary and confidential
 */

'using strict';

global.WebSocket = require('ws')
require('es6-promise').polyfill();
require('isomorphic-fetch');

var _ = require('lodash'),
    KamError = require('../utils/KamError'),
    config = require('./config.json'),  // appsync configuration from aws
    gql = require('graphql-tag'),
    mutations = require('./graphql/mutations');

const AWSAppSyncClient = require('aws-appsync').default;

// Fetch the appsync config and create structure for AWSAppSyncClient
const Client = new AWSAppSyncClient({
   url: config.graphqlApi.uris.GRAPHQL,
   region: config.graphqlApi.awsRegion,
   auth: {
      type: config.graphqlApi.authenticationType,
      apiKey: config.graphqlApi.apiKeys[0].id      // NOTE: Taking the first value of the array of keys
   },
   disableOffline: true,
   fetchPolicy: 'network-only' 
});

module.exports.notify = async function(order) {
   console.log('appsync.index notify');
   if (_.isNull(order) || _.isUndefined(order)) {
      throw new KamError('Invalid object order:', order);
   }

   await Client.hydrated();
   const result = await Client.mutate({mutation: gql(mutations.createOrder), variables: order});
   console.log(result);
   return result;
}

function test() {
   var s = require('./index');
   const order = {
      user_id: "1",
      hotel_id: "100",
      room_no: "109",
      o_id: "3",
      o_time: "2019-10-05T09:12:22.743Z",
      o_items: [ {  "name" : "hhh", "req_count" : 2, "category" : "r" }, {"name" : "soap", "req_count" : 1, "category" : "r" } ],
      o_status: { "status" : "new", "_id" : "5d985e76cccecd91d8a02f8b", "created_at" : "2019-10-05T09:12:22.743Z","updated_by":"1" } ,
      o_priority: { "priority" : "asap", "_id" : "5d985e76cccecd91d8a02f8a", "created_at" : "2019-10-05T09:12:22.742Z","updated_by":"1" } 
  };
   var r = s.notify(order);
}

// test();