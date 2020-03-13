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
    KamError = require('../utils/KamError'),
    HELPER = require('../utils/helpers');

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

function getOrdersInSession(thisObj) {
    return thisObj.$session.$data.orders;
}

function resetOrdersInSession(thisObj) {
    thisObj.$session.$data.orders = [];
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

    async Enquiry_facility_exists() {
        let hotel_id = this.$session.$data.hotel.hotel_id,
            item_name = this.$inputs.facility_slot.value;
        let item;
        try {
            item = await DBFuncs.item(hotel_id, item_name);
        } catch (error) {
            if (error instanceof KamError.InputError) {
                return this.tell(this.t('SYSTEM_ERROR'));
            } else if (error instanceof KamError.DBError) {
                return this.tell(this.t('SYSTEM_ERROR'));
            } else if (error instanceof KamError.FacilityDoesNotExistError) {
                this
                    .$speech
                    .addText(this.t('FACILITY_NOT_AVAILABLE', { item: item_name }))
                    .addBreak('200ms')
                    .addText(this.t('ORDER_ANYTHING_ELSE'));
                return this.ask(this.$speech);
            }
        }

        console.log('+++item=', item);
        let msg;
        let present = item.a;
        if (_.isEqual(present), false) {
            // Facility is not available
            msg = item.msg['no'];
            this.$speech.addText(msg)
                .addBreak('200ms')
                .addText(this.t('FOLLOWUP_QUESTION', {
                    item: item_name
                }));
            return this.ask(this.$session);
        }

        let presentAndOrderable = item.a & (isOrderable = _.isUndefined(item.o) ? false : item.o);
        if (_.isEqual(presentAndOrderable), true) {
            // Facility is present and can also be ordered
            // Ask user if they want to order it
            msg = item.msg['yes'];
            this.$speech.addText(msg)
                .addBreak('200ms')
                .addText(this.t('ITEM_ORDER_QUESTION', {    // We have dosa at our restaurant. Its cost is rupees 60. Would you like to order one?
                    item: item_name
                }));

            this.$session.$data.item = { name: item_name, item: item };    // Set the item for the followup
            return this
                .followUpState('FacilityExists_OrderItemState')
                .ask(this.$speech, this.t('YES_NO_REPROMPT'));
        } else {
            // Item is present, give information about the item
            msg = facility.msg['yes'];
            this.$speech.addText(msg)
                .addBreak('200ms')
                .addText(this.t('ITEM_ORDER_QUESTION', {
                    item: item_name
                }));
            this.ask(this.$speech);
        }
    },

    'FacilityExists_OrderItemState': {
        async YesIntent() {
            // Check if the item has a count
            console.log('#####item=', this.$session.$data.item);
            var item = this.$session.$data.item,
                req_count = _.isUndefined(this.$inputs.req_count) ? undefined : this.$inputs.req_count.value;

            // If item has count
            if (item.c && !_.isUndefined(req_count)) {    // count is defined for this item & its also provided as part of request
                this.$speech
                    .addText(this.t('REPEAT_ORDER_WITH_COUNT', { req_count: req_count, item_name: item.name }))
                    .addBreak('200ms')
                    .addText(this.t('ORDER_ANYTHING_ELSE'));

                addOrderToSession(this, item, req_count);
                this.ask(this.$speech);
            } else if (item.c && _.isUndefined(req_count)) {    // Item has count, but its not provided in the request
                // Item does not have a count flag. Like 'Do you have dosa'
                return this
                    .followUpState('AskItemCount')
                    .ask(this.$speech, this.t('ORDER_ASK_COUNT', {
                        item_name: item.name
                    }));
            } else if (!item.c) {   // Item does not have count flag. Add it to the orders
                this.$speech
                    .addText(this.t('REPEAT_ORDER_WITHOUT_COUNT'))
                    .addBreak('200ms')
                    .addText(this.t('ORDER_ANYTHING_ELSE'));
                addOrderToSession(this, item, 0);
                this.ask(this.$speech);
            }
        },

        NoIntent() {
            console.log('User does not want anything');
            this.$speech
                .addText(this.t('ANYTHING_ELSE'));
            //FIXME: What if the user says "No" => say Thank you very much
            return this.ask(this.$speech);
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

    async Order_item() {
        var item_name = this.$inputs.order_item_slot.value,
            req_count = this.$inputs.req_count.value,
            hotel_id = this.$session.$data.hotel.hotel_id;

        console.log('Order_item: item_name=' + item_name + ', req_count=' + req_count);
        var item;
        try {
            item = await DBFuncs.item(hotel_id, item_name);
            console.log('###item_obj=', item);
        } catch (error) {
            if (error instanceof KamError.InputError || error instanceof KamError.DBError) {
                this.tell(this.t('SYSTEM_ERROR'));
            } else if (error instanceof KamError.FacilityDoesNotExistError) {
                // This error is only incase room item is not available
                this.ask(this.t('ITEM_NOT_AVAILABLE', {
                    item_name: this.$inputs.room_item_slot.value
                }));
            }
        }

        // Check if the guest has ordered the same item + on the same day + unserved
        // If the same item has been ordered, check with guest and continue the flow, else continue the following
        try {
            var is_already_ordered = await DBFuncs.is_item_already_ordered(hotel_id,
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
        } catch (error) {
            if ((error instanceof KamError.InputError) || (error instanceof KamError.DBError)) {
                this.tell(this.t('SYSTEM_ERROR'));
            }
        }

        // if (_.isEmpty(this.$session.$data.items)) 
        //     this.$session.$data.items = [];
        set_item(this, []);
        console.log('####req_count=', req_count);

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
            for (var i = 0; i < items.length; i++) {
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
            console.log('creating order: hotel_id=' + hotel_id + ',user_id=' + user_id + ',room_no=' + room_no + ',items=', items);
            try {
                DBFuncs.create_order(hotel_id, room_no, user_id, items);
            } catch (error) {
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

    },

    // async Enquiry_kitchen_equipment() {

    // },

    // async Enquiry_kitchen_bottlesterilize() {

    // },

    async Enquiry_res_billing() {

    },

    async Equipment_not_working() {

    },

    // async Equipment_info() {

    // },

    async Enquiry_food_delivery_time() {

    },

    async Enquiry_room_last_refurbished_date() {

    },

    async Enquiry_hotel_floors() {

    }
}