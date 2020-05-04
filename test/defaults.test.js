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
    await dbsetup.createAndAssignDevice();
});

/***** TEST SUITE START *****/
for (const p of [new Alexa()]) {
    const testSuite = p.makeTestSuite();
    const conversation = testSuite.conversation(dbsetup.ConversationConfig);

    describe(`PLATFORM: ${p.constructor.name} INTENTS`, () => {
        test('Device not registered - ask user to register device ', async () => {
            // Delete device if its already created
            await dbsetup.deleteDevice();

            const launchRequest = await testSuite.requestBuilder.launch();
            const responseLaunchRequest = await conversation.send(launchRequest);
            let ret = responseLaunchRequest.getSpeechPlain();
            console.log('Got return=', dbsetup.removeSpace(ret));
            expect(dbsetup.removeSpace(ret)).toMatch(dbsetup.removeSpace('DEVICE_NOT_REGISTERED ASK_TO_REGISTER_DEVICE'));

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
            expect(dbsetup.removeSpace(ret)).toMatch('WELCOME');
        });

        test('UnhandledIntent', async () => {
            const nonExistantIntent = await testSuite.requestBuilder.intent('NonExistantIntent');
            const unhandledIntentResponse = await conversation.send(nonExistantIntent);
            let ret = unhandledIntentResponse.getSpeechPlain();
            expect(dbsetup.removeSpace(ret)).toMatch(dbsetup.removeSpace('SORRY UNKNOWN_REQUEST HELP_MESSAGE'));
        });

        test('HelpIntent', async () => {
            const helpIntent = await testSuite.requestBuilder.intent('AMAZON.HelpIntent');
            const helpIntentResponse = await conversation.send(helpIntent);
            let ret = helpIntentResponse.getSpeechPlain();
            expect(dbsetup.removeSpace(ret)).toMatch(dbsetup.removeSpace('HELP_MESSAGE HOW_CAN_I_HELP'));
        });
    });
}