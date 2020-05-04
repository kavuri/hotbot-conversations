/* Copyright (C) Kamamishu Pvt. Ltd. - All Rights Reserved
 * Unauthorized copying of this file, via any medium is strictly prohibited
 * Proprietary and confidential
 */

'using strict';

const { App, Util } = require('jovo-framework');
const { Alexa } = require('jovo-platform-alexa');
let dbsetup = require('./dbsetup');
//jest.setTimeout(500);

const ConversationConfig = {
    runtime: 'app',
    userId: '111',
    locale: 'keys-only',
    defaultDbDirectory: './db/tests/',
    httpOptions: {
        host: 'localhost',
        port: 3002,
        path: '/webhook',
        method: 'POST',
        headers: {
            'accept': 'application/json',
            'content-type': 'application/json',
            'jovo-test': 'true'
        },
    },
};

beforeAll(async () => {
});

afterAll(async () => {
});

/**
 * Method takes a response from server, removes the breaks and returns the response.
 * The tests do not have to compare the SSML break tags
 * @param {any} response
 */
const removeSpace = (response) => {
    //return response.replace(/<.*>/, '').replace(/ +(?= )/g, '');
    return response.replace(/ +(?= )/g, '');
}

/***** TEST SUITE START *****/
for (const p of [new Alexa()]) {
    const testSuite = p.makeTestSuite();
    const conversation = testSuite.conversation(ConversationConfig);

    describe(`PLATFORM: ${p.constructor.name} INTENTS`, () => {
        test('Device not registered - ask user to register device ', async () => {

            const launchRequest = await testSuite.requestBuilder.launch();
            const responseLaunchRequest = await conversation.send(launchRequest);
            let ret = responseLaunchRequest.getSpeechPlain();
            console.log('Got return=', removeSpace(ret));
            expect(removeSpace(ret)).toMatch('DEVICE_NOT_REGISTERED ASK_TO_REGISTER_DEVICE');

            /**** This  would not work, since the conversation engine would not get a valid Amazon API token to get the device address
            const yesForDeviceAddRequest = await testSuite.requestBuilder.intent('AMAZON.YesIntent');
            const addDeviceResponse = await conversation.send(yesForDeviceAddRequest);
            console.log('----return=', addDeviceResponse);
            addDeviceResponse.isTell('DEVICE_REGISTRATION_SUCCESS');
            */

            // Create a device
            await dbsetup.createAndAssignDevice();
        });

        test('Post device registration, launch would get WELCOME message', async () => {
            // Send a launch request to now get a Welcome message
            const launchRequest = await testSuite.requestBuilder.launch();
            const responseLaunchRequest = await conversation.send(launchRequest);
            let ret = responseLaunchRequest.getSpeechPlain();
            expect(removeSpace(ret)).toMatch('WELCOME');
        });

        test('UnhandledIntent', async () => {
            const nonExistantIntent = await testSuite.requestBuilder.intent('NonExistantIntent');
            const unhandledIntentResponse = await conversation.send(nonExistantIntent);
            let ret = unhandledIntentResponse.getSpeechPlain();
            expect(removeSpace(ret)).toMatch('SORRY UNKNOWN_REQUEST HELP_MESSAGE');
        });

        test('HelpIntent', async () => {
            const helpIntent = await testSuite.requestBuilder.intent('AMAZON.HelpIntent');
            const helpIntentResponse = await conversation.send(helpIntent);
            let ret = helpIntentResponse.getSpeechPlain();
            expect(removeSpace(ret)).toMatch('HELP_MESSAGE HOW_CAN_I_HELP');
        });
    });

    describe('Policy intents', () => {
        test('Smoking policy', async () => {
            const policy = dbsetup.item('smoking');
            const policyIntent = await testSuite.requestBuilder.intent('Policy_smoking');
            const policyIntentResponse = await conversation.send(policyIntent);
            let ret = policyIntentResponse.getSpeechPlain();
            expect(removeSpace(ret)).toEqual(expect.stringMatching(policy.msg + ' ANYTHING_ELSE'));
        });

        test('Alcohol policy', async () => {
            const alcohol = dbsetup.item('alcohol');
            const alcoholPolicyIntent = await testSuite.requestBuilder.intent('Policy_alcohol');
            const alcoholPolicyIntentResponse = await conversation.send(alcoholPolicyIntent);
            let ret = alcoholPolicyIntentResponse.getSpeechPlain();
            expect(removeSpace(ret)).toEqual(expect.stringMatching(alcohol.msg + ' ANYTHING_ELSE'));
        });

        test('Cancellation policy', async () => {
            const policy = dbsetup.item('cancellation');
            const policyIntent = await testSuite.requestBuilder.intent('Policy_cancellation');
            const policyIntentResponse = await conversation.send(policyIntent);
            let ret = policyIntentResponse.getSpeechPlain();
            expect(removeSpace(ret)).toEqual(expect.stringMatching(policy.msg + ' ANYTHING_ELSE'));
        });

        test('infants policy', async () => {
            const policy = dbsetup.item('infants');
            const policyIntent = await testSuite.requestBuilder.intent('Policy_infants');
            const policyIntentResponse = await conversation.send(policyIntent);
            let ret = policyIntentResponse.getSpeechPlain();
            expect(removeSpace(ret)).toEqual(expect.stringMatching(policy.msg + ' ANYTHING_ELSE'));
        });

        test('checkout time policy', async () => {
            const policy = dbsetup.item('checkout time');
            const policyIntent = await testSuite.requestBuilder.intent('Policy_checkout_time');
            const policyIntentResponse = await conversation.send(policyIntent);
            let ret = policyIntentResponse.getSpeechPlain();
            expect(removeSpace(ret)).toEqual(expect.stringMatching(policy.msg + ' ANYTHING_ELSE'));
        });

        test('no show policy', async () => {
            const policy = dbsetup.item('no show');
            const policyIntent = await testSuite.requestBuilder.intent('Policy_noshow');
            const policyIntentResponse = await conversation.send(policyIntent);
            let ret = policyIntentResponse.getSpeechPlain();
            expect(removeSpace(ret)).toEqual(expect.stringMatching(policy.msg + ' ANYTHING_ELSE'));
        });

        test('outside food policy', async () => {
            const policy = dbsetup.item('outside food');
            const policyIntent = await testSuite.requestBuilder.intent('Policy_outside_food');
            const policyIntentResponse = await conversation.send(policyIntent);
            let ret = policyIntentResponse.getSpeechPlain();
            expect(removeSpace(ret)).toEqual(expect.stringMatching(policy.msg + ' ANYTHING_ELSE'));
        });

        test('checkin time policy', async () => {
            const policy = dbsetup.item('checkin time');
            const policyIntent = await testSuite.requestBuilder.intent('Policy_checkin_time');
            const policyIntentResponse = await conversation.send(policyIntent);
            let ret = policyIntentResponse.getSpeechPlain();
            expect(removeSpace(ret)).toEqual(expect.stringMatching(policy.msg + ' ANYTHING_ELSE'));
        });

        test('pets policy', async () => {
            const policy = dbsetup.item('pets');
            const policyIntent = await testSuite.requestBuilder.intent('Policy_pets');
            const policyIntentResponse = await conversation.send(policyIntent);
            let ret = policyIntentResponse.getSpeechPlain();
            expect(removeSpace(ret)).toEqual(expect.stringMatching(policy.msg + ' ANYTHING_ELSE'));
        });

        test('payment methods policy', async () => {
            const policy = dbsetup.item('payment methods');
            const policyIntent = await testSuite.requestBuilder.intent('Policy_payment_method');
            const policyIntentResponse = await conversation.send(policyIntent);
            let ret = policyIntentResponse.getSpeechPlain();
            expect(removeSpace(ret)).toEqual(expect.stringMatching(policy.msg + ' ANYTHING_ELSE'));
        });

        test('No such policy', async () => {
            const policy = dbsetup.item('xyz');
            const policyIntent = await testSuite.requestBuilder.intent('Policy_smoking');
            const policyIntentResponse = await conversation.send(policyIntent);
            let ret = policyIntentResponse.getSpeechPlain();
            expect(removeSpace(ret)).toEqual(expect.stringMatching(policy.msg + ' ANYTHING_ELSE'));
        });

    });
}