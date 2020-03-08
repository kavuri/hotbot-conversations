/* Copyright (C) Kamamishu Pvt. Ltd. - All Rights Reserved
 * Unauthorized copying of this file, via any medium is strictly prohibited
 * Proprietary and confidential
 */

// ------------------------------------------------------------------
// APP CONFIGURATION
// ------------------------------------------------------------------

module.exports = {
    logging: true,
     api: {
        prefix: '/api/v1'
     },
     db: {
        MongoDb: {
            databaseName: 'test',
            collectionName: 'conversations',
            //uri: 'mongodb://ec2-13-235-45-238.ap-south-1.compute.amazonaws.com:27017,ec2-13-235-45-238.ap-south-1.compute.amazonaws.com:27018/test?replicaSet=rs0',
            uri: 'mongodb://localhost:27017,localhost:27018/test?replicaSet=rs0',
            replicaSet: 'rs0',
            poolSize: 5,
            useNewUrlParser: true,
            autoIndex: false,
            autoCreate: true,
            retryWrites: true,
            w: 'majority',
            useUnifiedTopology: true,
            useFindAndModify: false
        },
     }
 };
 
