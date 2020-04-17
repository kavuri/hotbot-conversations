/* Copyright (C) Kamamishu Pvt. Ltd. - All Rights Reserved
 * Unauthorized copying of this file, via any medium is strictly prohibited
 * Proprietary and confidential
 */
'use strict';

const express = require('express');
const router = express.Router();
const auth0 = require('../lib/auth0');
const cache = require('../../src/cache');
const graphlib = require('graphlib');
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
            let graph = await GraphModel.findOne({ value: hotel_id }).lean().exec();

            let g = graphlib.json.read(graph);

            // Get all nodes, create a structure and send it out
            let nodes = g.nodes();
            let data = [];
            console.log('node count=', nodes.length);
            for (var i = 0; i < nodes.length; i++) {
                let n = g.node(nodes[i]);
                // console.log('node=', nodes[i], '++n=', n);
                n = {
                    ...n,
                    name: nodes[i],
                    synonyms: _.isUndefined(g.children(nodes[i])) || _.isEmpty(g.children(nodes[i])) ? [] : g.children(nodes[i])
                };
                data.push(n);
            }
            res.status(200).send(data);
        } catch (error) {
            console.error('error in getting hotel data:', hotel_id, error);
            res.status(500).send(error);
        }
    });

/**
 * Creates a new node
 */
router.post('/',
    //auth0.authenticate,
    //auth0.authorize('read:device'),
    [
        check('hotel_id').exists({ checkNull: true, checkFalsy: true }).custom(value => { return !_.isEqual(value, 'undefined'); }),
        check('name').exists({ checkNull: true, checkFalsy: true }),
        check('a').exists({ checkNull: true, }),
    ],
    async function (req, res) {
        try {
            validationResult(req).throw();
        } catch (error) {
            return res.status(422).send(error);
        }

        let hotel_id = req.query.hotel_id;
        let item = req.body;
        let name = _.get(item, 'name'), synonyms = _.get(item, 'synonyms');
        console.log('hotel_id=', hotel_id, ',graph=', item);
        item = _.omit(item, ['synonyms', 'name']);
        try {
            let u = await GraphModel
                .updateOne({ value: hotel_id, 'nodes.v': { $ne: name } }, { $addToSet: { nodes: { v: name, value: item } } })
                .exec();
            console.log('node=', JSON.stringify(u));

            // Update all the children of this node
            // console.log('synonyms=', synonyms);
            for (let i = 0; i < synonyms.length; i++) {
                let s = await GraphModel
                    .updateOne({ value: hotel_id, 'nodes.v': { $ne: synonyms[i] } }, { $addToSet: { nodes: { v: synonyms[i], parent: name } } })
                    .exec();
            }
            res.status(200).send(u);
        } catch (error) {
            console.error('error in getting hotel data:', hotel_id, error);
            res.status(500).send(error);
        }
    });

/**
 * This function creates a dot notation for an object. Useful for setting the specific attributes
 * @param {*} obj 
 * @param {*} prefix 
 */
function flattenFlip(obj, prefix) {
    var data = {};

    function dive(obj_, path) {
        var keys = Object.keys(obj_);
        for (var i = 0; i < keys.length; i++) {
            var type = obj_[keys[i]].constructor;
            if (type === Object || type === Array) {
                dive(obj_[keys[i]], path + keys[i] + '.');
                continue;
            }

            data[obj_[keys[i]]] = path + keys[i];
        }
    }

    dive(obj, prefix ? prefix + '.' : '');
    return data;
}

/**
 * Patches a graph with a single change (without synonym)
 * @param hotel_id
 * @param node to update
 * @returns None
 */
router.put('/',
    //auth0.authenticate,
    //auth0.authorize('read:device'),
    [
        check('hotel_id').exists({ checkNull: true, checkFalsy: true }).custom(value => { return !_.isEqual(value, 'undefined'); }),
        check('name').exists({ checkNull: true, checkFalsy: true }),
    ],
    async function (req, res) {
        try {
            validationResult(req).throw();
        } catch (error) {
            return res.status(422).send(error);
        }

        let hotel_id = req.query.hotel_id;
        let item = req.body;
        let name = _.get(item, 'name');
        console.log('hotel_id=', hotel_id, ',graph=', item);
        item = _.omit(item, ['synonyms', 'name']);
        // Set the specific keys in the object that are to be updated
        let flatten = flattenFlip(item);
        let setObj = {};
        console.log('Flattened=', flatten);
        Object.keys(flatten).map(k => { setObj['nodes.$.value.' + flatten[k]] = k; });
        console.log('+++setObj=', setObj);
        try {
            let u = await GraphModel
                .findOneAndUpdate({ value: hotel_id, 'nodes.v': name }, { $set: setObj }, { upsert: true, fields: { 'nodes.$': 1 } })
                .exec();
            console.log('node=', JSON.stringify(u));
            res.status(200).send(u);
        } catch (error) {
            console.error('error in getting hotel data:', hotel_id, error);
            res.status(500).send(error);
        }
    });

/**
 * Adds synonyms to the graph
 * @param hotel_id
 * @param graph object
 * @returns None
 */
router.post('/synonym',
    //auth0.authenticate,
    //auth0.authorize('read:device'),
    [
        check('hotel_id').exists({ checkNull: true, checkFalsy: true }).custom(value => { return !_.isEqual(value, 'undefined'); }),
        check('parent').exists({ checkNull: true, checkFalsy: true }),
        check('synonym').exists({ checkNull: true, checkFalsy: true }),
    ],
    async function (req, res) {
        try {
            validationResult(req).throw();
        } catch (error) {
            return res.status(422).send(error);
        }

        let hotel_id = req.query.hotel_id;
        let parent = _.get(req.body, 'parent'), synonym = _.get(req.body, 'synonym');
        console.log('hotel_id=', hotel_id, ',graph=', req.body);
        try {
            let s = await GraphModel
                .updateOne({ value: hotel_id, 'nodes.v': { $ne: synonym } }, { $addToSet: { nodes: { v: synonym, parent: parent } } })
                .exec();
            res.status(200).send({ parent: parent, v: synonym });
        } catch (error) {
            console.error('error in getting hotel data:', hotel_id, error);
            res.status(500).send(error);
        }
    });

/**
 * Removes synonym from the graph
 * @param hotel_id
 * @param synonym
 * @returns None
 */
router.delete('/synonym',
    //auth0.authenticate,
    //auth0.authorize('read:device'),
    [
        check('hotel_id').exists({ checkNull: true, checkFalsy: true }).custom(value => { return !_.isEqual(value, 'undefined'); }),
        check('parent').exists({ checkNull: true, checkFalsy: true }),
        check('synonym').exists({ checkNull: true, checkFalsy: true }),
    ],
    async function (req, res) {
        try {
            validationResult(req).throw();
        } catch (error) {
            return res.status(422).send(error);
        }

        let hotel_id = req.query.hotel_id;
        let parent = _.get(req.body, 'parent'), synonym = _.get(req.body, 'synonym');
        console.log('hotel_id=', hotel_id, ',graph=', req.body);
        try {
            let s = await GraphModel
                .updateOne({ value: hotel_id }, { $pull: { nodes: { v: synonym } } })
                .exec();
            res.status(200).send({ v: synonym });
        } catch (error) {
            console.error('error in getting hotel data:', hotel_id, error);
            res.status(500).send(error);
        }
    });

module.exports = router;