/* Copyright (C) Kamamishu Pvt. Ltd. - All Rights Reserved
 * Unauthorized copying of this file, via any medium is strictly prohibited
 * Proprietary and confidential
 */

'using strict';

let _ = require('lodash'),
    fetch = require('node-fetch');

module.exports = {
    async Community_nearby() {

        var community_slot = this.$inputs.community_slot;
        var  slot = community_slot.value;
        console.log("community_slot : " + slot);
        //var location = this.$session.$data.location;
        var location = "12.9718837,77.743491";

        if (_.isEmpty(slot) || _.isNull(slot) || _.isUndefined(slot)) {
            console.log('Empty community_slot. Looks like community slot is not in the utterance.');
            this.tell(this.t('SYSTEM_ERROR'));
        }

        var community ={
                        "radius" : "1500",
                        "key" : "GOOGLE_PLACE_API_KEY",
                        "keyword" : ""
        }
        var community_nearby = [];

        var url = "https://maps.googleapis.com/maps/api/place/nearbysearch/json?" + "key=" + community.key + "&type=" + slot + "&location=" + location + "&radius=" + community.radius;
        console.log(url);

        try {
            const response = await fetch(url);
            const places = await response.json();
            var locations = places.results;
            for(var i=0 ; i<locations.length; i++){
                community_nearby.push(locations[i].name);
            }
        } catch(error) {
            console.log(error);
        }

        var message = slot + " near you are " +
                   community_nearby[0] + "," + community_nearby[1] + "," +
                   community_nearby[2];
        console.log("Community Nearby : " + message);
        if (_.isEmpty(message)) {
            this.tell(this.t('SYSTEM_ERROR'));
        }

        this.tell(message);

        }


};

module.exports.Community_nearby();
