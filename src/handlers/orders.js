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
    FACILITIES = require('../db/Facilities');

/**
 * 
 * @param {*} thisObj 
 */
async function get_room_item(thisObj) {

    var hotel_id = thisObj.$session.$data.hotel_id,
        item_name = thisObj.$inputs.room_item_slot.value;
    
    console.log('get_room_item. hotel_id='+ hotel_id + ', item_name='+ item_name);
        
    let room_item;
    try {
        room_item = await FACILITIES.facility(hotel_id, item_name, "r");
        thisObj.$session.$data.facility = facility; // store the facility object so that we can 
    } catch(error) {
        if (error instanceof KamError.InputError) {
            thisObj.tell(thisObj.t('SYSTEM_ERROR'));
        } else if (error instanceof KamError.DBError) {
            thisObj.tell(thisObj.t('SYSTEM_ERROR'));
        } else if (error instanceof KamError.FacilityDoesNotExistError) {
            throw error;
        }
    }

    return room_item;
}

module.exports = {
    async Order_room_item() {
        var item_name = this.$inputs.room_item_slot.value,
            count = this.$inputs.count.value;

        console.log('Order_room_item: item_name='+ item_name + ', count=' + count);
        var room_item;
        try {
            room_item = await get_room_item(this);
        } catch(error) {
            // This error is only incase room item is not available
            this.ask(this.t('ROOM_ITEM_NOT_AVAILABLE', {
                item_name: this.$inputs.room_item_slot.value
            }));
        }

        this.$session.$data.item_name = item_name;
        this.$session.$data.count = count;
        if (_.isEmpty(this.$session.$data.items)) this.$session.$data.items = [];
 
        // Check if the room item object (in database) has "count". If yes, ask for the count of items
        if (_.isUndefined(room_item.count)) { // There is no count for this item
            // Confirm the order
            this.$speech.addText(this.t('REPEAT_ORDER_WITHOUT_COUNT', {
                item_name: item_name
            }));
            this.$session.$data.items.push({item_name: item_name, count: 0});
            console.log('item does not require count');
            return this.followUpState('ConfirmRoomItemOrder')
                       .ask(this.$speech, this.t('YES_NO_REPROMPT'));
        } else if (!_.isUndefined(room_item.count) && !_.isUndefined(count)) { //User has provided count of items
            // Confirm that you are ordering
            this.$speech.addText(this.t('REPEAT_ORDER_WITH_COUNT', {
                count: count, item_name: item_name
            }));
            this.$session.$data.items.push({item_name: item_name, count: count});
            console.log('item has count and user has provided count');
            return this.followUpState('ConfirmRoomItemOrder')
                       .ask(this.$speech, this.t('YES_NO_REPROMPT'));
        } else if (!_.isUndefined(room_item.count) && _.isUndefined(count)) { // User has not provided count of items. Ask for it
            this.$speech.addText(this.t('ORDER_REQUEST_COUNT', {
                item_name: item_name
            }));
            console.log('item has count and user has provided count');
            return this.followUpState('RequestRoomItemCount')
                       .ask(this.$speech, this.t('ORDER_REQUEST_COUNT', {
                           item_name: item_name
                       }));
        }
    },

    'ConfirmRoomItemOrder': {

        YesIntent() {
            return this.ask(this.t('ASK_ITEM_NAME'));
        },

        NoIntent() {
            // Guest has finalized the order. Repeat the order, check and close
            var str = '';
            for (var i=0; i<this.$session.$data.items.length; i++) {
                str += this.$session.$data.items[i].count + ' ' + this.$session.$data.items[i].item_name + ' '
                console.log('%%%', str);
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
            // TODO: Save records to DB
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
            this.$session.$data.order = this.$session.$data.item_name = this.$session.$data.count = null;
            this.$session.$data.items = [];

            return this.ask(this.t('CONFIRM_ORDER_CANCEL'));
        },

        NoIntent() {
            // The guest is in two minds. 
            // TODO: What to do now?
        }
    },

    'RequestRoomItemCount': {
        Count_Input() {
            this.$session.$data.count = this.$inputs.count.value;

            console.log('RequestRoomItemCount:' + this.$session.$data.count);
            this.$speech.addText(this.t('REPEAT_ORDER_WITH_COUNT', {
                count: this.$session.$data.count, item_name: this.$session.$data.item_name
            }));
            this.$session.$data.items.push({item_name: this.$session.$data.item_name, count: this.$session.$data.count});
            return this.followUpState('ConfirmRoomItemOrder')
                       .ask(this.$speech, this.t('YES_NO_REPROMPT'));
        }
    },
    
    async Order_cancel() {

    },
    
    async Order_food() {

    },

    async Order_res_alcohol() {

    },

    async Order_taxi() {

    }
}