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

jest.setTimeout(10000);
beforeAll(async () => {
    await dbsetup.initGraph();

    // Create a device
    await dbsetup.createAndAssignDevice();
});

for (const p of [new Alexa()]) {
    const testSuite = p.makeTestSuite();
    const conversation = testSuite.conversation(dbsetup.ConversationConfig);

    describe('Testing Facilities handler', () => {
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

        test('Enquiry_facility_exists:no such facility', async () => {
            const facilityIntent = await testSuite.requestBuilder.intent('Enquiry_facility_exists', { facility_slot: 'xyz' });
            const facilityIntentResponse = await conversation.send(facilityIntent);
            let ret = facilityIntentResponse.getSpeechPlain();
            expect(dbsetup.removeSpace(ret)).toEqual(expect.stringMatching(dbsetup.removeSpace('FACILITY_NOT_AVAILABLE ANYTHING_ELSE')));
        });

        test('Enquiry_facility_exists:facility:available:not-orderable', async () => {
            const facility = await dbsetup.item('Gym');
            const facilityIntent = await testSuite.requestBuilder.intent('Enquiry_facility_exists', { facility_slot: 'Gym' });
            const facilityIntentResponse = await conversation.send(facilityIntent);
            let ret = facilityIntentResponse.getSpeechPlain();
            expect(dbsetup.removeSpace(ret)).toEqual(expect.stringMatching(dbsetup.removeSpace(facility.msg.yes + ' ANYTHING_ELSE')));
        });

        test('Enquiry_facility_exists:facility:not-available', async () => {
            await dbsetup.setValue('Gym', 'a', false);
            const facility = await dbsetup.item('Gym');
            console.log('----++++facility=', facility);
            const facilityIntent = await testSuite.requestBuilder.intent('Enquiry_facility_exists', { facility_slot: 'Gym' });
            const facilityIntentResponse = await conversation.send(facilityIntent);
            let ret = facilityIntentResponse.getSpeechPlain();
            expect(dbsetup.removeSpace(ret)).toEqual(expect.stringMatching(dbsetup.removeSpace(facility.msg.no + ' ANYTHING_ELSE')));
        });
    });
}
