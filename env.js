/* Copyright (C) Kamamishu Pvt. Ltd. - All Rights Reserved
 * Unauthorized copying of this file, via any medium is strictly prohibited
 * Proprietary and confidential
 */

const _ = require('lodash');
const APP_ROOT = require('app-root-path');

let ENV_FILE = '.env.' + (_.isUndefined(process.env.NODE_ENV) ? 'dev' : process.env.NODE_ENV);
console.log('ENV file=', APP_ROOT.resolve(ENV_FILE));
var ENV_PATH = APP_ROOT.resolve(ENV_FILE);
module.exports = require('dotenv').config({ path: ENV_PATH });