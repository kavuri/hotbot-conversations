/* Copyright (C) Kamamishu Pvt. Ltd. - All Rights Reserved
 * Unauthorized copying of this file, via any medium is strictly prohibited
 * Proprietary and confidential
 */
'use strict';

var express = require('express');
const dotenv = require('dotenv');
const session = require('express-session');
const MongoStore = require('connect-mongo')(session);
const DBConn = require('../../../src/db').DBConn;

dotenv.config();
var app = express();

// config express-session
var expiryDate = new Date(Date.now() + 60 * 60 * 1000 * 12) // 12 hours
var sess = {
    name: 'sessionId',
    secret: process.env.APP_SESSION_SECRET || 'hanuman rocks!',
    resave: false,
    saveUninitialized: true,
    cookie: {
        secure: process.env.NODE_ENV === 'production',
        httpOnly: true,
        domain: 'kamamishu.com',
        path: 'kamapp',
        expires: expiryDate,
        sameSite: 'lax'
    },
    store: new MongoStore({ mongooseConnection: DBConn })
};

if (process.env.NODE_ENV === 'production') {
    app.set('trust proxy', 1); // trust first proxy
}

module.exports = session(sess);
