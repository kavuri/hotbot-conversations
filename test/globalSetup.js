let dbsetup = require('./dbsetup');

module.exports = async () => {
    console.log('++++ GLOBAL SETUP ++++');
    global.__GLOBAL_STATE__ = await dbsetup.build();
}
