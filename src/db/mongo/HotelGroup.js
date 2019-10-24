/* Copyright (C) Kamamishu Pvt. Ltd. - All Rights Reserved
 * Unauthorized copying of this file, via any medium is strictly prohibited
 * Proprietary and confidential
 */
'use strict';

var _ = require('lodash'),
    mongoose = require('mongoose'),
    DBConn = require('./index').DBConn,
    AutoIncrement = require('./index').AutoIncrement;

var HotelGroupSchema = new mongoose.Schema({
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
        phone1: String,
        phone2: String,
        email1: String
    }
   }, {timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }, strict: false});

HotelGroupSchema.index({group_id: 1}, {unique: true});
HotelGroupSchema.index({name: 1}, {unique: true});

HotelGroupSchema.plugin(AutoIncrement.plugin, {
    model: 'HotelGroup',
    field: 'group_id',
    startAt: 100,
    incrementBy: 1
});

module.exports = DBConn.model('HotelGroup', HotelGroupSchema);
