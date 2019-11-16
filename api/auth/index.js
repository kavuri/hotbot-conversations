/* Copyright (C) Kamamishu Pvt. Ltd. - All Rights Reserved
 * Unauthorized copying of this file, via any medium is strictly prohibited
 * Proprietary and confidential
 */

'use strict';

let AUTH_PROVIDER = require('../config').authProvider;

module.exports = require('./' + AUTH_PROVIDER);