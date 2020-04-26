/* Copyright (C) Kamamishu Pvt. Ltd. - All Rights Reserved
 * Unauthorized copying of this file, via any medium is strictly prohibited
 * Proprietary and confidential
 */

const moment = require('moment-timezone'),
      _ = require('lodash'),
      KamError = require('./KamError');

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

module.exports.template_to_text = (tmpl, fields) => {
    var template = _.template(tmpl);
    var text = template(fields);
    return text;
};
