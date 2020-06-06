/* Copyright (C) Kamamishu Pvt. Ltd. - All Rights Reserved
 * Unauthorized copying of this file, via any medium is strictly prohibited
 * Proprietary and confidential
 */
'use strict';

var _ = require('lodash'),
    mongoose = require('mongoose'),
    DBConn = require('./index').DBConn;

var GraphSchema = new mongoose.Schema({
    value: { type: String, required: true, index: true },
    nodes: [{ _id: false, v: String, value: mongoose.Schema.Types.Mixed }],
    edges: [{ _id: false, v: String, w: String, value: mongoose.Schema.Types.Mixed }]
}, { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }, strict: false });

GraphSchema.index({ 'nodes.v': 1 }, { unique: true });
GraphSchema.index({ 'edges.v': 1, 'edges.w': 1 }, { unique: true });

console.log('created graph');
module.exports = DBConn.model('Graph', GraphSchema);
