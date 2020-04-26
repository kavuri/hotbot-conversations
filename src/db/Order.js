/* Copyright (C) Kamamishu Pvt. Ltd. - All Rights Reserved
 * Unauthorized copying of this file, via any medium is strictly prohibited
 * Proprietary and confidential
 */

'using strict';

const _ = require('lodash'),
    mongoose = require('mongoose'),
    DBConn = require('./index').DBConn,
    AutoIncrement = require('./index').AutoIncrement,
    CheckinCheckoutModel = require('./CheckinCheckout');

/**
 * new = for any new order, created by system
 * progress = order fulfilment in progress, changed by hotel staff
 * done = order fulfilment complete, changed by hotel staff
 * cant_serve = hotel unable to serve order, changed by hotel staff
 * cancelled = guest cancelled the order, changed by guest via bot
 */
var StatusSchema = new mongoose.Schema({
    set_by: { type: String }, // This is the id of whoever changed the status
    status: { type: String, required: true, enum: ['new', 'progress', 'done', 'cant_serve', 'cancelled'] },
    created: { type: Date, default: Date.now }
});

var PrioritySchema = new mongoose.Schema({
    set_by: { type: String }, // This is the email id of the logged-in user
    priority: { type: String, required: true, enum: ['urgent', 'asap', 'leisure'] },
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
    room_no: { type: String, required: true },
    item: { type: OrderItemsSchema, required: true },
    group_id: { type: String, required: true },
    ///items: { type: [OrderItemsSchema], required: true },
    priority: { type: [PrioritySchema], default: { priority: 'asap' } },
    status: { type: [StatusSchema], default: { status: 'new' } },
    curr_priority: { type: PrioritySchema, required: true, default: { status: 'new' } },
    curr_status: { type: StatusSchema, required: true, default: { priority: 'asap' } },
    curr_comment: { type: CommentSchema },
    comments: { type: [CommentSchema] },
    checkincheckout: { type: mongoose.Schema.Types.ObjectId, ref: 'CheckinCheckout', required: true }
}, { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } });

// Create a pre save hook to create a reference to checkincheckout object. This is for display of the guest information in the UI
/*
OrderSchema.pre('save', async () => {
    let idea = this;
    let filter = { hotel_id: this.hotel_id, room_no: this.room_no, checkout: null };
    console.log('@@@pre:checkincheckout filter=', filter);
    console.log('###this=', idea);
    try {
        let guestInfo = await CheckinCheckoutModel.findOne(filter).exec();
        console.log('@@@guestInfo=', guestInfo);
        this.checkincheckout = guestInfo;
    } catch (error) {
        throw new Error(error);
    }
    console.log('pre save:guestInfo=', this.checkincheckout);
});
*/

// Create post save hooks
OrderSchema.post('save', async (doc) => {
    // Find the ordered item, find the order from CheckinCheckout and update the count
    // E.g.: Guest modifies the count of items they want. "I want to change the count of coffee to one"
    // This is useful for checking if the guest has ordered the same item again
    // console.log('Updating orders to room.', doc);
    let filter = { hotel_id: doc.hotel_id, room_no: doc.room_no, orders: doc._id, checkout: null };
    try {
        let currentOrder = await CheckinCheckoutModel
            .findOne(filter)
            .exec();
        console.log('post save:currentOrders=', currentOrder);
        if (_.isUndefined(currentOrder) || _.isNull(currentOrder)) {
            // This order is not part of checkincheckout, add to the list
            filter = { hotel_id: doc.hotel_id, room_no: doc.room_no, checkout: null };
            let updated = await CheckinCheckoutModel
                .findOneAndUpdate(filter, { $push: { orders: doc } })
                .exec();
            console.log('updated checkincheckout=', updated);
        }
    } catch (error) {
        console.error('error in storing order reference to CheckinCheckout:', error);
    }
});

OrderSchema.pre('updateOne', { document: true, query: false }, async function () {
    this.set({ updated_at: new Date() });
})

OrderSchema.index({ hotel_id: 1, room_no: 1 }, { unique: true });
OrderSchema.index({ hotel_id: 1, user_id: 1 });
OrderSchema.index({ 'item.name': 'text' });
OrderSchema.index({ 'curr_status.status': 1 });
OrderSchema.index({ room_no: 1 });

// FIXME: This group_is is not SaaS'ified
// Meaning, if hotel "1" generated group_id=1,2,3, hotel "2" will generate 4,5, rather it should generate 1,2
OrderSchema.plugin(AutoIncrement.plugin, {
    model: 'Order',
    field: 'group_id',
    startAt: 1,
    incrementBy: 1
});

module.exports = DBConn.model('Order', OrderSchema);
