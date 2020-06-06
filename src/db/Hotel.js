/* Copyright (C) Kamamishu Pvt. Ltd. - All Rights Reserved
 * Unauthorized copying of this file, via any medium is strictly prohibited
 * Proprietary and confidential
 */
'use strict';

const _ = require('lodash'),
    mongoose = require('mongoose'),
    DBConn = require('./index').DBConn,
    AutoIncrement = require('./index').AutoIncrement,
    GraphModel = require('./Graph'),
    graph = require('../utils/graph');

const HotelSchema = new mongoose.Schema({
    hotel_id: { type: String, required: true, unique: true },
    name: { type: String, required: true, unique: true },
    description: String,
    group_id: { type: String, required: true, unique: true },
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
    coordinates: {
        lat: { type: String, required: true },
        lng: { type: String, required: true }
    },
    rooms: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Room' }],
    front_desk_count: Number,
    reception_number: String
}, { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }, strict: false });

HotelSchema.index({ hotel_id: 1 }, { unique: true });
HotelSchema.index({ group_id: 1 }, { unique: 1 });
HotelSchema.index({ hotel_id: 1, group_id: 1 }, { unique: true });

HotelSchema.plugin(AutoIncrement.plugin, {
    model: 'Hotel',
    field: 'hotel_id',
    startAt: 1,
    incrementBy: 1
});

HotelSchema.post('save', async (doc) => {
    let json = graph.create(doc);
    let g = new GraphModel(json);
    try {
        // Save the graph to the database
        let data = await g.save();
    } catch (error) {
        console.log('error in storing graph:', error);
        throw error;
    }
});

console.log('created hotel ');

module.exports = DBConn.model('Hotel', HotelSchema);
