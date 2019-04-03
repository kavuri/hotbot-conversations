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

        let reception_lang;
        try {
            reception_lang = await HELPER.hotel_info(hotel_id, "facilities.reception_lang");
        } catch(error) {
            console.log('error while fetching hotel facilities:', error);
            this.tell(this.t('SYSTEM_ERROR'));
        }

        console.log('languages=',reception_lang);

        let lang = reception_lang.facilities.reception_lang[0];
        let flag = lang.flag;
        let message = lang.message[flag];

        this.$speech.addText(message)
                    .addBreak('200ms')
                    .addText(this.t('FOLLOWUP_QUESTION'));

        // Followup state is not required, as this is a straight forward answer and the next query from guest can be anything else
        return this.ask(this.$speech);
    },

    async Enquiry_all_facilities() {
        var hotel_id = this.$session.$data.hotel_id;
        let some_facilities = ['restaurant', 'gym', 'swimming pool', 'breakfast', 'laundry'];

        let facilities;
        try {
            facilities = await HELPER.hotel_info(hotel_id, "facilities");
        } catch(error) {
            console.log('error while fetching hotel facilities:', error);
            this.tell(this.t('SYSTEM_ERROR'));
        }

        var all_facilities = facilities.facilities;
        // Iterate thru the facilities and pick the top 5 of them to play to the user
        var facility_names = [];
        _.forEach(all_facilities, function(facility) {
            facility_names.push(facility.name);
        });
        
        // Find the intersection of some_facilities and all the facilities that the hotel supports
        var common = _.intersection(facility_names, some_facilities);
        var stitched_facilities = _.join(common, ',');

        this.ask(this.t('HOTEL_FACILITIES', {facilities: stitched_facilities}));
    },

    async Enquiry_Facility_timings() {
        var hotel_id = this.$session.$data.hotel_id,
            facility = this.$inputs.facility_slot;

            var fuse = new Fuse(facilities.facilities, HELPER.FUSE_OPTIONS);
            var result = fuse.search(drinking_place);

        let facility_obj;
        try {
            facility_obj = await HELPER.hotel_info(hotel_id, "facilities.reception_lang");
        } catch(error) {
            console.log('error while fetching hotel facilities:', error);
            this.tell(this.t('SYSTEM_ERROR'));
        }

        console.log('languages=',reception_lang);

        let lang = reception_lang.facilities.reception_lang[0];
        let flag = lang.flag;
        let message = lang.message[flag];

        this.$speech.addText(message)
                    .addBreak('200ms')
                    .addText(this.t('FOLLOWUP_QUESTION'));

        // Followup state is not required, as this is a straight forward answer and the next query from guest can be anything else
        return this.ask(this.$speech);
    },
    
    Hotel_Facilities() {
        
    }
}