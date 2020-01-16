/* Copyright (C) Kamamishu Pvt. Ltd. - All Rights Reserved
 * Unauthorized copying of this file, via any medium is strictly prohibited
 * Proprietary and confidential
 */

'using strict';

let _ = require('lodash'),
    DeviceModel = require('../db/Device'),
    HotelModel = require('../db/Hotel'),
    KamError = require('../utils/KamError'),
    rp = require('request-promise');

module.exports = {

    // Always triggered when a user opens your app, no matter the query (new session)
    async NEW_SESSION() {
        console.log('new session handler:');
        //Account linking starts
        let token = await this.$request.getAccessToken();
        console.log('Token : ' + token);

        // checkSessionToken(this, token);

        // if (_.isEmpty(token) || _.isNull(token) || _.isUndefined(token) || _.isUndefined(token)) {
        //     this.$alexaSkill.showAccountLinkingCard();
        //     return this.tell('Please link you Account');
        // }else{
        //     let options = {
        //         method: 'GET',
        //         uri: 'https://kamamishu-india.auth0.com/userinfo',
        //         headers: {
        //             authorization: 'Bearer ' + token,
        //         }
        //     };

        //     await rp(options).then((body) => {
        //         let data = JSON.parse(body);
        //         let user_name = data.name ;
        //     });
        // }
        //Account linking ends

        // FixME Add user_name in Device_To_Hotel/separate login table for tracking purpose
        var device_id = this.$request.context.System.device.deviceId,
            user_id = this.$request.context.System.user.userId,
            intent = this.$request.getIntentName();

        // Get the hotel id from this device_id and user_id

        let data;
        try {
            data = await DeviceModel.findOne({device_id: device_id}).populate('belongs_to');

            console.log('hotel data..', JSON.stringify(data));
            if (_.isUndefined(data) || _.isEmpty(data)) {
                // Device is not registered
                this.$speech.addText(this.t('DEVICE_NOT_REGISTERED'))
                  .addText(this.t('ASK_TO_REGISTER_DEVICE'));
                
                console.log('device is not registered...');
                return this.followUpState('RegisterDeviceState')
                    .ask(this.$speech, this.t('YES_NO_REPROMPT'));
            } else if (_.isUndefined(data.belongs_to) || !_.isEqual(data.status, 'active')) {
                return this.tell(this.t('DEVICE_NOT_ASSIGNED_TO_HOTEL'));
            } else {
                // Set the hotel_id and info in the session data
                this.$session.$data.hotel = {
                    hotel_id: data.hotel_id,
                    room_no: data.room_no,
                    user_id: data.user_id,
                    name: data.belongs_to.name
                }
            }

        } catch(error) {
            // Some DB error
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

    //FIXME: Replace 'ABC' to the hotel name
    async LAUNCH() {
        console.info('LAUNCH handler', this.$session.$data.hotel);
        this.ask(this.t('WELCOME', {hotel_name: this.$session.$data.hotel.name}));
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

// function checkSessionToken(this, token) {
//     if (_.isEmpty(token) || _.isNull(token) || _.isUndefined(token) || _.isUndefined(token)) {
//         this.$alexaSkill.showAccountLinkingCard();
//         return this.tell('Please link you Account');
//     }else{
//             let options = {
//                 method: 'GET',
//                 uri: 'https://kamamishu-india.auth0.com/userinfo',
//                 headers: {
//                     authorization: 'Bearer ' + token,
//                 }
//             };

//             await rp(options).then((body) => {
//                 let data = JSON.parse(body);
//                 let user_name = data.name ;
//             });
//     }
//         // Account linking ends
// }