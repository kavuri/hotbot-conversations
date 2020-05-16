/* Copyright (C) Kamamishu Pvt. Ltd. - All Rights Reserved
 * Unauthorized copying of this file, via any medium is strictly prohibited
 * Proprietary and confidential
 */
'use strict';

var express = require('express');
var router = express.Router();
const auth0 = require('../lib/auth0');
const CheckinCheckoutModel = require('../../src/db/CheckinCheckout'),
    RoomModel = require('../../src/db/Room'),
    _ = require('lodash'),
    { check, validationResult } = require('express-validator');

/**
 * Creates a room
 * @param hotel_id
 * @returns created room
 */
router.post('/',
    auth0.authorize('create:hotel'),
    [
        check('hotel_id').exists({ checkNull: true, checkFalsy: true }),
        check('room_no').exists({ checkNull: true, checkFalsy: true }),
        check('type').exists({ checkNull: true, checkFalsy: true }),
    ],
    async function (req, res) {
        try {
            validationResult(req).throw();
        } catch (error) {
            return res.status(422).send(error);
        }

        const room = new RoomModel({
            hotel_id: req.query.hotel_id,
            room_no: req.body.room_no,
            type: req.body.type,
            checkincheckout: null
        });

        try {
            // Find the room corresponding to the hotel_id and room
            let r = await room.save();
            return res.status(200).send(r);
        } catch (error) {
            console.log('error in checkin of guest.', error);
            res.status(500).send(error);
        }
    });

/**
 * Gets all rooms for admin. This is an Admin API
 * @param hotel_id
 * @returns created room
 */
router.get('/admin/',
    [
        check('hotel_id').exists({ checkNull: true, checkFalsy: true }),
    ],
    auth0.authorize('read:room'),
    async function (req, res) {
        try {
            validationResult(req).throw();
        } catch (error) {
            return res.status(422).send(error);
        }

        const hotel_id = req.query.hotel_id;
        try {
            // Find the room corresponding to the hotel_id and room
            let rooms = await RoomModel
                .find({ hotel_id: hotel_id })
                .populate('checkincheckout')
                .exec();
            return res.status(200).send(rooms);
        } catch (error) {
            console.log('error in checkin of guest.', error);
            res.status(500).send(error);
        }
    });

/**
 * Gets all rooms
 * @returns created room
 */
router.get('/',
    auth0.authorize('read:room'),
    async function (req, res) {
        try {
            validationResult(req).throw();
        } catch (error) {
            return res.status(422).send(error);
        }

        const hotel_id = req.user.app_metadata.hotel_id;
        try {
            // Find the room corresponding to the hotel_id and room
            let rooms = await RoomModel
                .find({ hotel_id: hotel_id })
                .populate('checkincheckout')
                .exec();
            return res.status(200).send(rooms);
        } catch (error) {
            console.log('error in checkin of guest.', error);
            res.status(500).send(error);
        }
    });

/**
 * Update attribubtes of a room
 */
router.patch('/:_id',
    auth0.authorize('update:room'),
    [
        check('_id').exists({ checkNull: true, checkFalsy: true }),
    ],
    async function (req, res) {

        try {
            validationResult(req).throw();
        } catch (error) {
            return res.status(422).send(error);
        }

        let _id = req.params._id;
        let obj = {};
        obj = { type: req.body.type } ? { ...obj, type: req.body.type } : obj;

        try {
            let room = await RoomModel
                .findByIdAndUpdate(_id, { $set: obj }, { new: true, upsert: true })
                .exec();

            // Send the result
            res.status(200).send(room);
        } catch (error) {
            console.log('error in updating room:', error);
            res.status(500).send(error);
        }
    });

/**
 * Checks-in a guest
 * @param hotel_id
 * @param room_no
 * @returns check-in details
 */
router.post('/:room_no/checkin',
    auth0.authorize('create:checkin'),
    [
        check('room_no').exists({ checkNull: true, checkFalsy: true }),
        check('guestNumber').exists({ checkNull: true, checkFalsy: true }),
        check('guestName').exists({ checkNull: true, checkFalsy: true })
    ],
    async function (req, res) {
        try {
            validationResult(req).throw();
        } catch (error) {
            return res.status(422).send(error);
        }

        const hotel_id = req.user.app_metadata.hotel_id,
            room_no = req.params.room_no,
            guestName = req.body.guestName,
            guestNumber = req.body.guestNumber;
        console.log('checkin in guest ' + guestName, ',' + guestNumber);
        try {
            // Find the room corresponding to the hotel_id and room
            let room = await RoomModel.findOne({ hotel_id: hotel_id, room_no: room_no }).exec();
            if (_.isUndefined(room) || _.isNull(room)) {
                // No such room
                return res.status(404).send({ error: 'no such room in hotel=' + hotel_id + ', room_no=' + room_no });
            }
            const checkin = new CheckinCheckoutModel({
                hotel_id: hotel_id,
                room_no: room_no,
                guestName: guestName,
                guestNumber: guestNumber
            });

            let cin = await checkin.save();

            // Update the room object
            await RoomModel.findOneAndUpdate({ hotel_id: hotel_id, room_no: room_no }, { $set: { checkincheckout: cin } }).exec();

            console.log('guest ' + checkin.guestNumber + ' checked in:', cin);
            return res.status(200).send(cin);
        } catch (error) {
            console.log('error in checkin of guest.', error);
            res.status(500).send(error);
        }
    });

/**
 * Checkout a guest
 * @param hotel_id
 * @param room_no
 * @returns check-out details
 */
router.post('/:room_no/checkout',
    auth0.authorize('create:checkin'),
    [
        check('room_no').exists({ checkNull: true, checkFalsy: true })
    ],
    async function (req, res) {
        try {
            validationResult(req).throw();
        } catch (error) {
            return res.status(422).send(error);
        }

        const hotel_id = req.user.app_metadata.hotel_id,
            room_no = req.params.room_no;
        try {
            // Find the room corresponding to the hotel_id and room
            const filter = { hotel_id: hotel_id, room_no: room_no, checkout: null };
            console.log('filter=', filter);
            let room = await CheckinCheckoutModel.findOne(filter).exec();
            if (_.isUndefined(room) || _.isNull(room)) {
                // No checkin done for hotel_id and room_no
                return res.status(404).send({ error: 'no checkin done for hotel_id=' + hotel_id + ', room_no=' + room_no });
            }

            room.checkout = new Date();
            let cout = await room.save();
            console.log('guest ' + cout + ' checked in');
            return res.status(200).send(cout);
        } catch (error) {
            console.log('error in checkin of guest.', error);
            res.status(500).send(error);
        }
    });

module.exports = router;