var express = require('express');
var router = express.Router();

/* GET users listing. */
router.get('/', function(req, res) {
  console.log('..index route..', req.params);
  res.send('kamamishu api');
});

module.exports = router;
