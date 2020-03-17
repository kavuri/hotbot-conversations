/* Copyright (C) Kamamishu Pvt. Ltd. - All Rights Reserved
 * Unauthorized copying of this file, via any medium is strictly prohibited
 * Proprietary and confidential
 */

'using strict';

const mongoose = require('mongoose'),
    DBConn = require('./index').DBConn,
    AutoIncrement = require('./index').AutoIncrement;

var StatusSchema = new mongoose.Schema({
    set_by: { type: String, required: true }, // This is the email id of the logged-in user
    status: { type: String, required: true, enum: ['new', 'progress', 'done', 'cant_serve', 'cancelled'], default: 'new' },
    created: { type: Date, default: Date.now }
});

var PrioritySchema = new mongoose.Schema({
    set_by: { type: String, required: true }, // This is the email id of the logged-in user
    priority: { type: String, required: true, enum: ['urgent', 'asap', 'leisure'], default: 'asap' },
    created: { type: Date, default: Date.now }
});

var CommentSchema = new mongoose.Schema({
    comment_by: { type: String, required: true }, // This is the email id of the logged-in user
    comment: { type: String, required: true },
    created: { type: Date, default: Date.now }
});

var OrderItemsSchema = new mongoose.Schema({
    name: { type: String, required: true }, //This is same as the node name of the item in the graph
    type: { type: String, required: true }, // type=menu, roomitem, facility
    req_count: { type: Number },
    served_count: { type: Number }
});

var OrderSchema = new mongoose.Schema({
    hotel_id: { type: String, required: true, index: true }, // this is the "address1" field
    user_id: { type: String, required: true },
    room_no: String,
    items: { type: [OrderItemsSchema], required: true },
    priority: { type: [PrioritySchema], default: { priority: 'asap' } },
    status: { type: [StatusSchema], default: { status: 'new' } },
    completion_time: Date,
    cancelled_by: String,
    comments: { type: [CommentSchema] }
}, { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } });

OrderItemsSchema.plugin(AutoIncrement.plugin, 'OrderItems');

var OrderModel = DBConn.model('Order', OrderSchema);

// Create post save hooks
OrderSchema.post('save', async function (doc) {
    // Find the ordered item, find the order from CheckinCheckout and update the count
    // This is useful for checking if the guest has ordered the same item again
    console.log('Updating orders to room');
    const filter = { hotel_id: doc.hotel_id, room_no: doc.room_no, checkout: null };
    let room = await CheckinCheckoutModel.findOne(filter).exec();
    room.orders.push(doc);
    /*
    for (var i = 0; i < doc.items.length; i++) {
        let prevOrderIdx = _.findIndex(room.orders, { name: doc.items[i].name })
        if (_.isEqual(prevOrderIdx, -1)) { // Its a new order. Add it to room
            room.orders.push({ name: doc.items[i].name, type: doc.items[i].type, count: doc.items[i].req_count });
        } else {    // A similar order has already been made. Update the previous order
            room.orders[prevOrderIdx].count += doc.items[i].req_count;
        }
    }
    */

    // Save the orders to the room
    await room.save();
});

OrderSchema.index({ hotel_id: 1, o_id: 1 }, { unique: true });
OrderSchema.index({ hotel_id: 1, user_id: 1 });

module.exports = OrderModel;
