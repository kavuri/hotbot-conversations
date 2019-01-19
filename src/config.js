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
 