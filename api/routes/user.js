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
const UserModel = require('../../src/db/User');
const querystring = require('querystring');

dotenv.config();

/* GET user profile. */
/**
 * Gets logged-in user details
 * This API is invoked after the first time login of the user
 * This is to locally create the user in the database
 */
router.get('/:user_id',
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
    // console.log('checking database...', JSON.stringify(user_id))
    let user;
    try {
      user = await UserModel.findOne({ user_id: user_id }).exec();
      // console.log('user=', user);
    } catch (error) {
      console.log('error getting user:', error);
      return res.status(500).json(error);
    }
    return res.status(200).send(user);
  });

module.exports = router;
