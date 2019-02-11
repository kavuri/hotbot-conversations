/* Copyright (C) Kamamishu Pvt. Ltd. - All Rights Reserved
 * Unauthorized copying of this file, via any medium is strictly prohibited
 * Proprietary and confidential
 */

'use strict';

var _ = require('lodash');
let Conn = require('./Conn');
const TableName = 'Device';

/**
 * Table schema
 * Partition key=device_id, sort key=hotel_id
 */
module.exports.save = async function(device) {
    let params = {
        TableName: TableName,
        Item: device
    };

    let data;
    try {
        data = await Conn.get(null).put(params).promise();
    } catch(error) {
        console.error('error in saving device:', device);
        throw error;
    }
}

module.exports.get = async function(device_id) {
    let params = {
        TableName: TableName,
        Key: {
            HashKey: device_id
        }
    };

    let data;
    try {
        data = await Conn.get(params).promise();
    } catch(error) {
        console.error('error getting device info:', device_id, error);
        throw error;
    }

    return data;
}

/*
const device = {
    device_id: "100",
    hotel_id: "100", // this is the "address1" field
    room: "106", // this is "address2" field
    user_id: "123",
    address3: "nothing",
    status: 0, // active
    last_reset: "none",
    created_at: new Date(),
    updated_at: new Date()
  };

var Device = require('./Device');
try {
    Device.save(device);
} catch(error) {
    console.log(error);
}
*/