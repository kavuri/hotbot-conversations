/* Copyright (C) Kamamishu Pvt. Ltd. - All Rights Reserved
 * Unauthorized copying of this file, via any medium is strictly prohibited
 * Proprietary and confidential
 */

'use strict';

const _ = require('lodash');
const UserModel = require('../db/User');

module.exports.findHotelOfUser = async (user_id) => {
    console.log('findHotelOfUser=', user_id);
    if (_.isUndefined(user_id)) {
        throw new Error({ error: 'invalid input' });
    }

    // Fetch user from database
    let user;
    try {
        console.log('getting user...')
        user = await UserModel.findOne({ user_id: user_id }).select('app_metadata').lean().exec();

        console.log('user=', user);
    } catch (error) {
        console.log('got error=',error)
        throw new Error(error);
    }

    return user.app_metadata.hotel_id;
}
