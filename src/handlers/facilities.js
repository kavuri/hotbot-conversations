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
    HELPER = require('../utils/helpers'),
    Fuse = require('fuse.js'),
    FACILITY_TYPE = require('../utils/helpers').FACILITY_TYPE;

/**
 * 
 * @param {*} hotel_id - the hotel id of the facility
 * @param {*} facility_name - the name of the facility
 * @param {*} category - the category inside the facility (like price, location, availability etc.)
 * @param {*} session_data - the session data that could possibly hold the facility object
 */
async function get_facility(thisObj) {

    var hotel_id = thisObj.$session.$data.hotel.hotel_id,
        facility_name = thisObj.$inputs.facility_slot.value,
        session_data = thisObj.$session.$data.facility;

    console.log('get_facility. hotel_id=' + hotel_id + ',facility_name=' + facility_name);

    let facility;
    // Check if facility is in session object
    if (_.isUndefined(session_data)) {
        if (_.isUndefined(facility_name)) {
            // This situation should not occur
            return thisObj.tell(thisObj.t('SYSTEM_ERROR'));
        }

        // Session data is empty, get the facility from database
        try {
            console.log('session_data is null and facility_name=' + facility_name + '. Getting facility from db.', FACILITY_TYPE.FACILITIES);
            facility = await DBFuncs.facility(hotel_id, facility_name, FACILITY_TYPE.FACILITIES);
            console.log('%%%facility=', facility);
            thisObj.$session.$data.facility = facility; // store the facility object so that we can 
        } catch (error) {
            if (error instanceof KamError.InputError) {
                thisObj.tell(thisObj.t('SYSTEM_ERROR'));
            } else if (error instanceof KamError.DBError) {
                thisObj.tell(thisObj.t('SYSTEM_ERROR'));
            } else if (error instanceof KamError.FacilityDoesNotExistError) {
                thisObj.ask(thisObj.t('FACILITY_NOT_AVAILABLE', {
                    facility: facility_name
                }));
            }
        }
    } else if (!_.isUndefined(session_data)) {  // facility is not in session object
        if (_.isUndefined(facility_name)) {
            // This is a follow-up conversation and the invocation will not have the facility_name.
            // Use the facility from the session object
            console.log('facility_name not present in request. facility_name=' + facility_name);

            facility = session_data;
        } else if (!_.isUndefined(facility_name)) {
            facility = await search(facility_name, session_data);
            if (_.isEmpty(facility)) {
                // facility requested is not the same as in session object
                // refetch the facility from db
                try {
                    facility = await DBFuncs.facility(hotel_id, facility_name, FACILITY_TYPE.FACILITIES);
                    thisObj.$session.$data.facility = facility; // store the facility object so that we can 
                } catch (error) {
                    if (error instanceof KamError.InputError) {
                        thisObj.tell(thisObj.t('SYSTEM_ERROR'));
                    } else if (error instanceof KamError.DBError) {
                        thisObj.tell(thisObj.t('SYSTEM_ERROR'));
                    } else if (error instanceof KamError.FacilityDoesNotExistError) {
                        thisObj.ask(thisObj.t('FACILITY_NOT_AVAILABLE', {
                            facility: facility_name
                        }));
                    }
                }
            }
        }
    }

    return facility;
}

function search(facility_name, session_data) {
    if (_.isUndefined(facility_name) || _.isUndefined(session_data)) {
        throw new KamError.InputError('invalid data for search. facility_name=' + facility_name + ',session_data=' + session_data);
    }

    // Use fuse to search for the name
    let fuse_options = {
        shouldSort: true,
        threshold: 0.5,
        location: 0,
        distance: 100,
        maxPatternLength: 32,
        minMatchCharLength: 3,
        keys: [
            "f_name",
            "synonyms"
        ]
    };
    console.log('^^^facility=', session_data);
    var data = [{
        f_name: session_data.f_name,
        synonyms: session_data.synonyms
    }];

    console.log('++data=', data);
    var fuse = new Fuse(data, fuse_options);
    var result = fuse.search(facility_name);

    if (_.isEmpty(result)) {
        return result;
    } else {
        return session_data.facility;
    }
}

module.exports = {
    async Enquiry_reception_languages() {
        var hotel_id = this.$session.$data.hotel_id;
        console.log('Enquiry_reception_languages. hotel_id=' + hotel_id);

        let facility;
        // Session data is empty, get the facility from database
        try {
            facility = await DBFuncs.facility(hotel_id, "reception", FACILITY_TYPE.FACILITIES);
            this.$session.$data.facility = facility; // store the facility object
        } catch (error) {
            if (error instanceof KamError.InputError) {
                this.tell(this.t('SYSTEM_ERROR'));
            } else if (error instanceof KamError.DBError) {
                this.tell(this.t('SYSTEM_ERROR'));
            } else if (error instanceof KamError.FacilityDoesNotExistError) {
                this.ask(this.t('FACILITY_NOT_AVAILABLE', {
                    facility: facility_name
                }));
            }
        }

        console.log('===', facility);

        let langs = facility.spoken.languages;  // This is an array
        let message = facility.spoken.message.true;
        var text = HELPER.template_to_text(message, { 'languages': _.join(langs, ',') });

        this.$speech.addText(text)
            .addBreak('200ms')
            .addText(this.t('FOLLOWUP_QUESTION'));

        // Followup state is not required, as this is a straight forward answer and the next query from guest can be anything else
        return this.ask(this.$speech);
    },

    async Enquiry_all_facilities() {
        var hotel_id = this.$session.$data.hotel.hotel_id,
            main_facilities = await DBFuncs.main_facilities(hotel_id);

        let facility_names;
        try {
            // var ret = await DBFuncs.all_facility_names(hotel_id, FACILITY_TYPE.FACILITIES); //returns array of form [{f_name:'abc', synonyms:['def','ghi]}]
            // facility_names = _.map(ret, 'f_name'); // get only the f_name, i.e., the facility name
            const facility_names = await DBFuncs.all_facility_names(hotel_id, FACILITY_TYPE.FACILITIES);
            console.log('###returned facilities=', facility_names, ',main_facilities=', main_facilities);
        } catch (error) {
            console.log('error while fetching hotel facilities:', error);
            this.tell(this.t('SYSTEM_ERROR'));
        }

        // Find the intersection of main_facilities and all the facilities that the hotel supports
        var common = _.intersection(facility_names, main_facilities);
        var stitched_facilities = _.join(common, ',');
        if (stitched_facilities.length <= 4) stitched_facilities = main_facilities; // This is to ensure we market the hotel properly, incase there is just 1 intersection

        // Set the facilities as part of data, so that it can be used in 'AllFacilitiesState'
        // this.$session.$data.all_facilities = facility_names;

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
        var facility = await get_facility(this);

        console.log('+++facility=', facility);
        var flag = facility.present.flag;
        var message = facility.present.message[flag];
        if (!_.isEmpty(message) || !_.isUndefined(message)) {
            this.$speech.addText(message)
                .addBreak('200ms')
                .addText(this.t('FACILITY_FOLLOWUP_QUESTION', {
                    facility: facility.f_name
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

            var price_message = facility.price.message[facility.price.flag],
                p_text = HELPER.template_to_text(price_message, { 'price': facility.price.price });

            // var timing_message = facility.timing.message[facility.timing.flag],
            //     t_text = HELPER.template_to_text(timing_message, {'from': facility.timing.timings.from, 'to': facility.timing.timings.to});

            this.$speech.addText(p_text)
                .addBreak('200ms')
                .addText(t_text)
                .addText(this.t('FOLLOWUP_QUESTION'));

            return this.ask(this.$speech);
        },

        NoIntent() {
            console.log('Ending session at "FacilityExistsState"');
            return this.tell(this.t('END'));
        }
    },

    async Enquiry_Facility_timings() {
        var facility = await get_facility(this);

        var from = facility.timings.time.from, to = facility.timings.time.to;
        var message = facility.timings.message[facility.timings.flag];
        let text = message;
        if (!_.isEqual(from, "0000") && !_.isEqual(to, "0000")) { // facility is open 24x7
            // this is not 24x7 open, use templating
            text = HELPER.template_to_text(message, { 'from': from, 'to': to });
        }

        this.$speech.addText(text)
            .addBreak('200ms')
            .addText(this.t('FACILITY_FOLLOWUP_QUESTION', {
                facility: facility.f_name
            }));

        // Store the facility info for this session
        this.$session.$data.facility = facility;
        return this.ask(this.$speech);
    },

    async Enquiry_Facility_price() {
        var facility = await get_facility(this);

        var price = facility.price.price;
        var message = facility.price.message[facility.price.flag];
        let text = message;
        if (!_.isEqual(price, 0)) { // facility is *not* free of cost
            text = HELPER.template_to_text(message, { 'price': price });
        }

        this.$speech.addText(text)
            .addBreak('200ms')
            .addText(this.t('FACILITY_FOLLOWUP_QUESTION', {
                facility: facility.f_name
            }));

        // Store the facility info for this session
        this.$session.$data.facility = facility;
        return this.ask(this.$speech);
    },

    async Enquiry_Facility_location() {
        var facility = await get_facility(this);

        var message = facility.location.message[facility.location.flag];
        let text = message;

        this.$speech.addText(text)
            .addBreak('200ms')
            .addText(this.t('FACILITY_FOLLOWUP_QUESTION', {
                facility: facility.f_name
            }));

        // Store the facility info for this session
        this.$session.$data.facility = facility;
        return this.ask(this.$speech);
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

    },

    async Enquiry_room_last_refurbished_date() {

    },

    async Enquiry_hotel_floors() {

    }
}