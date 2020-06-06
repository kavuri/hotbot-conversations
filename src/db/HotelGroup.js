/* Copyright (C) Kamamishu Pvt. Ltd. - All Rights Reserved
 * Unauthorized copying of this file, via any medium is strictly prohibited
 * Proprietary and confidential
 */
'use strict';

const _ = require('lodash'),
    mongoose = require('mongoose'),
    DBConn = require('./index').DBConn,
    AutoIncrement = require('./index').AutoIncrement

const HotelGroupSchema = new mongoose.Schema({
    name: {type: String, required: true, index: true},
    description: String,
    group_id: {type: String, required: true, unique: true},
    hotels: [{type: mongoose.Schema.Types.ObjectId, ref: 'Hotel'}],
    address: {
        address1: String,
        address2: String,
        address3: String,
        city: String,
        pin: String,
        state: String,
        country: String
    },
    contact: {
        phone: [String],
        email: [String]
    },
    status: {type: String, enum: ['active', 'inactive'], default: 'active'}
   }, {timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }, strict: false});

HotelGroupSchema.index({group_id: 1}, {unique: true});
HotelGroupSchema.index({name: 1}, {unique: true});

HotelGroupSchema.plugin(AutoIncrement.plugin, {
    model: 'HotelGroup',
    field: 'group_id',
    startAt: 1,
    incrementBy: 1
});

console.log('created hotelGroup');
module.exports = DBConn.model('HotelGroup', HotelGroupSchema);
