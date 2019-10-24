/* Copyright (C) Kamamishu Pvt. Ltd. - All Rights Reserved
 * Unauthorized copying of this file, via any medium is strictly prohibited
 * Proprietary and confidential
 */

'use strict';

var _ = require('lodash'),
    mongoose = require('mongoose'),
    DBConn = require('./index').DBConn;

/**
 * Table schema
 * Partition key=device_id, sort key=hotel_id
 */

var AuditLogSchema = new mongoose.Schema({
    coll: {type: String, required: true, index: true},
    change: {type: String, required: true, enum: ['created', 'updated', 'deleted']},
    by: String,
    obj: {type: mongoose.Schema.Types.Mixed, required: true}
}, {timestamps: {createdAt: 'created_at'}, strict: false});

AuditLogSchema.index({coll: 1, change: 1});

module.exports = DBConn.model('AuditLog', AuditLogSchema);