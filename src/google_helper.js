'using strict';

let _ = require('lodash'),
    fetch = require('node-fetch');

module.exports = {
    async nearby(slot, location, keyword) {

        var community ={
            "radius" : "1500",
            "key" : "GOOGLE_NEARBY_API_KEY"
        }
        var community_nearby = [];
        var url;

        if (_.isEmpty(keyword) || _.isNull(keyword) || _.isUndefined(keyword)) {
            url = "https://maps.googleapis.com/maps/api/place/nearbysearch/json?" + "key=" + community.key + "&type=" + slot + "&location=" + location + "&radius=" + community.radius;
        }else {
            url = "https://maps.googleapis.com/maps/api/place/nearbysearch/json?" + "key=" + community.key + "&type=" + slot + "&location=" + location + "&radius=" + community.radius + "keyword=" + community.keyword;
        }

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

        return community_nearby;
    }
};



