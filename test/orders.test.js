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

jest.setTimeout(152000);

beforeAll(async () => {
    await dbsetup.initGraph();

    // Create a device
    await dbsetup.createAndAssignDevice();
});

for (const p of [new Alexa()]) {
    const testSuite = p.makeTestSuite();
    const conversation = testSuite.conversation(dbsetup.ConversationConfig);

    describe('Order handler tests', () => {
        beforeEach(async () => {
            // Initiate the launch request before any of the facility intents
            const launchRequest = await testSuite.requestBuilder.launch();
            const responseLaunchRequest = await conversation.send(launchRequest);
        });

        afterEach(async () => {
            //const endIntent = await testSuite.requestBuilder.intent('AMAZON.StopIntent');
            //await conversation.send(endIntent);
        });

        test('Order_item:item_name not provided', async () => {
            const item = await dbsetup.createItem('ri', { a: false, o: true });
            const orderIntent = await testSuite.requestBuilder.intent('Order_item');
            const orderIntentResponse = await conversation.send(orderIntent);
            let ret = orderIntentResponse.getSpeechPlain();
            expect(dbsetup.removeSpace(ret)).toEqual(expect.stringMatching(dbsetup.removeSpace('REPEAT_REQUEST')));
        });

        test('Order_item:not-available', async () => {
            const item = await dbsetup.createItem('ri', { a: false, o: true });
            console.log('====', item);
            const orderIntent = await testSuite.requestBuilder.intent('Order_item', { facility_slot: item.v });
            const orderIntentResponse = await conversation.send(orderIntent);
            let ret = orderIntentResponse.getSpeechPlain();
            expect(dbsetup.removeSpace(ret)).toEqual(expect.stringMatching(dbsetup.removeSpace(item.value.msg.no + ' ORDER_ANYTHING_ELSE')));
        });

        test('Order_item:available:not-orderable', async () => {
            const item = await dbsetup.createItem('ri', { a: true, o: false });
            console.log('====', item);
            const orderIntent = await testSuite.requestBuilder.intent('Order_item', { facility_slot: item.v });
            const orderIntentResponse = await conversation.send(orderIntent);
            let ret = orderIntentResponse.getSpeechPlain();
            expect(dbsetup.removeSpace(ret)).toEqual(expect.stringMatching(dbsetup.removeSpace(item.value.msg.yes + ' ANYTHING_ELSE')));
        });

        test('Order_item:available:orderable:guest-not-checked-in:count-not-provided', async () => {
            const item = await dbsetup.createItem('ri', { a: true, o: true });
            console.log('====', item);
            let orderIntent = await testSuite.requestBuilder.intent('Order_item', { facility_slot: item.v });
            let orderIntentResponse = await conversation.send(orderIntent);
            let ret = orderIntentResponse.getSpeechPlain();
            expect(dbsetup.removeSpace(ret)).toEqual(expect.stringMatching(dbsetup.removeSpace(' REQUEST_ITEM_COUNT')));

            // Send req_count
            orderIntent = await testSuite.requestBuilder.intent('Order_item', { facility_slot: item.v, req_count: 2 });
            orderIntentResponse = await conversation.send(orderIntent);
            ret = orderIntentResponse.getSpeechPlain();
            expect(dbsetup.removeSpace(ret)).toEqual(expect.stringMatching(dbsetup.removeSpace('REPEAT_ORDER_WITH_COUNT ORDER_ANYTHING_ELSE')));
        });

        test('Order_item:available:orderable:guest-checked-in:count-not-provided', async () => {
            const item = await dbsetup.createItem('ri', { a: true, o: true });
            await dbsetup.checkinGuest();

            console.log('====', item);
            let orderIntent = await testSuite.requestBuilder.intent('Order_item', { facility_slot: item.v });
            let orderIntentResponse = await conversation.send(orderIntent);
            let ret = orderIntentResponse.getSpeechPlain();
            expect(dbsetup.removeSpace(ret)).toEqual(expect.stringMatching(dbsetup.removeSpace(' REQUEST_ITEM_COUNT')));

            // Send req_count
            orderIntent = await testSuite.requestBuilder.intent('Order_item', { facility_slot: item.v, req_count: 2 });
            orderIntentResponse = await conversation.send(orderIntent);
            ret = orderIntentResponse.getSpeechPlain();
            expect(dbsetup.removeSpace(ret)).toEqual(expect.stringMatching(dbsetup.removeSpace('REPEAT_ORDER_WITH_COUNT ORDER_ANYTHING_ELSE')));

            // Send No to confirm order
            let noIntent = await testSuite.requestBuilder.intent('AMAZON.NoIntent');
            orderIntentResponse = await conversation.send(noIntent);
            ret = orderIntentResponse.getSpeechPlain();
            expect(dbsetup.removeSpace(ret)).toEqual(expect.stringMatching(dbsetup.removeSpace('ORDER_LIST ORDER_CONFIRM_MSG')));

            // Send Yes to confirm order
            let yesIntent = await testSuite.requestBuilder.intent('AMAZON.YesIntent');
            orderIntentResponse = await conversation.send(yesIntent);
            ret = orderIntentResponse.getSpeechPlain();
            expect(dbsetup.removeSpace(ret)).toEqual(expect.stringMatching(dbsetup.removeSpace('TELL_ORDER_CONFIRMED')));
        });

        test('Order_item:available:orderable:guest-checked-in:count-provided:reorder:no-to-reorder-end-session-without-ordering', async () => {
            const item = await dbsetup.createItem('ri', { a: true, o: true });
            let cin = await dbsetup.checkinGuest();
            await dbsetup.createOrder([item], cin);

            let orderIntent = await testSuite.requestBuilder.intent('Order_item', { facility_slot: item.v, req_count: 2 });
            let orderIntentResponse = await conversation.send(orderIntent);
            let ret = orderIntentResponse.getSpeechPlain();
            expect(dbsetup.removeSpace(ret)).toEqual(expect.stringMatching(dbsetup.removeSpace('ORDER_IN_PROGRESS ORDER_ASK_AGAIN')));

            // Send No to not to reorder
            let noIntent = await testSuite.requestBuilder.intent('AMAZON.NoIntent');
            orderIntentResponse = await conversation.send(noIntent);
            ret = orderIntentResponse.getSpeechPlain();
            expect(dbsetup.removeSpace(ret)).toEqual(expect.stringMatching(dbsetup.removeSpace('ANYTHING_ELSE')));

            orderIntentResponse = await conversation.send(noIntent);
            ret = orderIntentResponse.getSpeechPlain();
            expect(dbsetup.removeSpace(ret)).toEqual(expect.stringMatching(dbsetup.removeSpace('END')));
        });

        test('Order_item:available:orderable:guest-checked-in:count-provided:reorder:yes-to-reorder-end-session-with-ordering', async () => {
            const item = await dbsetup.createItem('ri', { a: true, o: true });
            let cin = await dbsetup.checkinGuest();
            await dbsetup.createOrder([item], cin);

            let orderIntent = await testSuite.requestBuilder.intent('Order_item', { facility_slot: item.v, req_count: 2 });
            let orderIntentResponse = await conversation.send(orderIntent);
            let ret = orderIntentResponse.getSpeechPlain();
            expect(dbsetup.removeSpace(ret)).toEqual(expect.stringMatching(dbsetup.removeSpace('ORDER_IN_PROGRESS ORDER_ASK_AGAIN')));

            // Send No to not to reorder
            let yesIntent = await testSuite.requestBuilder.intent('AMAZON.YesIntent');
            orderIntentResponse = await conversation.send(yesIntent);
            ret = orderIntentResponse.getSpeechPlain();
            expect(dbsetup.removeSpace(ret)).toEqual(expect.stringMatching(dbsetup.removeSpace('REPEAT_ORDER_WITH_COUNT ORDER_ANYTHING_ELSE')));

            orderIntentResponse = await conversation.send(noIntent);
            ret = orderIntentResponse.getSpeechPlain();
            expect(dbsetup.removeSpace(ret)).toEqual(expect.stringMatching(dbsetup.removeSpace('ORDER_LIST ORDER_CONFIRM_MSG')));

            // Say yes to confirm
            orderIntentResponse = await conversation.send(yesIntent);
            ret = orderIntentResponse.getSpeechPlain();
            expect(dbsetup.removeSpace(ret)).toEqual(expect.stringMatching(dbsetup.removeSpace('TELL_ORDER_CONFIRMED')));
        });

        test('Order_item:available:orderable:guest-checked-in:count-provided:reorder:yes-to-reorder-cancel-current-orders', async () => {
            const item = await dbsetup.createItem('ri', { a: true, o: true });
            let cin = await dbsetup.checkinGuest();
            await dbsetup.createOrder([item], cin);

            let orderIntent = await testSuite.requestBuilder.intent('Order_item', { facility_slot: item.v, req_count: 2 });
            let orderIntentResponse = await conversation.send(orderIntent);
            let ret = orderIntentResponse.getSpeechPlain();
            expect(dbsetup.removeSpace(ret)).toEqual(expect.stringMatching(dbsetup.removeSpace('ORDER_IN_PROGRESS ORDER_ASK_AGAIN')));

            // Send No to not to reorder
            let yesIntent = await testSuite.requestBuilder.intent('AMAZON.YesIntent');
            orderIntentResponse = await conversation.send(yesIntent);
            ret = orderIntentResponse.getSpeechPlain();
            expect(dbsetup.removeSpace(ret)).toEqual(expect.stringMatching(dbsetup.removeSpace('REPEAT_ORDER_WITH_COUNT ORDER_ANYTHING_ELSE')));

            orderIntentResponse = await conversation.send(noIntent);
            ret = orderIntentResponse.getSpeechPlain();
            expect(dbsetup.removeSpace(ret)).toEqual(expect.stringMatching(dbsetup.removeSpace('ORDER_LIST ORDER_CONFIRM_MSG')));

            // Say no to the orders
            orderIntentResponse = await conversation.send(noIntent);
            ret = orderIntentResponse.getSpeechPlain();
            expect(dbsetup.removeSpace(ret)).toEqual(expect.stringMatching(dbsetup.removeSpace('ASK_FOR_ORDER_CANCEL')));

            // Confirming cancellation
            orderIntentResponse = await conversation.send(yesIntent);
            ret = orderIntentResponse.getSpeechPlain();
            expect(dbsetup.removeSpace(ret)).toEqual(expect.stringMatching(dbsetup.removeSpace('CONFIRM_ORDER_CANCEL ORDER_ANYTHING_ELSE')));
        });

        test('Order_item:available:orderable:guest-checked-in:count-provided:reorder:yes-to-reorder-cancel-current-orders-change-of-mind', async () => {
            const item = await dbsetup.createItem('ri', { a: true, o: true });
            let cin = await dbsetup.checkinGuest();
            await dbsetup.createOrder([item], cin);

            let orderIntent = await testSuite.requestBuilder.intent('Order_item', { facility_slot: item.v, req_count: 2 });
            let orderIntentResponse = await conversation.send(orderIntent);
            let ret = orderIntentResponse.getSpeechPlain();
            expect(dbsetup.removeSpace(ret)).toEqual(expect.stringMatching(dbsetup.removeSpace('ORDER_IN_PROGRESS ORDER_ASK_AGAIN')));

            // Send No to not to reorder
            let yesIntent = await testSuite.requestBuilder.intent('AMAZON.YesIntent');
            orderIntentResponse = await conversation.send(yesIntent);
            ret = orderIntentResponse.getSpeechPlain();
            expect(dbsetup.removeSpace(ret)).toEqual(expect.stringMatching(dbsetup.removeSpace('REPEAT_ORDER_WITH_COUNT ORDER_ANYTHING_ELSE')));

            orderIntentResponse = await conversation.send(noIntent);
            ret = orderIntentResponse.getSpeechPlain();
            expect(dbsetup.removeSpace(ret)).toEqual(expect.stringMatching(dbsetup.removeSpace('ORDER_LIST ORDER_CONFIRM_MSG')));

            // Say no to the orders
            orderIntentResponse = await conversation.send(noIntent);
            ret = orderIntentResponse.getSpeechPlain();
            expect(dbsetup.removeSpace(ret)).toEqual(expect.stringMatching(dbsetup.removeSpace('ASK_FOR_ORDER_CANCEL')));

            // Confirming cancellation
            orderIntentResponse = await conversation.send(noIntent);
            ret = orderIntentResponse.getSpeechPlain();
            expect(dbsetup.removeSpace(ret)).toEqual(expect.stringMatching(dbsetup.removeSpace('ORDER_ANYTHING_ELSE')));
        });

        test('Order_cancel:available:orderable:guest-checked-in:count-provided:cancel-orders-at-frontdesk', async () => {
            const item = await dbsetup.createItem('ri', { a: true, o: true });
            let cin = await dbsetup.checkinGuest();
            await dbsetup.createOrder([item], cin);

            let orderIntent = await testSuite.requestBuilder.intent('Order_cancel', { facility_slot: item.v });
            let orderIntentResponse = await conversation.send(orderIntent);
            let ret = orderIntentResponse.getSpeechPlain();
            expect(dbsetup.removeSpace(ret)).toEqual(expect.stringMatching(dbsetup.removeSpace('ORDER_CANCEL_REQUEST_CANCEL_AT_FRONTDESK ANYTHING_ELSE')));
        });

        test('Order_cancel:available:orderable:guest-checked-in:count-provided:cancel-orders-in-session', async () => {
            const item = await dbsetup.createItem('ri', { a: true, o: true });
            let cin = await dbsetup.checkinGuest();

            let orderIntent = await testSuite.requestBuilder.intent('Order_item', { facility_slot: item.v, req_count: 2 });
            let orderIntentResponse = await conversation.send(orderIntent);
            let ret = orderIntentResponse.getSpeechPlain();
            expect(dbsetup.removeSpace(ret)).toEqual(expect.stringMatching(dbsetup.removeSpace('REPEAT_ORDER_WITH_COUNT ORDER_ANYTHING_ELSE')));

            // Send cancel request
            orderIntent = await testSuite.requestBuilder.intent('Order_cancel', { facility_slot: item.v });
            orderIntentResponse = await conversation.send(orderIntent);
            ret = orderIntentResponse.getSpeechPlain();
            expect(dbsetup.removeSpace(ret)).toEqual(expect.stringMatching(dbsetup.removeSpace('ORDER_CANCEL_REMOVE_ITEM ANYTHING_ELSE')));
        });

        test('Order_cancel:available:orderable:guest-checked-in:count-provided:cancel-orders-item-name-not-provided-none-to-cancel', async () => {
            const item = await dbsetup.createItem('ri', { a: true, o: true });
            let cin = await dbsetup.checkinGuest();

            // Send cancel request
            let orderIntent = await testSuite.requestBuilder.intent('Order_cancel');
            let orderIntentResponse = await conversation.send(orderIntent);
            let ret = orderIntentResponse.getSpeechPlain();
            expect(dbsetup.removeSpace(ret)).toEqual(expect.stringMatching(dbsetup.removeSpace('ORDERS_NONE ANYTHING_ELSE')));  // There is nothing to cancel
        });

        test('Order_cancel:available:orderable:guest-checked-in:count-provided:cancel-orders-item-name-not-provided-orders-insession-to-cancel', async () => {
            const item = await dbsetup.createItem('ri', { a: true, o: true });
            let cin = await dbsetup.checkinGuest();

            let orderIntent = await testSuite.requestBuilder.intent('Order_item', { facility_slot: item.v, req_count: 2 });
            let orderIntentResponse = await conversation.send(orderIntent);
            let ret = orderIntentResponse.getSpeechPlain();
            expect(dbsetup.removeSpace(ret)).toEqual(expect.stringMatching(dbsetup.removeSpace('REPEAT_ORDER_WITH_COUNT ORDER_ANYTHING_ELSE')));

            // Send cancel request
            orderIntent = await testSuite.requestBuilder.intent('Order_cancel');
            orderIntentResponse = await conversation.send(orderIntent);
            ret = orderIntentResponse.getSpeechPlain();
            expect(dbsetup.removeSpace(ret)).toEqual(expect.stringMatching(dbsetup.removeSpace('ORDER_LIST ORDER_WHICH_TO_CANCEL')));  // There is nothing to cancel
        });

        test('Order_cancel:available:orderable:guest-checked-in:count-provided:cancel-orders-item-name-not-provided-orders-insession-to-cancel', async () => {
            const item = await dbsetup.createItem('ri', { a: true, o: true });
            let cin = await dbsetup.checkinGuest();
            await dbsetup.createOrder([item], cin);

            // Send cancel request
            let orderIntent = await testSuite.requestBuilder.intent('Order_cancel');
            let orderIntentResponse = await conversation.send(orderIntent);
            let ret = orderIntentResponse.getSpeechPlain();
            expect(dbsetup.removeSpace(ret)).toEqual(expect.stringMatching(dbsetup.removeSpace('ORDER_LIST_AT_FRONTDESK ORDER_WHICH_TO_CANCEL')));  // There is nothing to cancel
        });

        test('Order_cancel:available:orderable:guest-checked-in:count-provided:cancel-orders-item-name-not-provided-orders-insession-and-orders-at-frontdesk-to-cancel', async () => {
            const item = await dbsetup.createItem('ri', { a: true, o: true });
            let cin = await dbsetup.checkinGuest();
            await dbsetup.createOrder([item], cin);

            let orderIntent = await testSuite.requestBuilder.intent('Order_item', { facility_slot: item.v, req_count: 2 });
            let orderIntentResponse = await conversation.send(orderIntent);
            let ret = orderIntentResponse.getSpeechPlain();
            expect(dbsetup.removeSpace(ret)).toEqual(expect.stringMatching(dbsetup.removeSpace('REPEAT_ORDER_WITH_COUNT ORDER_ANYTHING_ELSE')));

            // Send cancel request
            orderIntent = await testSuite.requestBuilder.intent('Order_cancel');
            orderIntentResponse = await conversation.send(orderIntent);
            ret = orderIntentResponse.getSpeechPlain();
            expect(dbsetup.removeSpace(ret)).toEqual(expect.stringMatching(dbsetup.removeSpace('ORDER_LIST ORDER_LIST_AT_FRONTDESK ORDER_WHICH_TO_CANCEL')));  // There is nothing to cancel
        });

        test('Ordered_items:no-orders', async () => {
            const item = await dbsetup.createItem('ri', { a: true, o: true });
            let cin = await dbsetup.checkinGuest();
            //await dbsetup.createOrder([item], cin);

            let orderIntent = await testSuite.requestBuilder.intent('Ordered_items');
            let orderIntentResponse = await conversation.send(orderIntent);
            let ret = orderIntentResponse.getSpeechPlain();
            expect(dbsetup.removeSpace(ret)).toEqual(expect.stringMatching(dbsetup.removeSpace('ORDERS_NONE ORDER_ANYTHING_ELSE')));
        });

        test('Ordered_items:orders-at-frontdesk', async () => {
            const item = await dbsetup.createItem('ri', { a: true, o: true });
            let cin = await dbsetup.checkinGuest();
            await dbsetup.createOrder([item], cin);

            let orderIntent = await testSuite.requestBuilder.intent('Ordered_items');
            let orderIntentResponse = await conversation.send(orderIntent);
            let ret = orderIntentResponse.getSpeechPlain();
            expect(dbsetup.removeSpace(ret)).toEqual(expect.stringMatching(dbsetup.removeSpace('ORDER_LIST_AT_FRONTDESK ORDER_ANYTHING_ELSE')));
        });

        test('Ordered_items:orders-in-session', async () => {
            const item = await dbsetup.createItem('ri', { a: true, o: true });
            let cin = await dbsetup.checkinGuest();

            let orderIntent = await testSuite.requestBuilder.intent('Order_item', { facility_slot: item.v, req_count: 2 });
            let orderIntentResponse = await conversation.send(orderIntent);
            let ret = orderIntentResponse.getSpeechPlain();
            expect(dbsetup.removeSpace(ret)).toEqual(expect.stringMatching(dbsetup.removeSpace('REPEAT_ORDER_WITH_COUNT ORDER_ANYTHING_ELSE')));

            orderIntent = await testSuite.requestBuilder.intent('Ordered_items');
            orderIntentResponse = await conversation.send(orderIntent);
            ret = orderIntentResponse.getSpeechPlain();
            expect(dbsetup.removeSpace(ret)).toEqual(expect.stringMatching(dbsetup.removeSpace('ORDER_LIST ORDER_ANYTHING_ELSE')));
        });

        //TODO
        test('Equipment_not_working:item-not-in-hotel', async () => {
            const item = await dbsetup.createItem('ri', { a: true, o: true });
            let cin = await dbsetup.checkinGuest();
            //await dbsetup.createOrder([item], cin);

            let orderIntent = await testSuite.requestBuilder.intent('Equipment_not_working');
            let orderIntentResponse = await conversation.send(orderIntent);
            let ret = orderIntentResponse.getSpeechPlain();
            //expect(dbsetup.removeSpace(ret)).toEqual(expect.stringMatching(dbsetup.removeSpace('ORDERS_NONE ORDER_ANYTHING_ELSE')));
        });
    });
}
