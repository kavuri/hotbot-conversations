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
const CheckinCheckoutModel = require('../../src/db/CheckinCheckout');

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
    // auth0.authenticate,
    [
        check('hotel_id').exists({ checkNull: true, checkFalsy: true }),
        check('user_id').exists({ checkNull: true, checkFalsy: true }),
        check('room_no').exists({ checkNull: true, checkFalsy: true }),
        check('item').exists({ checkNull: true, checkFalsy: true }),
        check('group_id').exists({ checkNull: true, checkFalsy: true }),
    ],
    async function (req, res) {
        try {
            validationResult(req).throw();
        } catch (error) {
            return res.status(422).send(error);
        }

        let user_id = req.body.user_id, hotel_id = req.body.hotel_id, room_no = req.body.room_no;
        let checkincheckout;
        try {
            const filter = { hotel_id: hotel_id, room_no: room_no, checkout: null };
            checkincheckout = await CheckinCheckoutModel.find(filter).exec();
        } catch (error) {
            console.log('error in getting checkincheckout:', error);
            return res.status(500).send(error);
        }

        console.log('checkincheckout=', checkincheckout);
        let order = new OrderModel({
            hotel_id: req.body.hotel_id,
            user_id: req.body.user_id,
            room_no: req.body.room_no,
            item: req.body.item,
            curr_status: { status: 'new', set_by: user_id },
            curr_priority: { priority: 'asap', set_by: user_id },
            checkincheckout: checkincheckout._id
        });

        // console.log('order=', order);
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
 */

/**
 * Gets all orders of the hotel 
 * @param hotel_id
 * @param room_no
 * @param status (optional. 'new' by default)
 * @returns all orders (new or done)
 */
router.get('/',
    // auth0.authenticate,
    // auth0.authorize('read:order'),
    [
        check('hotel_id').exists({ checkNull: true, checkFalsy: true }),
        check('resPerPage').exists({ checkNull: true, checkFalsy: true }),
        check('page').exists({ checkNull: true, checkFalsy: true }),
    ],
    async function (req, res) {

        try {
            validationResult(req).throw();
        } catch (error) {
            return res.status(422).send(error);
        }

        const resPerPage = parseInt(req.query.resPerPage || 10); // results per page
        const page = parseInt(req.query.page || 1); // Page 

        const hotel_id = req.query.hotel_id;
        let status = req.query.status;

        console.log('get all orders:hotel_id=', hotel_id, 'status=', status, ', resPerPage=', resPerPage, ',page=', page);

        let query = OrderModel.find({ hotel_id: hotel_id });
        if (_.isUndefined(status)) {
            // Nothing change. Do nothing
        } else if (_.isEqual(status, 'new')) {
            // Get both 'new' and 'progress' orders
            query = query.or([{ 'curr_status.status': 'new' }, { 'curr_status.status': 'progress' }]);
        } else {
            // Get the orders of the specific status
            query = query.where('curr_status.status').equals(status);
        }

        try {
            let total = await OrderModel
                .countDocuments({ hotel_id: hotel_id })
                .exec();
            let orders = await query
                .skip((resPerPage * page) - resPerPage)
                .limit(resPerPage)
                .lean()
                .sort({ createdAt: 1 })
                .exec();
            console.log('orders count=', total);
            res.status(200).json({ data: orders, total: total });
        } catch (error) {
            console.error(error);
            res.status(500).send(error);
        }
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
        console.log('hotel_id=', hotel_id);
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

        try {
            validationResult(req).throw();
        } catch (error) {
            return res.status(422).send(error);
        }

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

/**
 * Change the status of the order
 * @param order_id
 * @param comment
 * @param status
 * @param priority
 */
router.patch('/:order_id/',
    // auth0.authenticate,
    // auth0.authorize('create:order'),
    [
        check('order_id').exists({ checkNull: true, checkFalsy: true }),
    ],
    async function (req, res) {
        try {
            validationResult(req).throw();
        } catch (error) {
            return res.status(422).send(error);
        }

        let hotel_id = req.query.hotel_id,
            order_id = req.params.order_id;

        // FIXME: This comes after login. But will not be there for non-logged-in user
        // const user_id = req.user.sub;
        const user_id = "1";

        // The attributes of an order that can be updated/added:
        // status, priority, comment
        // Check for each of these and update accordingly
        let comment = req.body.comment,
            status = req.body.status,
            priority = req.body.priority;

        let obj = {}, arrs = {};
        if (!_.isUndefined(comment)) {
            let c = { comment_by: user_id, comment: comment };
            obj.curr_comment = c;
            arrs.comments = c;
        }
        if (!_.isUndefined(status)) {
            let s = { set_by: user_id, status: status };
            obj.curr_status = s;
            arrs.status = s;
        }
        if (!_.isUndefined(priority)) {
            let p = { set_by: user_id, priority: priority };
            obj.curr_priority = p;
            arrs.priority = p;
        }

        if (_.isEmpty(obj)) {
            // User did not provide anything to update
            return res.status(400).send({ error: 'None of status, priority, comments are provided' });
        }

        try {
            let order = await OrderModel
                .findByIdAndUpdate(order_id, { $set: obj, $push: arrs }, { new: true, upsert: true })
                .exec();
            return res.status(200).send(order);
        } catch (error) {
            return res.status(500).send(error);
        }
    });

module.exports = router;
