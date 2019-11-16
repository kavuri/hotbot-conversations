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
'use strict';

/**
 * The purpose of this middleware is to have the `user`
 * object available for all views.
 *
 * This is important because the user is used in layout.pug.
 */
module.exports = function () {
    return function (req, res, next) {
      res.locals.user = req.user;
      next();
    };
  };