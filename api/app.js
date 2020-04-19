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

const createError = require('http-errors');
const express = require('express');
const cors = require('cors');
const path = require('path');
const cookieParser = require('cookie-parser');
const logger = require('morgan');
const helmet = require("helmet");
const flash = require('connect-flash');
const session = require('./lib/middleware/session');
const config = require('./config');
const app = express();

const { watchOrders } = require('./lib/ordersListener');

var corsOptions = {
  origin: '*',
  optionsSuccessStatus: 200 // some legacy browsers (IE11, various SmartTVs) choke on 204
}

app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');
app.use(helmet());
app.use(logger('dev'));
app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

// Session data
app.use(session);

app.use(flash());

app.use('/', require('./routes/index'));
app.use(config.api.prefix + '/user', require('./routes/user'));
app.use(config.api.prefix + '/device', require('./routes/device'));
app.use(config.api.prefix + '/hotel', require('./routes/hotel'));
app.use(config.api.prefix + '/hotelGroup', require('./routes/hotelGroup'));
app.use(config.api.prefix + '/item', require('./routes/item'));
app.use(config.api.prefix + '/order', require('./routes/order'));
app.use(config.api.prefix + '/room', require('./routes/room'));
app.use(config.api.prefix + '/checkincheckout', require('./routes/checkincheckout'));

// Listen for order changes
watchOrders();

// catch 404 and forward to error handler
app.use(function (req, res, next) {
  // res.redirect('/');
  next(createError(404));
});

// error handler
app.use(function (err, req, res, next) {
  if (err.name === 'UnauthorizedError') {
    res.status(401).send('invalid token...');
  } else {
    // set locals, only providing error in development
    res.locals.message = err.message;
    res.locals.error = req.app.get('env') === 'development' ? err : {};

    // render the error page
    res.status(err.status || 500);
    res.render('error');
  }
});

module.exports = app;
