/* Copyright (C) Kamamishu Pvt. Ltd. - All Rights Reserved
 * Unauthorized copying of this file, via any medium is strictly prohibited
 * Proprietary and confidential
 */
'use strict';

var _ = require('lodash'),
    mongoose = require('mongoose'),
    DBConn = require('./index').DBConn;

var FacilitySchema = new mongoose.Schema({
        hotel_id: {type: String, required: true, index: true}, // this is the "address1" field
        f_name: {type: String, required: true, index: true},    // facility name
        f_type: {type: String, index: true},    // facility type. Can be room item, facility, kitchen item, policy
        s_type: [{type: String, required: true, enum: ['order', 'service', 'none']}],
        synonyms: [String],
        present: {
            flag: {type: String, required: true},
            message: {type: mongoose.Schema.Types.Mixed}
        }
   }, {timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }, strict: false});

FacilitySchema.index({hotel_id: 1, f_name: 1}, {unique: true});

module.exports = DBConn.model('Facility', FacilitySchema);
