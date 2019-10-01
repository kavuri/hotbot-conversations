/* Copyright (C) Kamamishu Pvt. Ltd. - All Rights Reserved
 * Unauthorized copying of this file, via any medium is strictly prohibited
 * Proprietary and confidential
 */

'use strict';

const _ = require('lodash');

let DATABASE = require('../config').system.DATABASE;

if (_.isEqual(DATABASE, 'mongo')) {
    var mongo = require('../mongo.js');
    mongo();
} else if (_.isEqual(DATABASE, 'dynamo')) {
    // initialize dynamodb
}
    
module.exports = {
    FacilityModel: require('./' + DATABASE + '/Facilities'),
    PolicyModel: require('./' + DATABASE + '/Policies'),
    DeviceModel: require('./' + DATABASE + '/Device'),
    OrderModel: require('./' + DATABASE + '/Order'),
    HotelModel: require('./' + DATABASE + '/Hotel'),
    HotelGroupModel: require('./' + DATABASE + '/HotelGroup'),
    DBFuncs: require('./' + DATABASE + '/db_funcs')
}