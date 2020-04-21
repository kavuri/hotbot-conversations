/* Copyright (C) Kamamishu Pvt. Ltd. - All Rights Reserved
 * Unauthorized copying of this file, via any medium is strictly prohibited
 * Proprietary and confidential
 */

'use strict';

const _ = require('lodash');
const UserModel = require('../../../src/db/User');

module.exports = async (req, res, next) => {
    const user = req.user;

    if (_.isUndefined(user)) {
        // Not yet authenticated?
        return next({error: 'user not authenticated'}); // Cannot happen!
    }
    // Fetch user from database
    try {
        let u = await UserModel
            .findOne({ user_id: user.sub })
            .select('app_metadata')
            .lean()
            .exec();

        console.log('user=', u);
        req.user.app_metadata = u.app_metadata;
        return next();
    } catch (error) {
        console.log('got error=', error)
        return next(error);
    }
}
