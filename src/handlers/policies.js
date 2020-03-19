/* Copyright (C) Kamamishu Pvt. Ltd. - All Rights Reserved
 * Unauthorized copying of this file, via any medium is strictly prohibited
 * Proprietary and confidential
 */

'using strict';

const _ = require('lodash'),
    KamError = require('../utils/KamError'),
    HELPER = require('../utils/helpers'),
    DBFuncs = require('../db/db_funcs');

/**
 * This is a common function to get the policy information from an input
 * @param {Hotel id} hotel_id 
 * @param {*} policy 
 */
async function policyMessage(hotel_id, policy) {
    try {
        policy = await DBFuncs.item(hotel_id, policy);
    } catch (error) {
        console.log('error while fetching hotel policies:', error);
        throw error;
    }

    let msg;
    if (_.isEmpty(policy) || _.has(policy, 'f') || _.isEqual(policy.f, true)) {
        // No such policy defined for this hotel
        msg = this.t('POLICY_DOES_NOT_EXIST');
    }

    if (_.has(policy, 'p') && _.isEqual(policy.p, true)) {
        // Its a policy. Send the message
        msg = policy.msg;
    }
    return msg;
}

module.exports = {
    async Policy_smoking() {
        var hotel_id = this.$session.$data.hotel.hotel_id;

        let msg;
        try {
            msg = await policyMessage(hotel_id, 'smoking');
        } catch (error) {
            console.log('error while fetching hotel policies:', error);
            return this.tell(this.t('SYSTEM_ERROR'));
        }

        this
            .$speech
            .addText(msg)
            .addBreak('200ms')
            .addText(this.t('ANYTHING_ELSE'));

        // Followup state is not required, as this is a straight forward answer and the next query from guest can be anything else
        return this.ask(this.$speech);
    },

    async Policy_alcohol() {
        var hotel_id = this.$session.$data.hotel.hotel_id;

        let msg;
        try {
            msg = await policyMessage(hotel_id, 'alcohol');
        } catch (error) {
            console.log('error while fetching hotel policies:', error);
            return this.tell(this.t('SYSTEM_ERROR'));
        }

        this
            .$speech
            .addText(msg)
            .addBreak('200ms')
            .addText(this.t('ANYTHING_ELSE'));

        // Followup state is not required, as this is a straight forward answer and the next query from guest can be anything else
        return this.ask(this.$speech);
    },

    async Policy_cancellation() {
        var hotel_id = this.$session.$data.hotel.hotel_id;

        let msg;
        try {
            msg = await policyMessage(hotel_id, 'cancellation');
        } catch (error) {
            console.log('error while fetching hotel policies:', error);
            return this.tell(this.t('SYSTEM_ERROR'));
        }

        this
            .$speech
            .addText(msg)
            .addBreak('200ms')
            .addText(this.t('ANYTHING_ELSE'));

        // Followup state is not required, as this is a straight forward answer and the next query from guest can be anything else
        return this.ask(this.$speech);
    },

    async Policy_infants() {
        var hotel_id = this.$session.$data.hotel.hotel_id;

        let msg;
        try {
            msg = await policyMessage(hotel_id, 'infants');
        } catch (error) {
            console.log('error while fetching hotel policies:', error);
            return this.tell(this.t('SYSTEM_ERROR'));
        }

        this
            .$speech
            .addText(msg)
            .addBreak('200ms')
            .addText(this.t('ANYTHING_ELSE'));

        // Followup state is not required, as this is a straight forward answer and the next query from guest can be anything else
        return this.ask(this.$speech);
    },

    async Policy_checkout_time() {
        var hotel_id = this.$session.$data.hotel.hotel_id;

        let msg;
        try {
            msg = await policyMessage(hotel_id, 'checkout time');
        } catch (error) {
            console.log('error while fetching hotel policies:', error);
            return this.tell(this.t('SYSTEM_ERROR'));
        }

        this
            .$speech
            .addText(msg)
            .addBreak('200ms')
            .addText(this.t('ANYTHING_ELSE'));

        // Followup state is not required, as this is a straight forward answer and the next query from guest can be anything else
        return this.ask(this.$speech);
    },

    async Policy_noshow() {
        var hotel_id = this.$session.$data.hotel.hotel_id;

        let msg;
        try {
            msg = await policyMessage(hotel_id, 'no show');
        } catch (error) {
            console.log('error while fetching hotel policies:', error);
            return this.tell(this.t('SYSTEM_ERROR'));
        }

        this
            .$speech
            .addText(msg)
            .addBreak('200ms')
            .addText(this.t('ANYTHING_ELSE'));

        // Followup state is not required, as this is a straight forward answer and the next query from guest can be anything else
        return this.ask(this.$speech);
    },

    async Policy_outside_food() {
        var hotel_id = this.$session.$data.hotel.hotel_id;

        let msg;
        try {
            msg = await policyMessage(hotel_id, 'outside food');
        } catch (error) {
            console.log('error while fetching hotel policies:', error);
            return this.tell(this.t('SYSTEM_ERROR'));
        }

        this
            .$speech
            .addText(msg)
            .addBreak('200ms')
            .addText(this.t('ANYTHING_ELSE'));

        // Followup state is not required, as this is a straight forward answer and the next query from guest can be anything else
        return this.ask(this.$speech);
    },

    async Policy_checkin_time() {
        var hotel_id = this.$session.$data.hotel.hotel_id;

        let msg;
        try {
            msg = await policyMessage(hotel_id, 'checkin time');
        } catch (error) {
            console.log('error while fetching hotel policies:', error);
            return this.tell(this.t('SYSTEM_ERROR'));
        }

        this
            .$speech
            .addText(msg)
            .addBreak('200ms')
            .addText(this.t('ANYTHING_ELSE'));

        // Followup state is not required, as this is a straight forward answer and the next query from guest can be anything else
        return this.ask(this.$speech);
    },

    async Policy_pets() {
        var hotel_id = this.$session.$data.hotel.hotel_id;

        let msg;
        try {
            msg = await policyMessage(hotel_id, 'pets');
        } catch (error) {
            console.log('error while fetching hotel policies:', error);
            return this.tell(this.t('SYSTEM_ERROR'));
        }

        this
            .$speech
            .addText(msg)
            .addBreak('200ms')
            .addText(this.t('ANYTHING_ELSE'));

        // Followup state is not required, as this is a straight forward answer and the next query from guest can be anything else
        return this.ask(this.$speech);
    },

    async Policy_payment_method() {
        var hotel_id = this.$session.$data.hotel.hotel_id;

        let msg;
        try {
            msg = await policyMessage(hotel_id, 'payment methods');
        } catch (error) {
            console.log('error while fetching hotel policies:', error);
            return this.tell(this.t('SYSTEM_ERROR'));
        }

        this
            .$speech
            .addText(msg)
            .addBreak('200ms')
            .addText(this.t('ANYTHING_ELSE'));

        // Followup state is not required, as this is a straight forward answer and the next query from guest can be anything else
        return this.ask(this.$speech);
    }
};