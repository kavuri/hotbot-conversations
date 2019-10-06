/* Copyright (C) Kamamishu Pvt. Ltd. - All Rights Reserved
 * Unauthorized copying of this file, via any medium is strictly prohibited
 * Proprietary and confidential
 */

'use strict';

const _ = require('lodash'),
    mongoose = require('mongoose'),
    Fuse = require('fuse.js'),
    KamError = require('../../utils/KamError'),
    FacilityModel = require('./Facilities.js'),
    OrderModel = require('./Order'),
    AppSync = require('../../appsync');

module.exports.TYPE = {
    POLICIES: "p",
    FACILITIES: "f",
    ROOM_ITEM: "r",
    KITCHEN_ITEM: "k",
    MENU: "m"
};

/**********************************************************************************************************
 * Facility functions
 **********************************************************************************************************/
// Function to return all facilities and facilities of a type
 module.exports.all_facility_names = async function(hotel_id, facility_type) {
    console.log('all_facility_names', hotel_id, facility_type);
    if (_.isNull(hotel_id) || _.isUndefined(hotel_id)) {
        throw new KamError.InputError('invalid input. hotel_id=' + hotel_id + ',' + 'facility_type=' + facility_type);
    }

    var query = {hotel_id: hotel_id};
    if (!_.isNull(facility_type) && !_.isUndefined(facility_type)) {
        query['f_type'] = facility_type;
    }

    let data;
    try {
        data = await FacilityModel.find(query, {'_id': 0, 'f_name': 1, 'synonyms': 1}).lean();
    } catch (error) {
        console.error('error getting hotel info:', hotel_id, error);
        throw KamError.DBError('error getting hotel info:'+ hotel_id);
    }

    if (_.isEmpty(data) || _.isUndefined(data)) {
        // Make a check atleast when all facilities are asked for
        if (_.isNull(facility_type) && _.isUndefined(facility_type)) {
            // Means, all facilities are requested
            // No facilities in database for this hotel - something wrong with the setup
            throw new KamError.DBSetupError('db for this hotel has not been setup');
        }
    }

    return data;
}

// Function to get a specific facility
module.exports.facility = async (hotel_id, facility_name, facility_type) => {
    console.log('@@facility hotel_id=' + hotel_id + ',facility_name=' + facility_name + ',facility_type=' + facility_type);
    if (_.isNull(hotel_id) || _.isUndefined(hotel_id) ||
        _.isNull(facility_name) || _.isUndefined(facility_name)) {
        throw new KamError.InputError('invalid input. hotel_id=' + hotel_id + ',' + 'facility_type=' + facility_type);
    }

    // This is a 2-step process
    // 1. Get the facility names (including synonyms). Use fuse.js to search for the facility
    // 2. Use ths name in (1) to get the actual facility
    let names;
    try {
        names = await this.all_facility_names(hotel_id, facility_type);
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
    // console.log('++names=', names);
    var fuse = new Fuse(names, fuse_options);
    var result = fuse.search(facility_name);

    if (_.isEmpty(result)) {
        // No such facility
        throw new KamError.FacilityDoesNotExistError('facility with name ' + facility_name + ' and type ' + facility_type + ' for hotel with id ' + hotel_id + ' does not exist');
    }

    // console.log('###fuse search result=', result);
    // 3. Make another DB call to get the facility
    let data;
    try {
        data = await FacilityModel.findOne({hotel_id: hotel_id, f_name: result[0].f_name}).lean();
    } catch (error) {
        console.error('error getting hotel info:', hotel_id, error);
        throw new KamError.DBError('error getting hotel info:'+ hotel_id);
    }

    if (_.isUndefined(data) || _.isEmpty(data)) {
        // Did not get any facility with the required facility name
        throw new KamError.FacilityDoesNotExistError('facility with name ' + facility_name + ' and type ' + facility_type + ' for hotel with id ' + hotel_id + ' does not exist');
    }

    return data;
};

/*
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
*/

/**********************************************************************************************************
 *  Order functions
 **********************************************************************************************************/
module.exports.create_order = async function(hotel_id, room_no, user_id, items) {

    if (_.isUndefined(hotel_id) || _.isUndefined(room_no) || (_.isUndefined(items) || _.isEmpty(items))) {
        throw new KamError.InputError('invalid input. hotel_id=' + hotel_id + ',' + 'room_no=' + room_no + ',items=', items);
    }

    // Generate the order_id
    let order = new OrderModel({
        user_id: user_id,
        hotel_id: hotel_id,
        room_no: room_no,
        o_items: items
    });
    
    let r;
    try {
        r = await order.save();
    } catch (error) {
        console.log('error while saving order to db');
        throw new KamError.DBError('error while saving order to db'+ error);
    }

    // Create an app sync schema compliant order object
    const appsync_order = {
        user_id: r.user_id,
        hotel_id: r.hotel_id,
        room_no: r.room_no,
        o_id: r._id,
        o_time: r.created_at,
        o_items: r.items,
        o_status: r.o_status,
        o_priority: r.o_priority
    };

    var result = await AppSync.notify(appsync_order);

    // console.log('%%obj=', result);
    return result;
 }

 /**
   This method checks if:
    the guest has ordered the same item + on the same day + in last 2hrs + unserved
  */
 module.exports.is_room_item_already_ordered = async function(hotel_id, room_no, item_name, category) {
     if (_.isUndefined(hotel_id) || _.isUndefined(room_no) || _.isUndefined(item_name) || _.isUndefined(category)) {
         throw new KamError.InputError('invalid input. hotel_id=' + hotel_id + ', room_no=' + room_no + ',items=' + item_name + ',category=' + category);
     }

     try {
         var order = await OrderModel.find({hotel_id: hotel_id, room_no: room_no, 'o_items.name': item_name, category: category}).exec();
         console.log('item=', order);

             if (_.isEmpty(order) || _.isUndefined(order)) {
                 return false;
             } else {
                 return true;
             }

             //TODO: Should status of the order be checked? Whether the previously ordered item is served?
             // Also check for 'cancelled' status
     } catch (error) {
         console.log('error thrown', error);
         throw new KamError.DBError(error);
     }
 }

 module.exports.cancel_order = function() {

 }

 module.exports.modify_order = function() {

 }

 module.exports.change_order_status = function() {

 }

 module.exports.change_order_priority = function() {

 }

 module.exports.add_comment_to_order = function() {
     
 }

 function order() {
    var o = require('./Order');
    var items = [
        {item_name: "towel", req_count: 2, category: "r"},
        {item_name: "napkins", req_count: 1, category: "r"}
    ]
   o.create_order("107", "25", items);
}

async function test_is_item_already_ordered() {
   var o = require('./Order');
   var r = await o.is_item_already_ordered("100", "102", "towels", "r");
   console.log(r);
}

//  main();

// test_is_item_already_ordered();

const test_hotel = async function() {
    let Hotel = require('./Hotel');
    var p = await Hotel.room_item("100", "r", "tiss");
    console.log('data=', JSON.stringify(p));
}

const test_all_facilities = async function() {
    var mongo = require('../../mongo.js');
    mongo();
}

// test_all_facilities();