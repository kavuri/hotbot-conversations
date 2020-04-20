/*
 * This handler will be used while onboarding a device into Kamamishu
 * When the device is registered, the hotel/Kamamishu can ask for the device
 * to setup, during which time this handler will be invoked and the device
 * will be registered in the database
 */
'using strict';

const jwt = require("express-jwt");
const jwksRsa = require("jwks-rsa");
const dotenv = require('dotenv')
dotenv.config()

module.exports.authenticate = jwt({
    secret: jwksRsa.expressJwtSecret({
        cache: true,
        rateLimit: true,
        jwksRequestsPerMinute: 5,
        jwksUri: `https://${process.env.AUTH0_DOMAIN}/.well-known/jwks.json`
    }),
    getToken: function fromHeaderOrQuerystring(req) {
        if (req.headers.authorization && req.headers.authorization.split(' ')[0] === 'Bearer') {
            return req.headers.authorization.split(' ')[1];
        } else if (req.query && req.query.token) {
            return req.query.token;
        }
        return null;
    },
    audience: process.env.AUTH0_AUDIENCE,
    issuer: `https://${process.env.AUTH0_DOMAIN}/`,
    algorithm: ["RS256"]
});

module.exports.authorize = (permission) => {
    return (req, res, next) => {
        const { permissions } = req.user;
        console.log(req.user);
        if (permissions.includes(permission)) return next();
        res.status(403).send({ error: 'user does not have permission for api' });
    }
}
