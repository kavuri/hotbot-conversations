/*
 * This handler will be used while onboarding a device into Kamamishu
 * When the device is registered, the hotel/Kamamishu can ask for the device
 * to setup, during which time this handler will be invoked and the device
 * will be registered in the database
 */
'using strict';

const jwt = require("express-jwt");
const jwksRsa = require("jwks-rsa");
const authConfig = require("../config").auth0;

if (!authConfig.domain || !authConfig.audience) {
  throw new Error(
    "Please make sure that auth0 config is in place"
  );
}

module.exports = jwt({
        secret: jwksRsa.expressJwtSecret({
            cache: true,
            rateLimit: true,
            jwksRequestsPerMinute: 5,
            jwksUri: `https://${authConfig.domain}/.well-known/jwks.json`
        }),
        audience: authConfig.audience,
        issuer: `https://${authConfig.domain}/`,
        algorithm: ["RS256"]
    });

