/* Copyright (C) Kamamishu Pvt. Ltd. - All Rights Reserved
 * Unauthorized copying of this file, via any medium is strictly prohibited
 * Proprietary and confidential
 */

'using strict';

const mongoose = require('mongoose'),
    DBConn = require('./index').DBConn;

const CheckinCheckoutSchema = new mongoose.Schema({
    hotel_id: { type: String, required: true },
    room_no: { type: String, required: true },
    checkin: { type: Date, required: true, default: Date.now },
    checkout: { type: Date },
    guestName: { type: String },
    guestNumber: { type: String, required: true },
    orders: [{type: mongoose.Schema.Types.ObjectId, ref: 'Order'}]
});

var CheckinCheckoutModel = DBConn.model('CheckinCheckout', CheckinCheckoutSchema);

module.exports = CheckinCheckoutModel;