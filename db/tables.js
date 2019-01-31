/* Copyright (C) Kamamishu Pvt. Ltd. - All Rights Reserved
 * Unauthorized copying of this file, via any medium is strictly prohibited
 * Proprietary and confidential
 */

'using strict';

// Create tables
const argv = require('yargs')
    .usage('Usage: $0 <command> [options]')
    .example('$0 -c hotel.json,device.json -l')
    .help('h')
    .alias('h', 'help')
    .alias('l', 'local')
    .nargs('l', 0)
    .describe('l', 'for connecting to local dynamodb')
    .alias('c', 'create')
    .describe('c', 'list of table files to create')
    .alias('d', 'delete')
    .describe('d', 'list of tables to delete')
    .argv,
    _ = require('lodash'),
    { execSync } = require('child_process');

const all_tables_json = [
    'Hotel.json',
    'Device.json',
    'HotelGroup.json'
];

const all_tables = [
    'Hotel',
    'Device',
    'HotelGroup'
];

let create_table_cmd = 'aws dynamodb create-table ';
let delete_table_cmd = 'aws dynamodb delete-table ';
const end_point_url = ' --endpoint-url http://localhost:8000 ';
let cli_input_json = ' --cli-input-json file://./';

// console.log(argv.local, _.split(argv.create, ','), argv.delete);

if (_.isEqual(argv.local, true)) {
    create_table_cmd += end_point_url;
    delete_table_cmd += end_point_url;
}

if (!_.isUndefined(argv.create)) {
    // Create tables
    create_tables(_.split(argv.create, ','));
} else if (!_.isUndefined(argv.delete)) {
    // Delete tables
    delete_tables(_.split(argv.delete, ','));
}

//aws dynamodb create-table --cli-input-json file://./hotel.json --endpoint-url http://localhost:8000
/**
 * If tables are passed in the arg, use that, else, create all tables
 * @param {*} tables 
 */
function create_tables(tables) {
    console.log('create_tables:', tables[0]);
    if (_.isEqual(tables[0], 'true')) {
        tables = all_tables_json;
    }
    
    _.forEach(tables, (val) => {
        console.log(val);
        create_table_cmd += cli_input_json + val;
        let out = execSync(create_table_cmd);
        console.log(out);
    });
}

function delete_tables(tables) {
    console.log('delete_tables:', tables);
    if (_.isEqual(tables[0], 'true')) {
        tables = all_tables;
    }
    
    _.forEach(tables, (val) => {
        console.log(val);
        delete_table_cmd += ' --table-name ' + val;
        let out = execSync(delete_table_cmd);
        console.log(out);
    });
}