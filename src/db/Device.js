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
class Device {
    constructor(device_id) {
        this.conn = new Conn(null).doc_client;
        this.device_id = device_id;
    }

    static async save() {
        let params = {
            TableName: TableName,
            Item: this.device_id
        };

        let data;
        try {
            data = await this.conn.put(params).promise();
        } catch(error) {
            console.error('error while saving device:', this.device_id);
            throw error;
        }
    }

    async get() {
        let params = {
            TableName: TableName,
            Key: {
                HashKey: this.device_id
            }
        };

        let data;
        try {
            data = await this.conn.get(params).promise();
        } catch(error) {
            console.error('error getting device info:', this.device_id, error);
            throw error;
        }

        return data;
    }

    /**
     *  Method to check if the device is registered and active
     * @returns {result: true, message: null}, or {result: false, message: "error"}
     */
    async isDeviceRegistered() {
        //TODO: Implement this
    }
}

module.exports.Device = Device;