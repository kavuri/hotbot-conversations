/* Copyright (C) Kamamishu Pvt. Ltd. - All Rights Reserved
 * Unauthorized copying of this file, via any medium is strictly prohibited
 * Proprietary and confidential
 */

'use strict';

const OrderModel = require('../../src/db/Order'),
    CheckinCheckout = require('../../src/db/CheckinCheckout');
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
    if (_.isUndefined(clients[hotel_id])) return; // If the front desk has not opened the orders screen, then we have no reference
    // console.log('sending data to ', hotel_id, data)

    Object.keys(clients[hotel_id]).forEach(c => {
        console.log('clientId=', c)
        clients[hotel_id][c].write(`data: ${JSON.stringify(data)}\n\n`)
    });
}

module.exports.watchOrders = () => {
    console.log('watching for changes in orders...');
    OrderModel.watch({ fullDocument: 'updateLookup' }).on('change', async (data) => {
        console.log('order changed:', JSON.stringify(data), '+++\n', data.fullDocument);

        if (_.isEqual(data.operationType, 'delete')) { // Document is deleted. Should not be!
            //TODO: Documents should never be deleted. Maybe add an audit log?
        } else if (_.isEqual(data.operationType, 'insert') || _.isEqual(data.operationType, 'update')) {
            // This is triggered when the guest changes state (like cancel order) or increases the priority (like I need the item urgently)
            // FIXME: If the update is done from front desk, the event will make a round trip - inefficient
            const hotel_id = data.hotel_id;
            let checkincheckout = await CheckinCheckout
                .findById(data.fullDocument.checkincheckout, '-orders')
                .lean()
                .exec();
            let order = data.fullDocument;
            order['checkincheckout'] = [checkincheckout];   // This is to maintain consistency with the GET of orders, where checkincheckout is returned as an array
            console.log('+++document=', order);
            this.sendEvent(hotel_id, order);
        }
    });

    OrderModel.watch().on('close', () => {
        // TODO: Underlying connection is closed. Do something
    });

    OrderModel.watch().on('error', () => {
        // TODO: Error with underlying connection. Do something
    });
}
