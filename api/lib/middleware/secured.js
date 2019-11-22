/* Copyright (C) Kamamishu Pvt. Ltd. - All Rights Reserved
 * Unauthorized copying of this file, via any medium is strictly prohibited
 * Proprietary and confidential
 */
'use strict';

const _ = require('lodash'),
      UserModel = require('../../../src/db').UserModel;
/**
 * This is a middleware that checks if the user is logged in.
 *
 * If the user is not logged in, it stores the requested url in `returnTo` attribute
 * and then redirects to `/login`.
 *
Sample structure
{ displayName: 'gimliguha@gmail.com',
  id: 'auth0|5dcd1a4b7297fa0edee352aa',
  user_id: 'auth0|5dcd1a4b7297fa0edee352aa',
  name: {},
  emails: [ { value: 'gimliguha@gmail.com' } ],
  picture: 'https://s.gravatar.com/avatar/24c8fb9932fdfcf352d9c22ef4508ee0?s=480&r=pg&d=https%3A%2F%2Fcdn.auth0.com%2Favatars%2Fgi.png',
  nickname: 'gimliguha',
  _json: 
   { sub: 'auth0|5dcd1a4b7297fa0edee352aa',
     nickname: 'gimliguha',
     name: 'gimliguha@gmail.com',
     picture: 'https://s.gravatar.com/avatar/24c8fb9932fdfcf352d9c22ef4508ee0?s=480&r=pg&d=https%3A%2F%2Fcdn.auth0.com%2Favatars%2Fgi.png',
     updated_at: '2019-11-18T10:51:09.095Z',
     email: 'gimliguha@gmail.com',
     email_verified: true },
  _raw: '{"sub":"auth0|5dcd1a4b7297fa0edee352aa","nickname":"gimliguha","name":"gimliguha@gmail.com","picture":"https://s.gravatar.com/avatar/24c8fb9932fdfcf352d9c22ef4508ee0?s=480&r=pg&d=https%3A%2F%2Fcdn.auth0.com%2Favatars%2Fgi.png","updated_at":"2019-11-18T10:51:09.095Z","email":"gimliguha@gmail.com","email_verified":true}' }
*/
module.exports = function () {
    return async function secured (req, res, next) {
      if (!_.isUndefined(req.user)) {

        // Check if email is verified
        if (_.isEqual(req.user._json.email_verified, true)) {
          // User is verified. Can continue
        } else {
          // TODO: Show a screen with message to verify the email
        }
        
        // Check if the user belongs to the hotel id that is mentioned
        let hotel_id = req.param.hotel_id;
        let userFromDB = await UserModel.findOne({email:req.user._json.email}).exec();
        if (_.isEmpty(userFromDB) || _.isUndefined(userFromDB)) {
          // User does not exist, but has loggedIn? Not possible. Security issue
          console.error('user ' + email + ' does not exist! But loggedIn? Cant happen');
        } else if (!_.isEqual(userFromDB.hotel_id, hotel_id)) {
          // logged-in user does not belong to the provided hotel_id
          console.log('##user=', user);
          return res.status(401).send('Access denied');
          //TODO: Provide a proper authentication return value
        } else {
          return next();
        }
      }
      console.log('not authenticated:', req.user);
      req.session.returnTo = req.originalUrl;
      return res.redirect('/login');
    };
};