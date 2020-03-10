/* Copyright (C) Kamamishu Pvt. Ltd. - All Rights Reserved
 * Unauthorized copying of this file, via any medium is strictly prohibited
 * Proprietary and confidential
 */

'use strict';

const _ = require('lodash'),
    Fuse = require('fuse.js'),
    KamError = require('../utils/KamError'),
    FacilityModel = require('./Facility.js'),
    OrderModel = require('./Order'),
    ITEM_STATUS = require('../utils/helpers').ITEM_STATUS,
    cache = require('../cache');

/**********************************************************************************************************
 * Facility functions
 **********************************************************************************************************/
// Function to return all facilities and facilities of a type
// module.exports.all_facility_names = async function (hotel_id, facility_type) {
//     console.log('all_facility_names', hotel_id, facility_type);
//     if (_.isNull(hotel_id) || _.isUndefined(hotel_id)) {
//         throw new KamError.InputError('invalid input. hotel_id=' + hotel_id + ',' + 'facility_type=' + facility_type);
//     }

//     var query = { hotel_id: hotel_id };
//     if (!_.isNull(facility_type) && !_.isUndefined(facility_type)) {
//         query['f_type'] = facility_type;
//     }

//     let data;
//     try {
//         data = await FacilityModel.find(query, { '_id': 0, 'f_name': 1, 'synonyms': 1 }).lean();
//     } catch (error) {
//         console.error('error getting hotel info:', hotel_id, error);
//         throw KamError.DBError('error getting hotel info:' + hotel_id);
//     }

//     if (_.isEmpty(data) || _.isUndefined(data)) {
//         // Make a check atleast when all facilities are asked for
//         if (_.isNull(facility_type) && _.isUndefined(facility_type)) {
//             // Means, all facilities are requested
//             // No facilities in database for this hotel - something wrong with the setup
//             throw new KamError.DBSetupError('db for this hotel has not been setup');
//         }
//     }

//     return data;
// }

module.exports.all_facility_names = async (hotel_id, facility_type) => {
    console.log('all_facility_names', hotel_id, facility_type);
    if (_.isNull(hotel_id) || _.isUndefined(hotel_id)) {
        throw new KamError.InputError('invalid input. hotel_id=' + hotel_id + ',' + 'facility_type=' + facility_type);
    }

    const g = await cache.get(hotel_id);
    const facilities = g.node('facilities');
    if (_.isEmpty(facilities) || _.isUndefined(facilities)) {
        // Does this hotel have no facilities? Bad marketing. There should be something
        throw new KamError.DBSetupError('this hotel does not seem to have any facilities. Add atleast few');
    }

    console.log('facilities=', facilities);
    return facilities;
}

module.exports.main_facilities = async (hotel_id) => {
    console.log('main_facilities:', hotel_id);
    if (_.isNull(hotel_id) || _.isUndefined(hotel_id)) {
        throw new KamError.InputError('invalid input. hotel_id=' + hotel_id);
    }

    const g = await cache.get(hotel_id);
    const main_facilities = g.node('main_facilities');
    console.log('main facilities=', main_facilities);
    return main_facilities;
}

// Function to get a specific facility
/*
module.exports.facility = async function (hotel_id, facility_name, facility_type) {
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
    } catch (error) {
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
        data = await FacilityModel.findOne({ hotel_id: hotel_id, f_name: result[0].f_name }).lean();
    } catch (error) {
        console.error('error getting hotel info:', hotel_id, error);
        throw new KamError.DBError('error getting hotel info:' + hotel_id);
    }

    if (_.isUndefined(data) || _.isEmpty(data)) {
        // Did not get any facility with the required facility name
        throw new KamError.FacilityDoesNotExistError('facility with name ' + facility_name + ' and type ' + facility_type + ' for hotel with id ' + hotel_id + ' does not exist');
    }

    return data;
};
*/

function search(facility_name) {
    if (_.isUndefined(facility_name)) {
        throw new KamError.InputError('invalid data for search. facility_name=' + facility_name);
    }

    // Use fuse to search for the name
    var fuse_options = {
        shouldSort: true,
        includeScore: true,
        threshold: 0.4,
        location: 0,
        distance: 10,
        maxPatternLength: 32,
        minMatchCharLength: 3,
        keys: [
            "items"
        ]
    };

    // Get all the items from 'all_items' node
    const items = g.node('all_items');

    var data = [{
        items: items
    }];

    console.log('++data=', data);
    var fuse = new Fuse(data, fuse_options);
    var result = fuse.search(facility_name);

    if (!_.isEmpty(result)) {
        // There are some results
        if (result[0].score < 0.15) { // the more the score is close to 0, the closer the search string to the result
            // return g.node(result[0].item.f_name);
            return items[result[0].item];
        }
    }
    return [];
}

/**
 * @param hotel_id
 * @param facility_name
 * @param facility_type
 */
module.exports.facility = async function (hotel_id, facility_name, facility_type) {
    console.log('@@facility hotel_id=' + hotel_id + ',facility_name=' + facility_name + ',facility_type=' + facility_type);
    if (_.isNull(hotel_id) || _.isUndefined(hotel_id) ||
        _.isNull(facility_name) || _.isUndefined(facility_name)) {
        throw new KamError.InputError('invalid input. hotel_id=' + hotel_id + ',' + 'facility_name=' + facility_name);
    }

    // Three step process. Optimized
    // 1. Find the item from the graph - O(1)
    // 2. If item is not found, do a fuzzy search from all the facilities
    // 3. If the item is found in step 2, use the name as the node to fetch from graph again

    const g = await cache.get(hotel_id);
    if (g.hasNode(facility_name)) {
        // This node could be a child node. The parent would have the full-info. So check if there is a parent
        const parent = g.parent(facility_name);
        if (_.isUndefined(parent)) {
            // Parent does not exist. Send the node
            return g.node(facility_name);
        } else {
            // Parent exists and is the real node. Return it
            return parent;
        }
    }

    console.log('doing fuzzy search...');
    // Could not find node directly. Do a fuzzy search
    const res = search(facility_name);
    if (_.isEmpty(res)) {
        // Could not find the item. Return not found
        throw new KamError.FacilityDoesNotExistError('facility ' + facility_name + ' does not exist');
    } else {
        return g.node(res);
    }
}

/**********************************************************************************************************
 *  Order functions
 **********************************************************************************************************/
module.exports.create_order = async function (hotel_id, room_no, user_id, items) {

    if (_.isUndefined(hotel_id) || _.isUndefined(room_no) || _.isUndefined(user_id) ||
        (_.isUndefined(items) || _.isEmpty(items))) {
        throw new KamError.InputError('invalid input. hotel_id=' + hotel_id + ',' + 'room_no=' + room_no + ',user_id=' + user_id + ',items=', items);
    }

    // Generate the order_id
    let order = new OrderModel({
        user_id: user_id,
        hotel_id: hotel_id,
        room_no: room_no,
        items: items
    });

    let r;
    try {
        r = await order.save();
    } catch (error) {
        console.log('error while saving order to db');
        throw new KamError.DBError('error while saving order to db' + error);
    }

    // console.log('%%obj=', r);
    return r;
}

/**
  This method checks if:
   the guest has ordered the same item + on the same day + in last 2hrs + unserved
 */
/**
 * @param hotel_id - the id of the hotel
 * @param room_no - the room number
 * @param f__id - the item id
 * @returns {}
 */
module.exports.is_item_already_ordered = async function (hotel_id, room_no, f_id) {
    if (_.isUndefined(hotel_id) || _.isUndefined(room_no) || _.isUndefined(f_id)) {
        throw new KamError.InputError('invalid input. hotel_id=' + hotel_id + ', room_no=' + room_no + ',items=' + item_id);
    }

    try {
        // Check for items ordered only today
        var start = new Date();
        start.setHours(0, 0, 0, 0);

        var end = new Date();
        end.setHours(23, 59, 59, 999);

        var order = await OrderModel.find(
            {
                hotel_id: hotel_id,
                room_no: room_no,
                "items.facility": f_id,
                created_at: { $gte: start, $lte: end }
            }).sort({ created_at: -1 }).exec();

        if (_.isEmpty(order)) { // Item has not been ordered ever
            // No such order has been made
            return { item: f_id, status: ITEM_STATUS.NOT_ORDERED };
        }
        //  else if () { // There are have been same orders and already served. This is going to be a hotel specific condition

        //  } else if () { // There was a same order, but not served yet.

        //  }
        console.log('item=', order);

        //TODO: Should status of the order be checked? Whether the previously ordered item is served?
        // Also check for 'cancelled' status
    } catch (error) {
        console.log('error thrown', error);
        throw new KamError.DBError(error);
    }
}

module.exports.cancel_order = function () {

}

module.exports.modify_order = function () {

}

module.exports.change_order_status = function () {

}

module.exports.change_order_priority = function () {

}

module.exports.add_comment_to_order = function () {

}

function order() {
    var o = require('./Order');
    var items = [
        { item_name: "towel", req_count: 2, category: "r" },
        { item_name: "napkins", req_count: 1, category: "r" }
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

const test_hotel = async function () {
    let Hotel = require('./Hotel');
    var p = await Hotel.room_item("100", "r", "tiss");
    console.log('data=', JSON.stringify(p));
}

const test_all_facilities = async function () {
    var facilities = await require('./db_funcs').all_facility_names('100');
    console.log('all facilities=', facilities);
}


// test_all_facilities();