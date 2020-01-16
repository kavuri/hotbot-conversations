/* Copyright (C) Kamamishu Pvt. Ltd. - All Rights Reserved
 * Unauthorized copying of this file, via any medium is strictly prohibited
 * Proprietary and confidential
 */

 'using strict';

 const mongoose = require('mongoose'),
       DBConn = require('./index').DBConn,
       AutoIncrement = require('./index').AutoIncrement;

var StatusSchema = new mongoose.Schema({
    status: {type: String, required: true, enum: ['new', 'progress', 'done', 'cant_serve','cancelled'], default: 'new'},
    created: { type: Date, default: Date.now }
});

var PrioritySchema = new mongoose.Schema({
    priority: {type: String, required: true, enum: ['urgent', 'asap', 'leisure'], default: 'asap'},
    created: { type: Date, default: Date.now }
});

var CommentSchema = new mongoose.Schema({
    // comment_by: {type: mongoose.Schema.Types.ObjectId, required: true, ref: 'User'},
    comment: {type: String, required: true},
    created: { type: Date, default: Date.now }
});

var OrderItems = new mongoose.Schema({
    f_id: {type: mongoose.Schema.Types.ObjectId, required: true, ref: 'Facilities'},
    req_count: {type: Number},
    served_count: {type: Number}
});

var OrderSchema = new mongoose.Schema({
        hotel_id: {type: String, required: true, index: true}, // this is the "address1" field
        user_id: {type: String, required: true},
        room_no: String,
	    items: {type: [OrderItems], required: true},
	    priority: {type: [PrioritySchema], default: {priority: 'asap'}},
	    status: {type: [StatusSchema], default: {status: 'new'}},
        completion_time: Date,
	    cancelled_by: String,
	    comments: {type: [CommentSchema]}
}, {timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }});

OrderItems.plugin(AutoIncrement.plugin, 'OrderItems');

var OrderModel = DBConn.model('Order', OrderSchema);

// Create post save hooks
OrderSchema.post('inventory', function(doc) {
    console.log('need to update inventory of the ordered item', doc);
});

OrderSchema.index({hotel_id: 1, o_id: 1}, {unique: true});
OrderSchema.index({hotel_id: 1, user_id: 1});

module.exports = OrderModel;
