/* Copyright (C) Kamamishu Pvt. Ltd. - All Rights Reserved
 * Unauthorized copying of this file, via any medium is strictly prohibited
 * Proprietary and confidential
 */

'use strict';
const express = require('express');
const router = express.Router();
const querystring = require('querystring');
const OrderModel = require('../../src/db/Order');
const { check, validationResult } = require('express-validator');
const auth0 = require('../lib/auth0');
const ordersListener = require('../lib/ordersListener');
const _ = require('lodash');
const moment = require('moment');
const CheckinCheckoutModel = require('../../src/db/CheckinCheckout');

/**
 * Post an order. This method would not be used in real use
 * //FIXME: Remove this endpoint in production
 * @param hotel_id
        user_id,
        room_no,
	    items: {facility_id, req_count},
	    priority,
	    status
 */
router.post('/',
    auth0.authorize('create:order'),
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
            checkincheckout = await CheckinCheckoutModel.findOne(filter).exec();
        } catch (error) {
            console.log('error in getting checkincheckout:', error);
            return res.status(500).send(error);
        }

        // console.log('checkincheckout=', checkincheckout);
        let order = new OrderModel({
            hotel_id: req.body.hotel_id,
            user_id: req.body.user_id,
            room_no: req.body.room_no,
            item: req.body.item,
            curr_status: { status: 'new', set_by: user_id },
            curr_priority: { priority: 'asap', set_by: user_id },
            checkincheckout: checkincheckout._id
        });

        let saved_order;
        try {
            saved_order = order = await order.save();
            // console.log('order=', saved_order);
        } catch (error) {
            console.log('error while saving order:', error);
            res.status(500).send(error);
        }

        return res.status(200).send(saved_order);
    });

/**
 * Gets all orders of the hotel on a particular day
 * Also fetches all open orders (status='done' or 'progress') from all previous days
 * @param hotel_id
 * @param room_no
 * @param status (optional. 'new' by default)
 * @returns all orders (new or done)
 */
router.get('/',
    auth0.authorize('read:order'),
    [
        check('reqDate').exists({ checkNull: true, checkFalsy: true }).custom(value => { return moment(value).isValid() }),
    ],
    async function (req, res) {

        try {
            validationResult(req).throw();
        } catch (error) {
            return res.status(422).send(error);
        }

        let rowsPerPage = parseInt(req.query.rowsPerPage || 10); // results per page
        rowsPerPage = rowsPerPage > 100 ? 100 : rowsPerPage; // Maximum number of return items per page

        const hotel_id = req.user.app_metadata.hotel_id,
            page = parseInt(req.query.page),
            status = req.query.status,
            reqDate = querystring.unescape(req.query.reqDate);

        console.log('get all orders:hotel_id=', hotel_id, 'status=', status, ', rowsPerPage=', rowsPerPage, ',page=', page, ',selectedDate=', reqDate);

        let facets = {};
        facets['allOnDate'] = [
            { $match: { created_at: { '$gte': moment(reqDate).startOf('day').toDate(), '$lte': moment(reqDate).endOf('day').toDate() } } },
            { $sort: { created_at: 1 } },
            { $lookup: { from: 'checkincheckouts', localField: 'checkincheckout', foreignField: '_id', as: 'checkincheckout' } },
            { $project: { priority: 0, status: 0, comments: 0 } },
        ];
        facets['allOpen'] = [
            { $match: { 'curr_status.status': { $in: ['new', 'progress'] } } },
            // { $match: { $and: [{ 'curr_status.status': { $in: ['new', 'progress'] } }, { created_at: { '$lt': moment(reqDate).startOf('day').toDate() } }] } },
            { $sort: { created_at: 1 } },
            { $project: { priority: 0, status: 0, comments: 0 } },
            { $lookup: { from: 'checkincheckouts', localField: 'checkincheckout', foreignField: '_id', as: 'checkincheckout' } },
        ];

        try {
            let orders = await OrderModel
                .aggregate([{ $match: { hotel_id: hotel_id } }])
                .facet(facets)
                .exec();

            // console.log('count=', orders[0].allOnDate);
            return res.status(200).send(orders[0]);
        } catch (error) {
            console.error(error);
            res.status(500).send(error);
        }

    });

router.get('/listen',
    auth0.authorize('read:order'),
    async (req, res, next) => {
        const headers = {
            'Content-Type': 'text/event-stream',
            'Connection': 'keep-alive',
            'Cache-Control': 'no-cache'
        };
        res.writeHead(200, headers);

        res.write('\n\n');

        const user_id = req.user.sub,
            hotel_id = req.user.app_metadata.hotel_id;
        ordersListener.addClient(hotel_id, user_id, res);

        req.on('close', () => {
            console.log('closing client connection ', user_id);
            ordersListener.removeClient(hotel_id, user_id);
        })
    });

/**
 * This is a test listener that takes hotel_id as argument and send the results
 */
// FIXME: Only for testing. Remove it in production
router.get('/testlisten',
    auth0.authorize('create:order'),
    async (req, res, next) => {
        const headers = {
            'Content-Type': 'text/event-stream',
            'Connection': 'keep-alive',
            'Cache-Control': 'no-cache'
        };
        res.writeHead(200, headers);

        res.write('\n\n');

        const hotel_id = req.query.hotel_id;
        console.log('__hotel_id=', hotel_id);
        const clientId = Date.now();

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
    return ordersListener.sendEvent('1', newNest);
}

router.post('/nest', auth0.authorize('create:order'), addNest);

/**
 * Change the status of the order
 * @param order_id
 * @param comment
 * @param status
 * @param priority
 */
router.patch('/:order_id/',
    auth0.authorize('update:order'),
    [
        check('order_id').exists({ checkNull: true, checkFalsy: true }),
    ],
    async function (req, res) {
        try {
            validationResult(req).throw();
        } catch (error) {
            return res.status(422).send(error);
        }

        const order_id = req.params.order_id,
            user_id = req.user.sub;

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
