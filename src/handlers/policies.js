/* Copyright (C) Kamamishu Pvt. Ltd. - All Rights Reserved
 * Unauthorized copying of this file, via any medium is strictly prohibited
 * Proprietary and confidential
 */

'using strict';

let Hotel = require('../db/Hotel'),
    _ = require('lodash'),
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

module.exports = {
    async Policy_smoking() {
        var smoking_slot = this.$inputs.smoking_slot,
            place_slot = this.$inputs.place_slot,
            hotel_id = this.$session.$data.hotel_id;
        
        if (_.isEmpty(hotel_id) || _.isNull(hotel_id) || _.isUndefined(hotel_id)) {
            // Something is wrong. Send out system problem to user
            console.log('Empty hotel_id. Looks like this device is not registered properly.', hotel_id);
            this.tell(this.t('SYSTEM_ERROR'));
        }

        // console.log('--', smoking_slot, place_slot, hotel_id);

        var hotel_policies = await Hotel.get(hotel_id, "policies.smoking");
        console.log('==hotel_policies;', JSON.stringify(hotel_policies));
        if (_.isEmpty(hotel_policies) || _.isNull(hotel_policies) || _.isUndefined(hotel_policies)) {
            // This should not happen, basically means that smoking policies are not present in the database
            this.tell(this.t('SYSTEM_ERROR'));
        }

        let smoking_place = place_slot.value;
        if (_.isEmpty(smoking_place) || _.isNull(smoking_place) || _.isUndefined(smoking_place)) {
            // The user did not ask for a specific place to smoke, default to the hotel value
            smoking_place = 'hotel';
        }
        var fuse = new Fuse(hotel_policies.policies.smoking, fuse_options);

        var result = fuse.search(smoking_place);

        let message = result[0].item.message[result[0].item.flag];
        this.tell(message);
    },
    
    Policy_cancellation() {

    },

    Policy_alcohol() {

    },

    Policy_infants() {

    },

    Policy_checkout_time() {

    },

    Policy_noshow() {

    },

    Policy_outside_food() {

    }
};