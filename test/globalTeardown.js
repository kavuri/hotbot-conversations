let dbsetup = require('./dbsetup');

module.exports = async () => {
    console.log('---- INSIDE GLOBAL TEARDOWN ----');
    await dbsetup.destroy(global.__GLOBAL_STATE__);
}
