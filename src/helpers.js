/* Copyright (C) Kamamishu Pvt. Ltd. - All Rights Reserved
 * Unauthorized copying of this file, via any medium is strictly prohibited
 * Proprietary and confidential
 */

const moment = require('moment-timezone'),
      _ = require('lodash'),
      ERROR = require('./helpers').ERROR;

module.exports.user_local_time = async (jovo_obj) => {
    try {
        const timezone = await jovo_obj.$alexaSkill.$user.getTimezone();
        const now = moment.utc();
        const localTime = now.tz(timezone).format('ddd, MMM D, YYYY [at] h:mma');

        return localTime;
    } catch (error) {
        return null;
    }
}

module.exports.user_distance_unit = async (jovo_obj) => {
    try {
        const distanceUnit = await jovo_obj.$alexaSkill.$user.getDistanceUnit();
        return distanceUnit;
    } catch(error) {
        return null;
    }
}

module.exports.user_temperature_unit = async (jovo_obj) => {
    try {
        const temperatureUnit = await jovo_obj.$alexaSkill.$user.getTemperatureUnit();
        return temperatureUnit;
    } catch(error) {
        return null;
    }
}

module.exports.hotel_info = async (hotel_id, hotel_item) => {
    if (_.isEmpty(hotel_id) || _.isNull(hotel_id) || _.isUndefined(hotel_id)) {
        // Something is wrong. Send out system problem to user
        console.log('Empty hotel_id. Looks like this device is not registered properly.', hotel_id);
        throw ERROR["HOTEL_DOES_NOT_EXIST"];
        // this.tell(this.t('SYSTEM_ERROR'));
    }

    // console.log('--', smoking_slot, place_slot, hotel_id);

    let hotel_info;
    let Hotel = require('./db/Hotel');
    try {
        console.log('hotel_id='+ hotel_id, 'hotel_item='+ hotel_item);
        hotel_info = await Hotel.get(hotel_id, hotel_item);
        console.log('==hotel_policies;', JSON.stringify(hotel_info));
        if (_.isEmpty(hotel_info) || _.isNull(hotel_info) || _.isUndefined(hotel_info)) {
            // This should not happen, basically means that smoking policies are not present in the database
            throw ERROR["POLICY_DOES_NOT_EXIST"];
            // this.tell(this.t('SYSTEM_ERROR'));
        }
    } catch(error) {
        console.log('pre_check:error:', error);
        throw ERROR["DB_ERROR"];
    }

    return hotel_info;
}

module.exports.ERROR = [
    "HOTEL_DOES_NOT_EXIST",
    "POLICY_DOES_NOT_EXIST",
    "DB_ERROR"
];