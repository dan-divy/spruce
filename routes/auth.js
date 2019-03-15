var express = require('express');
var router = express.Router();
var db = require('../utils/handlers/user');
var formParser = require('../utils/form-parser.js');

/* GET signup page. */
router.get('/new', function(req, res, next) {
  res.render('auth/signup', { 
  	title: req.app.conf.name ,
  	error:false
  });
});

/* GET login page. */
router.get('/getin', function(req, res, next) {
	res.render('auth/login', { 
		title: req.app.conf.name ,
		error:false
	});
})

router.post('/new', formParser, function(req, res, next) {
	db.createNew(req.body, (error, result) => {
		if(!result) {
			res.render('auth/signup', {
				title: req.app.conf.name ,
				error:'Bad user details.'
			})
		}
	 	else {
			req.session._id = result._id;
			req.session.user = result.username;
			res.redirect('/');
		}
	})
})

router.post('/getin', formParser, function(req, res, next) {
	db.checkUser(req.body, (error, result) => {
		if(!result) {
			res.render('auth/login', {
				title: req.app.conf.name,
				error:'Bad username or password.'
			})
		}
		else {
			req.session._id = result._id;
			req.session.user = result.username;
			res.redirect('/');
		}
	})
})
module.exports = router;
