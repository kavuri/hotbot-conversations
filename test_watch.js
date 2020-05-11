const _ = require('lodash'),
    mongoose = require('mongoose'),
    HotelGroup = require('./src/db/HotelGroup');

async function run() {

  // Create a change stream. The 'change' event gets emitted when there's a
  // change in the database
  HotelGroup.watch().
    on('change', data => console.log(new Date(), data));

  // Insert a doc, will trigger the change stream handler above
  console.log(new Date(), 'Inserting doc');
  await HotelGroup.create({ name: 'Axl Rose' });
}

async function main() {
	await run();
}

main();
