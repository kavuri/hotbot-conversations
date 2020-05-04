/* Copyright (C) Kamamishu Pvt. Ltd. - All Rights Reserved
 * Unauthorized copying of this file, via any medium is strictly prohibited
 * Proprietary and confidential
 */

'using strict';

const { App, Util } = require('jovo-framework');
const { Alexa } = require('jovo-platform-alexa');
let dbsetup = require('./dbsetup');
//jest.setTimeout(500);

beforeAll(async () => {
    await dbsetup.initGraph();

    // Create a device
    console.log('++++++creating and assigning device....');
    await dbsetup.createAndAssignDevice();
});

/***** TEST SUITE START *****/
for (const p of [new Alexa()]) {
    const testSuite = p.makeTestSuite();
    console.log('Conversation config=', dbsetup.ConversationConfig);
    const conversation = testSuite.conversation(dbsetup.ConversationConfig);

    describe('Policy intents', () => {
        beforeEach(async () => {
            // Initiate the launch request before any of the facility intents
            const launchRequest = await testSuite.requestBuilder.launch();
            const responseLaunchRequest = await conversation.send(launchRequest);
        });

        test('Smoking policy', async () => {
            const policy = dbsetup.item('smoking');
            const policyIntent = await testSuite.requestBuilder.intent('Policy_smoking');
            const policyIntentResponse = await conversation.send(policyIntent);
            let ret = policyIntentResponse.getSpeechPlain();
            expect(dbsetup.removeSpace(ret)).toEqual(expect.stringMatching(dbsetup.removeSpace(policy.msg + ' ANYTHING_ELSE')));
        });

        test('Alcohol policy', async () => {
            const alcohol = dbsetup.item('alcohol');
            const alcoholPolicyIntent = await testSuite.requestBuilder.intent('Policy_alcohol');
            const alcoholPolicyIntentResponse = await conversation.send(alcoholPolicyIntent);
            let ret = alcoholPolicyIntentResponse.getSpeechPlain();
            expect(dbsetup.removeSpace(ret)).toEqual(expect.stringMatching(dbsetup.removeSpace(alcohol.msg + ' ANYTHING_ELSE')));
        });

        test('Cancellation policy', async () => {
            const policy = dbsetup.item('cancellation');
            const policyIntent = await testSuite.requestBuilder.intent('Policy_cancellation');
            const policyIntentResponse = await conversation.send(policyIntent);
            let ret = policyIntentResponse.getSpeechPlain();
            expect(dbsetup.removeSpace(ret)).toEqual(expect.stringMatching(dbsetup.removeSpace(policy.msg + ' ANYTHING_ELSE')));
        });

        test('infants policy', async () => {
            const policy = dbsetup.item('infants');
            const policyIntent = await testSuite.requestBuilder.intent('Policy_infants');
            const policyIntentResponse = await conversation.send(policyIntent);
            let ret = policyIntentResponse.getSpeechPlain();
            expect(dbsetup.removeSpace(ret)).toEqual(expect.stringMatching(dbsetup.removeSpace(policy.msg + ' ANYTHING_ELSE')));
        });

        test('checkout time policy', async () => {
            const policy = dbsetup.item('checkout time');
            const policyIntent = await testSuite.requestBuilder.intent('Policy_checkout_time');
            const policyIntentResponse = await conversation.send(policyIntent);
            let ret = policyIntentResponse.getSpeechPlain();
            expect(dbsetup.removeSpace(ret)).toEqual(expect.stringMatching(dbsetup.removeSpace(policy.msg + ' ANYTHING_ELSE')));
        });

        test('no show policy', async () => {
            const policy = dbsetup.item('no show');
            const policyIntent = await testSuite.requestBuilder.intent('Policy_noshow');
            const policyIntentResponse = await conversation.send(policyIntent);
            let ret = policyIntentResponse.getSpeechPlain();
            expect(dbsetup.removeSpace(ret)).toEqual(expect.stringMatching(dbsetup.removeSpace(policy.msg + ' ANYTHING_ELSE')));
        });

        test('outside food policy', async () => {
            const policy = dbsetup.item('outside food');
            const policyIntent = await testSuite.requestBuilder.intent('Policy_outside_food');
            const policyIntentResponse = await conversation.send(policyIntent);
            let ret = policyIntentResponse.getSpeechPlain();
            expect(dbsetup.removeSpace(ret)).toEqual(expect.stringMatching(dbsetup.removeSpace(policy.msg + ' ANYTHING_ELSE')));
        });

        test('checkin time policy', async () => {
            const policy = dbsetup.item('checkin time');
            const policyIntent = await testSuite.requestBuilder.intent('Policy_checkin_time');
            const policyIntentResponse = await conversation.send(policyIntent);
            let ret = policyIntentResponse.getSpeechPlain();
            expect(dbsetup.removeSpace(ret)).toEqual(expect.stringMatching(dbsetup.removeSpace(policy.msg + ' ANYTHING_ELSE')));
        });

        test('pets policy', async () => {
            const policy = dbsetup.item('pets');
            const policyIntent = await testSuite.requestBuilder.intent('Policy_pets');
            const policyIntentResponse = await conversation.send(policyIntent);
            let ret = policyIntentResponse.getSpeechPlain();
            expect(dbsetup.removeSpace(ret)).toEqual(expect.stringMatching(dbsetup.removeSpace(policy.msg + ' ANYTHING_ELSE')));
        });

        test('payment methods policy', async () => {
            const policy = dbsetup.item('payment methods');
            const policyIntent = await testSuite.requestBuilder.intent('Policy_payment_method');
            const policyIntentResponse = await conversation.send(policyIntent);
            let ret = policyIntentResponse.getSpeechPlain();
            expect(dbsetup.removeSpace(ret)).toEqual(expect.stringMatching(dbsetup.removeSpace(policy.msg + ' ANYTHING_ELSE')));
        });

    });
}