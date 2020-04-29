/* Copyright (C) Kamamishu Pvt. Ltd. - All Rights Reserved
 * Unauthorized copying of this file, via any medium is strictly prohibited
 * Proprietary and confidential
 */

/*
 * This handler answers queries related to the hotel facility
 */
'using strict';

let _ = require('lodash'),
    KamError = require('../utils/KamError'),
    DBFuncs = require('../db/db_funcs');

const { Item, MenuItem, Facility, RoomItem } = require('./Item');
const { OrdersInSession } = require('./OrdersInSession');

/*********************************************** Order_Item handler *****************************************************/
/**
 * Finds same kind of orders
 * @param {any} itemObj The object of the item
 * @param {any} hotel_id
 * @param {any} room_no
 * @returns {status:'progress'/none, pre:[previous orders]}
 */
async function checkForReorders(itemObj, hotel_id, room_no) {
    // Check if the guest has ordered the same item + on the same day + unserved
    // If the same item has been ordered, check with guest and continue the flow, else continue the following
    let prevOrders = { status: 'none', prev: {} };
    try {
        let sameOrders = await DBFuncs.already_ordered_items(hotel_id, room_no, itemObj);
        const prevOrdersCount = sameOrders.length;
        console.log('^^prevOrderCount=', prevOrdersCount);
        if (prevOrdersCount > 0) { // There have been prior orders from this guest
            // Status = 'new', 'progress' = tell user that the item has already been ordered. Would you like to still order it?
            // Status = 'cant_serve' = tell user that unfortunately, the order cannot be served
            // Status = 'done' = tell user that the item has already been order today. Would you like to order again?
            // Status = 'cancelled', proceed with the order taking
            const status_new = _.filter(sameOrders, { curr_status: { status: 'new' } });
            const status_progress = _.filter(sameOrders, { curr_status: { status: 'progress' } });
            const status_done = _.filter(sameOrders, { status: { curr_status: 'done' } });
            const status_cant_serve = _.filter(sameOrders, { curr_status: { status: 'cant_serve' } });
            const status_canceled = _.filter(sameOrders, { curr_status: { status: 'cancelled' } });
            if (!_.isEmpty(status_new) || !_.isEmpty(status_progress)) {
                prevOrders = {
                    status: 'progress',
                    prev: _.concat(status_new, status_progress)
                }
            } else if (!_.isEmpty(status_done) || !_.isEmpty(status_canceled)) {
                let price = itemObj.price(), limit = itemObj.limit();
                // Check the limits for this order
                if (!_.isUndefined(limit)) {    // There are limits on this item
                    if (_.isEqual(price, 0)) {    // The item costs money, so why check for limit. This is a problem in DB setup
                        // Do nothing. Continue with the order process
                    } else if (price > 0) {    // The item is free
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
            throw error;
        }
    }
    return prevOrders;
}


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
module.exports = {
    async Order_item() {
        console.log('++got into HandleOrderIntent');
        let hotel_id = this.$session.$data.hotel.hotel_id,
            room_no = this.$session.$data.hotel.room_no,
            inSessionOrders = new OrdersInSession();

        let item_name = _.has(this.$inputs.facility_slot, 'value') ? this.$inputs.facility_slot.value : '';

        console.log('+++hasValue+++', this.$inputs.facility_slot);
        console.log('---hasEntityMatch---', JSON.stringify(this.$alexaSkill.hasEntityMatch('facility_slot')));
        console.log('---getEntityMatches---', JSON.stringify(this.$alexaSkill.getEntityMatches('facility_slot')));
        console.log('---getDynamicEntityMatches---', JSON.stringify(this.$alexaSkill.getDynamicEntityMatches('facility_slot')));
        console.log('---getStaticEntityMatches---', JSON.stringify(this.$alexaSkill.getStaticEntityMatches('ifacility_slot')));

        let absMatch = true;
        if (!this.$alexaSkill.$dialog.isCompleted()) {
            this.$alexaSkill.$dialog.delegate();
        } else if (_.isEmpty(item_name)) {
            if (!this.$alexaSkill.hasEntityMatch('facility_slot') &&
                _.isEmpty(this.$alexaSkill.getEntityMatches('facility_slot'))) {
                console.log('+++--No Matches--+++');
                absMatch = false;
                this.$speech
                    .addText(this.t('SORRY'))
                    .addBreak('100ms')
                    .addText(this.t('UNKNOWN_REQUEST'))
                    .addBreak('100ms')
                    .addText(this.t('HELP_MESSAGE'));
                return this
                    .$alexaSkill
                    .$dialog
                    .elicitSlot('facility_slot', this.t('REPEAT_REQUEST'), this.$speech);
            }
        }
        // else if (this.$alexaSkill.$dialog.getIntentConfirmationStatus() !== 'CONFIRMED') {
        //     let reprompt = speech = `So you would like to order ${this.$inputs.facility_slot.value}, right?`;
        //     return this.$alexaSkill.$dialog.confirmIntent(speech, reprompt);
        // }

        // Check if the item exists before asking for count
        let item = {};   // Step 1
        try {
            item = await DBFuncs.item(hotel_id, item_name, absMatch);
        } catch (error) {
            if ((error instanceof KamError.InputError) || (error instanceof KamError.DBError)) {
                return this.tell(this.t('SYSTEM_ERROR'));
            }
        }

        // If the hotel does not have this item, say so and ask for something else  
        if (_.isEmpty(item)) {
            this
                .$speech
                .addText(this.t('FACILITY_NOT_AVAILABLE', { item_name: item_name }))
                .addBreak('200ms')
                .addText(this.t('ORDER_ANYTHING_ELSE'));
            return this.ask(this.$speech);
        }

        let itemObj = {};
        if (!_.isEmpty(item)) {
            itemObj = Item.load(item);
        }

        let reqCount = 1;
        if (_.has(this.$inputs.req_count, 'value')) {
            reqCount = parseInt(this.$inputs.req_count.value);
            if (isNaN(reqCount)) reqCount = -1;
        }
        if (itemObj.hasCount()) {
            if (!this.$alexaSkill.$dialog.isCompleted()) {
                this.$alexaSkill.$dialog.delegate();
            } else if (_.isEqual(reqCount, -1)) {
                console.log('+++--No Matches--+++');
                return this
                    .$alexaSkill
                    .$dialog
                    .elicitSlot('req_count', this.t('REQUEST_ITEM_COUNT'), this.t('REQUEST_ITEM_COUNT'));
            }
            //  else if (this.$alexaSkill.$dialog.getIntentConfirmationStatus() !== 'CONFIRMED') {
            //     let reprompt = speech = `So you would like ${req_count} of ${item_name}, right?`;
            //     return this.$alexaSkill.$dialog.confirmIntent(speech, reprompt);
            // } else if (this.$alexaSkill.$dialog.getIntentConfirmationStatus() === 'CONFIRMED') {
            //     console.log('Guest confirmed order:', this.$inputs.facility_slot);
            //     // return this.tell('You have requested for ' + req_count + ' ' + item_name);
            //     // FIXME: Populate the count
            // }
        }

        // If item is not available say so and ask for something else
        let msg = '';
        if (!itemObj.available()) {
            msg = itemObj.msgNo();
            this.$speech
                .addText(msg)
                .addBreak('200ms')
                .addText(this.t('ANYTHING_ELSE'));
            return this.ask(this.$speech);
        }

        // If item is not orderable, tell about the item and ask for something else
        if (!itemObj.orderable()) {
            console.log('isOrdeerable is false');
            // Item is present, 'cannot' be ordered. Give information about the item
            msg = itemObj.msgYes();
            this.$speech
                .addText(msg)
                .addBreak('200ms')
                .addText(this.t('ANYTHING_ELSE'));
            return this.ask(this.$speech);
        }

        // Check for re-orders
        console.log('+++_---itemObj=', itemObj, '--typeof=', itemObj instanceof MenuItem);
        let prevOrders = await checkForReorders(itemObj, hotel_id, room_no);
        console.log('prevOrders=', prevOrders, '---currOrders=', this.$session.$data.orders);
        switch (prevOrders.status) {
            case 'none':    //No previous orders
                // Read the order and ask for confirmation
                this.$speech
                    .addText(this.t('REPEAT_ORDER_WITH_COUNT', { req_count: reqCount, item_name: itemObj.name }))
                    .addBreak('200ms')
                    .addText(this.t('ORDER_ANYTHING_ELSE'));
                console.log('there are no prev orders...sending to confirmroomitemorder');
                inSessionOrders.add(itemObj, reqCount);
                this.$session.$data.orders = inSessionOrders.currOrders(); // Set these orders in session, so that other intents have access to these

                return this
                    .followUpState('ConfirmRoomItemOrder_State')
                    .ask(this.$speech, this.t('YES_NO_REPROMPT'));
                break;
            case 'progress':
                let cnt = 0;
                prevOrders.prev.map((p) => {
                    cnt += p.item.req_count;
                });
                this
                    .$speech
                    .addText(this.t('ORDER_IN_PROGRESS', { req_count: cnt, item_name: itemObj.name }))
                    .addBreak('200ms')
                    .addText(this.t('ORDER_ASK_AGAIN'));
                this.$session.$data.tmpItem = { itemObj: itemObj, req_count: reqCount };

                console.log('there is an order in progress...');
                return this
                    .followUpState('ReOrder_State')
                    .ask(this.$speech, this.t('YES_NO_PROMPT'));
                break;
            case 'done':
                break;
            case 'cant_serve':
                break;
        }

        console.log('### did not hit switch conditions');
    },

    'ReOrder_State': {
        /**
         * This YesIntent is when user wants to re-order an item that has already been in progress
         */
        async YesIntent() {
            // Go to OrderFlowIntent
            console.log('Guest wants to reorder......');

            let orders = _.isUndefined(this.$session.$data.orders) ? [] : this.$session.$data.orders;
            let inSessionOrders = new OrdersInSession(orders);
            console.log('===+++orders=', inSessionOrders.toString());
            if (_.has(this.$session.$data.tmpItem, 'itemObj')) {
                console.log('tmpObj....', this.$session.$data.tmpItem);
                let itemObj = Item.load(this.$session.$data.tmpItem.itemObj);
                inSessionOrders.add(itemObj, this.$session.$data.tmpItem.req_count);
                this.$session.$data.orders = inSessionOrders.currOrders();
                this.$speech
                    .addText(this.t('REPEAT_ORDER_WITH_COUNT', { req_count: this.$session.$data.tmpItem.req_count, item_name: itemObj.name }))
                    .addBreak('200ms')
                    .addText(this.t('ORDER_ANYTHING_ELSE'));

                return this
                    .followUpState('ConfirmRoomItemOrder_State')
                    .ask(this.$speech, this.t('YES_NO_REPROMPT'))
            } else {
                //FIXME: Should not happen, but take care of this
            }
        },

        /**
         * This NoIntent is invoked since the user says that they do not want the item
         */
        NoIntent() {
            console.log('User does not want anything');
            this.$session.$data.tmpItem = {};
            this.$speech
                .addText(this.t('ANYTHING_ELSE'));
            this.removeState(); // This makes the next invocation go global
            return this.ask(this.$speech);
        }
    },

    'ConfirmRoomItemOrder_State': {
        YesIntent() {
            return this.toIntent('Order_Item'); // Start the request process again
        },

        NoIntent() {
            let orders = _.isUndefined(this.$session.$data.orders) ? [] : this.$session.$data.orders;
            let inSessionOrders = new OrdersInSession(orders);
            // Guest has finalized the order. Configm the order, check and close
            let msg = inSessionOrders.toString();

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
                orders = _.isUndefined(this.$session.$data.orders) ? [] : this.$session.$data.orders;
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

    'CancelCurrentOrder': {
        YesIntent() {
            // Reset the values of items, order, item_name and count in the session object
            this.$session.$data.orders = [];

            this.$speech
                .addText(this.t('CONFIRM_ORDER_CANCEL'))
                .addBreak('200ms')
                .addText(this.t('ORDER_ANYTHING_ELSE'));
            this.removeState(); // This makes the next invocation go global
            return this.ask(this.$speech);
        },

        NoIntent() {
            this.$speech
                .addText(this.t('ORDER_ANYTHING_ELSE'));
            this
                .ask(this.$speech);
        }
    },
    /*********************************************** Order_Item handler END *****************************************************/

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

        let orderCount = 0;
        let ordersInSession = _.isUndefined(this.$session.$data.orders) ? [] : this.$session.$data.orders;
        let ordersSentToFrontDesk = [];
        try {
            ordersSentToFrontDesk = await DBFuncs.new_orders(hotel_id, room_no, user_id);
        } catch (error) {
            console.log('error in fetching orders sent to front desk:', error);
            //FIXME: What to do incase of DB errors
        }
        console.log('++allorders=', ordersInSession, '---at frontdesk=', ordersSentToFrontDesk);
        orderCount = ordersInSession.length + ordersSentToFrontDesk.length;

        // Read out the orders and ask for confirmation
        let msg_InSession = '';
        if (ordersInSession.length > 0) {
            let inSessionOrders = new OrdersInSession(ordersInSession);
            msg_InSession = inSessionOrders.toString();
        }
        let msg_AtFrontDesk = '';
        if (ordersSentToFrontDesk.length > 0) {
            msg_AtFrontDesk = ', ' + OrdersInSession.stringifyOrdersAtFrontDesk(ordersSentToFrontDesk);
        }
        console.log('mesages=', msg_InSession, '++at fd=', msg_AtFrontDesk);

        if (_.isEmpty(item_name) || (!this.$alexaSkill.hasEntityMatch('facility_slot') && _.isEmpty(this.$alexaSkill.getEntityMatches('facility_slot')))) {
            console.log('item name not provided...');
            if (!this.$alexaSkill.$dialog.isCompleted()) {
                console.log('delegating...');
                this.$alexaSkill.$dialog.delegate();
            } else {
                if (!_.isEmpty(msg_InSession)) {
                    this.$speech
                        .addText(this.t('ORDER_LIST', { items: msg_InSession }))
                        .addBreak('200ms');
                }
                if (!_.isEmpty(msg_AtFrontDesk)) {
                    this.$speech
                        .addText(this.t('ORDER_LIST_AT_FRONTDESK', { items: msg_AtFrontDesk }))
                        .addBreak('200ms');
                }

                if (_.isEmpty(msg_InSession) && _.isEmpty(msg_AtFrontDesk)) {
                    console.log('%%no items ordered...asking user..');
                    this.$speech
                        .addText(this.t('ORDERS_NONE'))
                        .addBreak('200ms')
                        .addText(this.t('ANYTHING_ELSE'));
                    return this.ask(this.$speech);
                } else {
                    console.log('^^some item found.ading message:');
                    this.$speech
                        .addText(this.t('ORDER_WHICH_TO_CANCEL'));
                    return this
                        .$alexaSkill
                        .$dialog
                        .elicitSlot('facility_slot', this.$speech, this.$speech);
                }
            }
        } else if (!_.isEmpty(item_name)) {
            console.log('user has provided an item name to cancl:', item_name);
            // If the user has told the name of the item
            let item = {};   // Step 1
            try {
                item = await DBFuncs.item(hotel_id, item_name);
            } catch (error) {
                if ((error instanceof KamError.InputError) || (error instanceof KamError.DBError)) {
                    return this.tell(this.t('SYSTEM_ERROR'));
                }
            }

            console.log('FOUN item:', item);
            let orderedItem;
            if (ordersInSession.length > 0) {
                orderedItem = _.filter(ordersInSession, { name: item.name });
                console.log('--item is in session:', orderedItem);
                if (orderedItem.length > 0) {
                    // Confirm cancellation of this order
                    this.$speech
                        .addText(this.t('ORDER_CANCEL_REMOVE_ITEM', { count: orderedItem[0].req_count, item_name: orderedItem[0].name }))   //orderedItem[0] is fine, as there cannot be multiple entries for the same item
                        .addBreak('200ms')
                        .addText(this.t('ANYTHING_ELSE'));

                    // Remove order from list
                    _.remove(this.$session.$data.orders, { name: item_name });
                }
            } else if (ordersSentToFrontDesk.length > 0) {
                orderedItem = _.filter(ordersSentToFrontDesk, { item: { name: item.name } });
                console.log('--item is in previous orders:', orderedItem);
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
            }
            this.ask(this.$speech);
        }
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

        let ordersInSession = _.isUndefined(this.$session.$data.orders) ? [] : this.$session.$data.orders;
        let ordersSentToFrontDesk = [];
        try {
            ordersSentToFrontDesk = await DBFuncs.new_orders(hotel_id, room_no, user_id);
        } catch (error) {
            console.log('error in fetching orders sent to front desk:', error);
            //FIXME: What to do incase of DB errors
        }
        console.log('++allorders=', ordersInSession, '---at frontdesk=', ordersSentToFrontDesk);
        orderCount = ordersInSession.length + ordersSentToFrontDesk.length;

        // Read out the orders and ask for confirmation
        let msg_InSession = '';
        if (ordersInSession.length > 0) {
            let inSessionOrders = new OrdersInSession(ordersInSession);
            msg_InSession = inSessionOrders.toString();
        }
        let msg_AtFrontDesk = '';
        if (ordersSentToFrontDesk.length > 0) {
            msg_AtFrontDesk = ', ' + OrdersInSession.stringifyOrdersAtFrontDesk(ordersSentToFrontDesk);
        }
        console.log('mesages=', msg_InSession, '++at fd=', msg_AtFrontDesk);

        if (!_.isEmpty(msg_InSession)) {
            this.$speech
                .addText(this.t('ORDER_LIST', { items: msg_InSession }))
                .addBreak('200ms');
        }
        if (!_.isEmpty(msg_AtFrontDesk)) {
            this.$speech
                .addText(this.t('ORDER_LIST_AT_FRONTDESK', { items: msg_AtFrontDesk }))
                .addBreak('200ms');
        }

        if (_.isEmpty(msg_InSession) && _.isEmpty(msg_AtFrontDesk)) {
            console.log('%%no items ordered...asking user..');
            this.$speech
                .addText(this.t('ORDERS_NONE'))
                .addBreak('200ms');
        }

        this.$speech.addText(this.t('ANYTHING_ELSE'));
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
        let orders = this.$session.$data.orders;
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
}