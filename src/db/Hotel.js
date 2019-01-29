/* Copyright (C) Kamamishu Pvt. Ltd. - All Rights Reserved
 * Unauthorized copying of this file, via any medium is strictly prohibited
 * Proprietary and confidential
 */

'use strict';

var _ = require('lodash');
let Conn = require('./Conn');
const TableName = 'Hotel';

class Hotel {
    constructor(hotel_id) {
        this.hotelId = hotel_id;
        this.conn = new Conn(null).doc_client;
    }

    /*
     * Method to get the hotel information
    */
    get() {
        let params = {
            TableName: TableName,
            Key: {
                HashKey: this.hotel_id
            }
        };

        let data;
        try {
            data = await this.conn.get(params).promise();
        } catch(error) {
            console.error('error while getting hotel info:', this.hotel_id, error);
            throw error;
        }

        return data;
    }

    facilities() {
        let params = {
            TableName: TableName,
            Key: {
                HashKey: this.hotel_id
            },
            AttributesToGet: ['facilities']
        };

        let data;
        try {
            data = await this.conn.get(params).promise();
        } catch(error) {
            console.error('error while getting hotel facilities:', this.hotel_id, error);
            throw error;
        }

        return data;
    }

    policies() {
        let params = {
            TableName: TableName,
            Key: {
                HashKey: this.hotel_id
            },
            AttributesToGet: ['policies']
        };

        let data;
        try {
            data = await this.conn.get(params).promise();
        } catch(error) {
            console.error('error while getting hotel policies:', this.hotel_id, error);
            throw error;
        }

        return data;
    }

    info() {
        let params = {
            TableName: TableName,
            Key: {
                HashKey: this.hotel_id
            },
            AttributesToGet: ['info']
        };

        let data;
        try {
            data = await this.conn.get(params).promise();
        } catch(error) {
            console.error('error while getting hotel info:', this.hotel_id, error);
            throw error;
        }

        return data;
    }
}