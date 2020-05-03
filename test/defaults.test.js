/* Copyright (C) Kamamishu Pvt. Ltd. - All Rights Reserved
 * Unauthorized copying of this file, via any medium is strictly prohibited
 * Proprietary and confidential
 */

'using strict';

const { App, Util } = require('jovo-framework');
const { Alexa } = require('jovo-platform-alexa');
//jest.setTimeout(500);

beforeAll(async () => {
});

afterAll(async () => {
    // Remove the graph
});

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

/**
 * Method takes a response from server, removes the breaks and returns the response.
 * The tests do not have to compare the SSML break tags
 * @param {any} response
 */
const removeBreak = (response) => {
    return response.replace(/<.*>/, '');
}

// Create 

beforeAll(async () => {
});

for (const p of [new Alexa()]) {
    const testSuite = p.makeTestSuite();

    describe(`New device registration`, () => {
        test('Should return registration message for a new device', async () => {

        });
    });

    describe(`PLATFORM: ${p.constructor.name} INTENTS`, () => {
        test('should return a welcome message and ask for the name at "LAUNCH"', async () => {
            const conversation = testSuite.conversation(ConversationConfig);

            const launchRequest = await testSuite.requestBuilder.launch();
            const responseLaunchRequest = await conversation.send(launchRequest);
            expect(responseLaunchRequest.getSpeech()).toMatch('DEVICE_NOT_REGISTERED <break time=\"200ms\"/> ASK_TO_REGISTER_DEVICE');
            //expect(
            //    responseLaunchRequest.isAsk('Hello World! What\'s your name?', 'Please tell me your name.')
            //).toBe(true);

        });
    });
}