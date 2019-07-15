/* Copyright (C) Kamamishu Pvt. Ltd. - All Rights Reserved
 * Unauthorized copying of this file, via any medium is strictly prohibited
 * Proprietary and confidential
 */

 'using strict';

 const _ = require('lodash'),
       gql = require('graphql-tag'),
       mutations = require('../utils/graphql/mutations'),
       uuidv1 = require('uuid/v1'),
       KamError = require('../utils/KamError'),
       appsync = require('../utils/appsync');
 
 module.exports.create_order = function(hotel_id, room_no, items) {

    if (_.isUndefined(hotel_id) || _.isUndefined(room_no) || (_.isUndefined(items) || _.isEmpty(items))) {
        throw KamError.InputError('invalid input. hotel_id=' + hotel_id + ',' + 'room_no=' + room_no + ',items=', items);
    }

    // Generate the order_id
    let order_id = uuidv1();
    let order_time = new Date().toISOString();
    let status = "new";
    
    appsync.hydrated().then((client) => {
        const obj = {
            hotel_id: hotel_id,
            order_id: order_id,
            room_no: room_no,
            order_time: order_time,
            items: items,
            status: status
        };

        client.mutate({mutation: gql(mutations.createGuestOrder), variables: {input: obj}})
        .then((data) => {
            console.log('order raised', data);
        })
        .catch((e) => {
            console.log('error in creating order');
            throw e;
        });
    });
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

 function main() {
     var o = require('./Order');
     var items = [
         {item_name: "towel", req_count: 2, category: "r"},
         {item_name: "napkins", req_count: 1, category: "r"}
     ]
    o.create_order("107", "25", items);
 }
 
//  main();