/* Copyright (C) Kamamishu Pvt. Ltd. - All Rights Reserved
 * Unauthorized copying of this file, via any medium is strictly prohibited
 * Proprietary and confidential
 */

'using strict';

let Hotel = require('../db/Hotel');

module.exports = {
    Policy_smoking() {
        var smoking_slot = this.$inputs.smoking_slot,
            place_slot = this.$inputs.place_slot;
        console.log('--', smoking_slot, place_slot);
        this.tell('smoking is not allowed');
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