var express = require('express');
var router = express.Router();
var db = require('../utils/handlers/user');
var formParser = require('../utils/form-parser');

var User = require('../utils/models/user');

router.get('/', function(req, res, next) {
  res.render('chat/index', {
    
  })
});



module.exports = router;
