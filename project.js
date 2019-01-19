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
 