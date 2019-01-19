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
     }
 };
 