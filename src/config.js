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

     db: {
        FileDb: {
            pathToFile: '../db/db.json',
        }
     },

     i18n: {
        filesDir: '../i18n/',
    },

    intentsToSkipUnhandled: [
        'CancelIntent',
        'HelpIntent'
    ]
 };
 