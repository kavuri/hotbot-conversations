/* Copyright (C) Kamamishu Pvt. Ltd. - All Rights Reserved
 * Unauthorized copying of this file, via any medium is strictly prohibited
 * Proprietary and confidential
 */
'use strict';

var express = require('express');
const passport = require('passport');
const Auth0Strategy = require('passport-auth0');
const dotenv = require('dotenv');
var app = express();
dotenv.config();

// Configure Passport to use Auth0
  var strategy = new Auth0Strategy(
    {
      domain: process.env.AUTH0_DOMAIN,
      clientID: process.env.AUTH0_CLIENT_ID,
      clientSecret: process.env.AUTH0_CLIENT_SECRET,
      callbackURL:
        process.env.AUTH0_CALLBACK_URL || 'http://localhost:3000/callback'
    },
    function (accessToken, refreshToken, extraParams, profile, done) {
      // accessToken is the token to call Auth0 API (not needed in the most cases)
      // extraParams.id_token has the JSON Web Token
      // profile has all the information from the user
      return done(null, profile);
    }
  );
  
  passport.use(strategy);

  passport.serializeUser(function (user, done) {
    done(null, user);
    console.log('user=',user);
  });
  
  passport.deserializeUser(function (user, done) {
    done(null, user);
  });

  app.use(passport.initialize());
  app.use(passport.session());