/* Copyright (C) Kamamishu Pvt. Ltd. - All Rights Reserved
 * Unauthorized copying of this file, via any medium is strictly prohibited
 * Proprietary and confidential
 */

'using strict';

let _ = require('lodash'),
    KamError = require('../utils/KamError'),
    DBFuncs = require('../db').DBFuncs,
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
        var hotel_id = this.$session.$data.hotel.hotel_id;

        let smoking_policy;
        try {
            smoking_policy = await DBFuncs.facility(hotel_id, "smoking", DBFuncs.TYPE.POLICIES);
        } catch (error) {
            if (error instanceof KamError.FacilityDoesNotExistError) {
                // FIXME: This hotel does not have such a policy
                // Check with hotel reception?
            }
            console.log('error while fetching hotel policies:', error);
            return this.tell(this.t('SYSTEM_ERROR'));
        }

        var allowed_smoking_places = smoking_policy.allowed, flag = smoking_policy.present.flag;
        let message = smoking_policy.present.message[flag];
        
        if (_.isEqual(flag, "yes")) {
            // smoking is allowed at certain places
            var areas = _.join(allowed_smoking_places);
            var template = _.template(message);
            message = template({'areas': areas});
        }

        this.$speech.addText(message)
            .addBreak('200ms')
            .addText(this.t('FOLLOWUP_QUESTION'));

        // Followup state is not required, as this is a straight forward answer and the next query from guest can be anything else
        return this.ask(this.$speech);
    },

    async Policy_alcohol() {
        var hotel_id = this.$session.$data.hotel.hotel_id;

        let alcohol_policy;
        try {
            alcohol_policy = await DBFuncs.facility(hotel_id, "alcohol", DBFuncs.TYPE.POLICIES);
        } catch (error) {
            if (error instanceof KamError.FacilityDoesNotExistError) {
                // FIXME: This hotel does not have such a policy
                // Check with hotel reception?
            }
            console.log('error while fetching hotel policies:', error);
            return this.tell(this.t('SYSTEM_ERROR'));
        }

        var allowed_alcohol_places = alcohol_policy.allowed, flag = alcohol_policy.present.flag;
        let message = alcohol_policy.present.message[flag];

        if (_.isEqual(flag, "yes")) {
            // smoking is allowed at certain places
            var areas = _.join(allowed_alcohol_places);
            var template = _.template(message);
            message = template({'areas': areas});
        }

        this.$speech.addText(message)
            .addBreak('200ms')
            .addText(this.t('FOLLOWUP_QUESTION'));

        // Followup state is not required, as this is a straight forward answer and the next query from guest can be anything else
        return this.ask(this.$speech);
    },

    async Policy_cancellation() {
        var hotel_id = this.$session.$data.hotel.hotel_id;

        let cancellation_policy;
        try {
            cancellation_policy = await DBFuncs.facility(hotel_id, "cancellation", DBFuncs.TYPE.POLICIES);
        } catch (error) {
            if (error instanceof KamError.FacilityDoesNotExistError) {
                // FIXME: This hotel does not have such a policy
                // Check with hotel reception?
            }
            console.log('error while fetching hotel policies:', error);
            return this.tell(this.t('SYSTEM_ERROR'));
        }

        let flag = cancellation_policy.present.flag;

        let message = cancellation_policy.present.message[flag];
        this.$speech.addText(message)
            .addBreak('200ms')
            .addText(this.t('FOLLOWUP_QUESTION'));

        // Followup state is not required, as this is a straight forward answer and the next query from guest can be anything else
        return this.ask(this.$speech);
    },

    async Policy_infants() {
        var hotel_id = this.$session.$data.hotel.hotel_id;

        let infants_policy;
        try {
            infants_policy = await DBFuncs.facility(hotel_id, "infants", DBFuncs.TYPE.POLICIES);
        } catch (error) {
            if (error instanceof KamError.FacilityDoesNotExistError) {
                // FIXME: This hotel does not have such a policy
                // Check with hotel reception?
            }
            console.log('error while fetching hotel policies:', error);
            return this.tell(this.t('SYSTEM_ERROR'));
        }

        let flag = infants_policy.present.flag;
        let message = infants_policy.present.message[flag];

        // Replace the age in the message with the number that is part of the object
        var template = _.template(message);
        var text = template({
            'age': infants_policy.age
        });

        this.$speech.addText(text)
            .addBreak('200ms')
            .addText(this.t('FOLLOWUP_QUESTION'));

        // Followup state is not required, as this is a straight forward answer and the next query from guest can be anything else
        return this.ask(this.$speech);
    },

    async Policy_checkout_time() {
        var hotel_id = this.$session.$data.hotel.hotel_id;

        let checkout_time_policy;
        try {
            checkout_time_policy = await DBFuncs.facility(hotel_id, "checkout time", DBFuncs.TYPE.POLICIES);
        } catch (error) {
            if (error instanceof KamError.FacilityDoesNotExistError) {
                // FIXME: This hotel does not have such a policy
                // Check with hotel reception?
            }
            console.log('error while fetching hotel policies:', error);
            return this.tell(this.t('SYSTEM_ERROR'));
        }

        let flag = checkout_time_policy.present.flag;
        let message = checkout_time_policy.present.message[flag];

        // Replace the age in the message with the number that is part of the object
        var template = _.template(message);
        var text = template({
            'time': checkout_time_policy.time,
            'reception_no': this.$session.$data.hotel.info.contact.reception
        });

        this.$speech.addText(text)
            .addBreak('200ms')
            .addText(this.t('FOLLOWUP_QUESTION'));

        // Followup state is not required, as this is a straight forward answer and the next query from guest can be anything else
        return this.ask(this.$speech);
    },

    async Policy_noshow() {
        var hotel_id = this.$session.$data.hotel.hotel_id;

        let noshow_policy;
        try {
            noshow_policy = await DBFuncs.facility(hotel_id, "no show", DBFuncs.TYPE.POLICIES);
        } catch (error) {
            if (error instanceof KamError.FacilityDoesNotExistError) {
                // FIXME: This hotel does not have such a policy
                // Check with hotel reception?
            }
            console.log('error while fetching hotel policies:', error);
            return this.tell(this.t('SYSTEM_ERROR'));
        }

        let flag = noshow_policy.present.flag;
        let message = noshow_policy.present.message[flag];

        this.$speech.addText(message)
            .addBreak('200ms')
            .addText(this.t('FOLLOWUP_QUESTION'));

        // Followup state is not required, as this is a straight forward answer and the next query from guest can be anything else
        return this.ask(this.$speech);
    },

    async Policy_outside_food() {
        var hotel_id = this.$session.$data.hotel.hotel_id;

        let outside_food_policy;
        try {
            outside_food_policy = await DBFuncs.facility(hotel_id, "outside food", DBFuncs.TYPE.POLICIES);
        } catch (error) {
            if (error instanceof KamError.FacilityDoesNotExistError) {
                // FIXME: This hotel does not have such a policy
                // Check with hotel reception?
            }
            console.log('error while fetching hotel policies:', error);
            return this.tell(this.t('SYSTEM_ERROR'));
        }

        let flag = outside_food_policy.present.flag;
        let message = outside_food_policy.present.message[flag];

        this.$speech.addText(message)
            .addBreak('200ms')
            .addText(this.t('FOLLOWUP_QUESTION'));

        // Followup state is not required, as this is a straight forward answer and the next query from guest can be anything else
        return this.ask(this.$speech);
    },

    async Policy_checkin_time() {
        var hotel_id = this.$session.$data.hotel.hotel_id;

        let checkin_time_policy;
        try {
            checkin_time_policy = await DBFuncs.facility(hotel_id, "checkin time", DBFuncs.TYPE.POLICIES);
        } catch (error) {
            if (error instanceof KamError.FacilityDoesNotExistError) {
                // FIXME: This hotel does not have such a policy
                // Check with hotel reception?
            }
            console.log('error while fetching hotel policies:', error);
            return this.tell(this.t('SYSTEM_ERROR'));
        }

        let flag = checkin_time_policy.present.flag;
        let message = checkin_time_policy.present.message[flag];

        var template = _.template(message);
        var text = template({
            'checkin_time': checkin_time_policy.time
        });
        this.$speech.addText(text)
            .addBreak('200ms')
            .addText(this.t('FOLLOWUP_QUESTION'));

        // Followup state is not required, as this is a straight forward answer and the next query from guest can be anything else
        return this.ask(this.$speech);
    },

    async Policy_pets() {
        var hotel_id = this.$session.$data.hotel.hotel_id;

        let pets_policy;
        try {
            pets_policy = await DBFuncs.facility(hotel_id, "pets", DBFuncs.TYPE.POLICIES);
        } catch (error) {
            if (error instanceof KamError.FacilityDoesNotExistError) {
                // FIXME: This hotel does not have such a policy
                // Check with hotel reception?
            }
            console.log('error while fetching hotel policies:', error);
            return this.tell(this.t('SYSTEM_ERROR'));
        }

        let flag = pets_policy.present.flag;
        let message = pets_policy.present.message[flag];

        this.$speech.addText(message)
            .addBreak('200ms')
            .addText(this.t('FOLLOWUP_QUESTION'));

        // Followup state is not required, as this is a straight forward answer and the next query from guest can be anything else
        return this.ask(this.$speech);
    },

    async Policy_payment_method() {
        var hotel_id = this.$session.$data.hotel.hotel_id;

        let payment_methods_policy;
        try {
            payment_methods_policy = await DBFuncs.facility(hotel_id, "payment methods", DBFuncs.TYPE.POLICIES);
        } catch (error) {
            if (error instanceof KamError.FacilityDoesNotExistError) {
                // FIXME: This hotel does not have such a policy
                // Check with hotel reception?
            }
            console.log('error while fetching hotel policies:', error);
            return this.tell(this.t('SYSTEM_ERROR'));
        }

        let methods = _.join(payment_methods_policy.methods, ', ');

        let flag = payment_methods_policy.present.flag;
        let message = payment_methods_policy.present.message[flag];

        // Replace the payment_methods in the message with the 'methods' string above
        var template = _.template(message);
        var text = template({
            'payment_methods': methods
        });

        this.$speech.addText(text)
            .addBreak('200ms')
            .addText(this.t('FOLLOWUP_QUESTION'));

        // Followup state is not required, as this is a straight forward answer and the next query from guest can be anything else
        return this.ask(this.$speech);
    }
};