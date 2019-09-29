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

module.exports.room_item = async function(hotel_id, f_type, room_item) {
    if (_.isEmpty(hotel_id) || _.isEmpty(f_type) || _.isEmpty(room_item)) {
        // Error in input
        throw new Error('invalid input');
    }

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

    // reset fuse options to search by name instead of f_type
    fuse_options.keys = ["name"];
    var item = new Fuse(result, fuse_options);
    var r = item.search(room_item);

    return r;
}

const test = async function() {
    let Hotel = require('./Hotel');
    var p = await Hotel.room_item("100", "r", "tiss");
    console.log('data=', JSON.stringify(p));
}

// test();