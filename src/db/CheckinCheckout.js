/* Copyright (C) Kamamishu Pvt. Ltd. - All Rights Reserved
 * Unauthorized copying of this file, via any medium is strictly prohibited
 * Proprietary and confidential
 */

'using strict';

const mongoose = require('mongoose'),
    DBConn = require('./index').DBConn,
    Room = require('./Room'),
    _ = require('lodash');

const CheckinCheckoutSchema = new mongoose.Schema({
    hotel_id: { type: String, required: true },
    room_no: { type: String, required: true },
    checkin: { type: Date, required: true, default: Date.now },
    checkout: { type: Date },
    guestName: { type: String },
    guestNumber: { type: String, required: true },
    orders: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Order' }]
});

CheckinCheckoutSchema.post('save', async (doc) => {
    // If doc.checkout === null, its a check-in
    // If doc.checkout !== null, its a check-out
    let ref = null;
    if (_.isNull(doc.checkout) || _.isUndefined(doc.checkout)) {
        // Add reference of doc to room.checkincheckout
        ref = doc;
    }
    await Room.findOneAndUpdate({ hotel_id: doc.hotel_id, room_no: doc.room_no }, { $set: { checkincheckout: ref } }).exec();
});

CheckinCheckoutSchema.index({ hotel_id: 1 });

module.exports = DBConn.model('CheckinCheckout', CheckinCheckoutSchema);