/* Copyright (C) Kamamishu Pvt. Ltd. - All Rights Reserved
 * Unauthorized copying of this file, via any medium is strictly prohibited
 * Proprietary and confidential
 */
'use strict';

const express = require('express');
const router = express.Router();
const auth0 = require('../lib/auth0');

const FacilityModel = require('../db/Facility'),
    _ = require('lodash'),
    { check, validationResult } = require('express-validator');

/**
 * @param hotel_id
 * @returns all devices in that hotel
 */
router.get('/',
    auth0.authenticate,
    auth0.authorize('read:facility'),
    [
        check('hotel_id').exists({ checkNull: true, checkFalsy: true }),
    ],
    async function (req, res) {
        try {
            validationResult(req).throw();
        } catch (error) {
            return res.status(422).send(error);
        }

        let hotel_id = req.query.hotel_id;
        try {
            let facilities = await FacilityModel.find({ hotel_id: hotel_id }).exec();
            console.log(facilities);
            return res.status(200).send(facilities);
        } catch (error) {
            console.log('error in getting all devices.', error);
            return res.status(400).send(error);
        }
    });

/**
 * @param hotel_id
 * @returns updated facility object
 */
router.put('/:facility_id',
    auth0.authenticate,
    auth0.authorize('update:facility'),
    [
        check('facility_id').exists({ checkNull: true, checkFalsy: true })
    ],
    async function (req, res) {
        console.log('updating facility ' + req.params.facility_id);

        try {
            validationResult(req).throw();
        } catch (error) {
            return res.status(422).send(error);
        }

        let facility_id = req.params.facility_id, u = req.body;

        try {
            // Update facility object
            await FacilityModel.update({ _id: facility_id }, { $set: u }).exec();

            return res.status(200).send({ facility_id: facility_id });
        } catch (error) {
            console.log('error in updating facility', facility_id);
            res.status(500).send(error);
        }
    });

module.exports = router;
