/* Copyright (C) Kamamishu Pvt. Ltd. - All Rights Reserved
 * Unauthorized copying of this file, via any medium is strictly prohibited
 * Proprietary and confidential
 */

/*
 * This handler answers queries related to the hotel facility
 */
'using strict';

const _ = require('lodash'),
    DBFuncs = require('../db/db_funcs'),
    KamError = require('../utils/KamError');

/**
 * Common funtion to check the price tag and retun the price message
 * @param {*} thisObj 
 * @param {*} item 
 */
async function priceMsg(thisObj, hotel_id, item) {
    let msg = '';
    if (!_.has(item, 'msg')) {
        // Message is not set in the data. Check for price and create a message
        if (!_.has(item, 'price') || _.isEqual(item.price, '0')) {
            msg = thisObj.t('ORDER_FREE', { item_name: item.name });
        } else if (_.has(item, 'price') && !_.isEqual(item.price, '0')) {
            const price = item.price;
            msg = thisObj.t('ORDER_COSTS', { item_name: item.name, price: price });
        }
    } else if (_.has(item, 'f')) {
        let price_node_name = item.name.toLowerCase() + '_price';
        let price = await DBFuncs.getNode(hotel_id, price_node_name);
        if (_.isUndefined(price)) {   // FIXME: Ensure this does not happen
            this.tell(this.t('SYSTEM_ERROR'));
        }
    } else {
        msg = item.msg['yes'];
    }

    console.log('returning price msg:', msg);
    return msg;
}

module.exports = {
    async Enquiry_reception_languages() {
        const hotel_id = this.$session.$data.hotel.hotel_id;
        let facility;
        try {
            facility = await DBFuncs.item(hotel_id, 'reception_languages');
        } catch (error) {
            console.log('error while fetching hotel facility:', error);
            throw error;
        }

        let msg;
        if (_.isEmpty(facility)) {
            // No such policy defined for this hotel
            msg = this.t('FACILITY_NOT_AVAILABLE');
        }

        if (_.has(facility, 'f') && _.isEqual(facility.f, true)) {
            // Its a facility. Get the message
            msg = facility.msg;
        }
        this
            .$speech
            .addText(msg)
            .addBreak('200ms')
            .addText(this.t('ANYTHING_ELSE'));

        // Followup state is not required, as this is a straight forward answer and the next query from guest can be anything else
        return this.ask(this.$speech);
    },

    async Enquiry_all_facilities() {
        var hotel_id = this.$session.$data.hotel.hotel_id;

        let allFacilities;
        try {
            allFacilities = await DBFuncs.allFacilities(hotel_id);
            console.log('###returned facilities=', facility_names);
        } catch (error) {
            if (error instanceof KamError.DBSetupError) {
                this
                    .$speech
                    .addText(this.t('NO_FACILITIES'))
                    .addBreak('100ms')
                    .addText(this.t('ANYTHING_ELSE'));
                return this.ask(this.$speech);
            }
        }

        // If the number of facilities is >4, tell the first four
        if (allFacilities.length > 4) {
            allFacilities = _.slice(allFacilities, 0, 4);
        }
        let stitch = _.join(allFacilities, ',');

        this
            .$speech
            .addText(this.t('HOTEL_FACILITIES', { facilities: stitch }))
            .addBreak('200ms')
            .addText(this.t('ANYTHING_ELSE'));

        this.removeState(); // This makes the next invocation go global
        return this.ask(this.$speech);
        // return this
        //     .followUpState('ReadOutAllFacilitiesState')
        //     .ask(this.$speech, this.t('YES_NO_REPROMPT'));
    },

    'ReadOutAllFacilitiesState': {
        async YesIntent() {

            // Take the facilities info from the session object

            allFacilities = await DBFuncs.allFacilities(hotel_id);
            let stitch = _.join(allFacilities, ',');

            this.$speech
                .addText(this.t('HOTEL_FACILITIES', { facilities: stitch }))
                .addBreak('200ms')
                .addText(this.t('ANYTHING_ELSE'));
            return this.ask(this.$speech);
        },

        NoIntent() {
            console.log('Ending session at "AllFacilitiesState"');
            return this.tell(this.t('END'));
        },

        Unhandled() {
            console.log('unhandled in followup state');
            this.$speech
                .addText(this.t('REPEAT_REQUEST'));
            // Triggered when the requested intent could not be found in the handlers variable
            return this.ask(this.$speech);
        }
    },

    /**
     * Flow
     * 1. Find item from the graph
     * 2. If item is not present, say so and ask for something else, else continue
     * 3. If item cannot be ordered, tell user so and ask if they want anything else.
     * 4. [Extra step from order flow] If the item can be ordered, ask user if they want to order it
     * 5. If yes, go with the order flow (step 6 onwards), if no, ask if they want anything else?
     * 6. Check if item has already been ordered
     *  a. If ordered + not-served -> tell user that the item has been ordered, but not served. Please wait for the order to be served or would the user want to order more of it?
     *  b. If ordered + served -> tell user that the item has been ordered already. Would you want to order it again?
     * 7. If item is not ordered
     *  a. If item has count, and
     *      i) count is not provided, ask user for count
     *      ii) count is provided, confirm order and check if user wants more
     *  b. If item does not have count, confirm the order and ask if the user wants anything else
     * 8. If the user says, cancel this order -> pick data from session and ask if the latest one should be cancelled -> confirm & cancel
     * 9. Once done, read the orders and place them
     */
    async Enquiry_facility_exists() {
        //TODO: Implement
        return this.toIntent('HandleOrderIntent');
    },

    /**
     * Global NoIntent
     */
    async NoIntent() {
        // If the cache is not cleared and if data is changed from UI, the cache will have old data
        // This is a hack to get around this problem - beats the purpose of cache
        // FIXME: Find time to fix this
        DBFuncs.delCache(this.$session.$data.hotel.hotel_id);

        // Clear the dynamic entities
        this.$alexaSkill.clearDynamicEntities();

        console.log('ENDING IN FACILITIES...');
        // Say thank you and end
        this.tell(this.t('END'));
    },

    /**
     * Two types of order cancellation
     * 1. During the order session - clear the orders in the session & not saved to database
     * 2. Cancel ones that are already ordered - send cancellation request to front desk
     *   a) Fetch the orders from the DB
     *   b) Read out the "new" and "progress" orders to the guest and ask which ones to cancel
     *   c) If all, send cancellation request for all items in the order
     * 
     * Flow: For order in session
     * 1. Guest: Cancel tea order
     * 2. Alexa: I am canceling your order for 1 tea. Would you like anything else?
     * 3. Guest: No
     * 4. Alexa: Confirm order and exit
     * 
     * Flow: For order that reached front desk
     * 1. Guest: Cancel tea order
     * 2. Alexa: I will place the cancellation request. But the front desk is processing your order for 1 tea and so I cannot guarantee the cancellation. Would you like anything else?
     * 3. Guest: No
     * 4. Alexa: Thank you & exit
     * 
     */
    async Order_cancel() {
        const hotel_id = this.$session.$data.hotel.hotel_id,
            user_id = this.$request.context.System.user.userId,
            room_no = this.$session.$data.hotel.room_no,
            item_name = this.$inputs.facility_slot.value;

        let item;   // Step 1
        try {
            item = await DBFuncs.item(hotel_id, item_name);
        } catch (error) {
            if ((error instanceof KamError.InputError) || (error instanceof KamError.DBError)) {
                return this.tell(this.t('SYSTEM_ERROR'));
            }
        }

        if (_.isEmpty(item) || _.isUndefined(item)) {
            // Not possible. If the guest has ordered an item, then finding the item for cancellation should also be there
            // TODO: But what if!
        }

        let ordersInSession = getOrdersInSession(this);
        let ordersSentToFrontDesk = await DBFuncs.new_orders(hotel_id, room_no, user_id);
        // facility slot has value

        let orderedItem;
        if (ordersInSession.length > 0) {
            orderedItem = _.filter(ordersInSession, { name: item.name });
            if (orderedItem.length > 0) {
                // Confirm cancellation of this order
                this.$speech
                    .addText(this.t('ORDER_CANCEL_REMOVE_ITEM', { count: orderedItem[0].req_count, item_name: orderedItem[0].name }))   //orderedItem[0] is fine, as there cannot be multiple entries for the same item
                    .addBreak('200ms')
                    .addText(this.t('ANYTHING_ELSE'));

                // Remove order from list
                removeItemFromOrder(this, item.name);
            }
        } else if (ordersSentToFrontDesk.length > 0) {
            orderedItem = _.filter(ordersSentToFrontDesk, { item: { name: item.name } });
            if (orderedItem.length > 0) {
                this.$speech
                    .addText(this.t('ORDER_CANCEL_REQUEST_CANCEL_AT_FRONTDESK', { count: orderedItem[0].item.req_count, item_name: orderedItem[0].item.name }))   //orderedItem[0] is fine, as there cannot be multiple entries for the same item
                    .addBreak('200ms')
                    .addText(this.t('ANYTHING_ELSE'));

                // Remove order from database
                try {
                    await DBFuncs.cancel_order(hotel_id, room_no, user_id, item.name);
                } catch (error) {
                    //FIXME: Should we tell the customer about the error? 
                }
            }
        } else {    // No such order
            this.$speech
                .addText(this.t('NO_SUCH_ORDER'))
                .addBreak('200ms')
                .addText(this.t('ANYTHING_ELSE'));
        }
        return this.ask(this.$speech);

    },

    async Enquiry_Facility_timings() {
        let hotel_id = this.$session.$data.hotel.hotel_id,
            item_name = this.$inputs.facility_slot.value;
        let item;
        try {
            item = await DBFuncs.item(hotel_id, item_name);
        } catch (error) {
            if (error instanceof KamError.InputError) {
                this.tell(this.t('SYSTEM_ERROR'));
            } else if (error instanceof KamError.DBError) {
                this.tell(this.t('SYSTEM_ERROR'));
            }
        }
        if (_.isEmpty(item) || _.isUndefined(item)) {
            this.$speech
                .addText(this.t('FACILITY_NOT_AVAILABLE', { facility: item_name }))
                .addBreak('200ms')
                .addText(this.t('ANYTHING_ELSE'));
            return this.ask(this.$speech);
        }

        console.log('+++timings item=', item);

        let msg = '';
        if (_.isEqual(item.a, false)) {
            // Facility is not available
            msg = item.msg['no'];
            this.$speech
                .addText(msg)
                .addBreak('200ms')
                .addText(this.t('ANYTHING_ELSE'));
            return this.ask(this.$speech);
        }

        // Get the timings node
        let timings_node_name = item.name.toLowerCase() + '_timings';
        console.log('getting node_name=', timings_node_name);
        let timings = await DBFuncs.getNode(hotel_id, timings_node_name);
        if (_.isUndefined(timings)) {   // FIXME: Ensure this does not happen
            this.tell(this.t('SYSTEM_ERROR'));
        }

        msg = timings.msg;
        this.$speech.addText(msg)
            .addBreak('200ms')
            .addText(this.t('ANYTHING_ELSE'));

        return this.ask(this.$speech);
    },

    async Enquiry_Facility_price() {
        let hotel_id = this.$session.$data.hotel.hotel_id,
            item_name = this.$inputs.facility_slot.value;
        let item;
        try {
            item = await DBFuncs.item(hotel_id, item_name);
        } catch (error) {
            if (error instanceof KamError.InputError) {
                this.tell(this.t('SYSTEM_ERROR'));
            } else if (error instanceof KamError.DBError) {
                this.tell(this.t('SYSTEM_ERROR'));
            }
        }
        if (_.isEmpty(item) || _.isUndefined(item)) {
            this.$speech
                .addText(this.t('FACILITY_NOT_AVAILABLE', { facility: item_name }))
                .addBreak('200ms')
                .addText(this.t('ANYTHING_ELSE'));
            return this.ask(this.$speech);
        }

        console.log('+++item=', item);

        // Price can be a separate node of the facility, or it can be a price tag
        let msg = '';
        if (_.isEqual(item.a, false)) {
            // Facility is not available
            msg = item.msg['no'];
            this.$speech
                .addText(msg)
                .addBreak('200ms')
                .addText(this.t('ANYTHING_ELSE'));
            return this.ask(this.$speech);
        }

        msg = await priceMsg(this, hotel_id, item);
        // Price can be an attribute of the node or a successor

        this.$speech
            .addText(msg)
            .addBreak('200ms')
            .addText(this.t('ITEM_ORDER_QUESTION', {    // We have dosa at our restaurant. Its cost is rupees 60. Would you like to order one?
                item_name: item.name
            }));

        return this.ask(this.$speech);
    },

    async Enquiry_Facility_location() {
        let hotel_id = this.$session.$data.hotel.hotel_id,
            item_name = this.$inputs.facility_slot.value;
        let item;
        try {
            item = await DBFuncs.item(hotel_id, item_name);
        } catch (error) {
            if (error instanceof KamError.InputError) {
                this.tell(this.t('SYSTEM_ERROR'));
            } else if (error instanceof KamError.DBError) {
                this.tell(this.t('SYSTEM_ERROR'));
            }
        }
        if (_.isEmpty(item) || _.isUndefined(item)) {
            this.$speech
                .addText(this.t('FACILITY_NOT_AVAILABLE', { facility: item_name }))
                .addBreak('200ms')
                .addText(this.t('ANYTHING_ELSE'));
            return this.ask(this.$speech);
        }

        console.log('+++item=', item);

        let msg = '';
        if (_.isEqual(item.a, false)) {
            // Facility is not available
            msg = item.msg['no'];
            this.$speech
                .addText(msg)
                .addBreak('200ms')
                .addText(this.t('ANYTHING_ELSE'));
            return this.ask(this.$speech);
        }

        // Get the timings node
        let location_node_name = item.name.toLowerCase() + '_location';
        let location = await DBFuncs.getNode(hotel_id, location_node_name);
        if (_.isUndefined(location)) {   // FIXME: Ensure this does not happen
            this.tell(this.t('SYSTEM_ERROR'));
        }

        msg = location.msg;
        this.$speech
            .addText(msg)
            .addBreak('200ms')
            .addText(this.t('ANYTHING_ELSE'));

        return this.ask(this.$speech);
    },

    /*
    async Enquiry_menu() {
        let hotel_id = this.$session.$data.hotel.hotel_id;
        let item;
        try {
            item = await DBFuncs.item(hotel_id, 'menu');
        } catch (error) {
            if (error instanceof KamError.InputError) {
                this.tell(thisObj.t('SYSTEM_ERROR'));
            }
        }
     
        console.log('+++item=', item);
        let msg;
        let present = item.a;
        if (_.isEqual(present), false) {
            // Facility is not available
            msg = item.msg['no'];
        } else if (_.isEqual(present), true) {
            msg = item.msg['yes'];
        }
        this.$speech.addText(msg)
            .addBreak('200ms')
            .addText(this.t('ANYTHING_ELSE'));
        return this.ask(this.$speech);
    },
    */

    async Enquiry_menu_cuisinetype() {
        let hotel_id = this.$session.$data.hotel.hotel_id;
        let item;
        try {
            item = await DBFuncs.item(hotel_id, 'Cuisines');
        } catch (error) {
            if (error instanceof KamError.InputError) {
                this.tell(this.t('SYSTEM_ERROR'));
            }
        }

        if (_.isUndefined(item) || _.isEmpty(item)) {
            this.$speech
                .addText(this.t('FACILITY_NONAME_NOT_AVAILABLE'))
                .addBreak('200ms')
                .addText(this.t('ANYTHING_ELSE'));
            return this.ask(this.$speech);
        }

        console.log('+++cuisines=', item);
        let msg = '';
        if (_.isEqual(item.a, false)) {
            // Facility is not available
            msg = item.msg['no'];
        } else if (_.isEqual(item.a, true)) {
            msg = item.msg['yes'];
        }
        this.$speech.addText(msg)
            .addBreak('200ms')
            .addText(this.t('ANYTHING_ELSE'));
        return this.ask(this.$speech);
    },

    /**
     * Guest: What did I order?
     * Alexa: You have ordered 2 tea, 2 idly today at 12:30 PM. Would you like to know or order anything else?
     * Guest: Yes, I would like a coffee as well => Order_item flow
     * (or) Guest: No
     * Alexa: Thank you. Please wake me up incase of need
     */
    async Ordered_items() {
        let hotel_id = this.$session.$data.hotel.hotel_id,
            user_id = this.$request.context.System.user.userId,
            room_no = this.$session.$data.hotel.room_no;

        let ordersInSession = getOrdersInSession(this);
        let ordersSentToFrontDesk = [];
        try {
            ordersSentToFrontDesk = await DBFuncs.all_orders(hotel_id, room_no, user_id);
        } catch (error) {
            this.tell(this.t('SYSTEM_ERROR'));
        }

        let msg_OrdersInSession = '';
        if (ordersInSession.length > 0) {
            msg_OrdersInSession = stringifyOrdersInSession(this);
        }

        let msg_OrdersAtFrontdesk = '';
        if (ordersSentToFrontDesk.length > 0) {
            msg_OrdersAtFrontdesk = stringifyOrdersSentToFrontdesk(ordersSentToFrontDesk);
            if (!_.isEmpty(msg_OrdersInSession)) {
                this.$speech
                    .addText(this.t('ORDER_LIST', { items: msg_OrdersInSession }))
                    .addBreak('200ms')
                    .addText(this.t('ORDER_LIST_AT_FRONTDESK', { items: msg_OrdersAtFrontdesk }))
                    .addBreak('200ms')
                    .addText(this.t('ANYTHING_ELSE'));
            } else {
                this.$speech
                    .addText(this.t('ORDER_LIST', { items: msg_OrdersAtFrontdesk }))
                    .addBreak('200ms')
                    .addText(this.t('ANYTHING_ELSE'));
            }
            // There are orders like this with front desk
            // if (_.isEqual(orderedItem[0].curr_status, "progress")) {
            // } else if (_.isEqual(orderedItem[0].curr_status, "new")) {
            // }
        }

        let finalMsg = msg_OrdersInSession + msg_OrdersAtFrontdesk;
        if (_.isEmpty(finalMsg)) {
            this.$speech
                .addText(this.t('ORDERS_NONE'))
                .addBreak('200ms')
                .addText(this.t('ANYTHING_ELSE'));
        }

        this.ask(this.$speech);
    },

    /**
     * Guest: The TV is not working
     * Alexa: You mentioned that the TV is not working. Can you confirm
     * Guest: Yes
     * Alexa: I will take a request to have someone look into the problem. Would you like to know about or order anything else?
     * (or)
     * Alexa: I see that there is already a request placed for {{item}}. I will notify the issue to the hotel staff and they will tend to this as soon as possible
     */
    async Equipment_not_working() {
        let hotel_id = this.$session.$data.hotel.hotel_id,
            user_id = this.$request.context.System.user.userId,
            room_no = this.$session.$data.hotel.room_no,
            item_name = this.$inputs.facility_slot.value;

        let item;
        try {
            item = await DBFuncs.successors(hotel_id, item_name);
        } catch (error) {
            if (error instanceof KamError.InputError) {
                this.tell(this.t('SYSTEM_ERROR'));
            }
        }

        if (_.isEmpty(item) || _.isUndefined(item)) {
            let msg = '';
            if (_.isUndefined(item_name)) {
                msg = this.t('FACILITY_NONAME_NOT_AVAILABLE');
            } else {
                msg = this.t('FACILITY_NOT_AVAILABLE', { item_name: item_name });
            }
            this.$speech
                .addText(msg)
                .addBreak('200ms')
                .addText(this.t('ANYTHING_ELSE'));
            return this.ask(this.$speech);
        }

        try {
            let sameOrders = await DBFuncs.already_ordered_items(hotel_id, room_no, item);
            if (sameOrders.length > 0) { // There have been prior orders from this guest
                // Status = 'new', 'progress' = tell user that the item has already been ordered. Would you like to still order it?
                const status_new = _.filter(orders, { curr_status: [{ status: 'new' }] });
                const status_progress = _.filter(orders, { curr_status: [{ status: 'progress' }] });
                if (!_.isEmpty(status_new) || !_.isEmpty(status_progress)) {
                    this
                        .$speech
                        .addText(this.t('PROBLEM_BEING_WORKED_ON'))
                        .addBreak('200ms')
                        .addText(this.t('ANYTHING_ELSE'));
                    //TODO: Change the status to 'urgent'?
                }
            }
        } catch (error) {
            if ((error instanceof KamError.InputError) || (error instanceof KamError.DBError)) {
                this.tell(this.t('SYSTEM_ERROR'));
            }
        }

        addOrderToSession(this, item, 0, true);
        let orders = getOrdersInSession(this);
        console.log('creating order for non functioning item: hotel_id=' + hotel_id + ',user_id=' + user_id + ',room_no=' + room_no + ',items=', orders);
        try {
            DBFuncs.create_order(hotel_id, room_no, user_id, orders);
        } catch (error) {
            console.log('coding or db error.', error);
            this.tell(this.t('SYSTEM_ERROR'));
        }

        this.$speech
            .addText(this.t('ORDER_TAKEN_FOR_NOT_WORKING_FACILITY'))
            .addBreak('200ms')
            .addText(this.t('ANYTHING_ELSE'));
        return this.ask(this.$speech);

    },

    /** 
    {
      "name": "Enquiry_TV_Channels",
      "phrases": [
        "What are the channels on the TV",
        "what all channels do you get",
        "what can I see on TV",
        "What is on TV",
        "What is playing on TV",
        "What can I play on TV"
      ]
    }
    This intent is probably not required now, as the Enquiry_facility_exists takes care of this
    async Enquiry_TV_Channels() {
        let hotel_id = this.$session.$data.hotel.hotel_id;
        let item;
        try {
            item = await DBFuncs.item(hotel_id, 'TV');
        } catch (error) {
            if (error instanceof KamError.InputError) {
                this.tell(this.t('SYSTEM_ERROR'));
            }
        }
     
        if (_.isUndefined(item)) {
            this.$speech
                .addText(this.t('FACILITY_NOT_AVAILABLE', { facility: item_name }))
                .addBreak('200ms')
                .addText(this.t('ANYTHING_ELSE'));
            return this.ask(this.$speech);
        }
     
        console.log('+++TV=', item);
        let msg;
        if (_.isEqual(item.a, false)) {
            // Facility is not available
            msg = item.msg['no'];
        } else if (_.isEqual(present), true) {
            msg = item.msg['yes'];
        }
        this.$speech.addText(msg)
            .addBreak('200ms')
            .addText(this.t('ANYTHING_ELSE'));
        return this.ask(this.$speech);
    }
    */

    async Equipment_action() {
        this.$speech
            .addText(this.t('FACILITY_NONAME_NOT_AVAILABLE'))
            .addBreak('200ms')
            .addText(this.t('ANYTHING_ELSE'));
        return this.ask(this.$speech);
    },

    async Order_Request() {
        this.tell('Not implemented yet');
    }
}