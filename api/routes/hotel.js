/* Copyright (C) Kamamishu Pvt. Ltd. - All Rights Reserved
 * Unauthorized copying of this file, via any medium is strictly prohibited
 * Proprietary and confidential
 */

'use strict';
const express = require('express');
const router = express.Router();
const auth0 = require('../lib/auth0');
const HotelModel = require('../../src/db/Hotel'),
    _ = require('lodash'),
    { check, validationResult } = require('express-validator');

/**
 * @returns all hotels
 */
router.get('/',
    auth0.authenticate,
    auth0.authorize('read:hotel'),
    async function (req, res) {
        console.log('get all hotels');
        const resPerPage = parseInt(req.query.resPerPage || 9); // results per page
        const page = parseInt(req.query.page || 1); // Page 

        try {
            let hotels = await HotelModel
                .find({})
                .skip((resPerPage * page) - resPerPage)
                .limit(resPerPage)
                .lean()
                .sort({ last_reset: -1 })
                .exec();
            console.log(hotels);
            return res.status(200).send(hotels);
        } catch (error) {
            console.log('error in getting all hotels.', error);
            return res.status(400).send(error);
        }
    });

router.post('/:group_id',
    //auth0.authenticate,
    //auth0.authorize('create:hotel'),
    [
        check('group_id').exists({ checkNull: true, checkFalsy: true }),
        check('name').exists({ checkNull: true, checkFalsy: true }),
        check('address').exists({ checkNull: true, checkFalsy: true }),
        check('contact').exists({ checkNull: true, checkFalsy: true }),
        check('coordinates').exists({ checkNull: true, checkFalsy: true }),
        check('front_desk_count').exists({ checkNull: true, checkFalsy: true }),
        check('room_count').exists({ checkNull: true, checkFalsy: true }),
        check('reception_number').exists({ checkNull: true, checkFalsy: true }),
    ],
    async function (req, res) {
        try {
            validationResult(req).throw();
        } catch (error) {
            return res.status(422).send(error);
        }

        let group_id = req.params.group_id;
        req.body.group_id = group_id;
        const hotel = new HotelModel(req.body);
        try {
            let h = await hotel.save();
            res.status(200).send(h);
        } catch (error) {
            res.status(500).send(error);
        }

    });

module.exports = router;
