/* Copyright (C) Kamamishu Pvt. Ltd. - All Rights Reserved
 * Unauthorized copying of this file, via any medium is strictly prohibited
 * Proprietary and confidential
 */

const moment = require('moment-timezone'),
      _ = require('lodash'),
      ERROR = require('./helpers').ERROR,
      Fuse = require('fuse.js'),
      Hotel = require('./db/Hotel');

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
        hotel_info = await Hotel.get(hotel_id, hotel_item);

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

module.exports.all_facility_names = async (hotel_id) => {
    let all_facilities, facility_names = [];
    try {
        all_facilities = await this.hotel_info(hotel_id, "facilities");
    } catch (error) {
        console.log('error while fetching hotel facilities:', error);
        throw error;
    }
    
    _.forEach(all_facilities.facilities, function(facility) {
        console.log(facility.name);
        facility_names.push(facility.name);
    });

    return facility_names;
};

module.exports.hotel_facility = async (hotel_id, facility_name, facility_names) => {
    console.log('hotel_id='+ hotel_id, ',facility_name='+ facility_name);
    let facilities;
    try {
        facilities = await this.hotel_info(hotel_id, "facilities");
    } catch (error) {
        console.log('error while fetching hotel facilities:', error);
        throw error;
    }
    var all_facilities = facilities.facilities;

    var fuse = new Fuse(all_facilities, this.FUSE_OPTIONS);
    var result = fuse.search(facility_name);

    var facility = result[0];   // fuse returns an array. We pick the top search item from the array
    if (_.isEmpty(facility) || _.isUndefined(facility) || _.isNull(facility)) {
        // Facility is not part of the list
        throw new FacilityDoesNotExist("Facility " + facility_name + " does not exist");
    } else {
        return facility;
    }
};

module.exports.template_to_text = (tmpl, fields) => {
    var template = _.template(tmpl);
    var text = template(fields);
    return text;
};

module.exports.ERROR = [
    "HOTEL_DOES_NOT_EXIST",
    "POLICY_DOES_NOT_EXIST",
    "DB_ERROR",
    "FACILITY_NOT_AVAILABLE",
    "SYSTEM_ERROR"
];

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

  class HotelDoesNotExistError extends Error {
      constructor(message) {
          super(message);

          this.name = this.constructor.name;
      }
  };

  class FacilityDoesNotExist extends Error {
      constructor(message) {
          super(message);

          this.name = this.constructor.name;
      }
  };

  class PolicyDoesNotExistError extends Error {
      constructor(message) {
          super(message);

          this.name = this.constructor.name;
      }
  };

  class DbError extends Error {
      constructor(message) {
          super(message);

          this.name = this.constructor.name;
      }
  };

  class SystemError extends Error {
      constructor(message) {
          super(message);

          this.name = this.constructor.name;
      }
  };

  module.exports.ERRORS = {
      HotelDoesNotExistError,
      FacilityDoesNotExist,
      PolicyDoesNotExistError,
      DbError,
      SystemError
  };