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

/**
 * 
 * @param {*} thisObj 
 */
async function get_item(hotel_id, item_name) {
    
    console.log('get_room_item. hotel_id='+ hotel_id + ', item_name='+ item_name);
        
    let item;
    try {
        item = await DBFuncs.facility(hotel_id, item_name);
    } catch(error) {
        throw error;
    }

    return item;
}

function set_item(thisObj, item) {
    thisObj.$session.$data.items.push(item);
}

function get_items(thisObj) {
    return thisObj.$session.$data.items;
}

function reset_items(thisObj) {
    thisObj.$session.$data.items = [];
}

function respond_for_multiple_items(thisObj, db_item, item_name, req_count) {
    console.log('respond_for_multiple_items:', db_item, item_name, req_count, _.has(db_item, 'count'));
    let db_item_has_count = _.has(db_item, 'count');
    if (db_item_has_count && _.isUndefined(req_count)) {
        req_count = 1;  // User must have requested like "can I get a soap"
    }

    let item = {
        f_id: db_item._id,
        f_name: item_name
    };

    // Check if the room item object (in database) has "count". If yes, ask for the count of items
    if (!db_item_has_count) { // There is no count for this item
        // Confirm the order
        console.log('item does not require count');
        thisObj.$speech.addText(thisObj.t('REPEAT_ORDER_WITHOUT_COUNT', {
            item_name: item_name
        }));
        item.req_count = 0;
        // thisObj.$session.$data.items.push(item);
        set_item(this, item);
        return thisObj.followUpState('ConfirmRoomItemOrder')
                .ask(thisObj.$speech, thisObj.t('YES_NO_REPROMPT'));
    } else if (db_item_has_count && !_.isUndefined(req_count)) { //User has provided count of items
        // Confirm that you are ordering
        console.log('item has count and user has provided count');
        thisObj.$speech.addText(thisObj.t('REPEAT_ORDER_WITH_COUNT', {
            req_count: req_count, item_name: item_name
        }));
        item.req_count = req_count;
        set_item(this, item);
        // thisObj.$session.$data.items.push(item);
        return thisObj.followUpState('ConfirmRoomItemOrder')
                .ask(thisObj.$speech, thisObj.t('YES_NO_REPROMPT'));
    } else if (db_item_has_count && _.isUndefined(count)) { // User has not provided count of items. Ask for it
        console.log('item has count and user has not provided count');
        thisObj.$speech.addText(thisObj.t('ORDER_REQUEST_COUNT', {
            item_name: item_name
        }));
        return thisObj.followUpState('RequestRoomItemCount')
                .ask(thisObj.$speech, thisObj.t('ORDER_REQUEST_COUNT', {
                    item_name: item_name
                }));
    }
}

module.exports = {
    async Order_item() {
        var item_name = this.$inputs.order_item_slot.value,
            req_count = this.$inputs.req_count.value,
            hotel_id = this.$session.$data.hotel.hotel_id;

        console.log('Order_room_item: item_name='+ item_name + ', req_count=' + req_count);
        var item_obj;
        try {
            item_obj = await get_item(hotel_id, item_name);
            console.log('###item_obj=', item_obj);
        } catch(error) {
            if (error instanceof KamError.InputError || error instanceof KamError.DBError) {
                this.tell(this.t('SYSTEM_ERROR'));
            } else if (error instanceof KamError.FacilityDoesNotExistError) {
                // This error is only incase room item is not available
                this.ask(this.t('ROOM_ITEM_NOT_AVAILABLE', {
                    item_name: this.$inputs.room_item_slot.value
                }));
            }
        }

        // Check if the guest has ordered the same item + on the same day + unserved
        // If the same item has been ordered, check with guest and continue the flow, else continue the following
        try {
            var is_already_ordered  = await DBFuncs.is_item_already_ordered(hotel_id,
                                                                           room_no,
                                                                           item_obj._id);
            if (_.isEqual(is_already_ordered, true)) {
                // Tell guest that the item has already been ordered. Ask if they want to order more
                this.$speech.addText(this.t('ITEM_ALREADY_ORDERED', {
                    item_name: item_name
                }));
            } else {
                // Go with the normal flow. Do nothing
            }
        } catch(error) {
            if ((error instanceof KamError.InputError) || (error instanceof KamError.DBError)) {
                this.tell(this.t('SYSTEM_ERROR'));
            }
        }

        // if (_.isEmpty(this.$session.$data.items)) 
        //     this.$session.$data.items = [];
        set_item(this, []);
        console.log('####req_count=',req_count);
 
        respond_for_multiple_items(this, item_obj, item_name, req_count);
    },

    'ItemAlreadyOrdered': {
        YesIntent() {
            respond_room_item(this,
                              this.$session.$data.item,
                              this.$session.$data.req_count);
        },

        NoIntent() {

        }
    },

    'ConfirmRoomItemOrder': {

        YesIntent() {
            return this.ask(this.t('ASK_ITEM_NAME'));
        },

        NoIntent() {
            // Guest has finalized the order. Configm the order, check and close
            var str = '';
            var items = get_items(this);
            for (var i=0; i<items.length; i++) {
                str += items[i].req_count + ' ' + items[i].f_name + ', '
                console.log('^^^', str);
            }
            this.$session.$data.order = str;

            this.$speech.addText(this.t('ASK_CONFIRM_ORDER', {
                items: str
            }));
            return this.followUpState('OrderConfirmed')
                       .ask(this.$speech, this.t('YES_NO_REPROMPT'));
        }
    },

    'OrderConfirmed': {
        YesIntent() {
            // Save records to DB (using appsync)
            var hotel_id = this.$session.$data.hotel.hotel_id,
                user_id = this.$request.context.System.user.userId,
                room_no = this.$session.$data.hotel.room_no,
                items = get_items(thisObj);
                console.log('creating order: hotel_id='+hotel_id+',user_id='+user_id+',room_no='+room_no+',items=', items);
            try {
                DBFuncs.create_order(hotel_id, room_no, user_id, items);
            } catch(error) {
                console.log('coding or db error.', error);
                this.tell(this.t('SYSTEM_ERROR'));
            }

            return this.tell(this.t('TELL_ORDER_CONFIRMED'));
        },

        NoIntent() {
            // Ask to cancel order
            this.$speech.addText(this.t('ASK_FOR_ORDER_CANCEL', {
                order: this.$session.$data.order
            }));
            return this.followUpState('CancelCurrentOrder')
                       .ask(this.$speech, this.t('YES_NO_REPROMPT'));
        }
    },

    'CancelCurrentOrder': {
        YesIntent() {
            // Reset the values of items, order, item_name and count in the session object
            this.$session.$data.order = this.$session.$data.item_name = this.$session.$data.req_count = null;
            reset_items(thisObj);

            return this.ask(this.t('CONFIRM_ORDER_CANCEL'));
        },

        NoIntent() {
            // The guest is in two minds.
            // TODO: What to do now?
        }
    },

    'RequestRoomItemCount': {
        Count_Input() {
            this.$session.$data.req_count = this.$inputs.req_count.value;

            console.log('RequestRoomItemCount:' + this.$session.$data.req_count);
            this.$speech.addText(this.t('REPEAT_ORDER_WITH_COUNT', {
                req_count: this.$session.$data.req_count, item_name: this.$session.$data.item_name
            }));
            this.$session.$data.items.push({
                f_name: this.$session.$data.item_name,
                req_count: this.$session.$data.req_count
            });
            return this.followUpState('ConfirmRoomItemOrder')
                       .ask(this.$speech, this.t('YES_NO_REPROMPT'));
        }
    },
    
    async Order_cancel() {
        // TODO: Get the orders open + in room_no & hotel_id
    },
    
    async Order_change() {

    }
}