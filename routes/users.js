var express = require('express');
var router = express.Router();
var path = require('path');
var db = require('../utils/handlers/user');
var textParser = ('../utils/text-parser')
var formParser = require('../utils/form-parser');

/* GET users listing. */
router.get('/', function(req, res, next) {
  db.getAll((err, users) => {
  	res.render('user/list', {
  		title: req.app.conf.name,
  		list: users
  	});
  });  
});

router.get('/:username', function(req, res, next) {
	db.findOne({username:req.params.username},(err, user) => {
		
		user.bio = textParser.parse(user.bio);
		res.render('user/profile', {
			title:req.app.conf.name,
			user:user,
			userId: req.session._id
		})
	})
})
module.exports = router;
