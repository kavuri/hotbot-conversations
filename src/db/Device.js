/* Copyright (C) Kamamishu Pvt. Ltd. - All Rights Reserved
 * Unauthorized copying of this file, via any medium is strictly prohibited
 * Proprietary and confidential
 */

'use strict';

var _ = require('lodash'),
    mongoose = require('mongoose'),
    AuditLogModel = require('./AuditLog'),
    DBConn = require('./index').DBConn,
    HotelModel = require('../db/Hotel'),
    RoomModel = require('../db/Room');

/**
 * Table schema
 * Partition key=device_id, sort key=hotel_id
 */

var DeviceSchema = new mongoose.Schema({
    device_id: { type: String, required: true, index: true },
    hotel_id: { type: String, index: true }, // this is the "address1" field
    user_id: { type: String, required: true, index: true },
    room_no: String, // this is "address2" field
    status: { type: String, required: true, enum: ['inactive', 'active', 'disabled', 'new'], default: 'inactive' },
    belongs_to: { type: mongoose.Schema.Types.ObjectId, ref: 'Hotel' },
    room: { type: mongoose.Schema.Types.ObjectId, ref: 'Room' }
}, { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }, strict: false });

DeviceSchema.index({ device_id: 1, hotel_id: 1 }, { unique: true });

//Setup the middleware
DeviceSchema.post('save', async function (doc) {
    console.log('%%% Device save post hook.', doc);
    let audit = new AuditLogModel({
        coll: DeviceModel.collection.name,
        change: 'created',
        by: doc.user_id, // TODO: Get this user from 
        obj: doc
    });

    var log = await audit.save(audit);
});

DeviceSchema.post('updateOne', async function (doc) {
    const docToUpdate = await this.model.findOne(this.getQuery());

    let audit = new AuditLogModel({
        coll: DeviceModel.collection.name,
        change: 'updated',
        by: doc.user_id, // TODO: Get this user from 
        obj: docToUpdate
    });

    var log = await audit.save(audit);
    console.log(log);
});

DeviceSchema.post('remove', async function (doc) {
    console.log('Device removed. Should not happen', doc);

    let audit = new AuditLogModel({
        coll: DeviceModel.collection.name,
        change: 'deleted',
        by: doc.user_id, // TODO: Get this user from 
        obj: docToUpdate
    });

    var log = await audit.save(audit);
});

var DeviceModel = DBConn.model('Device', DeviceSchema);

module.exports = DeviceModel;