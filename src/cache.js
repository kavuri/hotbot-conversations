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
            graph = await GraphModel.findOne({ value: key }).lean().exec();
        } catch (error) {
            throw KamError.DBError('error getting hotel info:', key);
        }

        // Store this graph to cache
        cache.set(key, graph);
    }

    // Return the graph
    return graphlib.json.read(graph);
}
module.exports.setArray = async function (keyValues) {
    cache.mset(keyValues);
}