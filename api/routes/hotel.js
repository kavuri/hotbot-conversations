/* Copyright (C) Kamamishu Pvt. Ltd. - All Rights Reserved
 * Unauthorized copying of this file, via any medium is strictly prohibited
 * Proprietary and confidential
 */

'use strict';
const express = require('express');
const router = express.Router();
const auth0 = require('../lib/auth0');
const HotelModel = require('../../src/db/Hotel'),
    RoomModel = require('../../src/db/Room'),
    CheckinCheckout = require('../../src/db/CheckinCheckout'),
    _ = require('lodash'),
    { check, validationResult } = require('express-validator');

/**
 * @returns all hotels
 */
router.get('/',
    //auth0.authenticate,
    //auth0.authorize('read:hotel'),
    async function (req, res) {
        console.log('get all hotels');
        const resPerPage = parseInt(req.query.resPerPage || 9); // results per page
        const page = parseInt(req.query.page || 1); // Page 
        const group_id = req.query.group_id;

        let filter = {};
        if (!_.isUndefined(group_id)) {
            filter = { group_id: group_id };
        }

        try {
            let query = HotelModel.find(filter);
            let hotels = await query
                .skip((resPerPage * page) - resPerPage)
                .limit(resPerPage)
                .lean()
                .sort({ last_reset: -1 })
                .exec();
            let total = await query.countDocuments().exec();
            // console.log(hotels);
            return res.status(200).send({ data: hotels, total: total });
        } catch (error) {
            console.log('error in getting all hotels.', error);
            return res.status(400).send(error);
        }
    });

/**
 * Gets the details of a hotel
 */
router.get('/:hotel_id',
    // auth0.authenticate,
    // auth0.authorize('read:hotel'),
    [
        check('hotel_id').exists({ checkNull: true, checkFalsy: true }),
    ],
    async (req, res) => {
        try {
            validationResult(req).throw();
        } catch (error) {
            return res.status(422).send(error);
        }

        let hotel_id = req.params.hotel_id;
        try {
            let hotel = await HotelModel
                .findOne({ hotel_id: hotel_id })
                .populate('rooms')
                .populate({ path: 'rooms', populate: { path: 'device' } })
                .populate({ path: 'rooms', populate: { path: 'checkincheckout' } })
                .exec();
            console.log('hotel data=', JSON.stringify(hotel));
            res.status(200).send(hotel);
        } catch (error) {
            console.error('error in getting hotel data:', hotel_id, error);
            res.status(500).send(error);
        }
    });

router.post('/',
    //auth0.authenticate,
    //auth0.authorize('create:hotel'),
    [
        check('group_id').exists({ checkNull: true, checkFalsy: true }),
        check('name').exists({ checkNull: true, checkFalsy: true }),
        check('address').exists({ checkNull: true, checkFalsy: true }),
        check('contact').exists({ checkNull: true, checkFalsy: true }),
        check('coordinates').exists({ checkNull: true, checkFalsy: true }),
        check('front_desk_count').exists({ checkNull: true, checkFalsy: true }),
        check('reception_number').exists({ checkNull: true, checkFalsy: true })
    ],
    async function (req, res) {
        try {
            validationResult(req).throw();
        } catch (error) {
            return res.status(422).send(error);
        }

        let group_id = req.query.group_id;
        req.body.group_id = group_id;
        const hotel = new HotelModel(req.body);
        try {
            let h = await hotel.save();
            res.status(200).send(h);
        } catch (error) {
            res.status(500).send(error);
        }
    });

/**
 * Add a room to a hotel
 */
router.put('/:hotel_id',
    //auth0.authenticate,
    //auth0.authorize('create:hotel'),
    [
        check('hotel_id').exists({ checkNull: true, checkFalsy: true }),
        check('room_no').exists({ checkNull: true, checkFalsy: true }),
    ],
    async function (req, res) {

        try {
            validationResult(req).throw();
        } catch (error) {
            return res.status(422).send(error);
        }

        let hotel_id = req.params.hotel_id;
        let room = req.body;
        try {
            // Find the hotel so that reference to room can be made
            let hotel = await HotelModel.findOne({ hotel_id: hotel_id }).populate('rooms').exec();
            if (_.isUndefined(hotel) || _.isNull(hotel)) {
                return res.status(404).send({ error: 'hotel with id ' + hotel_id + ' not found' });
            }
            // Check if room_no has already been added to hotel
            room.hotel_id = hotel_id;

            if (!_.isEqual(_.findIndex(hotel.rooms, { room_no: room.room_no }), -1)) {
                // Room has already been added to the hotel. Do not add again
                return res.status(200).send(hotel);
            }

            // Create room object
            const r = new RoomModel(room);
            let ret = await r.save();

            // Update room to the hotel
            hotel.rooms.push(ret);
            hotel = await hotel.save();

            // Send the result
            res.status(200).send(hotel);
        } catch (error) {
            res.status(500).send(error);
        }
    });

/**
 * Update attribubtes of a hotel. The PUT method to update the room to a hotel can also be made part of this
 */
router.patch('/:_id',
    //auth0.authenticate,
    //auth0.authorize('create:hotel'),
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
        obj = { description: req.body.description } ? { ...obj, description: req.body.description } : obj;
        obj = { address: req.body.address } ? { ...obj, address: req.body.address } : obj;
        obj = { contact: req.body.contact } ? { ...obj, contact: req.body.contact } : obj;
        obj = { coordinates: req.body.coordinates } ? { ...obj, coordinates: req.body.coordinates } : obj;
        obj = { front_desk_count: req.body.front_desk_count } ? { ...obj, front_desk_count: req.body.front_desk_count } : obj;
        obj = { reception_number: req.body.reception_number } ? { ...obj, reception_number: req.body.reception_number } : obj;

        try {
            // Find the hotel so that reference to room can be made
            let hotel = await HotelModel
                .findByIdAndUpdate(_id, { $set: obj }, { new: true, upsert: true })
                .exec();

            // Send the result
            res.status(200).send(hotel);
        } catch (error) {
            console.log('error in updating hotel:', error);
            res.status(500).send(error);
        }
    });

module.exports = router;
