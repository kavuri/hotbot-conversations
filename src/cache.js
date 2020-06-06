/* Copyright (C) Kamamishu Pvt. Ltd. - All Rights Reserved
 * Unauthorized copying of this file, via any medium is strictly prohibited
 * Proprietary and confidential
 */

'use strict';

const NodeCache = require("node-cache");
const cache = new NodeCache({ checkperiod: 0 });
const _ = require('lodash');
const KamError = require('./utils/KamError');
const GraphModel = require('./db/Graph');
const graphlib = require('graphlib');

const itemChangeListener = () => {
    console.log('watching for changes in items...');
    //GraphModel.watch({ fullDocument: 'updateLookup' }).on('change', async (data) => {
    GraphModel.watch().on('change', async (data) => {
        //console.log('item changed:', JSON.stringify(data));

        if (_.isUndefined(data.fullDocument)) return;

        const hotel_id = data.fullDocument.value;
        console.log('graph data changed..updating cache for hotel_id:', hotel_id, ', for operation=', data.operationType);
        if (_.isEqual(data.operationType, 'delete')) {
            cache.del(hotel_id);
        } else if (_.isEqual(data.operationType, 'insert') || _.isEqual(data.operationType, 'update') || _.isEqual(data.operationType, 'replace')) {
            cache.set(hotel_id, data.fullDocument);
        }
    });

    GraphModel.watch().on('close', () => {
        // TODO: Underlying connection is closed. Do something
    });

    GraphModel.watch().on('error', () => {
        // TODO: Error with underlying connection. Do something
    });
}

// Register the item listener
//itemChangeListener();

/**
 * Method invoked by the API server whenever an item is changed in the UI
 * Reload the graph from the database whenever an item for the corresponding hotel (key) is changed
 * @param {any} key the hotel_id of the graph
 */
module.exports.itemChanged = async (key) => {
    console.log('item ' + key + ' has changed');
    let graph;
    try {
        let g = await GraphModel.findOne({ value: key }).lean().exec();
        graph = graphlib.json.read(g);
        console.log('graph updated with the change:', graph.nodeCount());
    } catch (error) {
        throw KamError.DBError('error getting hotel info:', key);
    }

    // Store this graph to cache
    cache.set(key, graph);
}

module.exports.set = async function (key, value) {
    cache.set(key, value);
}

module.exports.get = async function (key) {
    if (_.isUndefined(key)) {
        throw new KamError.InputError('invalid input. key=' + key);
    }

    let graph = cache.get(key);
    if (_.isUndefined(graph)) {
        // Item does not exist in cache. Retrieve from database
        try {
            let g = await GraphModel.findOne({ value: key }).lean().exec();
            graph = graphlib.json.read(g);
        } catch (error) {
            throw KamError.DBError('error getting hotel info:', key);
        }

        // Store this graph to cache
        cache.set(key, graph);
    }

    //console.log(graph);
    // Return the graph
    return graph;
}

module.exports.del = async (key) => {
    console.log('^^^^ DELETING ^^^^', key);
    cache.del(key);
}

module.exports.setArray = async function (keyValues) {
    cache.mset(keyValues);
}