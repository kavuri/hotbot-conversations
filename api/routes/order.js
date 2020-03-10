/* Copyright (C) Kamamishu Pvt. Ltd. - All Rights Reserved
 * Unauthorized copying of this file, via any medium is strictly prohibited
 * Proprietary and confidential
 */

'use strict';
const express = require('express');
const router = express.Router();
const OrderModel = require('../../src/db/Order');
const { check, validationResult } = require('express-validator');
const auth0 = require('../lib/auth0');
const ordersListener = require('../lib/ordersListener');
const findHotelOfUser = require('../lib/helpers').findHotelOfUser;
const _ = require('lodash');

// const EventEmitter = require('events');

// class OrderCreatedEmitter extends EventEmitter { }

// const myEmitter = new OrderCreatedEmitter();

// OrderModel.watch().on('change', data => {
//     console.log('##new order:', data);
//     myEmitter.emit('order_created', data);
// });

/**
 * Post an order. This method would not be used in real use
 * @param hotel_id
        user_id,
        room_no,
	    items: {facility_id, req_count},
	    priority,
	    status
 */
router.post('/',
    auth0.authenticate,
    [
        check('hotel_id').exists({ checkNull: true, checkFalsy: true }),
        check('user_id').exists({ checkNull: true, checkFalsy: true }),
        check('room_no').exists({ checkNull: true, checkFalsy: true }),
        check('items').exists({ checkNull: true, checkFalsy: true }).isArray({ min: 1 })
    ],
    async function (req, res) {

        let order = new OrderModel({
            hotel_id: req.body.hotel_id,
            user_id: req.body.user_id,
            room_no: req.body.room_no,
            items: req.body.items
        });

        console.log('order=', order);
        let saved_order;
        try {
            saved_order = order = await order.save();
        } catch (error) {
            res.status(500).send(error);
        }

        return res.status(200).send(saved_order);
    });
/**
 * Gets all orders of the hotel (open ones by default)
 * @param hotel_id
 * @param room_no
 * @param status (optional. 'new' by default)
 * @returns all orders (new or done)
 */
router.get('/',
    auth0.authenticate,
    auth0.authorize('read:order'),
    async function (req, res) {

        const user_id = req.user.sub;

        var err = validationResult(req);
        if (!err.isEmpty()) {
            console.log(err.mapped())
            return res.status(400).json({ error: 'hotel_id required' });
        }

        let hotel_id;
        try {
            hotel_id = await findHotelOfUser(user_id);
            console.log('got hotel_id=', hotel_id);
        } catch (error) {
            return res.status(500).json(error);
        }

        let status;
        if (_.isUndefined(req.query.status)) status = 'new';
        else status = req.query.status;

        console.log(req.query.status, hotel_id, 'status=', status)

        let orders;
        try {
            orders = await OrderModel.find({ hotel_id: hotel_id, "status.status": status }).exec();
            // console.log('orders=', orders)
        } catch (error) {
            console.error(error);
            res.status(500).send(error);
        }

        res.status(200).json(orders);
    });

router.get('/listen',
    auth0.authenticate,
    auth0.authorize('read:order'),
    async (req, res, next) => {
        const headers = {
            'Content-Type': 'text/event-stream',
            'Connection': 'keep-alive',
            'Cache-Control': 'no-cache'
        };
        res.writeHead(200, headers);

        res.write('\n\n');

        const user_id = req.user.sub;
        let hotel_id;
        try {
            hotel_id = await findHotelOfUser(user_id);
            console.log('got hotel_id=', hotel_id);
        } catch (error) {
            console.log('error fetching hotel_id of user.', error);
            return res.end();
        }
        console.log('hotel_id=',hotel_id);
        ordersListener.addClient(hotel_id, user_id, res);

        req.on('close', () => {
            console.log('closing client connection ', user_id);
            ordersListener.removeClient(hotel_id, user_id);
        })
    });

router.get('/testlisten', auth0.authenticate, async (req, res, next) => {
    const headers = {
        'Content-Type': 'text/event-stream',
        'Connection': 'keep-alive',
        'Cache-Control': 'no-cache'
    };
    res.writeHead(200, headers);

    res.write('\n\n');

    // const clientId = req.user.sub;
    const clientId = Date.now();
    let hotel_id = '100';

    ordersListener.addClient(hotel_id, clientId, res);

    req.on('close', () => {
        console.log('closing client connection ', clientId);
        ordersListener.removeClient(hotel_id, clientId);
    });
});

async function addNest(req, res, next) {
    const newNest = req.body;
    // nests.push(newNest);

    // Send recently added nest as POST result
    res.json(newNest)

    // Invoke iterate and send function
    return ordersListener.sendEvent('100', newNest);
}

router.post('/nest', addNest);

// Get a single order
// input=hotel_id(mandatory), room_no(optional), status=open & closed (optional, open by default)
/**
 * @param hotel_id
 * @param order_id
 */
router.get('/:order_id',
    auth0.authenticate,
    auth0.authorize('read:order'),
    [
        check('hotel_id').exists({ checkNull: true, checkFalsy: true }),
        check('order_id').exists({ checkNull: true, checkFalsy: true })
    ],
    async function (req, res) {

        let hotel_id = req.params.hotel_id,
            order_id = req.params.order_id;

        let order;
        try {
            order = await OrderModel.find({ hotel_id: hotel_id, order_id: order_id }).exec();
        } catch (error) {
            console.error(error);
            res.status(500).send(error);
        }
        res.status(200).send(order);
    });

// Add comment
// priority, status, comment, follow-up
/**
 * @param order_id
 * @param comment
 * @param status
 * @param priority
 */
router.put('/:order_id', [
    check('hotel_id').exists({ checkNull: true, checkFalsy: true }),
    check('order_id').exists({ checkNull: true, checkFalsy: true }),
],
    async function (req, res) {
        let hotel_id = req.params.hotel_id,
            order_id = req.params.order_id,
            comment = req.params.comment,
            status = req.params.status,
            priority = req.params.priority;

        let order;
        try {
            order = await OrderModel.updateOne({ hotel_id: hotel_id, order_id: order_id }, { comment: comment, status: status, priority: priority });
        } catch (error) {
            console.error(error);
            res.status(500).send(error);
        }

        res.status(200).send(order);
    });

module.exports = router;
