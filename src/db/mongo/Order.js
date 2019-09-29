/* Copyright (C) Kamamishu Pvt. Ltd. - All Rights Reserved
 * Unauthorized copying of this file, via any medium is strictly prohibited
 * Proprietary and confidential
 */

 'using strict';

 const _ = require('lodash'),
       Conn = require('./Conn'),
       gql = require('graphql-tag'),
       mutations = require('../../utils/graphql/mutations'),
       uuidv1 = require('uuid/v1'),
       KamError = require('../../utils/KamError'),
       appsync = require('../../utils/appsync');

const TableName = 'GuestOrderTable';
 
 module.exports.create_order = async function(hotel_id, room_no, items) {

    if (_.isUndefined(hotel_id) || _.isUndefined(room_no) || (_.isUndefined(items) || _.isEmpty(items))) {
        throw new KamError.InputError('invalid input. hotel_id=' + hotel_id + ',' + 'room_no=' + room_no + ',items=', items);
    }

    // Generate the order_id
    let order_id = uuidv1();
    let order_time = new Date().toISOString();
    let status = "new";
    
    await appsync.hydrated();
    const obj = {
        hotel_id: hotel_id,
        o_id: order_id,
        room_no: room_no,
        o_time: order_time,
        o_items: items,
        o_status: status
    };

    // console.log('%%obj=', obj);
    const result = await appsync.mutate({mutation: gql(mutations.createGuestOrder), variables: {input: obj}});
    return result;
 }

 /**
   This method check if:
    the guest has ordered the same item + on the same day + in last 2hrs + unserved
  */
 module.exports.is_item_already_ordered = async function(hotel_id, room_no, item_name, category) {
     if (_.isUndefined(hotel_id) || _.isUndefined(room_no) || _.isUndefined(item_name) || _.isUndefined(category)) {
         throw new KamError.InputError('invalid input. hotel_id=' + hotel_id + ', room_no=' + room_no + ',items=' + item_name + ',category=' + category);
     }

     // Check from Order table for this data
     let params = {
        TableName: TableName,
        ProjectionExpression: 'o_items, o_status, o_cancelled_by, o_comments, o_time',
        KeyConditionExpression: 'hotel_id = :hotel_id and room_no = :room_no',
        ExpressionAttributeValues: {
            ':hotel_id': hotel_id,
            ':room_no': room_no
        }
    };

    let data;
    try {
        data = await Conn().query(params).promise();
    } catch(error) {
        console.log('error in fetching existing order', error);
        throw new KamError.DBError(error);
    }
    console.log(JSON.stringify(data));

    if (_.isEmpty(data.Items)) {
        // No orders found
        return [];
    } else {
        return data.Items[0].o_items;
    }
    var item = _.find(data.Items[0].o_items, {category: category, item_name: item_name});

    if (_.isUndefined(item)) {
        // No such item order
        return false;
    } else {
        return true;
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

 function main() {
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