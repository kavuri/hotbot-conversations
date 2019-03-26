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

    Enquiry_Facility_timings() {

    },
    
    Hotel_Facilities() {
        
    }
}