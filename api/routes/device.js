/* Copyright (C) Kamamishu Pvt. Ltd. - All Rights Reserved
 * Unauthorized copying of this file, via any medium is strictly prohibited
 * Proprietary and confidential
 */
'use strict';

const express = require('express');
const router = express.Router();
const auth0 = require('../lib/auth0');

const DeviceModel = require('../../src/db/Device'),
    HotelModel = require('../../src/db/Hotel'),
    RoomModel = require('../../src/db/Room'),
    _ = require('lodash'),
    { check, validationResult } = require('express-validator');

/**
 * @param hotel_id
 * @returns all devices in that hotel
 */
router.get('/',
    //auth0.authenticate,
    //auth0.authorize('read:device'),
    [
        check('hotel_id').exists({ checkNull: true, checkFalsy: true })
    ],
    async function (req, res) {
        console.log('get all devices.', req.query.hotel_id);
        try {
            validationResult(req).throw();
        } catch (error) {
            return res.status(422).send(error);
        }

        let hotel_id = req.query.hotel_id;
        try {
            let devices = await DeviceModel.find({hotel_id: hotel_id}).populate('belongs_to').populate('room').exec();
            // console.log(devices);
            return res.status(200).send(devices);
        } catch (error) {
            console.log('error in getting all devices.', error);
            return res.status(400).send(error);
        }
    });

/**
 * @param hotel_id
 * @param device_id
 * @returns device object
 */
router.put('/:device_id/activate',
    //auth0.authenticate,
    //auth0.authorize('create:device'),
    [
        check('hotel_id').exists({ checkNull: true, checkFalsy: true }),
        check('device_id').exists({ checkNull: true, checkFalsy: true })
    ],
    async function (req, res) {
        console.log('activating device ' + req.params.device_id, req.query.room);

        try {
            validationResult(req).throw();
        } catch (error) {
            return res.status(422).send(error);
        }

        let device_id = req.params.device_id;
        try {
            await DeviceModel.updateOne({ device_id: device_id }, { $set: { status: 'active', room: req.query.room } });
            console.log('device activated.');
            return res.status(200).send({ device_id: device_id, activated: true });
        } catch (error) {
            console.log('error in activating device.', error);
            res.status(500).send(error);
        }
    });

/**
 * @param hotel_id
 * @param device_id
 * @returns deactivated device object
 */
router.put('/:device_id/deactivate',
    auth0.authenticate,
    auth0.authorize('create:device'),
    [
        check('hotel_id').exists({ checkNull: true, checkFalsy: true }),
        check('device_id').exists({ checkNull: true, checkFalsy: true })
    ],
    async function (req, res) {
        console.log('de-activating device ' + req.params.device_id);

        let device_id = req.params.device_id;
        try {
            await DeviceModel.updateOne({ device_id: device_id }, { $set: { status: 'inactive' } });
            console.log('device deactivated.');
            return res.status(200).send({ device_id: device_id, deactivated: true });
        } catch (error) {
            console.log('error in deactivating device.', error);
            res.status(500).send(error);
        }
    });

/**
 * @param hotel_id
 * @param device_id
 * @param room_no
 * @returns updated device object
 */
router.put('/:device_id',
    // auth0.authenticate,
    // auth0.authorize('create:device'),
    [
        check('hotel_id').exists({ checkNull: true, checkFalsy: true }),
        check('device_id').exists({ checkNull: true, checkFalsy: true }),
        check('room_no').exists({ checkNull: true, checkFalsy: true })
    ],
    async function (req, res) {
        console.log('adding device ' + req.params.device_id + ' to hotel ' + req.body.hotel_id, req.body.room, req.body.status);

        try {
            validationResult(req).throw();
        } catch (error) {
            return res.status(422).send(error);
        }

        let device_id = req.params.device_id, hotel_id = req.body.hotel_id, status = req.body.status, room_no = req.body.room_no;

        try {
            // Get hotel object
            let hotel = await HotelModel.findOne({ hotel_id: hotel_id }).exec();
            if (_.isNull(hotel) || _.isUndefined(hotel)) {
                return res.status(400).send('hotel with id ' + hotel_id + ' not found');
            }

            // Find the room corresponding to the room_no and hotel_id
            let room = await RoomModel.findOne({ hotel_id: hotel_id, room_no: room_no }).exec();
            if (_.isUndefined(room) || _.isNull(room)) {
                return res.status(500).send({ error: 'room with hotel_id=' + hotel_id + ',room_no=' + room_no + ' not found' });
            }

            // Update the device
            await DeviceModel.updateOne({ device_id: device_id }, { $set: { hotel_id: hotel_id, room_no: room_no, belongs_to: hotel, room: room, status: status } });
            return res.status(200).send({ device_id: device_id });
        } catch (error) {
            console.log('error in adding device to hotel.', error);
            res.status(500).send(error);
        }
    });

module.exports = router;
