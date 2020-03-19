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
function addOrderToSession(thisObj, item, reqCount) {
    if (_.isEmpty(thisObj.$session.$data.orders)) {
        // First order
        thisObj.$session.$data.orders = [];
    }

    let type;
    if (item.m) {   // menu item
        type = 'menu';
    } else if (item.f) {    // facility. This is for reserving a facility
        //TODO: Add facility reservation
        type = 'facility';
    } else if (item.ri) {   // room item
        type = 'roomitem';
    }
    thisObj.$session.$data.orders.push({ type: type, name: item.name, count: reqCount });
}

// Function to get the current orders from session
function getOrdersInSession(thisObj) {
    return thisObj.$session.$data.orders;
}

// Function to reset order from session
function resetOrdersInSession(thisObj) {
    thisObj.$session.$data.orders = [];
}

module.exports = {
    async Enquiry_reception_languages() {
        var hotel_id = this.$session.$data.hotel_id;
        console.log('Enquiry_reception_languages. hotel_id=' + hotel_id);

        let facility;
        // Session data is empty, get the facility from database
        try {
            facility = await DBFuncs.item(hotel_id, 'reception');
        } catch (error) {
            if (error instanceof KamError.InputError) {
                this.tell(this.t('SYSTEM_ERROR'));
            } else if (error instanceof KamError.DBError) {
                this.tell(this.t('SYSTEM_ERROR'));
            } else if (error instanceof KamError.FacilityDoesNotExistError) {
                this.ask(this.t('FACILITY_NOT_AVAILABLE', {
                    facility: item_name
                }));
            }
        }

        if (facility.p) {   // If reception is present
            var langs = await DBFuncs.item(hotel_id, 'reception_languages');
            const msg = langs.message;
            this.$speech
                .addText(msg)
                .addBreak('200ms')
                .addText(this.t('ANYTHING_ELSE'));

            // Followup state is not required, as this is a straight forward answer and the next query from guest can be anything else
            return this.ask(this.$speech);
        }
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

        return this
            .followUpState('ReadOutAllFacilitiesState')
            .ask(this.$speech, this.t('YES_NO_REPROMPT'));
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
        // Set a flag that the invocation came from an 'order'
        this.$session.$data.intent = 'order';

        return this.toIntent('HandleOrderIntent');
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
            item_name = this.$inputs.facility_slot.value;

        if (_.isUndefined(item_name)) { // User has not provided what they way. Ask for it
            // return this.ask(this.t('ORDER_ASK_ITEM_NAME'));
            // This should be set in the Alexa console
        }

        let item;   // Step 1
        try {
            item = await DBFuncs.item(hotel_id, item_name);
        } catch (error) {
            if ((error instanceof KamError.InputError) || (error instanceof KamError.DBError)) {
                return this.tell(this.t('SYSTEM_ERROR'));
            }
        }
        if (_.isEmpty(item)) {
            this
                .$speech
                .addText(this.t('FACILITY_NOT_AVAILABLE', { item: item_name }))
                .addBreak('200ms')
                .addText(this.t('ORDER_ANYTHING_ELSE'));
            return this.ask(this.$speech);
        }

        console.log('+++item=', item);
        let msg;
        let isOrderable = _.isUndefined(item.o) ? false : item.o;
        if (_.isEqual(isOrderable), false) {    // Step 2
            // Item is present, 'cannot' be ordered. Give information about the item
            msg = facility.msg['yes'];
            this.$speech.addText(msg)
                .addBreak('200ms')
                .addText(this.t('ITEM_ORDER_QUESTION', {
                    item: item_name
                }));
            return this.ask(this.$speech);
        }

        let intent = this.$session.$data.intent;    // Step 3
        item.name = item_name; // Set the item name for creating the order
        this.$session.$data.item = item;    // Set the item for the followup
        if (_.isEqual(intent, 'enquiry')) { // The user has enquired for the item instead of ordering it
            // Facility is present and can also be ordered
            // Ask user if they want to order it
            // Give information about the price as well (free or costs money)
            let msg;
            if (!_.has(item, msg)) {
                // Message is not set in the data. Create one
                const price = item.price;

                let price_msg;
                if (_.isUndefined(price)) {
                    price_msg = this.t('ORDER_FREE');
                    msg = this.t('ORDER_ITEM_EXISTS_WITH_PRICE', { item_name: item.name, price_msg: price_msg });
                } else {
                    price_msg = this.t('ORDER_COSTS');
                    msg = this.t('ORDER_ITEM_EXISTS_WITH_PRICE', { item_name: item.name, price_msg: price_msg });
                }
            } else {
                msg = item.msg['yes'];
            }
            this.$speech.addText(msg)
                .addBreak('200ms')
                .addText(this.t('ITEM_ORDER_QUESTION', {    // We have dosa at our restaurant. Its cost is rupees 60. Would you like to order one?
                    item: item_name
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
                let sameOrders = await DBFuncs.is_item_already_ordered(hotel_id, room_no, item);
                const prevOrdersCount = sameOrders.length;
                if (prevOrdersCount > 0) { // There have been prior orders from this guest
                    // Status = 'new', 'progress' = tell user that the item has already been ordered. Would you like to still order it?
                    // Status = 'cant_serve' = tell user that unfortunately, the order cannot be served
                    // Status = 'done' = tell user that the item has already been order today. Would you like to order again?
                    // Status = 'cancelled', proceed with the order taking
                    const status_new = _.filter(orders, { status: [{ status: 'new' }] });
                    const status_progress = _.filter(orders, { status: [{ status: 'progress' }] });
                    const status_done = _.filter(orders, { status: [{ status: 'done' }] });
                    const status_cant_serve = _.filter(orders, { status: [{ status: 'cant_serve' }] });
                    const status_canceled = _.filter(orders, { status: [{ status: 'cancelled' }] });
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
            return this.toIntent('OrderFlow_CheckReorder_Intent');
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
                // Item does not have a count flag. Like 'Do you have dosa'
                this.$speech
                    .addText(this.t('ORDER_ASK_COUNT'));
                return this
                    .followUpState('AskItemCount_State')
                    .ask(this.$speech);
            } else if (!item.c) {   // Item does not have count flag. Add it to the orders
                this.$speech
                    .addText(this.t('REPEAT_ORDER_WITHOUT_COUNT'))
                    .addBreak('200ms')
                    .addText(this.t('ORDER_ANYTHING_ELSE'));
                addOrderToSession(this, item, 0);
                return this.followUpState('ConfirmRoomItemOrder_State')
                    .ask(this.$speech, this.t('YES_NO_REPROMPT'));
            }
        },

        /**
         * This YesIntent is when user wants to re-order an item that has already been in progress
         */
        async YesIntent() {
            // Go to OrderFlowIntent
            return this.toIntent('OrderFlow_CheckCount_Intent');
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

    'AskItemCount_State': {
        Count_Input() {
            let req_count = this.$inputs.count.value,
                item = this.$session.$data.item;

            console.log('RequestItemCount:' + req_count);
            this.$speech
                .addText(this.t('REPEAT_ORDER_WITH_COUNT', { req_count: req_count, item_name: item.name }))
                .addBreak('200ms')
                .addText(this.t('ORDER_ANYTHING_ELSE'));
            addOrderToSession(this, item, req_count);
            //this.removeState(); // This makes the next invocation go global
            return this.followUpState('ConfirmRoomItemOrder_State')
                .ask(this.$speech, this.t('YES_NO_REPROMPT'));
        }
    },

    'ConfirmRoomItemOrder_State': {

        YesIntent() {
            return this.ask(this.t('ASK_ITEM_NAME'));
        },

        NoIntent() {
            // Guest has finalized the order. Configm the order, check and close
            var str = '';
            const orders = getOrdersInSession(this);
            for (var i = 0; i < orders.length; i++) {
                str += orders[i].reqCount + ' ' + orders[i].name + ', '
                console.log('^^^', str);
            }

            this.$speech.addText(this.t('ASK_CONFIRM_ORDER', {
                items: str
            }));
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
            this.$speech.addText(this.t('ASK_FOR_ORDER_CANCEL', { order: this.$session.$data.order }));
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

    'AskItemCount': {
        Count_Input() {
            this.$session.$data.req_count = this.$inputs.req_count.value;

            console.log('RequestRoomItemCount:' + this.$session.$data.req_count);
            this.$speech
                .addText(this.t('REPEAT_ORDER_WITH_COUNT', { req_count: this.$session.$data.req_count, item_name: this.$session.$data.item.name }));

            addOrderToSession(this, this.$session.$data.item, this.$session.$data.req_count);

            this.ask(this.$speech);
        }
    },

    async Order_cancel() {
        // TODO: Get the orders open + in room_no & hotel_id
    },

    async Order_change() {

    },

    async Enquiry_Facility_timings() {
        let hotel_id = this.$session.$data.hotel.hotel_id,
            item_name = this.$inputs.facility_slot.value;
        let item;
        try {
            item = await DBFuncs.item(hotel_id, item_name);
        } catch (error) {
            if (error instanceof KamError.InputError) {
                this.tell(thisObj.t('SYSTEM_ERROR'));
            } else if (error instanceof KamError.DBError) {
                this.tell(thisObj.t('SYSTEM_ERROR'));
            } else if (error instanceof KamError.FacilityDoesNotExistError) {
                this.ask(thisObj.t('FACILITY_NOT_AVAILABLE', {
                    facility: item_name
                }));
            }
        }

        console.log('+++item=', item);

        let present = item.a;
        if (_.isEqual(present), false) {
            // Facility is not available
            msg = item.msg['no'];
            this.$speech.addText(msg)
                .addBreak('200ms')
                .addText(this.t('ANYTHING_ELSE'));
            return this.ask(this.$session);
        }

        // Get the timings node
        let timings_node_name = item_name + '_timings';
        let timings = await DBFuncs.item(hotel_id, timings_node_name);

        let msg = timings.msg;

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
                this.tell(thisObj.t('SYSTEM_ERROR'));
            } else if (error instanceof KamError.DBError) {
                this.tell(thisObj.t('SYSTEM_ERROR'));
            } else if (error instanceof KamError.FacilityDoesNotExistError) {
                this.ask(thisObj.t('FACILITY_NOT_AVAILABLE', {
                    facility: item_name
                }));
            }
        }

        console.log('+++item=', item);

        let present = item.a;
        if (_.isEqual(present), false) {
            // Facility is not available
            msg = item.msg['no'];
            this.$speech.addText(msg)
                .addBreak('200ms')
                .addText(this.t('ANYTHING_ELSE'));
            return this.ask(this.$session);
        }

        // Get the timings node
        let price_node_name = item_name + '_price';
        let price = await DBFuncs.item(hotel_id, price_node_name);

        let msg = price.msg;

        this.$speech.addText(msg)
            .addBreak('200ms')
            .addText(this.t('ANYTHING_ELSE'));

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
                this.tell(thisObj.t('SYSTEM_ERROR'));
            } else if (error instanceof KamError.DBError) {
                this.tell(thisObj.t('SYSTEM_ERROR'));
            } else if (error instanceof KamError.FacilityDoesNotExistError) {
                this.ask(thisObj.t('FACILITY_NOT_AVAILABLE', {
                    facility: item_name
                }));
            }
        }

        console.log('+++item=', item);

        let present = item.a;
        if (_.isEqual(present), false) {
            // Facility is not available
            msg = item.msg['no'];
            this.$speech.addText(msg)
                .addBreak('200ms')
                .addText(this.t('ANYTHING_ELSE'));
            return this.ask(this.$session);
        }

        // Get the timings node
        let location_node_name = item_name + '_location';
        let location = await DBFuncs.item(hotel_id, location_node_name);

        let msg = location.msg;

        this.$speech.addText(msg)
            .addBreak('200ms')
            .addText(this.t('ANYTHING_ELSE'));

        return this.ask(this.$speech);
    },

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
        return this.ask(this.$session);
    },

    async Enquiry_menu_cuisinetype() {
        let hotel_id = this.$session.$data.hotel.hotel_id;
        let cuisines;
        try {
            cuisines = await DBFuncs.successors(hotel_id, 'cuisines');
        } catch (error) {
            if (error instanceof KamError.InputError) {
                this.tell(thisObj.t('SYSTEM_ERROR'));
            }
        }

        console.log('+++cuisines=', cuisines);
        let msg;
        let present = item.a & _.isUndefined(item.a);
        if (_.isEqual(present), false) {
            // Facility is not available
            msg = item.msg['no'];
        } else if (_.isEqual(present), true) {
            msg = item.msg['yes'];
        }
        this.$speech.addText(msg)
            .addBreak('200ms')
            .addText(this.t('ANYTHING_ELSE'));
        return this.ask(this.$session);
    },

    async Enquiry_res_billing() {

    },

    async Equipment_not_working() {

    },

    async Enquiry_food_delivery_time() {

    },

    async Enquiry_room_last_refurbished_date() {

    },

    async Enquiry_hotel_floors() {

    }
}