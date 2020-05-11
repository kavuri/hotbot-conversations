/* Copyright (C) Kamamishu Pvt. Ltd. - All Rights Reserved
 * Unauthorized copying of this file, via any medium is strictly prohibited
 * Proprietary and confidential
 */

// ------------------------------------------------------------------
// APP CONFIGURATION
// ------------------------------------------------------------------

const env = require('../env');

module.exports = {
    logging: true,
     api: {
        prefix: '/api/v1'
     },
     db: {
        MongoDb: {
            databaseName: process.env.DB_NAME,
            collectionName: process.env.LOG_COLLECTION_NAME,
            uri: process.env.DB_URI,
            replicaSet: process.env.DB_REPLSET_NAME,
            poolSize: process.env.DB_POOLSIZE,
            useNewUrlParser: process.env.DB_USE_NEW_URL_PARSER,
            autoIndex: process.env.DB_AUTO_INDEX,
            autoCreate: process.env.DB_AUTO_CREATE,
            retryWrites: process.env.DB_RETRY_WRITES,
            w: process.env.DB_W,
            useUnifiedTopology: process.env.DB_USE_UNIFIED_TOPOLOGY,
            useFindAndModify: process.env.DB_USE_FIND_AND_MODIFY
        },
     }
 };
 
