/* Copyright (C) Kamamishu Pvt. Ltd. - All Rights Reserved
 * Unauthorized copying of this file, via any medium is strictly prohibited
 * Proprietary and confidential
 */

'use strict';

let DATABASE = require('../config').system.DATABASE;

var mongo = require('../mongo.js');
mongo();
    
module.exports = {
    FacilityModel: require('./' + DATABASE + '/Facilities'),
    PolicyModel: require('./' + DATABASE + '/Policies'),
    DeviceModel: require('./' + DATABASE + '/Device'),
    OrderModel: require('./' + DATABASE + '/Order'),
    HotelModel: require('./' + DATABASE + '/Hotel'),
    HotelGroupModel: require('./' + DATABASE + '/HotelGroup')
}