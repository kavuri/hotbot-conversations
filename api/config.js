/* Copyright (C) Kamamishu Pvt. Ltd. - All Rights Reserved
 * Unauthorized copying of this file, via any medium is strictly prohibited
 * Proprietary and confidential
 */

/*
 * This handler will be used while onboarding a device into Kamamishu
 * When the device is registered, the hotel/Kamamishu can ask for the device
 * to setup, during which time this handler will be invoked and the device
 * will be registered in the database
 */

module.exports = {
    api: {
        prefix: '/api/v1'
    },
    cognito: {
        region: "ap-south-1",
        cognitoUserPoolId: "ap-south-1_M1pQu9BIA",
        tokenUse: "access", //Possible Values: access | id
        tokenExpiration: 3600000 //Up to default expiration of 1 hour (3600000 ms)
    },
    auth0: {
        domain: "kamamishu.eu.auth0.com",
        clientId: "TkbQ7ZJoiPuacBboqGpm4xFmC5zgsEQt",
        audience: "https://kamamishu.com/api/v1"
    },
    authProvider: "auth0"
}
