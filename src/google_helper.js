'using strict';

let _ = require('lodash'),
    fetch = require('node-fetch');

module.exports = {
    async nearby(slot, location) {

        var community ={
            "radius" : "1500",
            "key" : "GOOGLE_NEARBY_API_KEY"
        }
        var locations = [];
        var url;

        url = "https://maps.googleapis.com/maps/api/place/nearbysearch/json?" + "keyword=" + slot + "&location=" + location + "&radius=" + community.radius + "&key=" + community.key;

        console.log(url);

        try {
            const response = await fetch(url);
            const places = await response.json();
            locations = places.results;
        } catch(error) {
            console.log(error);
            throw ERROR[this.t('SYSTEM_ERROR')];
        }
        return locations;
    },

    async find(slot, location) {

        var community ={
            "radius" : "1500",
            "key" : "GOOGLE_NEARBY_API_KEY"
        }
        var locations = [];
        var url;

        url = "https://maps.googleapis.com/maps/api/place/findplacefromtext/json?" + "input=" + slot + "&inputtype=textquery" + "&fields=formatted_address,name,opening_hours,rating" + "&locationbias=circle:" + community.radius + "@" + location + "&key=" + community.key;

        console.log(url);

        try {
            const response = await fetch(url);
            const places = await response.json();
            locations = places.candidates;
        } catch(error) {
            console.log(error);
            throw ERROR[this.t('SYSTEM_ERROR')];
        }
        return locations;
    }
};



