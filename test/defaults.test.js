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
const removeBreak = (response) => {
    return response.replace(/<.*>/, '').replace(/ +(?= )/g, '');
}

/***** TEST SUITE START *****/
for (const p of [new Alexa()]) {
    const testSuite = p.makeTestSuite();
    const conversation = testSuite.conversation(ConversationConfig);

    describe(`PLATFORM: ${p.constructor.name} INTENTS`, () => {
        test('Device not registered - ask user to register device ', async () => {

            const launchRequest = await testSuite.requestBuilder.launch();
            const responseLaunchRequest = await conversation.send(launchRequest);
            let ret = responseLaunchRequest.getSpeech();
            console.log('Got return=', removeBreak(ret));
            expect(removeBreak(ret)).toMatch('DEVICE_NOT_REGISTERED ASK_TO_REGISTER_DEVICE');

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
            let ret = responseLaunchRequest.getSpeech();
            console.log('Got return=', removeBreak(ret));
            expect(removeBreak(ret)).toMatch('WELCOME');
        });
    });
}