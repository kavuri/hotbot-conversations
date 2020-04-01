/* Copyright (C) Kamamishu Pvt. Ltd. - All Rights Reserved
 * Unauthorized copying of this file, via any medium is strictly prohibited
 * Proprietary and confidential
 */

'using strict';

const mongoose = require('mongoose'),
    DBConn = require('./index').DBConn,
    DeviceModel = require('./Device'),
    CheckinCheckout = require('./CheckinCheckout');

const RoomSchema = new mongoose.Schema({
    hotel_id: { type: String, required: true, index: true },
    room_no: { type: String, required: true, unique: true },
    type: { type: String }, // room type, like Deluxe, Standard, Executive etc. For future
    device: { type: mongoose.Schema.Types.ObjectId, ref: 'Device' },
    checkincheckout: { type: mongoose.Schema.Types.ObjectId, ref: 'CheckinCheckout' } // 'null' if room is not assigned, else refers to the current check-in object
});

RoomSchema.index({ hotel_id: 1, room_no: 1 }, { unique: true });

module.exports = DBConn.model('Room', RoomSchema);
