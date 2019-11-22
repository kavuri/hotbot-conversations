/* Copyright (C) Kamamishu Pvt. Ltd. - All Rights Reserved
 * Unauthorized copying of this file, via any medium is strictly prohibited
 * Proprietary and confidential
 */

/*
 * This handler will be used while onboarding a device into Kamamishu
 * When the device is registered, the hotel/Kamamishu can ask for the device
 * to setup, during which time this handler will be invoked and the device
 * will be registered in the database
 */

'use strict';
var express = require('express');
var router = express.Router(),
    OrderModel = require('../../src/db').OrderModel,
    { check, validationResult } = require('express-validator');

/**
 * Post an order. This method would not be used in real use
 * @param hotel_id
        user_id,
        room_no,
	    items: {facility_id, req_count},
	    priority,
	    status
 */
router.post('/', [
            check('hotel_id').exists({checkNull: true, checkFalsy: true}),
            check('user_id').exists({checkNull: true, checkFalsy: true}),
            check('room_no').exists({checkNull: true, checkFalsy: true}),
            check('items').exists({checkNull: true, checkFalsy: true}).isArray({min:1})
            ],
            async function(req, res) {

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
router.get('/', [
            check('hotel_id').exists({checkNull: true, checkFalsy: true})
            ],
            async function(req, res) {
    
    let hotel_id = req.params.hotel_id,
        room_no = req.params.room_no,
        status = req.params.status | 'new';

    let orders;
    try {
        orders = await OrderModel.find({hotel_id: hotel_id, room_no: room_no, o_status: status}).exec();
    } catch (error) {
        console.error(error);
        res.status(500).send(error);
    }
    res.status(200).send(orders);
});

// Get a single order
// input=hotel_id(mandatory), room_no(optional), status=open & closed (optional, open by default)
/**
 * @param hotel_id
 * @param order_id
 */
router.get('/', [
    check('hotel_id').exists({checkNull: true, checkFalsy: true}),
    check('order_id').exists({checkNull: true, checkFalsy: true})
    ],
    async function(req, res) {

    let hotel_id = req.params.hotel_id,
        order_id = req.params.order_id;

    let order;
    try {
        order = await OrderModel.find({hotel_id: hotel_id, order_id: order_id}).exec();
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
                check('hotel_id').exists({checkNull: true, checkFalsy: true}),
                check('order_id').exists({checkNull: true, checkFalsy: true}),
                ],
                async function(req, res) {
    let hotel_id = req.params.hotel_id,
        order_id = req.params.order_id,
        comment  = req.params.comment,
        status   = req.params.status,
        priority = req.params.priority;

    let order;
    try {
        order = await OrderModel.updateOne({hotel_id: hotel_id, order_id: order_id}, {comment: comment, status: status, priority: priority});
    } catch (error) {
        console.error(error);
        res.status(500).send(error);
    }

    res.status(200).send(order);
});

module.exports = router;