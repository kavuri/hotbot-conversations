/* Copyright (C) Kamamishu Pvt. Ltd. - All Rights Reserved
 * Unauthorized copying of this file, via any medium is strictly prohibited
 * Proprietary and confidential
 */

'use strict';

var _ = require('lodash');
let Conn = require('./Conn');
const TableName = 'DeviceToHotel';

/**
 * Table schema
 * Partition key=device_id, sort key=hotel_id
 */
module.exports.save = async function(device_id, hotel_id, user_id) {
    let params = {
        TableName: TableName,
        Item: {
            device_id: device_id,
            user_id: user_id,
            hotel_id: hotel_id
        }
    };

    let data;
    try {
        data = await Conn().put(params).promise();
    } catch(error) {
        console.error('error in saving device mapping:', device_id, hotel_id, user_id);
        throw error;
    }
}

module.exports.get = async function(device_id, user_id) {
    let params = {
        TableName: TableName,
        Key: {
            'device_id': device_id,
            'user_id': user_id
        }
    };

    let data;
    try {
        data = await Conn().get(params).promise();
        // console.log('....data=', data);
    } catch(error) {
        console.error('error getting device info:', device_id, error);
        throw error;
    }

    return data.Item;
}

const test = async function() {
    // const device_id = "100";
    const device_id = "amzn1.ask.device.AEULKDUHTVG77BSS6A5FY4C77QFP54UZYBD23QTJOR2FW6VESGHOXVTXGNHKKQVVSANOTNJA5LMZKU3I23O7H6JOQTFU2EQY2PARMI4Q75RIPPIBJ3MTIBQKNLC2REKW4BW3MO7O2TB6VJAQKTKJTR562SZBGD53DI3ZSHCYCGONYORJN5AWS",
          user_id = "amzn1.ask.account.AHE5TRHGVDNB2KJCY5HDZITRX2IRQ4MLXEDSV2HLBKIQMTVHEEV7H36KEYOICXQIFB5LEYP4KB6VZG2ZK3EXXCNYP3ZN7HLCWP2UBHR7GSZRDTLOHEAHYXD36MC7OHQPM6FNJGWE662J7OJT3GIFCPZRTJGYN6WOHFK2F7ANZTEQ3GRPCSA5HQPYLDX7SUQFWEVHLWU2QFPVOXA";
    
    var DeviceToHotel = require('./DeviceToHotel');
    try {
        // Device.save(device);
        var d = await DeviceToHotel.get(device_id, user_id);
        console.log(d);
    } catch(error) {
        console.log(error);
    }
}

// test();