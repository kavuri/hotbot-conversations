/* Copyright (C) Kamamishu Pvt. Ltd. - All Rights Reserved
 * Unauthorized copying of this file, via any medium is strictly prohibited
 * Proprietary and confidential
 */

'use strict';

const express = require('express');
const router = express.Router();

const ordersListener = require('../lib/ordersListener'),
    CheckinCheckout = require('../../src/db/CheckinCheckout');

/**
 * Router to watch for changes in orders (like new order or order update)
 */
router.post('/', async function (req, res) {
    const order = req.body;
    //console.log('received orderWatch:', order);
    let hotel_id = order.hotel_id;

    let checkincheckout = await CheckinCheckout
        .findById(order.checkincheckout, '-orders')
        .lean()
        .exec();
    order['checkincheckout'] = [checkincheckout];   // This is to maintain consistency with the GET of orders, where checkincheckout is returned as an array
    ordersListener.sendEvent(hotel_id, order);

    return res.status(200).send({ msg: 'order sent to client' });
});

module.exports = router;
