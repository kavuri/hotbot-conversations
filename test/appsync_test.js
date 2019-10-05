"use strict";
/**
* This shows how to use standard Apollo client on Node.js
*/

global.WebSocket = require('ws');
require('es6-promise').polyfill();
require('isomorphic-fetch');

// Require exports file with endpoint and auth info
const aws_exports = require('../src/appsync/aws-exports').default;

// Require AppSync module
const AUTH_TYPE = require('aws-appsync/lib/link/auth-link').AUTH_TYPE;
const AWSAppSyncClient = require('aws-appsync').default;

const url = aws_exports.ENDPOINT;
const region = aws_exports.REGION;
const type = "API_KEY";
const mutations = require('../src/appsync/graphql/mutations');

// If you want to use API key-based auth
const apiKey = 'da2-p67gl366qjeapd57srt7jweene';
// If you want to use a jwtToken from Amazon Cognito identity:
// const jwtToken = 'xxxxxxxx';

// If you want to use AWS...
const AWS = require('aws-sdk');
AWS.config.update({
    region: aws_exports.REGION,
    credentials: new AWS.Credentials({
        accessKeyId: aws_exports.AWS_ACCESS_KEY_ID,
        secretAccessKey: aws_exports.AWS_SECRET_ACCESS_KEY
    })
});
const credentials = AWS.config.credentials;
// console.log(credentials, aws_exports);

// Import gql helper and craft a GraphQL query
const gql = require('graphql-tag');
const m = gql(mutations.createOrder);
const query = gql(`
query AllPosts {
allPost {
    __typename
    id
    title
    content
    author
    version
}
}`);

// Set up a subscription query
const subquery = gql(`
subscription NewPostSub {
newPost {
    __typename
    id
    title
    author
    version
}
}`);

// Set up Apollo client
const client = new AWSAppSyncClient({
    url: url,
    region: region,
    auth: {
        type: type,
        apiKey: apiKey

    },
    disableOffline: true,      //Uncomment for AWS Lambda
    fetchPolicy: 'network-only'
});
// console.log('@@@client=',client);
client.hydrated().then(function (client) {
    //Now run a query
    // client.query({ query: query })
    //client.query({ query: query, fetchPolicy: 'network-only' })   //Uncomment for AWS Lambda
        // .then(function logData(data) {
        //     console.log('results of query: ', data);
        // })
        // .catch(console.error);

    //Now subscribe to results
    // const observable = client.subscribe({ query: subquery });

    // const realtimeResults = function realtimeResults(data) {
    //     console.log('realtime data: ', data);
    // };

    // observable.subscribe({
    //     next: realtimeResults,
    //     complete: console.log,
    //     error: console.log,
    // });

    const order = {
        user_id: "1",
        hotel_id: "100",
        room_no: "106",
        o_id: "2",
        o_time: "2019-10-05T09:12:22.743Z",
        o_items: [ {  "name" : "towels", "req_count" : 2, "category" : "r" }, {"name" : "soap", "req_count" : 1, "category" : "r" } ],
        o_status: { "status" : "new", "_id" : "5d985e76cccecd91d8a02f8b", "created_at" : "2019-10-05T09:12:22.743Z","updated_by":"1" } ,
        o_priority: { "priority" : "asap", "_id" : "5d985e76cccecd91d8a02f8a", "created_at" : "2019-10-05T09:12:22.742Z","updated_by":"1" } 
    };

    var r = client.mutate({mutation: gql(mutations.createOrder), variables: order});

    console.log(r);
});