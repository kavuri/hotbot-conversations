/* Copyright (C) Kamamishu Pvt. Ltd. - All Rights Reserved
 * Unauthorized copying of this file, via any medium is strictly prohibited
 * Proprietary and confidential
 */

// ------------------------------------------------------------------
// APP CONFIGURATION
// ------------------------------------------------------------------

module.exports = {
    logging: true,
 
    intentMap: {
       'AMAZON.StopIntent': 'END',
       'AMAZON.YesIntent': 'YesIntent',
       'AMAZON.NoIntent': 'NoIntent'
    },
 
    // db: {
    //      DynamoDb: {
    //          tableName: 'conversations',
    //      }
    //  },

    //  db: {
    //     FileDb: {
    //         pathToFile: '../db/db.json',
    //     }
    //  },

     db: {
        MongoDb: {
            databaseName: 'test',
            collectionName: 'conversations',
            uri: 'mongodb://localhost:27017,localhost:27018/',
            replicaSet: 'rs0',
            poolSize: 5,
            useNewUrlParser: true,
            autoIndex: false,
            autoCreate: true,
            retryWrites: true,
            w: 'majority',
            useUnifiedTopology: true
        },
     },

     i18n: {
        filesDir: '../i18n/',
    },

    intentsToSkipUnhandled: [
        'CancelIntent',
        'HelpIntent'
    ],

    system: {
        DATABASE: 'mongo'
    }
 };
 