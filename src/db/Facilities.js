/* Copyright (C) Kamamishu Pvt. Ltd. - All Rights Reserved
 * Unauthorized copying of this file, via any medium is strictly prohibited
 * Proprietary and confidential
 */
'use strict';

var _ = require('lodash'),
    Fuse = require('fuse.js'),
    Conn = require('./Conn'),
    KamError = require('../utils/KamError');

const TableName = 'HotelFacilities';

/**
 * Method returns all facility names
 */
module.exports.all_facility_names = async function(hotel_id, facility_type) {
    if (_.isNull(hotel_id) || _.isUndefined(hotel_id)) {
        throw new KamError.InputError('invalid input. hotel_id=' + hotel_id + ',' + 'facility_type=' + facility_type);
    }

    let params = {
        TableName: TableName,
        ProjectionExpression: 'f_name, synonyms',
        KeyConditionExpression: 'hotel_id = :hotel_id',
        ExpressionAttributeValues: {
            ':hotel_id': hotel_id
        }
    };

    // If facility_type is specified, use it filter the data, based on the facility_type
    if (!_.isUndefined(facility_type)) {
        params.FilterExpression = 'f_type = :f_type';
        params.ExpressionAttributeValues[':f_type'] = facility_type;
    }

    // console.log('params=', params);

    let data;
    try {
        data = await Conn().query(params).promise();
    } catch (error) {
        console.error('error getting hotel info:', hotel_id, error);
        throw KamError.DBError('error getting hotel info:'+ hotel_id);
    }

    return data.Items;
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

const test = async function() {
    let Facilities = require('./Facilities');
    // var p = await Facilities.all_facility_names("100");
    var p = await Facilities.facility("100", "reception", "f");
    console.log('data=', JSON.stringify(p));
}

// test();