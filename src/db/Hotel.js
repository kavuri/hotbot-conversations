/* Copyright (C) Kamamishu Pvt. Ltd. - All Rights Reserved
 * Unauthorized copying of this file, via any medium is strictly prohibited
 * Proprietary and confidential
 */
'use strict';

const _ = require('lodash'),
    mongoose = require('mongoose'),
    DBConn = require('./index').DBConn,
    AutoIncrement = require('./index').AutoIncrement;

const HotelSchema = new mongoose.Schema({
    hotel_id: {type: String, required: true, unique: true},
    name: {type: String, required: true, index: true},
    description: String,
    group_id: {type: String, required: true, unique: true, ref:'HotelGroup'},
    info: {
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
        },
        coordinates: {
            lat: {type: String, required: true},
            lng: {type: String, required: true}
        },
        front_desk_count: Number,
        room_count: Number,
        reception_number: String
    }
   }, {timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }, strict: false});

HotelSchema.index({hotel_id: 1});
HotelSchema.index({name: 1});
HotelSchema.index({group_id: 1});

HotelSchema.plugin(AutoIncrement.plugin, {
    model: 'Hotel',
    field: 'hotel_id',
    startAt: 100,
    incrementBy: 1
});

module.exports = DBConn.model('Hotel', HotelSchema);
