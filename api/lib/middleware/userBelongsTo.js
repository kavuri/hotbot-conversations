/* Copyright (C) Kamamishu Pvt. Ltd. - All Rights Reserved
 * Unauthorized copying of this file, via any medium is strictly prohibited
 * Proprietary and confidential
 */

'use strict';

const _ = require('lodash');
const fetch = require('node-fetch');
const UserModel = require('../../../src/db/User');

module.exports = async (req, res, next) => {
    const user = req.user, user_id = req.user.sub;

    if (_.isUndefined(user)) {
        console.log('user is not authenticated');
        // Not yet authenticated?
        return next({ error: 'user not authenticated' }); // Cannot happen!
    }
    // Fetch user from database
    let u = null;
    try {
        u = await UserModel
            .findOne({ user_id: user.sub })
            .select('app_metadata')
            .lean()
            .exec();
    } catch (error) {
        console.log('got error=', error)
        return next(error);
    }

    // If the user exists, set the app_metadata and continue, else, it must be a new user. Save the user and continue
    if (!_.isUndefined(u) && !_.isNull(u)) {
        // User exists. Return the user
        req.user.app_metadata = u.app_metadata;
    } else {
        try {
            // Get the detailed user info
            const body = JSON.stringify({
                'client_id': process.env.AUTH0_CLIENT_ID,
                'client_secret': process.env.AUTH0_CLIENT_SECRET,
                'audience': process.env.AUTH0_ADMIN_AUDIENCE,
                'grant_type': 'client_credentials'
            })

            const token = await fetch('https://' + process.env.AUTH0_DOMAIN + '/oauth/token', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: body
            }).then(function (a) {
                if (!a.ok) throw a;
                return a.json();
            }).then((json) => {
                return json;
            }).catch((error) => { throw error; });

            const full_user = await fetch('https://' + process.env.AUTH0_DOMAIN + '/api/v2/users/' + user_id, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'authorization': 'Bearer ' + token.access_token
                }
            }).then(function (a) {
                if (!a.ok) throw a;
                return a.json();
            }).then((json) => {
                return (json);
            }).catch((error) => { throw error; });

            // Store the user to the database
            u = new UserModel(full_user);
            let r;
            r = await u.save();
            req.user.app_metadata = r.app_metadata;
        } catch (error) {
            console.log('error in feching user:', error);
            return next(error);
        }
    }
    return next();
}
