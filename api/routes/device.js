/* Copyright (C) Kamamishu Pvt. Ltd. - All Rights Reserved
 * Unauthorized copying of this file, via any medium is strictly prohibited
 * Proprietary and confidential
 */
 'use strict';
 
 var express = require('express');
 var router = express.Router();
 let authenticate = require('../auth');

 const DeviceModel = require('../../src/db').DeviceModel,
       HotelModel = require('../../src/db').HotelModel,
       _ = require('lodash'),
       { check, validationResult } = require('express-validator');

router.get('/', async function(req, res) {
    console.log('get all devices');
    try {
        let devices = await DeviceModel.find({status:'inactive'}).sort({last_reset: -1}).exec();
        console.log(devices);
        return res.status(200).send(devices);
    } catch (error) {
        console.log('error in getting all devices.', error);
        return res.status(400).send(error);
    }
});

router.put('/:device_id/activate', [
        check('device_id').exists()
        ],
        authenticate,
        async function(req, res, next) {
    console.log('activating device ' + req.params.device_id, req.query.room);

    try {
        validationResult(req).throw();
    } catch (error) {
        return res.status(422).send(error);
    }

    let device_id = req.params.device_id;
    try {
        await DeviceModel.updateOne({device_id: device_id}, { $set: { status: 'active', room: req.query.room} });
        console.log('device activated.');
        return res.status(200).send({device_id: device_id, activated: true});
    } catch (error) {
        console.log('error in activating device.', error);
        res.status(500).send(error);
    }
});

router.put('/:device_id/deactivate', [
        check('device_id').exists()
        ],
        authenticate,
        async function(req, res, next) {
    console.log('de-activating device ' + req.params.device_id);

    let device_id = req.params.device_id;
    try {
        await DeviceModel.updateOne({device_id: device_id}, { $set: { status: 'inactive' } });
        console.log('device deactivated.');
        return res.status(200).send({device_id: device_id, deactivated: true});
    } catch (error) {
        console.log('error in deactivating device.', error);
        res.status(500).send(error);
    }
});

router.put('/:device_id', [
        check('device_id').exists(),
        check('hotel_id').exists(),
        check('room').exists(),
        ],
        authenticate,
        async function(req, res) {
    console.log('adding device ' + req.params.device_id + ' to hotel ' + req.body.hotel_id, req.body.room, req.body.status);

    try {
        validationResult(req).throw();
    } catch (error) {
        return res.status(422).send(error);
    }

    let device_id = req.params.device_id, hotel_id = req.body.hotel_id, room = req.body.room, status = req.body.status;

    try {
        // Get hotel object
        let hotel = await HotelModel.findOne({hotel_id: hotel_id}).exec();
        if (_.isNull(hotel) || _.isUndefined(hotel)) {
            return res.status(400).send('hotel with id ' + hotel_id + ' not found');
        }

        // Update the device
        await DeviceModel.updateOne({device_id: device_id}, { $set: { hotel_id: hotel_id, belongs_to: hotel, room: room, status: status } });
        return res.status(200).send({device_id: device_id});
    } catch (error) {
        console.log('error in adding device to hotel.', error);
        res.status(500).send(error);
    }
});

module.exports = router;