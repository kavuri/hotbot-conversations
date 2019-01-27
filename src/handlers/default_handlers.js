/* Copyright (C) Kamamishu Pvt. Ltd. - All Rights Reserved
 * Unauthorized copying of this file, via any medium is strictly prohibited
 * Proprietary and confidential
 */

'using strict';

module.exports = {

    // Always triggered when a user opens your app, no matter the query (new session)
    NEW_SESSION() {
        console.log('new session handler:');
        // TODO: Get the hotel_id and validate if this request is originating from a valid device
        
    },

    NEW_USER() {
        console.info('NEW_USER handler');
    },

    LAUNCH() {
        console.info('LAUNCH handler')
        this.tell(this.t('WELCOME', {hotel_name: 'ABC'}));
    },

    END() {
        let reason = this.getEndReason();

        //TODO: Store the reason to database

        this.tell('END');
    },

    Unhandled() {
        // Triggered when the requested intent could not be found in the handlers variable

    }
}
