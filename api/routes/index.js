/* Copyright (C) Kamamishu Pvt. Ltd. - All Rights Reserved
 * Unauthorized copying of this file, via any medium is strictly prohibited
 * Proprietary and confidential
 */
'use strict';

var express = require('express');
var router = express.Router();

/* GET users listing. */
router.get('/', function(req, res) {
  console.log('..index route..', req.params);
  res.render('index', { title: 'Kamamishu Webapp' });
});

module.exports = router;
