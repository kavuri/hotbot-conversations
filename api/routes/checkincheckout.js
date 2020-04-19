
/* Copyright (C) Kamamishu Pvt. Ltd. - All Rights Reserved
 * Unauthorized copying of this file, via any medium is strictly prohibited
 * Proprietary and confidential
 */
'use strict';

var express = require('express');
var router = express.Router();
const CheckinCheckoutModel = require('../../src/db/CheckinCheckout'),
    _ = require('lodash'),
    { check, validationResult } = require('express-validator');

/**
 * Gets all check-ins and check-outs of the hotel
 * @param hotel_id
 * @returns created room
 * TODO: Right now we will return all the records. But better to page them with inputs from UI
 */
router.get('/',
    //auth0.authenticate,
    //auth0.authorize('create:hotel'),
    [
        check('hotel_id').exists({ checkNull: true, checkFalsy: true }),    //FIXME: Remove hotel_id when auth is implemented
    ],
    async function (req, res) {
        try {
            validationResult(req).throw();
        } catch (error) {
            return res.status(422).send(error);
        }

        const hotel_id = req.query.hotel_id;
        console.log('fetching all checkincheckouts for hotel ', hotel_id);

        try {
            // Find the room corresponding to the hotel_id and room
            let cinsCouts = await CheckinCheckoutModel
                .find({ hotel_id: hotel_id })
                .sort({ checkout: -1 })
                .exec();
            return res.status(200).send(cinsCouts);
        } catch (error) {
            console.log('error in checkin of guest.', error);
            res.status(500).send(error);
        }
    });

/**
 * Gets a fully populated single entry
 * @param hotel_id
 * @returns created room
 */
router.get('/:id',
    //auth0.authenticate,
    //auth0.authorize('create:hotel'),
    [
        check('id').exists({ checkNull: true, checkFalsy: true }),
    ],
    async function (req, res) {
        try {
            validationResult(req).throw();
        } catch (error) {
            return res.status(422).send(error);
        }

        const hotel_id = req.query.hotel_id;
        const id = req.params.id;
        console.log('fetching all checkincheckouts for hotel ', hotel_id, ' with ', id);

        try {
            // Find the room corresponding to the hotel_id and room
            let obj = await CheckinCheckoutModel
                .findById(id)
                .populate('orders')
                .exec();
            return res.status(200).send(obj);
        } catch (error) {
            console.log('error in checkin of guest.', error);
            res.status(500).send(error);
        }
    });

module.exports = router;