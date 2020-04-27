/* Copyright (C) Kamamishu Pvt. Ltd. - All Rights Reserved
 * Unauthorized copying of this file, via any medium is strictly prohibited
 * Proprietary and confidential
 */

'using strict';

let _ = require('lodash'),
    DeviceModel = require('../db/Device'),
    KamError = require('../utils/KamError'),
    HotelModel = require('../db/Hotel'),    // Even though HotelModel is not used, DeviceModel.find().populate('belongs_to') needs this. Else, the call is failing
    dotenv = require('dotenv'),
    fetch = require('node-fetch'),
    DBFuncs = require('../db/db_funcs'),
    AlexaDeviceAddressClient = require('./AlexaDeviceAddressClient');
const ALL_ADDRESS_PERMISSION = "read::alexa:device:all:address";
const PERMISSIONS = [ALL_ADDRESS_PERMISSION];

dotenv.config();

module.exports = {
    // Always triggered when a user opens your app, no matter the query (new session)
    async NEW_SESSION() {
        //FIXME: Deep invocations do not work, since NEW_SESSION is not invoked for deep invocations.
        // Like, 'Alexa launch front desk and order a coffee for me'
        console.log('new session handler:');

        var device_id = this.$request.context.System.device.deviceId;

        let data;
        try {
            console.log('getting device...', device_id);
            // Get the hotel id from this device_id and user_id
            data = await DeviceModel
                .findOne({ device_id: device_id })
                .populate('belongs_to')
                .populate('room');

            console.log('hotel data..', JSON.stringify(data));
            if (_.isUndefined(data) || _.isEmpty(data)) {
                // Device is not registered
                this.$speech
                    .addText(this.t('DEVICE_NOT_REGISTERED'))
                    .addBreak('200ms')
                    .addText(this.t('ASK_TO_REGISTER_DEVICE'));

                console.log('device is not registered...');
                return this.followUpState('RegisterDeviceState')
                    .ask(this.$speech, this.t('YES_NO_REPROMPT'));
            } else if (
                _.isUndefined(data.belongs_to) ||
                _.isEqual(data.status, 'inactive') ||
                _.isNull(data.belongs_to)) {
                return this.tell(this.t('DEVICE_NOT_ASSIGNED_TO_HOTEL'));
            } else {
                // Set the hotel_id and info in the session data
                this.$session.$data.hotel = {
                    hotel_id: data.hotel_id,
                    room_no: data.room.room_no,
                    user_id: data.user_id,
                    name: data.belongs_to.name
                }
            }
        } catch (error) {
            // Some DB error
            console.log('error while fetching device:', error);
            if (error instanceof KamError.DBError) {
                this.tell(this.t('SYSTEM_ERROR'));
            }
        }
    },

    'RegisterDeviceState': {
        async YesIntent() {
            try {
                const address = await this.$alexaSkill.$user.getDeviceAddress();
                console.log('address=', address);

                this.tell('got full address');
                if (!_.has(address, 'addressLine1') || !_.has(address, 'addressLine2')) {
                    // Admin has not set the hotel_id in addressLine1 and room_no in addressLine2
                    return this.tell(this.t('DEVICE_ADDRESS_NOT_SET'));
                }
                var device = new DeviceModel({
                    device_id: this.$request.context.System.device.deviceId,
                    user_id: this.$request.context.System.user.userId,
                    hotel_id: address.addressLine1,
                    room_no: address.addressLine2,
                    address: address
                });

                try {
                    let res = await device.save();

                    this.$speech.addText(this.t('DEVICE_REGISTRATION_SUCCESS'));
                    this.tell(this.$speech);
                } catch (error) {
                    console.log('device setup error...', error);
                    this.tell(this.t('DEVICE_REGISTER_ERROR'));
                }
            } catch (error) {
                console.log('error while getting address:', error);
                this.$alexaSkill.showAskForAddressCard().tell(this.t('NOTIFY_MISSING_PERMISSIONS'));
                if (error.code === 'NO_USER_PERMISSION') {
                    console.log('user permission not given');
                } else {
                    // Do something
                    console.log('@@doing nothing:', error);
                }
            }
        },

        async NoIntent() {
            console.log('not registering this device');
            return this.tell(this.t('END'));
        },

        async Unhandled() {
            // Triggered when the requested intent could not be found in the handlers variable
            console.log('global unhandled state ');
        }
    },

    NEW_USER() {
        console.info('NEW_USER handler');
    },

    async LAUNCH() {
        // FIXME: Add user in Device_To_Hotel/separate login table for tracking purpose
        //const user = checkSessionToken(this);

        // Inject menu items
        // We do not inject any items that are not part of the skill in Alexa
        let menuItems = null;
        try {
            menuItems = await DBFuncs.allMenuItems(this.$session.$data.hotel.hotel_id);
        } catch (error) {
            // If error, does not have menu items
        }

        if (!_.isNull(menuItems)) {
            // Inject the menu items
            this.$alexaSkill.replaceDynamicEntities([menuItems]);
        }

        console.info('LAUNCH handler', this.$session.$data.hotel);
        this.ask(this.t('WELCOME', { hotel_name: this.$session.$data.hotel.name }));
    },

    END() {
        //TODO: Store the reason to database
        console.log('THE END ....');

        return this.tell(this.t('END'));
    },

    Unhandled() {
        // Triggered when the requested intent could not be found in the handlers variable
        console.log('Global unhandled intent...');
        this.$speech
            .addText(this.t('SORRY'))
            .addBreak('100ms')
            .addText(this.t('UNKNOWN_REQUEST'))
            .addBreak('100ms')
            .addText(this.t('HELP_MESSAGE'));
        return this.ask(this.$speech);
    }
}

async function checkSessionToken(thisObj) {
    let token = await thisObj.$request.getAccessToken();
    //console.log('checking for token:', token);
    if (_.isEmpty(token) || _.isNull(token) || _.isUndefined(token)) {
        //console.log('no token in request. Sending account linking card');
        thisObj.$alexaSkill.showAccountLinkingCard();
        return thisObj.tell('Please link you Account');
    } else {
        //console.log('invoking GET userinfo');
        const user = await fetch('https://' + process.env.AUTH0_DOMAIN + '/userinfo', {
            method: 'GET',
            headers: {
                authorization: 'Bearer ' + token,
            }
        });
        //console.log('userinfo=', user);
        return user;
    }
    // Account linking ends
}