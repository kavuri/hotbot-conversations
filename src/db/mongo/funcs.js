/* Copyright (C) Kamamishu Pvt. Ltd. - All Rights Reserved
 * Unauthorized copying of this file, via any medium is strictly prohibited
 * Proprietary and confidential
 */

'use strict';

var _ = require('lodash'),
    mongoose = require('mongoose');

/**
 * Method returns all facility names
 */
module.exports.all_facility_names = async function(hotel_id, facility_type) {
    if (_.isNull(hotel_id) || _.isUndefined(hotel_id)) {
        throw new KamError.InputError('invalid input. hotel_id=' + hotel_id + ',' + 'facility_type=' + facility_type);
    }

    var FacilityModel = require('./index.js').FacilityModel;
    var fields = 'f_name synonyms ';
    if (!_.isUndefined(facility_type)) {
        fields += ' f_type';
    }
    

    let data;
    try {
        data = await FacilityModel.find({hotel_id: hotel_id}, fields, {lean:true});
    } catch (error) {
        console.error('error getting hotel info:', hotel_id, error);
        throw KamError.DBError('error getting hotel info:'+ hotel_id);
    }

    return data;
}

module.exports.facility = async (hotel_id, facility_name, facility_type) => {
    console.log('Facilities.facility. hotel_id=' + hotel_id + ',facility_name=' + facility_name + ',facility_type=' + facility_type);
    if (_.isNull(hotel_id) || _.isUndefined(hotel_id) ||
        _.isNull(facility_name) || _.isUndefined(facility_name)) {
        throw new KamError.InputError('invalid input. hotel_id=' + hotel_id + ',' + 'facility_type=' + facility_type);
    }

    // This is a 2-step process
    // 1. Get the facility names (including synonyms). Use fuse.js to search for the facility
    // 2. Use ths name in (1) to get the actual facility
    try {
        var names = await this.all_facility_names(hotel_id, facility_type);
    } catch(error) {
        throw error;
    }

    // 2. Use fuse to search for the name
    let fuse_options = {
        shouldSort: true,
        threshold: 0.5,
        location: 0,
        distance: 100,
        maxPatternLength: 32,
        minMatchCharLength: 3,
        keys: [
          "f_name",
          "synonyms"
        ]
    };
    console.log('++names=', names);
    var fuse = new Fuse(names, fuse_options);
    var result = fuse.search(facility_name);

    console.log('###fuse search result=', result);
    // 3. Make another DB call to get the facility
    let params = {
        TableName: TableName,
        KeyConditionExpression: 'hotel_id = :hotel_id and f_name = :f_name',
        ExpressionAttributeValues: {
            ':hotel_id': hotel_id,
            ':f_name': result[0].f_name
        }
    };

    let data;
    try {
        data = await Conn().query(params).promise();
    } catch (error) {
        console.error('error getting hotel info:', hotel_id, error);
        throw KamError.DBError('error getting hotel info:'+ hotel_id);
    }

    if (_.isUndefined(data.Items) || _.isEmpty(data.Items)) {
        // Did not get any facility with the required facility name
        throw new KamError.FacilityDoesNotExistError('facility with name ' + facility_name + ' and type ' + facility_type + ' for hotel with id ' + hotel_id + ' does not exist');
    }

    console.log('+++', JSON.stringify(data));
    return data.Items[0];
};

const test_facility = async function() {
    // let Facilities = require('./Facilities');
    let Facilities = require('./Facilities');
    // var p = await Facilities.all_facility_names("100");
    var p = await Facilities.facility("100", "reception", "f");
    console.log('data=', JSON.stringify(p));
}

module.exports.room_item = async function(hotel_id, f_type, room_item) {
    if (_.isEmpty(hotel_id) || _.isEmpty(f_type) || _.isEmpty(room_item)) {
        // Error in input
        throw new Error('invalid input');
    }

    let params = {
        TableName: TableName,
        Key: {
            'hotel_id': hotel_id
        },
        AttributesToGet: ['facilities']
    };

    let data;
    try {
        data = await Conn().get(params).promise();
    } catch (error) {
        console.error('error while getting hotel facilities:', hotel_id, error);
        throw error;
    }

    let fuse_options = {
        shouldSort: true,
        threshold: 0.5,
        location: 0,
        distance: 100,
        maxPatternLength: 32,
        minMatchCharLength: 3,
        keys: [
          "f_type"
        ]
    };

    var fuse = new Fuse(data.Item.facilities, fuse_options);
    var result = fuse.search(f_type);

    // reset fuse options to search by name instead of f_type
    fuse_options.keys = ["name"];
    var item = new Fuse(result, fuse_options);
    var r = item.search(room_item);

    return r;
}

const test_hotel = async function() {
    let Hotel = require('./Hotel');
    var p = await Hotel.room_item("100", "r", "tiss");
    console.log('data=', JSON.stringify(p));
}

const test_all_facilities = async function() {
    var mongo = require('../../mongo.js');
    mongo();

    all_facility_names()
}

test_all_facilities();