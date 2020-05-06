/* Copyright (C) Kamamishu Pvt. Ltd. - All Rights Reserved
 * Unauthorized copying of this file, via any medium is strictly prohibited
 * Proprietary and confidential
 */

'using strict';

const { App, Util } = require('jovo-framework');
const { Alexa } = require('jovo-platform-alexa');
let dbsetup = require('./dbsetup');
const time = require('./time');

const sinon = require('sinon');
sinon.stub(time, 'setTimeout');

jest.setTimeout(102000);

beforeAll(async () => {
    await dbsetup.initGraph();

    // Create a device
    await dbsetup.createAndAssignDevice();
});

for (const p of [new Alexa()]) {
    const testSuite = p.makeTestSuite();
    const conversation = testSuite.conversation(dbsetup.ConversationConfig);

    describe('Testing General items', () => {
        beforeEach(async () => {
            // Initiate the launch request before any of the facility intents
            const launchRequest = await testSuite.requestBuilder.launch();
            const responseLaunchRequest = await conversation.send(launchRequest);
        });

        afterEach(async () => {
            //const endIntent = await testSuite.requestBuilder.intent('AMAZON.StopIntent');
            //await conversation.send(endIntent);
        });

        test('Enquiry_all_facilities', async () => {
            const facility = await dbsetup.item('main_facilities');
            const facilityIntent = await testSuite.requestBuilder.intent('Enquiry_all_facilities');
            const facilityIntentResponse = await conversation.send(facilityIntent);
            let ret = facilityIntentResponse.getSpeechPlain();
            expect(dbsetup.removeSpace(ret)).toEqual(expect.stringMatching(dbsetup.removeSpace(facility.msg.yes + ' ANYTHING_ELSE')));
        });

        /************* General Item Tests ******************/
        test('Enquiry_facility_exists:no such item', async () => {
            const facilityIntent = await testSuite.requestBuilder.intent('Enquiry_facility_exists', { facility_slot: 'xyz' });
            const facilityIntentResponse = await conversation.send(facilityIntent);
            let ret = facilityIntentResponse.getSpeechPlain();
            expect(dbsetup.removeSpace(ret)).toEqual(expect.stringMatching(dbsetup.removeSpace('FACILITY_NOT_AVAILABLE ANYTHING_ELSE')));
        });

        test('Enquiry_facility_exists:item:available:not-orderable', async () => {
            const item = await dbsetup.createItem('f', { a: true, o: false });
            const facilityIntent = await testSuite.requestBuilder.intent('Enquiry_facility_exists', { facility_slot: item.v });
            const facilityIntentResponse = await conversation.send(facilityIntent);
            let ret = facilityIntentResponse.getSpeechPlain();
            expect(dbsetup.removeSpace(ret)).toEqual(expect.stringMatching(dbsetup.removeSpace(item.value.msg.yes + ' ANYTHING_ELSE')));

            //await dbsetup.deleteItem(item.v);   //cleanup
        });

        test('Enquiry_facility_exists:item:not-available', async () => {
            const item = await dbsetup.createItem('f', { a: false });
            const facilityIntent = await testSuite.requestBuilder.intent('Enquiry_facility_exists', { facility_slot: item.v });
            const facilityIntentResponse = await conversation.send(facilityIntent);
            let ret = facilityIntentResponse.getSpeechPlain();
            expect(dbsetup.removeSpace(ret)).toEqual(expect.stringMatching(dbsetup.removeSpace(item.value.msg.no + ' ANYTHING_ELSE')));

            //await dbsetup.deleteItem(item.v);   //cleanup
        });

    });

    describe('Testing Facilities', () => {
        beforeEach(async () => {
            // Initiate the launch request before any of the facility intents
            const launchRequest = await testSuite.requestBuilder.launch();
            const responseLaunchRequest = await conversation.send(launchRequest);
        });

        afterEach(async () => {
            //const endIntent = await testSuite.requestBuilder.intent('AMAZON.StopIntent');
            //await conversation.send(endIntent);
        });

        /************* Facility Tests ******************/
        test('Enquiry_facility_exists:facility:available:orderable', async () => {
            const item = await dbsetup.createItem('f', { a: true, o: true });
            const facilityIntent = await testSuite.requestBuilder.intent('Enquiry_facility_exists', { facility_slot: item.v });
            const facilityIntentResponse = await conversation.send(facilityIntent);
            let ret = facilityIntentResponse.getSpeechPlain();
            expect(dbsetup.removeSpace(ret)).toMatch(dbsetup.removeSpace('ITEM_EXISTS AND ' + item.value.price.msg + ' ITEM_LIKE_TO_ORDER'));

            //await dbsetup.deleteItem(item.v);   //cleanup
        });

        test('Enquiry_facility_exists:facility:available:orderable:no-to-order', async () => {
            const item = await dbsetup.createItem('f', { a: true, o: true });
            const facilityIntent = await testSuite.requestBuilder.intent('Enquiry_facility_exists', { facility_slot: item.v });
            const facilityIntentResponse = await conversation.send(facilityIntent);
            const noIntent = await testSuite.requestBuilder.intent('AMAZON.NoIntent');
            let noIntentResponse = await conversation.send(noIntent);
            let ret = noIntentResponse.getSpeechPlain();
            expect(dbsetup.removeSpace(ret)).toMatch(dbsetup.removeSpace('ANYTHING_ELSE'));

            // Close the conversation by saying no
            noIntentResponse = await conversation.send(noIntent);
            ret = noIntentResponse.getSpeechPlain();
            expect(dbsetup.removeSpace(ret)).toMatch(dbsetup.removeSpace('END'));
        });

        test('Enquiry_facility_exists:facility:available:orderable:yes-to-order', async () => {
            const item = await dbsetup.createItem('f', { a: true, o: true });
            const facilityIntent = await testSuite.requestBuilder.intent('Enquiry_facility_exists', { facility_slot: item.v });
            const facilityIntentResponse = await conversation.send(facilityIntent);
            const yesIntent = await testSuite.requestBuilder.intent('AMAZON.YesIntent');
            let yesIntentResponse = await conversation.send(yesIntent);
            let ret = yesIntentResponse.getSpeechPlain();
            expect(dbsetup.removeSpace(ret)).toMatch(dbsetup.removeSpace('REQUEST_ITEM_COUNT'));

            //await dbsetup.deleteItem(item.v);   //cleanup
        });

        test('Enquiry_Facility_location:facility:available:location', async () => {
            const item = await dbsetup.createItem('f', { a: true, o: false });
            const facilityIntent = await testSuite.requestBuilder.intent('Enquiry_Facility_location', { facility_slot: item.v });
            const facilityIntentResponse = await conversation.send(facilityIntent);
            let ret = facilityIntentResponse.getSpeechPlain();
            expect(dbsetup.removeSpace(ret)).toMatch(dbsetup.removeSpace(item.value.location.msg + ' ANYTHING_ELSE'));

            //await dbsetup.deleteItem(item.v);   //cleanup
        });

        test('Enquiry_Facility_location:facility:not-available:location', async () => {
            const facilityIntent = await testSuite.requestBuilder.intent('Enquiry_Facility_location', { facility_slot: 'xyz' });
            const facilityIntentResponse = await conversation.send(facilityIntent);
            let ret = facilityIntentResponse.getSpeechPlain();
            expect(dbsetup.removeSpace(ret)).toMatch(dbsetup.removeSpace('FACILITY_NOT_AVAILABLE ANYTHING_ELSE'));

            //await dbsetup.deleteItem(item.v);   //cleanup
        });

        test('Enquiry_Facility_location:facility:unavailable:location', async () => {
            const item = await dbsetup.createItem('f', { a: false });
            const facilityIntent = await testSuite.requestBuilder.intent('Enquiry_Facility_location', { facility_slot: item.v });
            const facilityIntentResponse = await conversation.send(facilityIntent);
            let ret = facilityIntentResponse.getSpeechPlain();
            expect(dbsetup.removeSpace(ret)).toMatch(dbsetup.removeSpace(item.value.msg.no + ' ANYTHING_ELSE'));

            //await dbsetup.deleteItem(item.v);   //cleanup
        });

        test('Enquiry_Facility_timings:facility:available:timings', async () => {
            const item = await dbsetup.createItem('f', { a: true, o: false });
            const facilityIntent = await testSuite.requestBuilder.intent('Enquiry_Facility_timings', { facility_slot: item.v });
            const facilityIntentResponse = await conversation.send(facilityIntent);
            let ret = facilityIntentResponse.getSpeechPlain();
            expect(dbsetup.removeSpace(ret)).toMatch(dbsetup.removeSpace(item.value.timings.msg + ' ANYTHING_ELSE'));

            //await dbsetup.deleteItem(item.v);   //cleanup
        });

        test('Enquiry_Facility_timings:facility:not-available:timings', async () => {
            const facilityIntent = await testSuite.requestBuilder.intent('Enquiry_Facility_timings', { facility_slot: 'xyz' });
            const facilityIntentResponse = await conversation.send(facilityIntent);
            let ret = facilityIntentResponse.getSpeechPlain();
            expect(dbsetup.removeSpace(ret)).toMatch(dbsetup.removeSpace('FACILITY_NOT_AVAILABLE ANYTHING_ELSE'));

            //await dbsetup.deleteItem(item.v);   //cleanup
        });

        test('Enquiry_Facility_timings:facility:unavailable:timings', async () => {
            const item = await dbsetup.createItem('f', { a: false });
            const facilityIntent = await testSuite.requestBuilder.intent('Enquiry_Facility_timings', { facility_slot: item.v });
            const facilityIntentResponse = await conversation.send(facilityIntent);
            let ret = facilityIntentResponse.getSpeechPlain();
            expect(dbsetup.removeSpace(ret)).toMatch(dbsetup.removeSpace(item.value.msg.no + ' ANYTHING_ELSE'));

            //await dbsetup.deleteItem(item.v);   //cleanup
        });

        test('Enquiry_Facility_price:facility:available:facility price', async () => {
            const item = await dbsetup.createItem('f', { a: true });
            const facilityIntent = await testSuite.requestBuilder.intent('Enquiry_Facility_price', { facility_slot: item.v });
            const facilityIntentResponse = await conversation.send(facilityIntent);
            let ret = facilityIntentResponse.getSpeechPlain();
            expect(dbsetup.removeSpace(ret)).toMatch(dbsetup.removeSpace(item.value.price.msg + ' ANYTHING_ELSE'));
            //await dbsetup.deleteItem(item.v);   //cleanup
        });

        test('Enquiry_Facility_price:facility:available:orderable:menuitem-price-free', async () => {
            const item = await dbsetup.createItem('m', { a: true, o: true, price: 0 });
            const facilityIntent = await testSuite.requestBuilder.intent('Enquiry_Facility_price', { facility_slot: item.v });
            const facilityIntentResponse = await conversation.send(facilityIntent);
            let ret = facilityIntentResponse.getSpeechPlain();
            expect(dbsetup.removeSpace(ret)).toMatch(dbsetup.removeSpace('ITEM_EXISTS AND ITEM_FREE ITEM_LIKE_TO_ORDER'));
            //await dbsetup.deleteItem(item.v);   //cleanup
        });

        test('Enquiry_Facility_price:facility:available:orderable:menuitem-price-not-free', async () => {
            const item = await dbsetup.createItem('m', { a: true, o: true, price: 10 });
            const facilityIntent = await testSuite.requestBuilder.intent('Enquiry_Facility_price', { facility_slot: item.v });
            const facilityIntentResponse = await conversation.send(facilityIntent);
            let ret = facilityIntentResponse.getSpeechPlain();
            expect(dbsetup.removeSpace(ret)).toMatch(dbsetup.removeSpace('ITEM_EXISTS AND ITEM_COSTS ITEM_LIKE_TO_ORDER'));
            //await dbsetup.deleteItem(item.v);   //cleanup
        });

        test('Enquiry_Facility_price:facility:available:orderable:roomitem-without-limit-for-day-price-free', async () => {
            const item = await dbsetup.createItem('ri', { a: true, o: true, limit: { count: -1, for: 'day' }, price: 0 });
            const facilityIntent = await testSuite.requestBuilder.intent('Enquiry_Facility_price', { facility_slot: item.v });
            const facilityIntentResponse = await conversation.send(facilityIntent);
            let ret = facilityIntentResponse.getSpeechPlain();
            expect(dbsetup.removeSpace(ret)).toMatch(dbsetup.removeSpace('ITEM_EXISTS AND ITEM_LIKE_TO_ORDER'));
            //await dbsetup.deleteItem(item.v);   //cleanup
        });

        test('Enquiry_Facility_price:facility:available:orderable:roomitem-with-limit-price-free', async () => {
            const item = await dbsetup.createItem('ri', { a: true, o: true, limit: { count: 1, for: 'day' }, price: 0 });
            const facilityIntent = await testSuite.requestBuilder.intent('Enquiry_Facility_price', { facility_slot: item.v });
            const facilityIntentResponse = await conversation.send(facilityIntent);
            let ret = facilityIntentResponse.getSpeechPlain();
            expect(dbsetup.removeSpace(ret)).toMatch(dbsetup.removeSpace('ITEM_EXISTS AND LIMIT_PER_DAY ITEM_LIKE_TO_ORDER'));
            //await dbsetup.deleteItem(item.v);   //cleanup
        });

        test('Enquiry_Facility_price:facility:available:orderable:roomitem-without-limit-price-not-free', async () => {
            const item = await dbsetup.createItem('ri', { a: true, o: true, limit: { count: -1, for: 'day' }, price: 10 });
            const facilityIntent = await testSuite.requestBuilder.intent('Enquiry_Facility_price', { facility_slot: item.v });
            const facilityIntentResponse = await conversation.send(facilityIntent);
            let ret = facilityIntentResponse.getSpeechPlain();
            expect(dbsetup.removeSpace(ret)).toMatch(dbsetup.removeSpace('ITEM_EXISTS AND ITEM_COSTS ITEM_LIKE_TO_ORDER'));
            //await dbsetup.deleteItem(item.v);   //cleanup
        });

        test('Enquiry_Facility_price:facility:available:orderable:roomitem-with-limit-price-not-free', async () => {
            const item = await dbsetup.createItem('ri', { a: true, o: true, limit: { count: 1, for: 'day' }, price: 10 });
            const facilityIntent = await testSuite.requestBuilder.intent('Enquiry_Facility_price', { facility_slot: item.v });
            const facilityIntentResponse = await conversation.send(facilityIntent);
            let ret = facilityIntentResponse.getSpeechPlain();
            expect(dbsetup.removeSpace(ret)).toMatch(dbsetup.removeSpace('ITEM_EXISTS AND ITEM_COSTS LIMIT_PER_DAY ITEM_LIKE_TO_ORDER'));
            //await dbsetup.deleteItem(item.v);   //cleanup
        });

        test('Enquiry_Facility_price:facility:available:orderable:roomitem-with-limit-for-stay-price-not-free', async () => {
            const item = await dbsetup.createItem('ri', { a: true, o: true, limit: { count: 1, for: 'stay' }, price: 10 });
            const facilityIntent = await testSuite.requestBuilder.intent('Enquiry_Facility_price', { facility_slot: item.v });
            const facilityIntentResponse = await conversation.send(facilityIntent);
            let ret = facilityIntentResponse.getSpeechPlain();
            expect(dbsetup.removeSpace(ret)).toMatch(dbsetup.removeSpace('ITEM_EXISTS AND ITEM_COSTS LIMIT_PER_STAY ITEM_LIKE_TO_ORDER'));
            //await dbsetup.deleteItem(item.v);   //cleanup
        });

        test('Enquiry_menu_cuisinetype:facility:all-cuisines', async () => {
            const facility = await dbsetup.item('Cuisines');
            const facilityIntent = await testSuite.requestBuilder.intent('Enquiry_menu_cuisinetype');
            const facilityIntentResponse = await conversation.send(facilityIntent);
            let ret = facilityIntentResponse.getSpeechPlain();
            expect(dbsetup.removeSpace(ret)).toMatch(dbsetup.removeSpace(facility.msg.yes + ' ANYTHING_ELSE'));
        });

        test('Equipment_action:facility:action-intent', async () => {
            const facilityIntent = await testSuite.requestBuilder.intent('Equipment_action');
            const facilityIntentResponse = await conversation.send(facilityIntent);
            let ret = facilityIntentResponse.getSpeechPlain();
            expect(dbsetup.removeSpace(ret)).toMatch(dbsetup.removeSpace('FACILITY_NONAME_NOT_AVAILABLE ANYTHING_ELSE'));
        });
    });
}
