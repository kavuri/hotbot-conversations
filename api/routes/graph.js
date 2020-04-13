/* Copyright (C) Kamamishu Pvt. Ltd. - All Rights Reserved
 * Unauthorized copying of this file, via any medium is strictly prohibited
 * Proprietary and confidential
 */
'use strict';

const express = require('express');
const router = express.Router();
const auth0 = require('../lib/auth0');

const GraphModel = require('../../src/db/Graph'),
    _ = require('lodash'),
    { check, validationResult } = require('express-validator');

/**
 * Gets a graph given a hotel id
 * @param hotel_id
 * @returns The graph for the hotel
 */
router.get('/',
    //auth0.authenticate,
    //auth0.authorize('read:device'),   //FIXME: Remove hotel from arg when auth is implemented. Get it from session token
    [
        check('hotel_id').exists({ checkNull: true, checkFalsy: true }).custom(value => { return !_.isEqual(value, 'undefined'); })
    ],
    async function (req, res) {
        try {
            validationResult(req).throw();
        } catch (error) {
            return res.status(422).send(error);
        }

        let hotel_id = req.query.hotel_id;
        console.log('getting graph for ' + hotel_id);
        try {
            let graph = await GraphModel
                .findOne({ value: hotel_id })
                .lean()
                .exec();
            res.status(200).send(graph);
        } catch (error) {
            console.error('error in getting hotel data:', hotel_id, error);
            res.status(500).send(error);
        }
    });

/**
 * Patches a graph with a single change
 * FIXME: Too expensive to commit the whole graph for a single change
 * @param hotel_id
 * @param graph object
 * @returns None
 */
router.put('/',
    //auth0.authenticate,
    //auth0.authorize('read:device'),
    [
        check('hotel_id').exists({ checkNull: true, checkFalsy: true }).custom(value => { return !_.isEqual(value, 'undefined'); }),
        check('graph').exists({ checkNull: true, checkFalsy: true }).custom(value => { return !_.isEqual(value, 'undefined'); })
    ],
    async function (req, res) {
        try {
            validationResult(req).throw();
        } catch (error) {
            return res.status(422).send(error);
        }

        let hotel_id = req.query.hotel_id;
        let graph = req.body.graph;
        console.log('hotel_id=', hotel_id,',graph=',graph);
        console.log('Patching graph for ' + hotel_id);
        try {
            let g = await GraphModel
                .findOneAndUpdate({ value: hotel_id }, graph)
                .exec();
            res.status(200).send(g);
        } catch (error) {
            console.error('error in getting hotel data:', hotel_id, error);
            res.status(500).send(error);
        }
    });

module.exports = router;