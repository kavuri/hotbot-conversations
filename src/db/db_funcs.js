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

/**
 * Returns all facilities of the hotel
 */
module.exports.allFacilities = async (hotel_id) => {
    console.log('all_facility_names', hotel_id);
    if (_.isNull(hotel_id) || _.isUndefined(hotel_id)) {
        throw new KamError.InputError('invalid input. hotel_id=' + hotel_id);
    }

    const g = await cache.get(hotel_id);
    const facilities = g.successors('facilities');
    if (_.isEmpty(facilities) || _.isUndefined(facilities)) {
        // Does this hotel have no facilities? Bad marketing. There should be something
        throw new KamError.DBSetupError('this hotel does not seem to have any facilities. Add atleast few');
    }

    console.log('facilities=', facilities);
    return facilities;
}

/**
 * Returns of the main facilities (a subset of allFacilities)
 * FIXME: This is not used right now. Maybe later
 */
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

function search(name, g) {
    if (_.isUndefined(name)) {
        throw new KamError.InputError('invalid data for search. name=' + name);
    }

    // Use fuse to search for the name
    var fuse_options = {
        shouldSort: true,
        includeScore: true,
        threshold: 0.4,
        location: 0,
        distance: 20,
        maxPatternLength: 32,
        minMatchCharLength: 3,
        keys: [
            "items"
        ]
    };

    // Get all the items from 'all_items' node
    const items = g.node('all_items');
    console.log('total=', items.length)

    var data = {
        items: items
    };

    var fuse = new Fuse(items, fuse_options);
    // console.log('++data=', JSON.stringify(fuse));
    var result = fuse.search(name);
    console.log('search result=', JSON.stringify(result));

    if (!_.isEmpty(result)) {
        // There are some results
        // if (result[0].score < 0.15) { // the more the score is close to 0, the closer the search string to the result
            // return g.node(result[0].item.f_name);
            const res = items[result[0].item];
            console.log('search result=',res);
            return res;
        // }
    }
    return [];
}

/**
 * @param hotel_id
 * @param name
 * @param facility_type
 */
module.exports.item = async function (hotel_id, name) {
    console.log('@@facility hotel_id=' + hotel_id + ',name=' + name);
    if (_.isNull(hotel_id) || _.isUndefined(hotel_id) ||
        _.isNull(name) || _.isUndefined(name)) {
        throw new KamError.InputError('invalid input. hotel_id=' + hotel_id + ',' + 'name=' + name);
    }

    // Three step process. Optimized
    // 1. Find the item from the graph - O(1)
    // 2. If item is not found, do a fuzzy search from all the facilities
    // 3. If the item is found in step 2, use the name as the node to fetch from graph again

    const g = await cache.get(hotel_id);
    const res = search(name, g);
    if (_.isEmpty(res)) {
        // Could not find the item. Return not found
        console.log('facility ' + name + ' not found in search');
        throw new KamError.FacilityDoesNotExistError('facility ' + name + ' does not exist');
    } else {
        const parent = g.parent(res);
        if (_.isUndefined(parent)) {
            // Parent does not exist. Send the node
            return g.node(name);
        } else {
            // Parent exists and is the real node. Return it
            return g.node(parent);
        }
    }
}

module.exports.successors = async (hotel_id, name) => {
    if (_.isUndefined(hotel_id)) {
        throw new KamError.InputError('invalid input. hotel_id=' + hotel_id);
    }

    const g = await cache.get(hotel_id);
    return g.successors(name)
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

const test_search = async () => {
    const g = await cache.get('000');
    var t = search('swimming pool', g);
    console.log('t=', t);
}

// test_search();
// test_all_facilities();