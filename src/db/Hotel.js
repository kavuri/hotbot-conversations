/* Copyright (C) Kamamishu Pvt. Ltd. - All Rights Reserved
 * Unauthorized copying of this file, via any medium is strictly prohibited
 * Proprietary and confidential
 */
'use strict';

var _ = require('lodash');
let Conn = require('./Conn');
const TableName = 'Hotel';

module.exports.get = async function(hotel_id, projection) {
    if (_.isNull(projection) || _.isUndefined(projection)) {
        throw new Error('project for getting data not provided')
    }
    let params = {
        TableName: TableName,
        ProjectionExpression: projection,
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
}

module.exports.facility_names = async function(hotel_id) {
    let params = {
        TableName: TableName,
        Key: {
            'hotel_id': hotel_id
        },
        AttributesToGet: ['facilities']
    };

    let data;
    try {
        data = await Conn().get(params).promise();
    } catch (error) {
        console.error('error while getting hotel facilities:', hotel_id, error);
        throw error;
    }



    return data;
}

const test = async function() {
    let Hotel = require('./Hotel');
    var p = await Hotel.facility_names("100");
    console.log('data=', JSON.stringify(p));
}

// test();