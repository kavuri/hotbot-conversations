/* Copyright (C) Kamamishu Pvt. Ltd. - All Rights Reserved
 * Unauthorized copying of this file, via any medium is strictly prohibited
 * Proprietary and confidential
 */

'use strict';

var _ = require('lodash'),
    mongoose = require('mongoose'),
    assert = require('assert'),
    DBFuncs = require('../src/db').DBFuncs,
    KamError = require('../src/utils/KamError');

describe('all_facility_names', function() {
    it('should return error when hotel_id is null', async function() {
        try {
            let r = await DBFuncs.all_facility_names();
        } catch(error) {
            assert.ok(error instanceof KamError.InputError);
        }
        
    });
});