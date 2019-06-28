/* Copyright (C) Kamamishu Pvt. Ltd. - All Rights Reserved
 * Unauthorized copying of this file, via any medium is strictly prohibited
 * Proprietary and confidential
 */

/*
 * This handler answers queries related to the hotel facility
 */
'using strict';

let _ = require('lodash'),
    HELPER = require('../helpers'),
    FACILITIES = require('../db/Facilities');

module.exports = {
    async Order_room_item() {
        var hotel_id = this.$session.$data.hotel_id,
            room_item_slot = this.$inputs.room_item_slot,
            count = this.$inputs.count;

        console.log('Order_room_item: hotel_id='+ hotel_id, ',room_item_slot='+ JSON.stringify(room_item_slot), ",count="+JSON.stringify(count));

        let room_item = room_item_slot.value, item;
        try {
            console.log('fetching room item');
            item = await FACILITIES.facility(hotel_id, room_item);
            console.log('++item=', item);
            if (_.isEmpty(item)) {
                // No such item exists in the database
            } else {
                // There is an item
            }
        } catch(error) {
            this.tell(this.t("SYSTEM_ERROR"));
        }
        if (_.isEmpty(count) || _.isUndefined(count)) {
            // Count has not been specificed. Check the default count in the database
            // If count=1 (like clock, waste basket etc.), there is no need to ask for a count

        }
        /*
        try {
            facility = await HELPER.hotel_facility(hotel_id, facility_name, null);
        } catch(error) {
            if (error instanceof HELPER.ERRORS.FacilityDoesNotExist) {
                this.ask(this.t('FACILITY_NOT_AVAILABLE', {
                    facility: facility_slot.value
                }));
            } else {
                this.tell(this.t('SYSTEM_ERROR'));
            }
        }

        var message = facility.location.message[facility.location.flag];
        let text = message;

        this.$speech.addText(text)
            .addBreak('200ms')
            .addText(this.t('FACILITY_FOLLOWUP_QUESTION', {
                    facility: facility.name
        }));

        // Store the facility info for this session
        this.$session.$data.facility = facility;
        return this.ask(this.$speech);
        */

        this.$speech.addText('Hello there');
        return this.tell(this.$speech);
    },

    async Order_food() {

    },

    async Order_res_alcohol() {

    },

    async Order_taxi() {

    }
}