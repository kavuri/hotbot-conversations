/* Copyright (C) Kamamishu Pvt. Ltd. - All Rights Reserved
 * Unauthorized copying of this file, via any medium is strictly prohibited
 * Proprietary and confidential
 */

'use strict';

const { WebhookVerified: Webhook, ExpressJS } = require('jovo-framework');

const { app } = require('./app.js');
const env = require('../env');

// ------------------------------------------------------------------
// HOST CONFIGURATION
// ------------------------------------------------------------------

//TODO: Enable SSL with the real certificate
const fs = require('fs');
const path = require('path');
const port = process.env.PORT || 3000;
if (process.env.NODE_ENV === 'prod') {
    console.log('running in production environment. Setting certificates');
    Webhook.ssl = {
        key: fs.readFileSync('/etc/letsencrypt/live/alexa.kamamishu.online/privkey.pem'),
        cert: fs.readFileSync('/etc/letsencrypt/live/alexa.kamamishu.online/fullchain.pem'),
    };
}

const { itemChanged } = require('./cache');
/**
 * This REST API is to get a notification whenever a graph item is changed
 * FIXME: This API is not protected. Do not expose this to external parties
 */
Webhook.post('/itemChanged', async (req, res) => {
    itemChanged(req.query.hotel_id);
    return res.status(200).send({ msg: 'notification sent' });
});

// ExpressJS (Jovo Webhook)
//if (process.argv.indexOf('--webhook') > -1) {
Webhook.jovoApp = app;

Webhook.listen(port, () => {
    console.info(`Local server listening on port ${port}.`);
});

Webhook.post(['/webhook', '/webhook_alexa'], async (req, res) => {
    await app.handle(new ExpressJS(req, res));
});
//}

// AWS Lambda
exports.handler = async (event, context, callback) => {
    await app.handle(new Lambda(event, context, callback));
};
