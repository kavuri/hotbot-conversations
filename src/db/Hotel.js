/* Copyright (C) Kamamishu Pvt. Ltd. - All Rights Reserved
 * Unauthorized copying of this file, via any medium is strictly prohibited
 * Proprietary and confidential
 */
'use strict';

var _ = require('lodash'),
    Fuse = require('fuse.js');
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

module.exports.room_items = async function(hotel_id, f_type) {
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

    let fuse_options = {
        shouldSort: true,
        threshold: 0.5,
        location: 0,
        distance: 100,
        maxPatternLength: 32,
        minMatchCharLength: 3,
        keys: [
          "f_type"
        ]
    };

    var fuse = new Fuse(data.Item.facilities, fuse_options);
    var result = fuse.search(f_type);

    return result;
}

const test = async function() {
    let Hotel = require('./Hotel');
    var p = await Hotel.room_items("100", "r");
    console.log('data=', JSON.stringify(p));
}

// test();