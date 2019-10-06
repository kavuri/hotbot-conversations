/* Copyright (C) Kamamishu Pvt. Ltd. - All Rights Reserved
 * Unauthorized copying of this file, via any medium is strictly prohibited
 * Proprietary and confidential
 */

'use strict';

var _ = require('lodash'),
    assert = require('assert'),
    DBFuncs = require('../src/db').DBFuncs,
    KamError = require('../src/utils/KamError');

// These test cases assume the database is pre-populated with test hotel data
describe('all_facility_names', function() {
    it('should return error when hotel_id is null', async function() {
        try {
            let r = await DBFuncs.all_facility_names();
        } catch(error) {
            assert.ok(error instanceof KamError.InputError);
        }
    });

    it('should return all facilities', async function() {
        var hotel_id = '100';
        let r;
        try {
            r = await DBFuncs.all_facility_names(hotel_id);
            assert.ok(r.length > 0, r.length);
        } catch (error) {
            assert.fail(r.length > 0, error);
        }
    });

    it('should return all facilities of type kitchen. This test case could fail if there are no kitchen facilities in the hotel', async function() {
        var hotel_id = '100', facility_type = 'k';
        let r;
        try {
            r = await DBFuncs.all_facility_names(hotel_id, facility_type);
            assert.ok(r.length > 0, r.length);
        } catch (error) {
            assert.fail(r.length > 0, error);
        }
    });

    it('should return all facilities of type facility', async function() {
        var hotel_id = '100', facility_type = 'f';
        let r;
        try {
            r = await DBFuncs.all_facility_names(hotel_id, facility_type);
            assert.ok(r.length > 0, r.length);
        } catch (error) {
            assert.fail(r.length > 0, error);
        }
    });

    it('should return all facilities of type room item', async function() {
        var hotel_id = '100', facility_type = 'r';
        let r;
        try {
            r = await DBFuncs.all_facility_names(hotel_id, facility_type);
            assert.ok(r.length > 0, r.length);
        } catch (error) {
            assert.fail(r.length > 0, error);
        }
    });

    it('should throw error if asked for unknown facility type', async function() {
        var hotel_id = '100', facility_type = 'x';
        let r;
        try {
            r = await DBFuncs.all_facility_names(hotel_id, facility_type);
            assert.ok(r.length > 0, r.length);
        } catch (error) {
            assert.ok(true, 'no facilities of type ' + facility_type + error);
        }
    });
});

// Tests for getting facility name
describe('facility', function() {
    it('should get error if no facility name is provided', async function() {
        var hotel_id = '100', facility_name = 'swimming', facility_type = 'f';
        let r;
        try {
            r = await DBFuncs.facility(hotel_id);
        } catch (error) {
            assert.ok(error instanceof KamError.InputError, 'error thrown');
        }
    });

    it('should get the desired facility', async function() {
        var hotel_id = '100', facility_name = 'swimming', facility_type = 'f';
        let r;
        try {
            r = await DBFuncs.facility(hotel_id, facility_name, facility_type);
            assert.ok(r.f_name.includes('swimming'), 'facility found');
            // console.log('@@', r);
        } catch (error) {
            assert.ok(error instanceof KamError.InputError, 'should not throw error');
        }
    });

    it('should return error if no such facility is available', async function() {
        var hotel_id = '100', facility_name = 'xxx', facility_type = 'f';
        let r;
        try {
            r = await DBFuncs.facility(hotel_id, facility_name, facility_type);
        } catch (error) {
            assert.ok(error instanceof KamError.FacilityDoesNotExistError, 'no such facility exists');
        }
    });
});

// Tests for create_order
describe('create_order', function() {
    it('should fail if order input is invalid', async function() {
        var hotel_id = '100', user_id = '100', room_no = '101', items = [];
        let r;
        try {
            r = await DBFuncs.create_order(hotel_id, room_no, user_id, items);
            assert.ok(_.isUndefined(r), 'invalid input');
        } catch (error) {
            assert.ok(error instanceof KamError.InputError, 'invalid inputs');
        }
    });

    it('should create order in the db', async function() {
        var hotel_id = '100', user_id = '100', room_no = '101', items = [{name: 'fan', req_count: 2, category: "m"}, {name: 'napkins', req_count: 1, category: "m"}];
        let r;
        try {
            r = await DBFuncs.create_order(hotel_id, room_no, user_id, items);
            assert.ok(!_.isUndefined(r), 'order created' + r);
        } catch (error) {
            console.log(error);
            assert.ok(false, 'should not throw error');
        }
    });

    it('should test if the item is already ordered', async function() {
        // var hotel_id = '100', user_id = '100', room_no = '101', item_name = 
    });
})