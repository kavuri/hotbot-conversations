/* Copyright (C) Kamamishu Pvt. Ltd. - All Rights Reserved
 * Unauthorized copying of this file, via any medium is strictly prohibited
 * Proprietary and confidential
 */

/*
 * This handler answers queries related to the hotel facility
 */
'using strict';

let Hotel = require('../db/Hotel'),
    _ = require('lodash'),
    ERROR = require('../helpers').ERROR,
    HELPER = require('../helpers'),
    Fuse = require('fuse.js');

module.exports = {
    async Enquiry_reception_languages() {
        var hotel_id = this.$session.$data.hotel_id;

        console.log('Enquiry_reception_languages: hotel_id=', hotel_id);
        let facility;
        try {
            facility = await HELPER.hotel_facility(hotel_id, "reception", null);
        } catch(error) {
            this.tell(this.t('SYSTEM_ERROR'));
        }

        let langs = facility.spoken.languages;  // This is an array
        let message = facility.spoken.message.true;
        var text = HELPER.template_to_text(message, {'languages': _.join(langs, ',')});

        this.$speech.addText(text)
            .addBreak('200ms')
            .addText(this.t('FOLLOWUP_QUESTION'));

        // Followup state is not required, as this is a straight forward answer and the next query from guest can be anything else
        return this.ask(this.$speech);
    },

    async Enquiry_all_facilities() {
        var hotel_id = this.$session.$data.hotel_id;
        let some_facilities = ['restaurant', 'gym', 'swimming pool', 'breakfast', 'laundry'];

        let facility_names;
        try {
            facility_names = await HELPER.all_facility_names(hotel_id);
        }catch(error) {
            console.log('error while fetching hotel facilities:', error);
            this.tell(this.t('SYSTEM_ERROR'));
        }

        // Find the intersection of some_facilities and all the facilities that the hotel supports
        var common = _.intersection(facility_names, some_facilities);
        var stitched_facilities = _.join(common, ',');

        // Set the facilities as part of data, so that it can be used in 'AllFacilitiesState'
        this.$session.$data.all_facilities = facility_names;

        this.$speech.addText(this.t('HOTEL_FACILITIES', {
                facilities: stitched_facilities
            }))
            .addBreak('200ms')
            .addText(this.t('QUESTION_WANT_ALL_FACILITIES'));

        return this.followUpState('AllFacilitiesState')
            .ask(this.$speech, this.t('YES_NO_REPROMPT'));
    },

    'AllFacilitiesState': {
        async YesIntent() {

            // Take the facilities info from the session object
            var facility_names = this.$session.$data.all_facilities;

            this.$speech.addText(this.t('HOTEL_FACILITIES', {
                    facilities: facility_names
                }))
                .addBreak('200ms')
                .addText(this.t('FACILITY_FOLLOWUP_QUESTION'));
            return this.ask(this.$speech);
        },

        NoIntent() {
            console.log('Ending session at "AllFacilitiesState"');
            return this.tell(this.t('END'));
        },

        Unhandled() {
            // Triggered when the requested intent could not be found in the handlers variable
            console.log('unhandled in followup state');
            return
        }
    },

    async Enquiry_facility_exists() {
        var hotel_id = this.$session.$data.hotel_id,
            facility_slot = this.$inputs.facility_slot;

        console.log('hotel_id=', hotel_id, ',facility_slot=', facility_slot);
        let facility_name = facility_slot.value,
            facility;
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

        console.log('+++facility=', facility);
        var flag = facility.availability.flag;
        var message = facility.availability.message[flag];
        if (!_.isEmpty(message) || !_.isUndefined(message)) {
            this.$speech.addText(message)
                .addBreak('200ms')
                .addText(this.t('FACILITY_FOLLOWUP_QUESTION', {
                        facility: facility.name
                }));

            // Store the facility info for this session
            this.$session.$data.facility = facility;

            return this.followUpState('FacilityExistsState')
                    .ask(this.$speech, this.t('YES_NO_REPROMPT'));
        } else {
            console.log('something wrong with the database setup:', flag, message);
            return this.tell(this.t('SYSTEM_ERROR'));
        }
    },

    'FacilityExistsState': {
        async YesIntent() {
            console.log('#####facility=', this.$session.$data.facility);
            var facility = this.$session.$data.facility;

            var p_template = _.template(facility.price.message[facility.price.flag]);
            var p_text = p_template({
                'price': facility.price.price
            });

            var t_template = _.template(facility.timing.message[facility.timing.flag]);
            var t_text = t_template({
                'from': facility.timing.timings.from,
                'to': facility.timing.timings.to
            });

            this.$speech.addText(p_text)
                .addBreak('200ms')
                .addText(t_text)
                .addText(this.t('FOLLOWUP_QUESTION'));

            return this.ask(this.$speech);
        },

        NoIntent() {
            console.log('Ending session at "FacilityExistsState"');
            return this.tell(this.t('END'));
        },

        Unhandled() {

        }
    },

    async Enquiry_Facility_timings() {
        var hotel_id = this.$session.$data.hotel_id,
        facility_slot = this.$inputs.facility_slot;

        console.log('hotel_id=', hotel_id, ',facility_slot=', facility_slot);
        let facility_name = facility_slot.value,
            facility;
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

        var from = facility.timing.timings.from, to = facility.timing.timings.to;
        var message = facility.timing.message[facility.timing.flag];
        let text = message;
        if (!_.isEqual(from, "0000") && !_.isEqual(to, "0000")) { // facility is open 24x7
            // this is not 24x7 open, use templating
            text = HELPER.template_to_text(message, {'from': from, 'to': to});
        }
        
        this.$speech.addText(text)
            .addBreak('200ms')
            .addText(this.t('FACILITY_FOLLOWUP_QUESTION', {
                    facility: facility.name
        }));

        // Store the facility info for this session
        this.$session.$data.facility = facility;
        return this.ask(this.$speech);
    },

    async Enquiry_Facility_price() {
        var hotel_id = this.$session.$data.hotel_id,
            facility_slot = this.$inputs.facility_slot;

        console.log('Enquiry_Facility_price: hotel_id=', hotel_id, ',facility_slot=', facility_slot);
        let facility_name = facility_slot.value,
            facility;
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

        var price = facility.price.price;
        var message = facility.price.message[facility.price.flag];
        let text = message;
        if (!_.isEqual(price, 0)) { // facility is *not* free of cost
            text = HELPER.template_to_text(message, {'price': price});
        }

        this.$speech.addText(text)
            .addBreak('200ms')
            .addText(this.t('FACILITY_FOLLOWUP_QUESTION', {
                    facility: facility.name
        }));

        // Store the facility info for this session
        this.$session.$data.facility = facility;
        return this.ask(this.$speech);
    },

    async Enquiry_Facility_location() {
        var hotel_id = this.$session.$data.hotel_id,
        facility_slot = this.$inputs.facility_slot;

        console.log('Enquiry_Facility_location: hotel_id=', hotel_id, ',facility_slot=', facility_slot);
        let facility_name = facility_slot.value,
            facility;
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
    },

    async Enquiry_gym() {

    },

    async Enquiry_menu() {

    },

    async Enquiry_menu_cuisinetype() {

    },

    async Enquiry_kitchen_equipment() {

    },

    async Enquiry_kitchen_bottlesterilize() {

    },

    async Enquiry_res_billing() {

    },

    async Equipment_not_working() {

    },

    async Equipment_info() {

    },

    async Enquiry_food_delivery_time() {

    }
}