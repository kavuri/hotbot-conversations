/* Copyright (C) Kamamishu Pvt. Ltd. - All Rights Reserved
 * Unauthorized copying of this file, via any medium is strictly prohibited
 * Proprietary and confidential
 */

'using strict';

const mongoose = require('mongoose'),
    DBConn = require('./index').DBConn;

const RoomSchema = new mongoose.Schema({
    hotel_id: { type: String, required: true, index: true},
    room_no: { type: String, required: true, index: true },
    type: { type: String } // room type, like Deluxe, Standard, Executive etc. For future
});

var RoomModel = DBConn.model('Room', RoomSchema);

module.exports = RoomModel;
