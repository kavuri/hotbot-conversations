/* Copyright (C) Kamamishu Pvt. Ltd. - All Rights Reserved
 * Unauthorized copying of this file, via any medium is strictly prohibited
 * Proprietary and confidential
 */

'using strict';

let _ = require('lodash'),
    google_helper = require('../google_helper'),
    ERROR = require('../helpers').ERROR;

module.exports = {
    async Community_nearby() {
        var community_slot = this.$inputs.community_slot;
        var  slot = community_slot.value;
        //var location = this.$session.$data.location;
        var location = "12.9718837,77.743491";
        var keyword = "";

        console.log("community_slot : " + slot);

        if (_.isEmpty(slot) || _.isNull(slot) || _.isUndefined(slot)) {
            console.log('Empty community_slot. Looks like community slot is not in the utterance.');
            this.tell(this.t('SYSTEM_ERROR'));
        }

        try {
            var community_nearby = await google_helper.nearby(slot, location, keyword);
        } catch(error) {
            console.log(error);
            this.tell(this.t('SYSTEM_ERROR'));
        }

        if (_.isEmpty(community_nearby) || _.isNull(community_nearby) || _.isUndefined(community_nearby)) {
            console.log('Empty community_nearby');
            this.ask(this.t('NO_SLOT_NEARBY', {slot: slot}));
        }

        this.ask(this.t('PLACES_NEARBY' , {slot: slot,
        nearby1:community_nearby[0], nearby2:community_nearby[1],
        nearby3:community_nearby[2]}));
    },

    async Community_nearby_all() {
        console.log("community nearby all");
        this.$speech.addText(this.t('PLACES_NEARBY_ALL'));
        return this.followUpState('NearbyState').ask(this.$speech, this.t('YES_NO_REPROMPT'));
    },

    'NearbyState': {
        YesIntent() {
        // Have to use 'toStatelessIntent' since, the new intent resides in a separate global state,
        // whereas this current state is 'RegisterDeviceState'
        return this.tell(this.t('PLACES_NEARBY_OPTION'));
        },

        NoIntent() {
        console.log('not interested in any nearby place');
        return this.tell(this.t('END'));
        },

        Unhandled() {
        // Triggered when the requested intent could not be found in the handlers variable
        console.log('unhandled in followup state');
        }
    }
};


