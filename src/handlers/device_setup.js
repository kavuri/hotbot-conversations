/* Copyright (C) Kamamishu Pvt. Ltd. - All Rights Reserved
 * Unauthorized copying of this file, via any medium is strictly prohibited
 * Proprietary and confidential
 */

'using strict';

module.exports = {
    Hotel_Device_Setup() {
        console.log('hotel device setup:', this.$request.session);
        console.log('--', this.$request.context);
        console.log('--', this.$request.request)
        this.tell('hotel device setup...');
    }
}
