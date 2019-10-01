'use strict';

// ------------------------------------------------------------------
// APP INITIALIZATION
// ------------------------------------------------------------------

const { App } = require('jovo-framework');
const { Alexa } = require('jovo-platform-alexa');
const { GoogleAssistant } = require('jovo-platform-googleassistant');
const { JovoDebugger } = require('jovo-plugin-debugger');
const { FileDb } = require('jovo-db-filedb');
const { DynamoDb } = require('jovo-db-dynamodb');
const { MongoDb } = require('jovo-db-mongodb');

const app = new App();

app.use(
    new Alexa(),
    new GoogleAssistant(),
    new JovoDebugger(),
    // new DynamoDb()
    // new FileDb(),
    new MongoDb()  
);


// ------------------------------------------------------------------
// APP LOGIC
// ------------------------------------------------------------------

app.setHandler(
    require('./handlers/defaults'),
    require('./handlers/device_setup'),
    require('./handlers/policies'),
    require('./handlers/communities'),
    require('./handlers/facilities'),
    require('./handlers/orders')
);

module.exports.app = app;
