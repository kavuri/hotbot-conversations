/* Copyright (C) Kamamishu Pvt. Ltd. - All Rights Reserved
 * Unauthorized copying of this file, via any medium is strictly prohibited
 * Proprietary and confidential
 */
'use strict';

const express = require('express');
const router = express.Router();
const auth0 = require('../lib/auth0');
const _ = require('lodash');
const dotenv = require('dotenv');
const fetch = require('node-fetch');
const { check } = require('express-validator');
const UserModel = require('../db/User');
const querystring = require('querystring');

dotenv.config();

/* GET user profile. */
/**
 * Gets logged-in user details
 * This API is invoked after the first time login of the user
 * This is to locally create the user in the database
 */
router.get('/:user_id',
  auth0.authenticate,
  auth0.authorize('read:user'),
  [
    check('user_id').exists({ checkNull: true, checkFalsy: true }),
  ],
  async (req, res) => {
    const user_id = querystring.unescape(req.params.user_id); // User id is URL encoded, need to decode it

    if (_.isUndefined(user_id)) {
      // Not possible, since user should have been authenticated
      return res.status(500).send({ error: 'user is not logged in!' })
    }

    // Check if user has been created in database
    console.log('checking database...', JSON.stringify(user_id))
    let user;
    try {
      user = await UserModel.findOne({ user_id: user_id }).exec();
      console.log('user=', user);
    } catch (error) {
      return res.status(500).json(error);
    }

    if (!_.isUndefined(user) && !_.isNull(user)) {
      // User exists. Return the user
      console.log('user exists...', user);
      return res.status(200).json(user);
    }

    // Get the detailed user info
    const body = JSON.stringify({
      'client_id': process.env.AUTH0_CLIENT_ID,
      'client_secret': process.env.AUTH0_CLIENT_SECRET,
      'audience': process.env.AUTH0_ADMIN_AUDIENCE,
      'grant_type': 'client_credentials'
    })

    console.log('body=', body);
    const token = await fetch('https://' + process.env.AUTH0_DOMAIN + '/oauth/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: body
    }).then(function (a) {
      return a.json();
    }).then((json) => {
      return json;
    });

    console.log('token=', token.access_token);

    const full_user = await fetch('https://' + process.env.AUTH0_DOMAIN + '/api/v2/users/' + user_id, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'authorization': 'Bearer ' + token.access_token
      }
    }).then(function (a) {
      return a.json();
    }).then((json) => {
      return (json);
    });

    // Store the user to the database
    console.log('storing full user...', full_user)

    let u = new UserModel(full_user);
    let r;
    try {
      r = await u.save();
    } catch (error) {
      //TODO: What should be done incase of failure to save user?
      res.status(500).json(error);
    }
    res.status(200).json(r);
  });

module.exports = router;
