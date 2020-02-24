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
    console.log('removing client.', clientId, hotel_id)
    delete clients[hotel_id][clientId];
}

module.exports.sendEvent = function (hotel_id, data) {
    console.log('sending data to ', hotel_id, data)
    Object.keys(clients[hotel_id]).forEach(c => {
        console.log('clientId=',c)
        clients[hotel_id][c].write(`data: ${JSON.stringify(data)}\n\n`)
    });
}

module.exports.watch = () => {
    OrderModel.watch().on('change', data => {
        console.log('order changed:', data);

    });
}
