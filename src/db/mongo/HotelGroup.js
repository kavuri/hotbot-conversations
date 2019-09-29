/* Copyright (C) Kamamishu Pvt. Ltd. - All Rights Reserved
 * Unauthorized copying of this file, via any medium is strictly prohibited
 * Proprietary and confidential
 */
'use strict';

var _ = require('lodash'),
    Fuse = require('fuse.js'),
    mongoose = require('mongoose');

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
   }, {timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }});

module.exports = mongoose.model('HotelGroup', HotelGroupSchema);