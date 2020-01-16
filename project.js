/* Copyright (C) Kamamishu Pvt. Ltd. - All Rights Reserved
 * Unauthorized copying of this file, via any medium is strictly prohibited
 * Proprietary and confidential
 */

// ------------------------------------------------------------------
// JOVO PROJECT CONFIGURATION
// ------------------------------------------------------------------

module.exports = {
    alexaSkill: {
       nlu: 'alexa',
    },
    googleAction: {
       nlu: 'dialogflow',
       dialogflow: {
         projectId: 'frontdesk-a6a13',
         keyFile: './frontdesk-a6a13-dcf0042ab507.json'
       }
    },
    endpoint: '${JOVO_WEBHOOK_URL}',

    stages: {
       defaultStage: 'dev',
       dev: {

       },
       test: {

       },
       prod: {

       }
    }
};
 