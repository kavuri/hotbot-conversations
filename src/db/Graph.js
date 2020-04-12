/* Copyright (C) Kamamishu Pvt. Ltd. - All Rights Reserved
 * Unauthorized copying of this file, via any medium is strictly prohibited
 * Proprietary and confidential
 */
'use strict';

var _ = require('lodash'),
    mongoose = require('mongoose'),
    DBConn = require('./index').DBConn;

var GraphSchema = new mongoose.Schema({
    value: { type: String, required: true, index: true }
}, { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }, strict: false });

module.exports = DBConn.model('Graph', GraphSchema);
