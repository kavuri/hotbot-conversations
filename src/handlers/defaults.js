/* Copyright (C) Kamamishu Pvt. Ltd. - All Rights Reserved
 * Unauthorized copying of this file, via any medium is strictly prohibited
 * Proprietary and confidential
 */

'using strict';

let _ = require('lodash'),
    DeviceToHotel = require('../db/DeviceToHotel');

module.exports = {

    // Always triggered when a user opens your app, no matter the query (new session)
    async NEW_SESSION() {
        console.log('new session handler:');
        var device_id = this.$request.context.System.device.deviceId,
            user_id = this.$request.context.System.user.userId,
            intent = this.$request.getIntentName();

        // Get the hotel id from this device_id and user_id
        let data;
        try {
            data = await DeviceToHotel.get(device_id, user_id);
            console.log('hotel data..', data);
            if (_.isUndefined(data) || _.isEmpty(data)) {
                // Device is not registered
                this.$speech.addText(this.t('DEVICE_NOT_REGISTERED'))
                  .addText(this.t('ASK_TO_REGISTER_DEVICE'));
                
                console.log('device is not registered...');
                let reprompt = 'Please answer with yes or no.';
                return this.followUpState('RegisterDeviceState')
                    .ask(this.$speech, reprompt);
            } else {
                console.log('setting hotel_id in session attribute')
                // Set the hotel_id in the session data
                this.$session.$data.hotel_id = data.hotel_id;
            }
        } catch(error) {
            // Some DB error
            this.tell(this.t('SYSTEM_ERROR'));
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
        console.info('LAUNCH handler')
        this.ask(this.t('WELCOME', {hotel_name: 'ABC'}));
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
