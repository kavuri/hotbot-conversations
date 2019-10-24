/* Copyright (C) Kamamishu Pvt. Ltd. - All Rights Reserved
 * Unauthorized copying of this file, via any medium is strictly prohibited
 * Proprietary and confidential
 */

'use strict';

var _ = require('lodash'),
    mongoose = require('mongoose'),
    DBConn = require('./index').DBConn;

var PolicySchema = new mongoose.Schema({
        hotel_id: {type: String, required: true, index: true}, // this is the "address1" field
        p_name: {type: String, required: true, index: true},
        p_type: {type: String, index: true},
        synonyms: [String],
   }, {timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }});

module.exports = DBConn.model('Policy', PolicySchema);
PolicySchema.index({hotel_id: 1, p_name: 1}, {unique: true});

const test = async function(hotel_id, policy_name) {
    // var mongo = require('../../mongo.js');
    // mongo();

    try {
        var r = await PolicySchema.find({hotel_id: '100', p_name:"cancellation"});
        console.log(r);
    }catch(error) {
        console.error('error in getting policy', error);
    }
}

// test();