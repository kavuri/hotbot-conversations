/* Copyright (C) Kamamishu Pvt. Ltd. - All Rights Reserved
 * Unauthorized copying of this file, via any medium is strictly prohibited
 * Proprietary and confidential
 */

'use strict';
var express = require('express');
var router = express.Router();

const HotelModel = require('../../src/db').HotelModel,
      _ = require('lodash'),
      { check, validationResult } = require('express-validator');

/**
 * @returns all hotels
 */
router.get('/', async function(req, res) {
    console.log('get all hotel');

    try {
        let hotels = await HotelModel.find({}).sort({last_reset: -1}).exec();
        console.log(hotels);
        return res.status(200).send(hotels);
    } catch (error) {
        console.log('error in getting all devices.', error);
        return res.status(400).send(error);
    }
});

module.exports = router;