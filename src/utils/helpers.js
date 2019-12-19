/* Copyright (C) Kamamishu Pvt. Ltd. - All Rights Reserved
 * Unauthorized copying of this file, via any medium is strictly prohibited
 * Proprietary and confidential
 */

const moment = require('moment-timezone'),
      _ = require('lodash');

module.exports.ITEM_STATUS = {
    NOT_ORDERED: 'not_ordered',
    ALREADY_ORDERED_SERVED: 'already_ordered_and_served',
    ALREADY_ORDERED_NOT_SERVED: 'already_ordered_not_served'
};

module.exports.FACILITY_TYPE = {
    POLICIES: "p",
    FACILITIES: "f",
    ROOM_ITEM: "r",
    KITCHEN_ITEM: "k",
    MENU: "m"
};

module.exports.is_same_day = async (dt1_str, dt2_str) => {
    const dt1 = new Date(dt1_str), dt2 = new Date(dt2_str);
    if (_isEqual(dt1.getFullYear(), dt2.getFullYear()) &&
       (_.isEqual(dt1.getMonth(), dt2.getMonth)) &&
       (_.isEqual(dt1.getDate(), dt2.getDate))) {
           return true;
       } else {
           return false;
       }
};

module.exports.user_local_time = async (jovo_obj) => {
    try {
        const timezone = await jovo_obj.$alexaSkill.$user.getTimezone();
        const now = moment.utc();
        const localTime = now.tz(timezone).format('ddd, MMM D, YYYY [at] h:mma');

        return localTime;
    } catch (error) {
        return null;
    }
};

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
};

module.exports.hotel_info = async (hotel_id, hotel_item) => {
    if (_.isEmpty(hotel_id) || _.isNull(hotel_id) || _.isUndefined(hotel_id)) {
        // Something is wrong. Send out system problem to user
        console.log('Empty hotel_id. Looks like this device is not registered properly.', hotel_id);
        throw new HotelDoesNotExistError("hotel with id " + hotel_id + " does not exist");
    }

    let hotel_info;
    try {
        hotel_info = await HOTEL.get(hotel_id, hotel_item);

        if (_.isEmpty(hotel_info) || _.isNull(hotel_info) || _.isUndefined(hotel_info)) {
            // This should not happen, basically means that smoking policies are not present in the database
            throw new DbError('looks like data entry issue.' + hotel_item + ' does not exist');
        }
    } catch(error) {
        console.log('pre_check:error:', error);
        throw ERROR["DB_ERROR"];
    }

    return hotel_info;
};

module.exports.template_to_text = (tmpl, fields) => {
    var template = _.template(tmpl);
    var text = template(fields);
    return text;
};

module.exports.FUSE_OPTIONS = {
    shouldSort: true,
    threshold: 0.5,
    location: 0,
    distance: 100,
    maxPatternLength: 32,
    minMatchCharLength: 3,
    keys: [
      "name"
    ]
};
