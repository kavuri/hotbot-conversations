/* Copyright (C) Kamamishu Pvt. Ltd. - All Rights Reserved
 * Unauthorized copying of this file, via any medium is strictly prohibited
 * Proprietary and confidential
 */

'use strict';

const mongoose = require('mongoose'),
    autoIncrement = require('mongoose-auto-increment');

console.log('init mongo');
mongoose.Promise = global.Promise;
var config = require('../config').db.MongoDb;
var mongo_url = encodeURI(config.uri);

var connection = mongoose.createConnection(mongo_url, {
    dbName: config.databaseName,
    poolSize: config.poolSize,
    useNewUrlParser: config.useNewUrlParser,
    autoIndex: config.autoIndex,
    autoCreate: config.autoCreate,
    retryWrites: config.retryWrites,
    w: config.w,
    useUnifiedTopology: config.useUnifiedTopology,
    useFindAndModify: config.useFindAndModify
});

// Initialize auto increment plugin
autoIncrement.initialize(connection);

console.log('mongodb createConnection');

module.exports.AutoIncrement = autoIncrement;
module.exports.DBConn = connection;
