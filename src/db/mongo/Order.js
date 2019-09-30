/* Copyright (C) Kamamishu Pvt. Ltd. - All Rights Reserved
 * Unauthorized copying of this file, via any medium is strictly prohibited
 * Proprietary and confidential
 */

 'using strict';

 const _ = require('lodash'),
       Conn = require('./Conn'),
       gql = require('graphql-tag'),
       mutations = require('../../utils/graphql/mutations'),
       uuidv1 = require('uuid/v1'),
       KamError = require('../../utils/KamError'),
       appsync = require('../../utils/appsync'),
       mongoose = require('mongoose');

    var OrderSchema = new mongoose.Schema({
        hotel_id: {type: String, required: true, index: true}, // this is the "address1" field
        user_id: {type: String, required: true},
        o_id: {type: mongoose.Schema.Types.ObjectId, required: true, unique: true},
        room_no: String,
	    o_items: [{type: Map, required: true}],
	    o_status: [{
            status: {type: String, required: true, enum: ['new', 'progress', 'done', 'cant_serve','cancelled']},
            updated: { type: Date, default: Date.now }
        }],
	    o_priority: [{
            priority: {type: String, required: true, enum: ['urgent', 'asap', 'leisure']},
            updated: { type: Date, default: Date.now }
        }],
	    o_completion_time: Date,
	    o_cancelled_by: String,
	    o_comments: [{
            comment: String,
            updated: { type: Date, default: Date.now }
        }]
   }, {timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }});

   OrderSchema.index({hotel_id: 1, o_id: 1}, {unique: true});
   OrderSchema.index({hotel_id: 1, user_id: 1});

 module.exports = mongoose.model('Order', OrderSchema);
