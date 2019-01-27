/* Copyright (C) Kamamishu Pvt. Ltd. - All Rights Reserved
 * Unauthorized copying of this file, via any medium is strictly prohibited
 * Proprietary and confidential
 */

'use strict';

var _ = require('lodash');
var AWS = require('aws-sdk');

class Conn {
  constructor(config) {

    if (config) {
        this.config = {
            local: true,
            api_version: '2012-08-10',
            region: 'eu-west-1',
            local_url: 'http://docker.for.mac.localhost:8000'   //http://localhost:8000
        };
    } else {
        this.config = config;
    }
    console.info('config:', config);

    // Set the region
    AWS.config.update({region: config.region});

    if (_.isEqual(config.local, true)) {
      this.dynamoDB = new AWS.DynamoDB({api_version: config.api_version});
      this.doc_client = new AWS.DynamoDB.DocumentClient({api_version: config.api_version});
    } else {
      this.dynamoDB = new AWS.DynamoDB({ endpoint: new AWS.Endpoint(config.local_url) });
      this.doc_client = new AWS.DynamoDB.DocumentClient({ endpoint: new AWS.Endpoint(config.local_url) });
    }

    return this;
  }

  dynDB() {
    return this.dynamoDB;
  }

  dynDC() {
    return this.doc_client;
  }
}

module.exports.Conn = Conn;

// var DBConn = require('./db_connection.js');
// var constants = require('../constants')
//
// let testDbConn = new DBConn(constants.LOCAL_OR_REAL_DB);
// var dynamoDB = testDbConn.dynDB(),
//     doc_client = testDbConn.dynDC();