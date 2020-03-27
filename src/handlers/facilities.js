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

// Function to add order to current session
function addOrderToSession(thisObj, item, reqCount, notWorking) {
    if (_.isEmpty(thisObj.$session.$data.orders)) { // First order
        thisObj.$session.$data.orders = [];
    }

    // Update the item if it has already been ordered
    let item_idx = _.indexOf(thisObj.$session.$data.orders, item.name)
    if (!_.isEqual(item_idx, -1)) {
        thisObj.$session.$data.orders[item_idx].req_count += reqCount;
    } else {
        let type;
        if (item.m) {   // menu item
            type = 'menu';
        } else if (item.f) {    // facility. This is for reserving a facility
            //TODO: Add facility reservation
            type = 'facility';
        } else if (item.ri) {   // room item
            type = 'roomitem';
        } else if (_.isEqual(notWorking, true)) {
            type = 'problem';
        }
        thisObj.$session.$data.orders.push({ type: type, name: item.name, req_count: reqCount });
    }
}

// Function to get the current orders from session
function getOrdersInSession(thisObj) {
    if (_.has(thisObj.$session.$data, 'orders')) {
        return thisObj.$session.$data.orders;
    } else {
        return [];
    }
}

// Function to reset order from session
function resetOrdersInSession(thisObj) {
    thisObj.$session.$data.orders = [];
}

// Removes specific item from orders
function removeItemFromOrder(thisObj, item_name) {
    _.remove(thisObj.$session.$data.orders, {
        name: item_name
    });
}

function stringifyOrdersInSession(thisObj) {
    const orders = thisObj.$session.$data.orders;
    let ordersToStr = '';
    for (var i = 0; i < orders.length; i++) {
        ordersToStr += orders[i].req_count + ' ' + orders[i].name + ', '
        console.log('^^^', ordersToStr);
    }
    return ordersToStr;
}

function stringifyOrdersSentToFrontdesk(frontdeskOrders) {
    let ordersToStr = '';
    for (var i = 0; i < frontdeskOrders.length; i++) {
        ordersToStr += frontdeskOrders[i].item.req_count + ' ' + frontdeskOrders[i].item.name + ', ';
    }

    return ordersToStr;
}

/**
 * Common funtion to check the price tag and retun the price message
 * @param {*} thisObj 
 * @param {*} item 
 */
async function priceMsg(thisObj, item) {
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
        // Set a flag that the invocation came from an enquiry
        this.$session.$data.intent = 'enquiry';

        return this.toIntent('HandleOrderIntent');
    },

    /**
     * Flow
     * 1. Find item from the graph
     * 2. If item is not present, say so and ask for something else, else continue
     * 3. If item cannot be ordered, tell user so and ask if they want anything else. 
     * 4. Check if item has already been ordered
     *  a. If ordered + not-served -> tell user that the item has been ordered, but not served. Please wait for the order to be served or would the user want to order more of it?
     *  b. If ordered + served -> tell user that the item has been ordered already. Would you want to order it again?
     * 5. If item is not ordered
     *  a. If item has count, and
     *      i) count is not provided, ask user for count
     *      ii) count is provided, confirm order and check if user wants more
     *  b. If item does not have count, confirm the order and ask if the user wants anything else
     * 6. If the user says, cancel this order -> pick data from session and ask if the latest one should be cancelled -> confirm & cancel
     * 7. Once done, read the orders and place them
     */
    async Order_item() {
        console.log('In Order_item intent....');
        // Set a flag that the invocation came from an 'order'
        let item, hotel_id;
        /*
        if (_.has(this.$session.$data, 'intent')) {
            if (_.isEqual(this.$session.$data.intent, 'enquiry')) {
                item = this.$session.$data.item;
                hotel_id = this.$session.$data.hotel.hotel_id;
            }
        }
        */

        return this.toIntent('HandleOrderIntent');
        /*
        const isCompleted = this.$alexaSkill.$dialog.isCompleted();
        const hasReqCount = _.has(this.$inputs, 'req_count.value');
        console.log('###isCompleted=', isCompleted);
        if (!isCompleted && !hasReqCount) {
            console.log('%%% delegating to alexa');
            this.$alexaSkill.$dialog.delegate();
            return this.$alexaSkill.$dialog.elicitSlot('req_count', 'Please let me know the count of items')
        } else {
            console.log('%%% sending to HandleOrderIntent');
            return this.toIntent('HandleOrderIntent');
        }
        */

        /*
         if (!this.$alexaSkill.$dialog.isCompleted()) {
             this.$alexaSkill.$dialog.delegate();
         } else if (!_.has(this.$inputs, 'req_count.value')) {
             this.$alexaSkill.$dialog.elicitSlot('req_count', 'How many items do you need?', 'How many items do you need?');
         } else if (this.$alexaSkill.$dialog.getIntentConfirmationStatus() !== 'CONFIRMED') {
             let speech = `Should I confirm this order?`
             let reprompt = speech;
             this.$alexaSkill.$dialog.confirmIntent(speech, reprompt);
         } else if (this.$alexaSkill.$dialog.getIntentConfirmationStatus() === 'CONFIRMED') {
             this.$session.$data.intent = 'order';
             return this.toIntent('HandleOrderIntent');
         }
         */

    },

    /**
     * This is a common handler for both Enquiry_facility and Order_item intents
     * The only difference between these two intents is the way the response is given to the user.
     * 
     * For example, 'Do you have a dosa' vs. 'I want to order a dosa'. Responses should be
     * 'We have a dosa, would you like to order one'? vs 'I have taken the order for a dosa, would you like anything else?'
     */
    async HandleOrderIntent() {

        let hotel_id = this.$session.$data.hotel.hotel_id,
            intent = this.$session.$data.intent;
        let item_name, req_count;
        if (_.has(this.$inputs, 'facility_slot.value')) {
            // facility slot has value
            item_name = this.$inputs.facility_slot.value;
        } else {
            // return this.ask(this.t('ORDER_ASK_ITEM_NAME'));
            // This should be set in the Alexa console
        }

        /*
        * This happens in the following flow
        * Guest: Do you have coffee
        * Kam: We have coffee at our hotel. It costs Rupees 10. Would you like to order it
        * Guest: Yes
        * Kam: Check if the item has been already orderd. If yes, say so and get confirmation
        */
        if (_.isEqual(intent, 'order') && !_.isUndefined(this.$session.$data.item)) { // The user has enquired for the item instead of ordering it
            return this.toStateIntent('OrderItemExists_State', 'OrderFlow_CheckReorder_Intent');
        }

        let item;   // Step 1
        try {
            item = await DBFuncs.item(hotel_id, item_name);
        } catch (error) {
            if ((error instanceof KamError.InputError) || (error instanceof KamError.DBError)) {
                return this.tell(this.t('SYSTEM_ERROR'));
            }
        }

        let msg = '';
        if (_.isEmpty(item)) {
            this
                .$speech
                .addText(this.t('FACILITY_NOT_AVAILABLE', { item: item_name }))
                .addBreak('200ms')
                .addText(this.t('ORDER_ANYTHING_ELSE'));
            return this.ask(this.$speech);
        } else if (_.isEqual(item.a, false)) {
            msg = item.msg['no'];
            this.$speech
                .addText(msg)
                .addBreak('200ms')
                .addText(this.t('ANYTHING_ELSE'));
            return this.ask(this.$speech);
        }

        let isOrderable = !_.has(item, 'o') ? false : item.o;
        console.log('+++item=', item, ', isOrderable=', isOrderable);

        if (_.isEqual(isOrderable, false)) {    // Step 2
            console.log('isOrdeerable is false');
            // Item is present, 'cannot' be ordered. Give information about the item
            msg = item.msg['yes'];
            this.$speech
                .addText(msg)
                .addBreak('200ms')
                .addText(this.t('ANYTHING_ELSE'));
            return this.ask(this.$speech);
        }

        console.log('going to step 3 ......')
        this.$session.$data.item = item;    // Set the item for the followup
        if (_.isEqual(intent, 'enquiry')) { // The user has enquired for the item instead of ordering it
            // Facility is present and can also be ordered
            // Ask user if they want to order it
            // Give information about the price as well (free or costs money)
            let msg = await priceMsg(this, item);
            this.$speech
                .addText(msg)
                .addBreak('200ms')
                .addText(this.t('ITEM_ORDER_QUESTION', {    // We have dosa at our restaurant. Its cost is rupees 60. Would you like to order one?
                    item_name: item.name
                }));

            return this
                .followUpState('OrderItemExists_State')
                .ask(this.$speech, this.t('YES_NO_REPROMPT'));
        } else {
            return this.toStateIntent('OrderItemExists_State', 'OrderFlow_CheckReorder_Intent');
        }
    },

    'OrderItemExists_State': {
        async OrderFlow_CheckReorder_Intent() {
            var item = this.$session.$data.item,
                room_no = this.$session.$data.hotel.room_no;

            let price = item.price, limit = item.limit;

            // Check if the guest has ordered the same item + on the same day + unserved
            // If the same item has been ordered, check with guest and continue the flow, else continue the following
            try {
                let sameOrders = await DBFuncs.already_ordered_items(hotel_id, room_no, item);
                const prevOrdersCount = sameOrders.length;
                if (prevOrdersCount > 0) { // There have been prior orders from this guest
                    // Status = 'new', 'progress' = tell user that the item has already been ordered. Would you like to still order it?
                    // Status = 'cant_serve' = tell user that unfortunately, the order cannot be served
                    // Status = 'done' = tell user that the item has already been order today. Would you like to order again?
                    // Status = 'cancelled', proceed with the order taking
                    const status_new = _.filter(orders, { curr_status: { status: 'new' } });
                    const status_progress = _.filter(orders, { curr_status: { status: 'progress' } });
                    const status_done = _.filter(orders, { status: { curr_status: 'done' } });
                    const status_cant_serve = _.filter(orders, { curr_status: { status: 'cant_serve' } });
                    const status_canceled = _.filter(orders, { curr_status: { status: 'cancelled' } });
                    if (!_.isEmpty(status_new) || !_.isEmpty(status_progress)) {
                        this
                            .$speech
                            .addText(this.t('ORDER_IN_PROGRESS'))
                            .addBreak('200ms')
                            .addText(this.t('ORDER_ASK_AGAIN'));

                        return this
                            .followUpState('OrderAgain_State')
                            .ask(this.$speech, this.t('YES_NO_PROMPT'));
                    } else if (!_.isEmpty(status_done) || !_.isEmpty(status_canceled)) {
                        // Check the limits for this order
                        if (!_.isUndefined(limit)) {    // There are limits on this item
                            if (!_.isUndefined(price)) {    // The item costs money, so why check for limit. This is a problem in DB setup
                                // Do nothing. Continue with the order process
                            } else {    // The item is free
                                //TODO: Implement the "limit on orders" flow -> complicated!
                            }
                        }
                    } else if (!_.isEmpty(status_cant_serve)) {
                        // What to do if the hotel was unable to serve a previous order, and the user wants to place the order again
                        //this
                        //    .$speech
                        //    .addText(this.t('ORDER_UNABLE_TO_SERVE'))
                        //    .addBreak('200ms')
                        //    .addText(this.t('ORDER_PLACE_AGAIN'));

                        //FIXME: Is it required to tell the person that the hotel was unable to serve previous order?
                    }
                }
            } catch (error) {
                if ((error instanceof KamError.InputError) || (error instanceof KamError.DBError)) {
                    this.tell(this.t('SYSTEM_ERROR'));
                }
            }

            // Go to intent OrderFlow_CheckCount_Intent
            return this.toStateIntent('OrderAgain_State', 'OrderFlow_CheckCount_Intent');
        },

        /**
         * This YesIntent is invoked when the user says YES for a question: 'We have the dosa, would you like to order it?'
         */
        async YesIntent() {
            // Go to OrderFlowIntent
            console.log('OrderItem_ExistsState::Sending to OrderFlow_CheckReorder_Intent.....')
            this.$request.setIntentName('Order_item');
            return this.toStatelessIntent('Order_item');
            //return this.toIntent('OrderFlow_CheckReorder_Intent');
        },

        /**
         * This NoIntent is invoked since the user says that they do not want the item
         */
        NoIntent() {
            console.log('User does not want anything');
            this.$speech
                .addText(this.t('ANYTHING_ELSE'));
            this.removeState(); // This makes the next invocation go global
            return this.ask(this.$speech);
        }
    },

    'OrderAgain_State': {
        async OrderFlow_CheckCount_Intent() {

            var item = this.$session.$data.item,
                room_no = this.$session.$data.hotel.room_no,
                req_count = _.isUndefined(this.$inputs.req_count) ? undefined : this.$inputs.req_count.value;

            // If item has count
            if (item.c && !_.isUndefined(req_count)) {    // count is defined for this item & its also provided as part of request
                this.$speech
                    .addText(this.t('REPEAT_ORDER_WITH_COUNT', { req_count: req_count, item_name: item.name }))
                    .addBreak('200ms')
                    .addText(this.t('ORDER_ANYTHING_ELSE'));

                addOrderToSession(this, item, req_count);

                //this.removeState(); // This is to ensure that the user can anything else
                return this.followUpState('ConfirmRoomItemOrder_State')
                    .ask(this.$speech, this.t('YES_NO_REPROMPT'));
            } else if (item.c && _.isUndefined(req_count)) {    // Item has count, but its not provided in the request
                // NOTE: This condition should not arise, since this check is done at Alexa skill intent dialog setting
                // Item does not have a count flag. Like 'Do you have dosa'
                console.log('intent came here....sending to AskItemCount_State');
                this.$speech
                    .addText(this.t('ORDER_ASK_COUNT'));
                return this
                    .followUpState('AskItemCount_State')
                    .ask(this.$speech);
            } else if (!item.c) {   // Item does not have count flag. Add it to the orders
                // NOTE: This condition should not arise for room items and menu items, since each one of them should have count
                this.$speech
                    .addText(this.t('REPEAT_ORDER_WITHOUT_COUNT'), { item_name: item.name })
                    .addBreak('200ms')
                    .addText(this.t('ORDER_ANYTHING_ELSE'));
                addOrderToSession(this, item, 1);
                return this.followUpState('ConfirmRoomItemOrder_State')
                    .ask(this.$speech, this.t('YES_NO_REPROMPT'));
            }
        },

        /**
         * This YesIntent is when user wants to re-order an item that has already been in progress
         */
        async YesIntent() {
            // Go to OrderFlowIntent
            console.log('sending to Order_item....');
            this.removeState();
            return this.toIntent('Order_item');
            //return this.toIntent('OrderFlow_CheckCount_Intent');
        },

        /**
         * This NoIntent is invoked since the user says that they do not want the item
         */
        NoIntent() {
            console.log('User does not want anything');
            this.$speech
                .addText(this.t('ANYTHING_ELSE'));
            this.removeState(); // This makes the next invocation go global
            return this.ask(this.$speech);
        }
    },

    'ConfirmRoomItemOrder_State': {

        YesIntent() {
            return this.ask(this.t('ASK_ITEM_NAME'));
        },

        NoIntent() {
            // Guest has finalized the order. Configm the order, check and close
            let msg = stringifyOrdersInSession(this);

            this.$speech
                .addText(this.t('ORDER_LIST', { items: msg }))
                .addBreak('200ms')
                .addText(this.t('ORDER_CONFIRM_MSG'));
            return this.followUpState('OrderConfirmed_State')
                .ask(this.$speech, this.t('YES_NO_REPROMPT'));
        }
    },

    'OrderConfirmed_State': {
        YesIntent() {
            // Save records to DB (using appsync)
            var hotel_id = this.$session.$data.hotel.hotel_id,
                user_id = this.$request.context.System.user.userId,
                room_no = this.$session.$data.hotel.room_no,
                orders = getOrdersInSession(this);
            console.log('creating order: hotel_id=' + hotel_id + ',user_id=' + user_id + ',room_no=' + room_no + ',items=', orders);
            try {
                DBFuncs.create_order(hotel_id, room_no, user_id, orders);
            } catch (error) {
                console.log('coding or db error.', error);
                this.tell(this.t('SYSTEM_ERROR'));
            }

            return this.tell(this.t('TELL_ORDER_CONFIRMED'));
        },

        NoIntent() {
            // Ask to cancel order
            this.$speech
                .addText(this.t('ASK_FOR_ORDER_CANCEL'));
            return this.followUpState('CancelCurrentOrder')
                .ask(this.$speech, this.t('YES_NO_REPROMPT'));
        }
    },

    /**
     * Global NoIntent
     */
    async NoIntent() {
        // Say thank you and end
        this.tell(this.t('END'));
    },

    'CancelCurrentOrder': {
        YesIntent() {
            // Reset the values of items, order, item_name and count in the session object
            resetOrdersInSession(this);

            this.$speech
                .addText(this.t('CONFIRM_ORDER_CANCEL'))
                .addBreak('200ms')
                .addText(this.t('ORDER_ANYTHING_ELSE'));
            return this.ask(this.$speech);
        },

        NoIntent() {
            // The guest is in two minds.
            // TODO: What to do now?
        }
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

        msg = await priceMsg(this, item);
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
    }
}