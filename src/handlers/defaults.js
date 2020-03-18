/* Copyright (C) Kamamishu Pvt. Ltd. - All Rights Reserved
 * Unauthorized copying of this file, via any medium is strictly prohibited
 * Proprietary and confidential
 */

'using strict';

let _ = require('lodash'),
    DeviceModel = require('../db/Device'),
    KamError = require('../utils/KamError'),
    HotelModel = require('../db/Hotel'),
    dotenv = require('dotenv'),
    fetch = require('node-fetch');

dotenv.config();

module.exports = {

    // Always triggered when a user opens your app, no matter the query (new session)
    async NEW_SESSION() {
        console.log('new session handler:');

        var device_id = this.$request.context.System.device.deviceId;
        //user_id = this.$request.context.System.user.userId;

        let data;
        try {
            console.log('getting device...', device_id)
            // Get the hotel id from this device_id and user_id
            data = await DeviceModel.findOne({ device_id: device_id }).populate('belongs_to').populate('room');

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
        YesIntent() {
            // Have to use 'toStatelessIntent' since, the new intent resides in a separate global state, 
            // whereas this current state is 'RegisterDeviceState'
            return this.toStatelessIntent('Device_setup');
        },

        NoIntent() {
            console.log('not registering this device');
            return this.tell(this.t('END'));
        },

        Unhandled() {
            // Triggered when the requested intent could not be found in the handlers variable
            console.log('unhandled in followup state');
        }
    },

    NEW_USER() {
        console.info('NEW_USER handler');
    },

    async LAUNCH() {
        // FIXME: Add user in Device_To_Hotel/separate login table for tracking purpose
        const user = checkSessionToken(this);

        console.info('LAUNCH handler', this.$session.$data.hotel);
        this.ask(this.t('WELCOME', { hotel_name: this.$session.$data.hotel.name }));
    },

    END() {
        let reason = this.getEndReason();

        //TODO: Store the reason to database

        this.tell('END');
    },

    Unhandled() {
        // Triggered when the requested intent could not be found in the handlers variable
        console.log('Global unhandled intent...');
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