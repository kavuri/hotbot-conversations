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
        var location = this.$session.$data.location;
        //var location = "12.9718837,77.743491";
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
            throw ERROR["NO_SLOT_NEARBY"];
        }

        if (_.isEmpty(community_nearby) || _.isNull(community_nearby) || _.isUndefined(community_nearby)) {
            console.log('Empty community_nearby');
            this.ask(this.t('NO_SLOT_NEARBY', {slot: slot}));
        }

        this.ask(this.t('PLACES_NEARBY' , {slot: slot,
        nearby1:community_nearby[0], nearby2:community_nearby[1],
        nearby3:community_nearby[2]}));
    }
};


