/* Copyright (C) Kamamishu Pvt. Ltd. - All Rights Reserved
 * Unauthorized copying of this file, via any medium is strictly prohibited
 * Proprietary and confidential
 */

/*
 * This handler answers queries related to the hotel facility
 */
'using strict';

let _ = require('lodash'),
    KamError = require('../utils/KamError'),
    DBFuncs = require('../db/db_funcs');

/**
 * 
 * @param {*} thisObj 
 */
async function get_item(hotel_id, item_name) {

    console.log('get_room_item. hotel_id=' + hotel_id + ', item_name=' + item_name);

    let item;
    try {
        item = await DBFuncs.facility(hotel_id, item_name);
    } catch (error) {
        throw error;
    }

    return item;
}

function set_item(thisObj, item) {
    thisObj.$session.$data.items.push(item);
}

function get_items(thisObj) {
    return thisObj.$session.$data.items;
}

function reset_items(thisObj) {
    thisObj.$session.$data.items = [];
}

module.exports = {
    async Order_item() {
    }

}