/* Copyright (C) Kamamishu Pvt. Ltd. - All Rights Reserved
 * Unauthorized copying of this file, via any medium is strictly prohibited
 * Proprietary and confidential
 */

'use strict';

const _ = require('lodash'),
    Fuse = require('fuse.js'),
    KamError = require('../utils/KamError'),
    OrderModel = require('./Order'),
    cache = require('../cache'),
    CheckinCheckout = require('./CheckinCheckout');

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

async function search(name, g) {
    if (_.isUndefined(name)) {
        throw new KamError.InputError('invalid data for search. name=' + name);
    }

    // Use fuse to search for the name
    var fuse_options = {
        shouldSort: true,
        includeScore: true,
        threshold: 0.4,
        location: 0,
        distance: 100,
        maxPatternLength: 32,
        minMatchCharLength: 3,
        keys: [
            "items"
        ]
    };

    // Get all the items from 'all_items' node
    const items = g.node('all_items');
    // console.log('total=', items.length)

    var fuse = new Fuse(items, fuse_options);
    // console.log('++data=', JSON.stringify(fuse));
    var result = fuse.search(name);
    console.log('search result=', JSON.stringify(result));

    if (!_.isEmpty(result)) {
        // There are some results
        // if (result[0].score < 0.15) { // the more the score is close to 0, the closer the search string to the result
        // return g.node(result[0].item.f_name);
        console.log('result=',items[result[0].item])
        let res = items[result[0].item];
        console.log('returning=', res);
        return res;
        // }
    } else {
        return {};
    }
}

/**
 * @param hotel_id
 * @param name
 */
module.exports.item = async function (hotel_id, name) {
    console.log('@@facility hotel_id=' + hotel_id + ',name=' + name);
    if (_.isNull(hotel_id) || _.isUndefined(hotel_id) ||
        _.isNull(name) || _.isUndefined(name)) {
        throw new KamError.InputError('invalid input. hotel_id=' + hotel_id + ',' + 'name=' + name);
    }

    let g;
    try {
        g = await cache.get(hotel_id);
    } catch (error) {
        console.log('error while getting item from cache:', error)
        throw error;
    }

    // Three step process. Optimized
    // 1. Search for the item using fuzzy search
    // 2. If item is not found, throw an error that item not found
    // 3. If the item is found,
    //   3.1. If the item has a parent, return the parent, else
    //   3.2 If the item does not have a parent, return the node
    console.log('searchin for ' + name);
    const res = await search(name, g);
    console.log(':item got:', res);
    if (_.isEmpty(res)) {
        // Could not find the item. Return not found
        console.log('facility ' + name + ' not found in search');
        //throw new KamError.FacilityDoesNotExistError('facility ' + name + ' does not exist');
        return {};
    } else {
        const parent = g.parent(res);
        if (_.isUndefined(parent)) {
            console.log('no parent. returning ', g.node(res));
            var node = g.node(res);
            node.name = res;
            // Parent does not exist. Send the node
            return node;
        } else {
            // Parent exists and is the real node. Return it
            console.log('parent exists:', parent, ' returning ', g.node(parent));
            var node = g.node(parent);
            node.name = parent;
            return node;
        }
    }
}

module.exports.getNode = async (hotel_id, name) => {
    if (_.isUndefined(hotel_id) || _.isUndefined(name)) {
        throw new KamError.InputError('invalid input. hotel_id=' + hotel_id + ', name=' + name);
    }

    const g = await cache.get(hotel_id);
    return g.node(name);
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

    if (_.isUndefined(hotel_id) ||
        _.isUndefined(room_no) ||
        _.isUndefined(user_id) ||
        _.isUndefined(items) ||
        _.isEmpty(items)) {
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
 * @param item - the item 
 * @returns {}
 */
module.exports.is_item_already_ordered = async function (hotel_id, room_no, item) {
    if (_.isUndefined(hotel_id) || _.isUndefined(room_no) || _.isUndefined(item)) {
        throw new KamError.InputError('invalid input. hotel_id=' + hotel_id + ', room_no=' + room_no + ',items=' + item);
    }

    try {
        // start = checkin time of the guest
        const filter = { hotel_id: hotel_id, room_no: room_no, checkout: null };
        let room = await CheckinCheckoutModel.findOne(filter).exec();
        let sameOrder = _.filter(room.orders, { items: [{ name: item.name }] });
        return sameOrder;
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
    var t = search('time', g);
    console.log('t=', t);
}

// test_search();
// test_all_facilities();