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
    { Item, MenuItem, RoomItem, Facility } = require('./Item');

/**
 * Common funtion to check the price tag and retun the price message
 * @param {*} thisObj 
 * @param {*} item 
 */
function priceMsg(thisObj, hotel_id, itemObj) {
    let msg = '';
    if (itemObj instanceof MenuItem) {
        let price = itemObj.price;
        msg = _.isEqual(price, 0) ? thisObj.t('ITEM_FREE') : thisObj.t('ITEM_COSTS', { item_name: itemObj.name, price: price });
        console.log('^^^Its a menu item. msg=', msg);
    } else if (itemObj instanceof RoomItem) {
        let price = itemObj.price;
        let limit = itemObj.limitCount();
        let limitFor = itemObj.limitFor();
        let limitMsg = '';
        console.log('limit=', limit, ', limitFor=', limitFor);
        if (!_.isEqual(limit, -1)) {
            switch (limitFor) {
                case 'day':
                    limitMsg = thisObj.t('LIMIT_PER_DAY', { limit: limit });
                    break;
                case 'stay':
                    limitMsg = thisObj.t('LIMIT_PER_STAY', { limit: limit });
                    break;
                default:
                // No such case now
            }
        }
        console.log('--limit msg=', limitMsg);
        if (_.isEqual(price, 0) && _.isEqual(limit, -1)) {
            // Its free of cost for ever
            //msg = itemObj.msgYes();
        } else if (_.isEqual(price, 0) && !_.isEqual(limit, -1)) {
            msg = limitMsg;
            //msg = itemObj.msgYes() + limitMsg;
        } else if (!_.isEqual(price, 0) && _.isEqual(limit, -1)) {
            msg = thisObj.t('ITEM_COSTS', { price: price });
        } else if (!_.isEqual(price, 0) && !_.isEqual(limit, -1)) {
            msg = thisObj.t('ITEM_COSTS', { price: price }) + thisObj.$speech.addBreak('300ms') + limitMsg;
        }
        console.log('---msg=', msg);
    } else if (itemObj instanceof Facility) {
        msg = itemObj.priceMsg();
        console.log('^^^Its a facility. msg=', msg);
    }

    console.log('returning price msg:', msg);
    return msg;
}

module.exports = {
    /*
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
    */

    async Enquiry_all_facilities() {
        var hotel_id = this.$session.$data.hotel.hotel_id;

        let main_facilities, item = {};
        try {
            item = await DBFuncs.item(hotel_id, 'main_facilities');
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

        let itemObj = Item.load(item);

        this
            .$speech
            .addText(itemObj.msgYes())
            .addBreak('200ms')
            .addText(this.t('ANYTHING_ELSE'));

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
            return this.toStatelessIntent('END');
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
        console.log('++facility exists intent');
        let hotel_id = this.$session.$data.hotel.hotel_id,
            room_no = this.$session.$data.hotel.room_no,
            item_name = this.$inputs.facility_slot.value;

        // Check if the item exists before asking for count
        console.log('++++item name=', item_name);
        let item = {};   // Step 1
        try {
            item = await DBFuncs.item(hotel_id, item_name);
        } catch (error) {
            if ((error instanceof KamError.InputError) || (error instanceof KamError.DBError)) {
                return this.tell(this.t('SYSTEM_ERROR'));
            }
        }

        console.log('found item=', item);
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
        } else if (itemObj.orderable()) {   // Item is orderable, ask user if they would like to order
            // Get the price message and tell the user about it
            let msg = priceMsg(this, hotel_id, itemObj);
            this.$speech
                .addText(this.t('ITEM_EXISTS', { item_name: itemObj.name }))
                .addBreak('100ms')
                .addText(this.t('AND'))
                .addText(msg)
                .addBreak('400ms')
                .addText(this.t('ITEM_LIKE_TO_ORDER'));

            this.$session.$data.facility_slot = item_name;
            this.$session.$data.itemObj = itemObj;
            return this
                .followUpState('Query_To_Order_State')
                .ask(this.$speech, this.t('YES_NO_REPROMPT'));
        }
    },

    'Query_To_Order_State': {
        async YesIntent() {
            console.log('Going to Order_Item intent');
            // Set the facility_slot to the name of the item
            this.removeState();
            return this.toStatelessIntent('Order_item');
        },

        async NoIntent() {
            this.$speech
                .addText(this.t('ANYTHING_ELSE'));
            this.removeState();
            this.ask(this.$speech);
        }
    },

    /**
     * Global NoIntent
     */
    async NoIntent() {
        console.log('ENDING IN FACILITIES...');
        // Say thank you and end
        this.toStatelessIntent('END');
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

        msg = priceMsg(this, hotel_id, item);
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