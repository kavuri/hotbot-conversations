/* Copyright (C) Kamamishu Pvt. Ltd. - All Rights Reserved
* Unauthorized copying of this file, via any medium is strictly prohibited
* Proprietary and confidential
*/

/*
* This handler will be used while onboarding a device into Kamamishu
* When the device is registered, the hotel/Kamamishu can ask for the device
* to setup, during which time this handler will be invoked and the device
* will be registered in the database
*/

var constants = require('../constants');
const AlexaDeviceAddressClient = require('./AlexaDeviceAddressClient');
var _ = require('lodash');
var DeviceDb = require('../db/DeviceDb.js')

/**
* Another Possible value if you only want permissions for the country and postal code is:
* read::alexa:device:all:address:country_and_postal_code
*/
const ALL_ADDRESS_PERMISSION = "read::alexa:device:all:address";

const PERMISSIONS = [ALL_ADDRESS_PERMISSION];

const setupDevice = function() {
  console.info("Starting deviceInfoHandlers():@@", this.event.context);

  // If we have not been provided with a consent token, this means that the user has not
  // authorized your skill to access this information. In this case, you should prompt them
  // that you don't have permissions to retrieve their address.
  if(!_.has(this.event.context, 'System.user.permissions.consentToken')) {
    // if(!consentToken) {
    this.emit(":tellWithPermissionCard", this.t("NOTIFY_MISSING_PERMISSIONS"), PERMISSIONS);

    // Lets terminate early since we can't do anything else.
    console.log("User did not give us permissions to access their address.");
    console.info("Ending deviceInfoHandlers()");
    return;
  }

  const apiEndpoint = this.event.context.System.apiEndpoint;
  const deviceId = this.event.context.System.device.deviceId;
  const consentToken = this.event.context.System.user.permissions.consentToken;

  const alexaDeviceAddressClient = new AlexaDeviceAddressClient(apiEndpoint, deviceId, consentToken);
  let deviceAddressRequest = alexaDeviceAddressClient.getFullAddress();

  deviceAddressRequest.then((addressResponse) => {
    switch(addressResponse.statusCode) {
      case 200:
      console.log("Address successfully retrieved, now responding to user.");
      const address = addressResponse.address;
      console.log('@@addressResponse=', addressResponse);
      addressResponse.apiEndpoint = apiEndpoint;
      addressResponse.deviceId = deviceId;
      addressResponse.consentToken = consentToken;
      addressResponse.userId = this.event.context.System.user.userId;
      addressResponse.address = {
        addressLine1: address['addressLine1'],
        addressLine2: address['addressLine2'],
        addressLine3: address['addressLine3'],
        stateOrRegion: address['stateOrRegion'],
        postalCode: address['postalCode']
      }

      var REGISTRATION_SUCCESS_MESSAGE = this.t("REGISTRATION_SUCCESS", address['addressLine1'], address['stateOrRegion'], address['postalCode'])

      // Store the device information to the database
      var device = new DeviceDb();
      device.save(addressResponse, function(err, data) {
        if (err) {
          console.log("could not save data to database:", err);
          this.emit(":tell", this.t("DEVICE_REGISTER_ERROR"))
        }
      });

      this.emit(":tell", this.t(REGISTRATION_SUCCESS_MESSAGE));
      break;
      case 204:
      // This likely means that the user didn't have their address set via the companion app.
      console.log("Successfully requested from the device address API, but no address was returned.");
      this.emit(":tell", this.t("NO_ADDRESS"));
      break;
      case 403:
      console.log("The consent token we had wasn't authorized to access the user's address.");
      this.emit(":tellWithPermissionCard", this.t("NOTIFY_MISSING_PERMISSIONS"), PERMISSIONS);
      break;
      default:
      this.emit(":ask", this.t("LOCATION_FAILURE"), this.t("LOCATION_FAILURE"));
    }

    console.info("Ending getAddressHandler()");
  });

  deviceAddressRequest.catch((error) => {
    this.emit(":tell", this.t("DEVICE_REGISTER_ERROR"));
    console.error(error);
    console.info("Ending getAddressHandler()");
  });
}

/**
* Cancels existing request
*/
const cancelRequest = function() {

}

const deviceInfoHandlers = {};
deviceInfoHandlers['Hotel_Device_Setup'] = setupDevice;
deviceInfoHandlers['AMAZON.CancelIntent'] = cancelRequest;

module.exports = deviceInfoHandlers;
