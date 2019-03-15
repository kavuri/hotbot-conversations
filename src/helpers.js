/* Copyright (C) Kamamishu Pvt. Ltd. - All Rights Reserved
 * Unauthorized copying of this file, via any medium is strictly prohibited
 * Proprietary and confidential
 */

const moment = require('moment-timezone');

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

module.exports.ERROR = [
    "HOTEL_DOES_NOT_EXIST",
    "POLICY_DOES_NOT_EXIST",
    "DB_ERROR"
];