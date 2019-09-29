/* Copyright (C) Kamamishu Pvt. Ltd. - All Rights Reserved
 * Unauthorized copying of this file, via any medium is strictly prohibited
 * Proprietary and confidential
 */
'use strict';

var _ = require('lodash'),
    Fuse = require('fuse.js'),
    mongoose = require('mongoose');

var HotelSchema = new mongoose.Schema({
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
   }, {timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }});

module.exports = mongoose.model('Hotel', HotelSchema);

// module.exports.get = async function(hotel_id, projection) {
//     if (_.isNull(projection) || _.isUndefined(projection)) {
//         throw new Error('project for getting data not provided')
//     }
//     let params = {
//         TableName: TableName,
//         ProjectionExpression: projection,
//         Key: {
//             'hotel_id': hotel_id
//         }
//     };

//     let data;
//     try {
//         data = await Conn().get(params).promise();
//     } catch (error) {
//         console.error('error getting hotel info:', hotel_id, error);
//         throw error;
//     }

//     return data.Item;
// }