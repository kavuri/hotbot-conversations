var express = require('express');
var router = express.Router();
const config = require('../config');

/* GET users listing. */
router.get('/', function(req, res) {
  console.log('index route');
  res.send('kamamishu api');
});

module.exports = router;
