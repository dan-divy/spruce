var express = require('express');
var router = express.Router();
var path = require('path');
var db = require('../utils/handlers/user');
var formParser = require('../utils/form-parser.js');

/* GET users listing. */
router.get('/', function(req, res, next) {
  db.findOne({username:req.session.user}, (err, user) => {
  	res.render('me/index', {
  		title: req.app.conf.name,
  		user: user
  	});
  })
  	
});

router.get('/upload', function(req, res, next) {
	
		res.render('upload/file-upload', {
			title:req.app.conf.name,
			user: req.session.user
		})
	
})
module.exports = router;
