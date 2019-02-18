/* Copyright (C) Kamamishu Pvt. Ltd. - All Rights Reserved
 * Unauthorized copying of this file, via any medium is strictly prohibited
 * Proprietary and confidential
 */

'use strict';

var _ = require('lodash');
var AWS = require('aws-sdk');

module.exports = function(config) {
  if (_.isNull(config) || _.isUndefined(config)) {
    config = {
        local: true,
        api_version: '2012-08-10',
        region: 'eu-west-1',
        // local_url: 'http://docker.for.mac.localhost:8000'
        local_url: 'http://localhost:8000'
    };
  }

  // console.info('config:', config);

  // Set the region
  AWS.config.update({region: config.region});

  let dynamoDB, docClient;
  if (_.isEqual(config.local, false)) {
    dynamoDB = new AWS.DynamoDB({api_version: config.api_version});
    docClient = new AWS.DynamoDB.DocumentClient({api_version: config.api_version});
  } else {
    dynamoDB = new AWS.DynamoDB({ endpoint: new AWS.Endpoint(config.local_url) });
    docClient = new AWS.DynamoDB.DocumentClient({ endpoint: new AWS.Endpoint(config.local_url) });
  }

  return docClient;
}

// var DBConn = require('./db_connection.js');
// var constants = require('../constants')
//
// let testDbConn = new DBConn(constants.LOCAL_OR_REAL_DB);
// var dynamoDB = testDbConn.dynDB(),
//     doc_client = testDbConn.dynDC();