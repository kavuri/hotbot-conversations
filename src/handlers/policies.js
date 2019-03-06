/* Copyright (C) Kamamishu Pvt. Ltd. - All Rights Reserved
 * Unauthorized copying of this file, via any medium is strictly prohibited
 * Proprietary and confidential
 */

'using strict';

let Hotel = require('../db/Hotel'),
    _ = require('lodash'),
    ERROR = require('../helpers').ERROR,
    Fuse = require('fuse.js');

var fuse_options = {
    shouldSort: true,
    includeScore: true,
    threshold: 0.5,
    location: 0,
    distance: 10,
    maxPatternLength: 32,
    minMatchCharLength: 4,
    keys: [
      "name"
    ]
  };

async function pre_check(hotel_id, hotel_item) {
    if (_.isEmpty(hotel_id) || _.isNull(hotel_id) || _.isUndefined(hotel_id)) {
        // Something is wrong. Send out system problem to user
        console.log('Empty hotel_id. Looks like this device is not registered properly.', hotel_id);
        throw ERROR["HOTEL_DOES_NOT_EXIST"];
        // this.tell(this.t('SYSTEM_ERROR'));
    }

    // console.log('--', smoking_slot, place_slot, hotel_id);

    let hotel_info;
    try {
        console.log('hotel_id='+ hotel_id, 'hotel_item='+ hotel_item);
        hotel_info = await Hotel.get(hotel_id, hotel_item);
        console.log('==hotel_policies;', JSON.stringify(hotel_info));
        if (_.isEmpty(hotel_info) || _.isNull(hotel_info) || _.isUndefined(hotel_info)) {
            // This should not happen, basically means that smoking policies are not present in the database
            throw ERROR["POLICY_DOES_NOT_EXIST"];
            // this.tell(this.t('SYSTEM_ERROR'));
        }
    } catch(error) {
        console.log('pre_check:error:', error);
        throw ERROR["DB_ERROR"];
    }

    return hotel_info;
}

module.exports = {
    async Policy_smoking() {
        var place_slot = this.$inputs.place_slot,
            hotel_id = this.$session.$data.hotel_id;

        let hotel_policies;
        try {
            hotel_policies = await pre_check(hotel_id, "policies.smoking");
        } catch(error) {
            console.log('error while fetching hotel policies:', error);
            this.tell(this.t('SYSTEM_ERROR'));
        }

        console.log('policies=',hotel_policies);

        let smoking_place = place_slot.value;
        if (_.isEmpty(smoking_place) || _.isNull(smoking_place) || _.isUndefined(smoking_place)) {
            // The user did not ask for a specific place to smoke, default to the hotel value
            smoking_place = 'hotel';
        }
        var fuse = new Fuse(hotel_policies.policies.smoking, fuse_options);

        var result = fuse.search(smoking_place);

        let message = result[0].item.message[result[0].item.flag];
        this.$speech.addText(message)
                    .addBreak('200ms')
                    .addText(this.t('FOLLOWUP_QUESTION'));

        // Followup state is not required, as this is a straight forward answer and the next query from guest can be anything else
        return this.ask(this.$speech);
    },

    async Policy_alcohol() {
        var place_slot = this.$inputs.place_slot,
            hotel_id = this.$session.$data.hotel_id;
    
        let hotel_policies;
        try {
            hotel_policies = await pre_check(hotel_id, "policies.alcohol");
        } catch(error) {
            console.log('error while fetching hotel policies:', error);
            this.tell(this.t('SYSTEM_ERROR'));
        }

        let drinking_place = place_slot.value;
        if (_.isEmpty(drinking_place) || _.isNull(drinking_place) || _.isUndefined(drinking_place)) {
            // The user did not ask for a specific place to drink, default to the hotel value
            drinking_place = 'hotel';
        }
        var fuse = new Fuse(hotel_policies.policies.alcohol, fuse_options);

        var result = fuse.search(drinking_place);

        let message = result[0].item.message[result[0].item.flag];
        this.$speech.addText(message)
                    .addBreak('200ms')
                    .addText(this.t('FOLLOWUP_QUESTION'));

        // Followup state is not required, as this is a straight forward answer and the next query from guest can be anything else
        return this.ask(this.$speech);
    },

    async Policy_cancellation() {
        var hotel_id = this.$session.$data.hotel_id;

        let hotel_policies;
        try {
            hotel_policies = await pre_check(hotel_id, "policies.cancellation");
        } catch(error) {
            console.log('error while fetching hotel policies:', error);
            this.tell(this.t('SYSTEM_ERROR'));
        }

        let cancellation_policy = hotel_policies.policies.cancellation[0];
        let flag = cancellation_policy.flag;

        let message = cancellation_policy.message[flag];
        this.$speech.addText(message)
                    .addBreak('200ms')
                    .addText(this.t('FOLLOWUP_QUESTION'));

        // Followup state is not required, as this is a straight forward answer and the next query from guest can be anything else
        return this.ask(this.$speech);
    },

    async Policy_infants() {
        var hotel_id = this.$session.$data.hotel_id;

        let hotel_policies;
        try {
            hotel_policies = await pre_check(hotel_id, "policies.infants");
        } catch(error) {
            console.log('error while fetching hotel policies:', error);
            this.tell(this.t('SYSTEM_ERROR'));
        }

        let infants_policy = hotel_policies.policies.infants[0];
        let flag = infants_policy.flag;
        let message = infants_policy.message[flag];

        // Replace the age in the message with the number that is part of the object
        var template = _.template(message);
        var text = template({'age': infants_policy.age});

        this.$speech.addText(text)
                    .addBreak('200ms')
                    .addText(this.t('FOLLOWUP_QUESTION'));

        // Followup state is not required, as this is a straight forward answer and the next query from guest can be anything else
        return this.ask(this.$speech);
    },

    async Policy_checkout_time() {

    },

    async Policy_noshow() {

    },

    async Policy_outside_food() {

    }
};