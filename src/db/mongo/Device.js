/* Copyright (C) Kamamishu Pvt. Ltd. - All Rights Reserved
 * Unauthorized copying of this file, via any medium is strictly prohibited
 * Proprietary and confidential
 */

'use strict';

var _ = require('lodash'),
    mongoose = require('mongoose');

/**
 * Table schema
 * Partition key=device_id, sort key=hotel_id
 */

var DeviceSchema = new mongoose.Schema({
     device_id: {type: String, required: true, index: true},
     user_id: {type: String, required: true, index: true},
     hotel_id: {type: String, required: true, index: true}, // this is the "address1" field
     room: {type: String, required: true}, // this is "address2" field
     address3: String,
     coordinates: {
       lat: {type: String, required: true},
       lng: {type: String, required: true}
     },
     status: { type: String, required: true, enum: ['inactive', 'active', 'disabled'], default: 'inactive' },
     last_reset: { type: Date, default: Date.now }
}, {timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }});

DeviceSchema.index({device_id: 1, hotel_id: 1, user_id: 1}, {unique: true});

module.exports = mongoose.model('Device', DeviceSchema);

const test = async function() {

    var mongo = require('../../mongo.js');
    mongo();
    
    const device = {
        device_id: "104",
        hotel_id: "101", // this is the "address1" field
        room: "101", // this is "address2" field
        user_id: "123",
        address3: "nothing",
        status: 'active', // active
        coordinates: {
            lat: "10.12232",
            lng: "12.32322"
        }
      };
    
    var DeviceModel = require('./Device');
    
    let d = new DeviceModel(device);

    try {
        var r = await d.save();
        // DeviceModel.deleteMany({}, function(err) { console.log(err); })
        // console.log('---',r);

        // var r1 = await DeviceModel.find({device_id:'100',user_id:'123'}).exec();
        // console.log(r1);
    } catch(error) {
        console.log(error);
    }
    
}

// test();