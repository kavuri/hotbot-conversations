/* Copyright (C) Kamamishu Pvt. Ltd. - All Rights Reserved
 * Unauthorized copying of this file, via any medium is strictly prohibited
 * Proprietary and confidential
 */

'use strict';

var _ = require('lodash'),
    mongoose = require('mongoose');

var PolicySchema = new mongoose.Schema({
        hotel_id: {type: String, required: true, index: true}, // this is the "address1" field
        p_name: {type: String, required: true, index: true},
        p_type: {type: String, index: true},
        synonyms: [String],
   }, {timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }});

module.exports = mongoose.model('Policy', PolicySchema);
PolicySchema.index({hotel_id: 1, p_name: 1}, {unique: true});

module.exports.get = async (hotel_id, policy) => {
    if (_.isEmpty(hotel_id) || _.isNull(hotel_id) || _.isUndefined(hotel_id)) {
        // Something is wrong. Send out system problem to user
        console.log('Empty hotel_id. Looks like this device is not registered properly.', hotel_id);
        throw new HotelDoesNotExistError("hotel with id " + hotel_id + " does not exist");
    }

    let params = {
        TableName: TableName,
        ProjectionExpression: policy,
        Key: {
            'hotel_id': hotel_id
        }
    };

    let data;
    try {
        data = await Conn().get(params).promise();
    } catch (error) {
        console.error('error getting hotel info:', hotel_id, error);
        throw error;
    }

    return data.Item;
};

const test = async function(hotel_id, policy_name) {
    // var mongo = require('../../mongo.js');
    // mongo();

    try {
        var r = await PolicySchema.find({hotel_id: '100', p_name:"cancellation"});
        console.log(r);
    }catch(error) {
        console.error('error in getting policy', error);
    }
}

// test();