/* Copyright (C) Kamamishu Pvt. Ltd. - All Rights Reserved
 * Unauthorized copying of this file, via any medium is strictly prohibited
 * Proprietary and confidential
 */
'use strict';

var _ = require('lodash');
let Conn = require('./Conn');
const TableName = 'Hotel';

module.exports.get = async function(device_id, hotel_id) {
    let params = {
        TableName: TableName,
        Key: {
            'hotel_id': hotel_id
        }
    };

    let data;
    try {
        data = await Conn().get(params).promise();
    } catch (error) {
        console.error('error getting device info:', hotel_id, error);
        throw error;
    }

    return data;
}

module.exports.all_facilities = async function(hotel_id) {
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

module.exports.all_policies = async function(hotel_id) {
    let params = {
        TableName: TableName,
        Key: {
            'hotel_id': hotel_id
        },
        AttributesToGet: ['policies']
    };

    let data;
    try {
        data = await Conn().get(params).promise();
    } catch (error) {
        console.error('error while getting hotel policies:', hotel_id, error);
        throw error;
    }

    return data;
}

module.exports.info = async function(hotel_id) {
    let params = {
        TableName: TableName,
        Key: {
            HashKey: hotel_id
        },
        AttributesToGet: ['info']
    };

    let data;
    try {
        data = await Conn().get(params).promise();
    } catch (error) {
        console.error('error while getting hotel info:', hotel_id, error);
        throw error;
    }

    return data;
}