/* Copyright (C) Kamamishu Pvt. Ltd. - All Rights Reserved
 * Unauthorized copying of this file, via any medium is strictly prohibited
 * Proprietary and confidential
 */

'use strict';

var _ = require('lodash');
var AWS = require('aws-sdk');
let Conn = require('./Conn');
const TableName = 'Device';

class Device {
    constructor(device) {
        this.conn = new Conn(null).doc_client;
        this.device = device;
    }

    static async save() {
        let params = {
            TableName: TableName,
            Item: this.device
        };

        let data;
        try {
            data = await this.conn.put(params).promise();
        } catch(error) {
            console.error('error while saving device:', device);
            throw error;
        }
    }
}

module.exports.Device = Device;