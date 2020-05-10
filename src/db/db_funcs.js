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
    CheckinCheckoutModel = require('./CheckinCheckout'),
    uuid = require('uuid');

/**
 * Remove the cache item from database
 */
module.exports.delCache = async (hotel_id) => {
    cache.del(hotel_id);
}

/**
 * Returns all the hotel menu items without the policies, facilities and room items. This is mainly to inject the data into the intent calls
 * The policies are in the policies handler - should not be a problem
 * Room items and facilities are part of the Alexa slot types
 * Menu items can be injected via dynamicEntities feature
 * 
 * Structure of the dynamic entities
 {
    name: 'facility_types',
    values: [
        {
            id: 'idli',
            name: {
                value: 'idli',
                synonyms: ['rava idli'],
            }
        },
        {
            id: 'dosa',
            name: {
                value: 'dosa'
            }
        },
    ]
 }
 */
module.exports.allMenuItems = async (hotel_id) => {
    const g = await cache.get(hotel_id);

    // Get all menu items
    const menuitems = g.successors('menuitem');
    if (_.isEmpty(menuitems) || _.isUndefined(menuitems)) {
        // Does this hotel have no facilities? Bad marketing. There should be something
        throw new KamError.DBSetupError('this hotel does not seem to have any menu items');
    }

    let mapped = menuitems.map((item) => {
        return { name: { value: item, synonyms: (_.isEmpty(g.children(item)) ? undefined : g.children(item)) } }
    });

    return {
        name: 'facility_types',
        values: mapped.slice(0, 99) // Since Alexa can only take 100 items, slice off all entries beyond 100
    };
}

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
 */
module.exports.main_facilities = async (hotel_id) => {
    console.log('main_facilities:', hotel_id);
    if (_.isNull(hotel_id) || _.isUndefined(hotel_id)) {
        throw new KamError.InputError('invalid input. hotel_id=' + hotel_id);
    }

    const g = await cache.get(hotel_id);
    const main_facilities = g.children('main_facilities');
    console.log('main facilities=', main_facilities);
    return main_facilities;
}

async function search(name, g) {
    if (_.isUndefined(name)) {
        throw new KamError.InputError('invalid data for search. name=' + name);
    }

    // Use fuse to search for the name
    var fuse_options = {
        isCaseSensitive: false,
        shouldSort: true,
        includeScore: true,
        includeMatches: false,
        findAllMatches: true,
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
    // const itemsObj = { items: items };
    // console.dir(items, {'maxArrayLength': null});
    console.log('total=', items.length);

    var fuse = new Fuse(items, fuse_options);
    // console.log('++data=', JSON.stringify(fuse));
    var result = fuse.search(name);
    console.log('search result=', JSON.stringify(result));

    // the more the score is close to 0, the closer the search string to the result
    if (!_.isEmpty(result) && (result[0].score < 0.15)) { // FIXME: Does a treshold value of 0.15 good enough?
        let res = result[0];
        console.log('returning=', res);
        return res;
        // }
    }
    return {};
}

/**
 * @param hotel_id
 * @param name
 * @param absMatch, if true, do not fuzzy search, else perform fuzzy search
 * @returns the item from database
 */
module.exports.item = async function (hotel_id, name, absMatch=false) {
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
    console.log('Found hotel.....');

    // Three step process. Optimized
    // 1. Search for the item using fuzzy search
    // 2. If item is not found, throw an error that item not found
    // 3. If the item is found,
    //   3.1. If the item has a parent, return the parent, else
    //   3.2 If the item does not have a parent, return the node
    console.log('searchin for ' + name);
    const res = await search(name, g);
    console.log(':item got:', res);
    // TODO: Use absMatch hint flag
    if (_.isEmpty(res)) {
        // Could not find the item. Return not found
        console.log('facility ' + name + ' not found in search');
        //throw new KamError.FacilityDoesNotExistError('facility ' + name + ' does not exist');
        return {};
    } else {
        let item_name = res.item;
        const parent = g.parent(item_name);
        if (_.isUndefined(parent)) {
            console.log('no parent. returning ', g.node(item_name));
            var node = g.node(item_name);
            node.name = item_name;
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

    let checkincheckout;
    try {
        const filter = { hotel_id: hotel_id, room_no: room_no, checkout: null };
        checkincheckout = await CheckinCheckoutModel.findOne(filter).exec();
        console.log('checkincheckout obj=', checkincheckout);
    } catch (error) {
        throw new KamError.DBError('error while saving order to db' + error);
    }

    let orders = [];
    for (var i = 0; i < items.length; i++) {
        orders[i] = new OrderModel({
            order_group_id: uuid(),
            user_id: user_id,
            hotel_id: hotel_id,
            room_no: room_no,
            item: items[i],
            curr_status: { status: 'new', set_by: user_id },
            curr_priority: { priority: 'asap', set_by: user_id },
            checkincheckout: checkincheckout._id
        });
    }

    console.log('order=', orders);
    let r = [];
    try {
        for (var i = 0; i < orders.length; i++) {
            r[i] = await orders[i].save();
            console.log('saved order:', r[i]);
        }
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
 * @returns [] an array of orders matching the criteria
 */
module.exports.already_ordered_items = async function (hotel_id, room_no, itemObj) {
    if (_.isUndefined(hotel_id) || _.isUndefined(room_no) || _.isUndefined(itemObj)) {
        throw new KamError.InputError('invalid input. hotel_id=' + hotel_id + ', room_no=' + room_no + ',items=' + itemObj);
    }

    try {
        // start = checkin time of the guest
        const filter = { hotel_id: hotel_id, room_no: room_no, checkout: null };
        let room = await CheckinCheckoutModel
            .findOne(filter)
            .populate('orders')
            .exec();
        if (_.isNull(room) || _.isUndefined(room)) {
            // Checkin of the guest was probably not done
            return [];  // FIXME: Should we return empty list and let the orders be logged?
        }
        //console.log('----room=', JSON.stringify(room));
        let sameOrder = _.filter(room.orders, (o) => {
            return _.isEqual(_.lowerCase(o.item.name), _.lowerCase(itemObj.name));
            // { item: { name: itemObj.name() } }
        });
        //console.log('----sameOrder=', sameOrder);
        return sameOrder;
    } catch (error) {
        console.log('error thrown', error);
        throw new KamError.DBError(error);
    }
}

/**
 *  Returns the orders that have curr_status="new" or "progress"
 */
module.exports.new_orders = async function (hotel_id, room_no, user_id) {
    if (_.isUndefined(hotel_id) ||
        _.isUndefined(room_no) ||
        _.isUndefined(user_id)) {
        throw new KamError.InputError('invalid input. hotel_id=' + hotel_id + ',' + 'room_no=' + room_no + ',user_id=' + user_id);
    }
    console.log('input. hotel_id=' + hotel_id + ',' + 'room_no=' + room_no + ',user_id=' + user_id);

    const filter = { hotel_id: hotel_id, room_no: room_no, checkout: null };
    let checkinCheckout;
    try {
        checkinCheckout = await CheckinCheckoutModel
            .findOne(filter)
            .populate('orders')
            .exec();
         //console.log('found orders=', JSON.stringify(checkinCheckout.orders));
        var newOrders = _.filter(checkinCheckout.orders, { curr_status: { status: "new" } });
        var progressOrders = _.filter(checkinCheckout.orders, { curr_status: { status: "progress" } });
        //console.log('%%%newOrders=', newOrders, ',%%% progressOrders=', progressOrders);
        let openOrders = _.concat(newOrders, progressOrders);
        return openOrders;
    } catch (error) {
        console.error('error in storing order reference to CheckinCheckout:', error);
        throw new Error(error);
    }
}

/**
 *  Returns all the orders made by the guest during the stay
 */
module.exports.all_orders = async function (hotel_id, room_no, user_id) {
    if (_.isUndefined(hotel_id) ||
        _.isUndefined(room_no) ||
        _.isUndefined(user_id)) {
        throw new KamError.InputError('invalid input. hotel_id=' + hotel_id + ',' + 'room_no=' + room_no + ',user_id=' + user_id);
    }
    console.log('input. hotel_id=' + hotel_id + ',' + 'room_no=' + room_no + ',user_id=' + user_id);

    const filter = { hotel_id: hotel_id, room_no: room_no, checkout: null };
    let checkinCheckout, allOrders = [];
    try {
        checkinCheckout = await CheckinCheckoutModel
            .findOne(filter)
            .populate('orders')
            .exec();
        // console.log('found orders=', JSON.stringify(checkinCheckout.orders));
        allOrders = checkinCheckout.orders;
        // Of these orders, remove the cancelled orders
        _.remove(allOrders, (o) => { return _.isEqual(o.curr_status.status, 'cancelled'); });
        //console.log('++allOrders=', allOrders);
        return allOrders;
    } catch (error) {
        console.error('error in storing order reference to CheckinCheckout:', error);
        throw new Error(error);
    }
}

/**
 * Cancels an order
 */
module.exports.cancel_order = async (hotel_id, room_no, user_id, item_name) => {
    if (_.isUndefined(hotel_id) ||
        _.isUndefined(room_no) ||
        _.isUndefined(user_id) ||
        _.isEmpty(item_name)) {
        throw new KamError.InputError('invalid input. hotel_id=' + hotel_id + ',' + 'room_no=' + room_no + ',user_id=' + user_id + ',item_name=', item_name);
    }
    console.log('input. hotel_id=' + hotel_id + ',' + 'room_no=' + room_no + ',user_id=' + user_id + ',item_name=', item_name);

    const filter = { hotel_id: hotel_id, room_no: room_no, checkout: null };
    let checkinCheckout;
    try {
        console.log('item_name=', item_name)
        checkinCheckout = await CheckinCheckoutModel
            .findOne(filter)
            .populate('orders')
            .exec();
        // console.log('found orders=', JSON.stringify(checkinCheckout.orders));
        var newOrders = _.filter(checkinCheckout.orders, { item: { name: item_name }, curr_status: { status: "new" } });
        var progressOrders = _.filter(checkinCheckout.orders, { item: { name: item_name }, curr_status: { status: "progress" } });
        console.log('---found newOrders=', newOrders, ',progressOrders=', progressOrders);
        let cancelledOrder;
        if (!_.isEmpty(newOrders)) {
            // There are orders, set the status to "cancelled"
            for (let i = 0; i < newOrders.length; i++) {
                newOrders[i].curr_status = { status: "cancelled", set_by: user_id };
                newOrders[i].status.push({ set_by: user_id, status: "cancelled" });
                cancelledOrder = await newOrders[i].save();
                console.log('new order cancelled =', cancelledOrder);
            }
        }
        if (!_.isEqual(progressOrders)) {
            for (let i = 0; i < progressOrders.length; i++) {
                progressOrders[i].curr_status = {
                    status: "cancelled",
                    set_by: user_id
                }
                progressOrders[i].status.push({ set_by: user_id, status: "cancelled" });
                cancelledOrder = progressOrders[i].save();
                console.log('progress order cancelled =', cancelledOrder);
            }
        }
    } catch (error) {
        console.error('error in storing order reference to CheckinCheckout:', error);
        throw new Error(error);
    }
}

module.exports.change_order_status = function () {

}

module.exports.change_order_priority = function () {

}

module.exports.add_comment_to_order = function () {

}

function order_create() {
    var o = require('./db_funcs');
    var items = [{ name: 'coffee', type: 'm', req_count: 2 }];
    o.create_order("103",
        "101",
        "amzn1.ask.account.AGNAI33JLPXUYAHAS3INZIZ42OBZOF353BJ7J3EXQMS2WQF3LWUFQVU5W5NE64PW67V3Y7TCIEWJRGXVEWC63DXVXMUPOZXYPH7VNJCDX34J3SNWJVAP4REEOWQS3YPUTM547SW7AMPW2RFCJN7Q5AV7CJ3FA73APF4LBGO3CQNBDGFFJXDNTCMTO4HMHEKUZZGXWEW2QBB5CGA",
        items);
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

const test_cancel_order = async () => {
    var o = require('./db_funcs');
    let orders = o.cancel_order("103", "101", "1", "tea");
}

// test_search();
// test_all_facilities();
 //order_create();