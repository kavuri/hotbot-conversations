/* Copyright (C) Kamamishu Pvt. Ltd. - All Rights Reserved
 * Unauthorized copying of this file, via any medium is strictly prohibited
 * Proprietary and confidential
 */

'using strict';

let _ = require('lodash'),
    google_helper = require('../google_helper'),
    community_types = require('../community_types'),
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
    async Community_nearby() {
        var community_slot = this.$inputs.community_slot;
        var  slot = community_slot.value;
        var location = this.$session.$data.location;
        //var location = "12.9718837,77.743491";
        var community_type_list = [];

        console.log("community_slot : " + slot);

        if (_.isEmpty(slot) || _.isNull(slot) || _.isUndefined(slot)) {
            console.log('Empty community_slot. Looks like community slot is not in the utterance.');
            return this.ask(this.t('SLOT_NOT_AVAILABLE'));
        }

        community_type_list = await community_types.Community_type_list();

        var fuse = new Fuse(community_type_list, fuse_options);

        var result = fuse.search(slot);

        try {
            if(_.isEmpty(result) || _.isNull(result) || _.isUndefined(result)){
                var query_slot = slot.replace(/ /g, "%20")
                var community_nearby = await google_helper.find(query_slot, location);

                if (_.isEmpty(community_nearby) || _.isNull(community_nearby) || _.isUndefined(community_nearby)) {
                    console.log('Empty community_nearby');
                    return this.ask(this.t('NO_SLOT_NEARBY', {slot: slot}));
                }

                this.ask(this.t('SPECIFIC_COMMUNITY_NEARBY' , {slot: slot,
                    community_address:community_nearby[0].formatted_address,
                    rating:community_nearby[0].rating}));
            }else {
                var query_slot = slot.replace(/ /g, "+")
                var community_nearby = await google_helper.nearby(query_slot, location);

                if (_.isEmpty(community_nearby) || _.isNull(community_nearby) || _.isUndefined(community_nearby)) {
                    console.log('Empty community_nearby');
                    return this.ask(this.t('NO_SLOT_NEARBY', {slot: slot}));
                }

                this.$session.$data.option1 = community_nearby[0];
                this.$session.$data.option2 = community_nearby[1];
                this.$session.$data.option3 = community_nearby[2];

                this.ask(this.t('PLACES_NEARBY' , {slot: slot,
                    nearby1:community_nearby[0].name,
                    nearby2:community_nearby[1].name,
                    nearby3:community_nearby[2].name}));
            }
        } catch(error) {
            console.log(error);
            this.ask(this.t('NO_SLOT_NEARBY', {slot: slot}));
        }
    },

    async Community_nearby_all() {
        console.log("community nearby all");
        this.$speech.addText(this.t('PLACES_NEARBY_ALL'));
        return this.ask(this.$speech);
    },

    async Community_options() {
        console.log("community options");
        var input_option = this.$inputs.option_number.value;
        console.log("input_option " + input_option);

        var option = "option" + input_option;

        var session_data = this.$session.$data;
        var community_option = session_data[option];

        this.$speech.addText(this.t('COMMUNITY_NEARBY_NAME' , {option_number:
        input_option , community_name:  community_option.name}));

        this.$speech.addText(this.t('COMMUNITY_NEARBY_ADDRESS' , {community_address:  community_option.vicinity}));
        return this.ask(this.$speech);
    }
};


