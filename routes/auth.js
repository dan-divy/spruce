var express = require('express');
var router = express.Router();
var db = require('../utils/handlers/user');
var formParser = require('../utils/form-parser.js');
var config = require('../config/instagram');
var httpRequest = require('request');
var User = require('../utils/models/user')

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
			result.lastLogin = new Date();
			result.save(() => {
				res.redirect('/');
			})

		}
	})
});
router.get('/out', function (req, res, next) {
	req.session.destroy(() => {
		res.redirect('/?action=logout');
	})
})
router.get('/oauth/:service', function(req, res, next) {

	if(req.params.service == 'instagram') {
		var ig_code = req.query.code;
		console.log(ig_code)
		var options = {
			url: 'https://api.instagram.com/oauth/access_token',
			method: 'POST',
			form: {
				client_id: config.instagram.client_id,
				client_secret: config.instagram.client_secret,
				grant_type: 'authorization_code',
				redirect_uri: config.instagram.redirect_uri,
				code: ig_code
			}
		};

		httpRequest(options, function (error, response, body) {
			//if (!error && response.statusCode == 200) {

				var r = JSON.parse(body)
				console.log(r)
				db.checkUser({id:r.user.id},(err, exists) => {
					console.log(r)
					if(exists) {
						req.session._id = exists._id;
						req.session.user = exists.username;
						res.redirect('/')
					}
					else {
						var r = JSON.parse(body);
						var newUser = new User({
							id: r.user.id,
							username: r.user.username,
							fistname: r.user.full_name.split(" ")[0],
							lastname: r.user.full_name.split(" ")[r.user.full_name.split(" ").length - 1],
							bio: r.user.bio,
							dob: "not set",
							//website: r.user.website,
							profile_pic: r.user.profile_picture,
							password: r.access_token,
							posts:[],
							followers:[]
						});
						console.log(newUser)

						newUser.save((err, cb) => {
							req.session._id = cb._id;
							req.session.user = cb.username;
							res.redirect('/');
						})
					}
				})
			//}
		});
	}
	if(req.params.service == 'google') {
		
	}
})
module.exports = router;
