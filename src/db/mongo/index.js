/* Copyright (C) Kamamishu Pvt. Ltd. - All Rights Reserved
 * Unauthorized copying of this file, via any medium is strictly prohibited
 * Proprietary and confidential
 */

'use strict';

var mongoose = require('mongoose'),
    autoIncrement = require('mongoose-auto-increment');

// module.exports = async function() {
console.log('init mongo');
mongoose.Promise = global.Promise;
var mongo_config = require('../../config').db;
var mongo_url = mongo_config.MongoDb.uri + mongo_config.MongoDb.databaseName;

console.log('mongo url=' + mongo_url);

var connection = mongoose.createConnection(mongo_url, {
    poolSize: 4,
    useNewUrlParser: true,
    autoIndex: false,
    autoCreate: true
});

// Initialize auto increment plugin
autoIncrement.initialize(connection);

// mongoose.connect(mongo_url, {useNewUrlParser: true, autoIndex: false, autoCreate: true});
console.log('mongodb createConnection');

// var connection = mongoose.connection;
// connection.on('error', console.error.bind(console, 'Connection error: '));
// connection.once('open', function(callback) {
//     console.log('Successfully connected to MongoDB.');
//     return connection;
// });

module.exports.AutoIncrement = autoIncrement;
module.exports.DBConn = connection;
// }