/* Copyright (C) Kamamishu Pvt. Ltd. - All Rights Reserved
 * Unauthorized copying of this file, via any medium is strictly prohibited
 * Proprietary and confidential
 */

'use strict';

var _ = require('lodash');
let Conn = require('./Conn');
const TableName = 'HotelPolicies';

module.exports.get = async (hotel_id, policy) => {
    if (_.isEmpty(hotel_id) || _.isNull(hotel_id) || _.isUndefined(hotel_id)) {
        // Something is wrong. Send out system problem to user
        console.log('Empty hotel_id. Looks like this device is not registered properly.', hotel_id);
        throw new HotelDoesNotExistError("hotel with id " + hotel_id + " does not exist");
    }

    let params = {
        TableName: TableName,
        ProjectionExpression: policy,
        Key: {
            'hotel_id': hotel_id
        }
    };

    let data;
    try {
        data = await Conn().get(params).promise();
    } catch (error) {
        console.error('error getting hotel info:', hotel_id, error);
        throw error;
    }

    return data.Item;
};