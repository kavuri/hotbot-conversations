/* Copyright (C) Kamamishu Pvt. Ltd. - All Rights Reserved
 * Unauthorized copying of this file, via any medium is strictly prohibited
 * Proprietary and confidential
 */

'use strict';

const OrderModel = require('../../src/db/Order');
const _ = require('lodash');

let clients = {};

module.exports.addClient = function (hotel_id, clientId, res) {
    console.log('adding client.', clientId, hotel_id);
    if (_.isEmpty(clients[hotel_id])) {
        let client = {};
        client[clientId] = res;
        clients[hotel_id] = client;
    } else {
        clients[hotel_id][clientId] = res;
    }

    // console.log('all clients=', clients);
}

module.exports.removeClient = function (hotel_id, clientId) {
    console.log('removing client.', clientId, hotel_id);
    delete clients[hotel_id][clientId];
}

module.exports.sendEvent = function (hotel_id, data) {
    console.log('sending data to ', hotel_id, data)
    if (_.isUndefined(clients[hotel_id])) return; // If the front desk has not opened the orders screen, then we have no reference

    Object.keys(clients[hotel_id]).forEach(c => {
        console.log('clientId=', c)
        clients[hotel_id][c].write(`data: ${JSON.stringify(data)}\n\n`)
    });
}

module.exports.watchOrders = () => {
    console.log('watching for changes in orders...');
    OrderModel.watch().on('change', data => {
        console.log('order changed:', data);

        if (_.isEqual(data.operationType, 'delete')) { // Document is deleted. Should not be!
            //TODO: Documents should never be deleted. Maybe add an audit log?
        } else if (_.isEqual(data.operationType, 'replace') || _.isEqual(data.operationType, 'insert')) { // Document has been modified or inserted. Resend the new one
            const hotel_id = data.hotel_id;
            this.sendEvent(hotel_id, data.fullDocument);
            console.log('sent data to ', hotel_id);
        }
    });

    OrderModel.watch().on('close', () => {
        // TODO: Underlying connection is closed. Do something
    });

    OrderModel.watch().on('error', () => {
        // TODO: Error with underlying connection. Do something
    });
}
