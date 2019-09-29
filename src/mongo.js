/* Copyright (C) Kamamishu Pvt. Ltd. - All Rights Reserved
 * Unauthorized copying of this file, via any medium is strictly prohibited
 * Proprietary and confidential
 */

'use strict';

var _ = require('lodash'),
    mongoose = require('mongoose');

module.exports = async function() {
    console.log('init mongo');
  mongoose.Promise = global.Promise;
  var mongo_config = require('./config').db;
  var mongo_url = mongo_config.MongoDb.uri + mongo_config.MongoDb.databaseName;

  console.log('mongo url=' + mongo_url);

  // var db = await mongoose.createConnection(mongo_url, {poolSize: 4, useNewUrlParser: true});
  mongoose.connect(mongo_url, {useNewUrlParser: true, autoIndex: false, autoCreate: true});
  console.log('mongodb createConnection');

  var db = mongoose.connection;
  db.on('error', console.error.bind(console, 'Connection error: '));
  db.once('open', function(callback) {
      console.log('Successfully connected to MongoDB.');
  });

}