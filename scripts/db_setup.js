/* Copyright (C) Kamamishu Pvt. Ltd. - All Rights Reserved
 * Unauthorized copying of this file, via any medium is strictly prohibited
 * Proprietary and confidential
 */

'using strict';

// Create tables
const argv = require('yargs')
    .usage('Usage: $0 <command> [options]')
    .example('$0 -t -l -f ./master_hotel_data.json')
    .help('h')
    .alias('h', 'help')
    .alias('d', 'delete')
    .describe('d', 'delete collections data')
    .alias('t', 'test')
    .describe('t', 'populate test data')
    .alias('f', 'file')
    .describe('f', 'hotel data file')
    .argv,
    _ = require('lodash'),
    {
        execSync
    } = require('child_process');

var ALL_MODELS = require('../src/db/');

// console.log(argv.local, _.split(argv.create, ','), argv.delete);

if (!_.isUndefined(argv.delete)) {
    // Delete tables
    delete_tables();
} else if (!_.isUndefined(argv.test)) {
    // Populate test data
    populate_hotel_data(argv.file);
}

async function delete_tables() {
    console.log('deleting collection data...');
    var d = await ALL_MODELS.DeviceModel.deleteMany({}) //, function(err) { console.log(err); })
    d = await ALL_MODELS.FacilityModel.deleteMany({}) //, function(err) {console.log(err); });
    d = await ALL_MODELS.OrderModel.deleteMany({}) //, function(err) {console.log(err); });
    d = await ALL_MODELS.PolicyModel.deleteMany({}) //, function(err) {console.log(err); });
    d = await ALL_MODELS.HotelModel.deleteMany({}) //, function(err) {console.log(err); });
    d = await ALL_MODELS.HotelGroupModel.deleteMany({}) //, function(err) {console.log(err); });

    console.log('deleted table contents');
}

async function populate_hotel_data(hotel_data_file) {
    console.log('populate test data for ' + hotel_data_file);

    const fs = require('fs');
    let hotel_data = JSON.parse(fs.readFileSync(hotel_data_file));

    // Hotel group data
    let hg = await store_hotel_group_data(hotel_data);

    // Hotel data
    let hotel = await store_hotel_data(hotel_data, hg.group_id);
console.log('^^h=',hotel);
    // Store facilities data
    await store_facilities_data(hotel_data, hotel.hotel_id);

    //Store policies data
    // store_policies_data(hotel_data);

    console.log('created test data...');
}

async function store_hotel_group_data(hotel_data) {
    var hg_data = hotel_data.hotel_group;
    let hg = new ALL_MODELS.HotelGroupModel(hg_data);
    hg = await hg.save();
    return hg;
}

async function store_hotel_data(hotel_data, group_id) {
    hotel_data.hotel.group_id = group_id;
    let h = new ALL_MODELS.HotelModel(hotel_data.hotel);
    try {
        h = await h.save();
    } catch (error) {
        console.log(error);
    }
    return h;
}

/**
 * Creates facilities data from master
 * Structure of facilities
 * { hotel_id: '100',
  name: 'clock',
  type: 'r',
  count: 1,
  synonyms: [ 'table clock', 'watch' ],
  availability: 
   { flag: 'true',
     message: { true: 'There is a clock in the room' } } }
    { hotel_id: '100',
  name: 'towel',
  type: 'r',
  count: 2,
  synonyms: [ 'bath towel' ],
  availability: 
   { flag: 'true',
     message: { true: 'There are towels in the in the bathroom' } } }
 * @param {*} db_conn 
 * @param {*} hotel_data 
 */
async function store_facilities_data(hotel_data, hotel_id) {
    var facilities = hotel_data.facilities;

    for (var i = 0; i < facilities.length; i++) {
        // Get all the keys for this hotel and add them as key/value pairs
        var facility = facilities[i];
        var keys = Object.keys(facility);
        var obj = {};
        // obj.hotel_id = hotel_data.hotel.hotel_id;
        obj.hotel_id = hotel_id;
        for (var j = 0; j < keys.length; j++) {
            obj[keys[j]] = facility[keys[j]];
        }

        let f = new ALL_MODELS.FacilityModel(obj);
        try {
            f = await f.save();
        } catch (error) {
            console.log(error, obj);
            process.exit(1);
        }
    }
}

// FIXME: Need to reorganize policies data
async function store_policies_data(hotel_data) {
    var policies = hotel_data.policies;
    for (var i = 0; i < policies.length; i++) {
        // Get all the keys for this hotel and add them as key/value pairs
        var policy = policies[i];
        var keys = Object.keys(policy);
        var obj = {};
        obj.hotel_id = hotel_data.hotel.hotel_id;
        for (var j = 0; j < keys.length; j++) {
            obj[keys[j]] = policy[keys[j]];
        }

        let p = new ALL_MODELS.PolicyModel(obj);
        p = await p.save();
    }
}