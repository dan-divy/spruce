var express = require('express');
var router = express.Router();
var db = require('../utils/handlers/user');
var formParser = require('../utils/form-parser.js');
var instagramConf = require('../config/instagram');
var googleConf = require('../config/google');
const {google} = require('googleapis');
const oauth2Client = new google.auth.OAuth2(
  googleConf.client_id,
  googleConf.client_secret,
  googleConf.redirect_uri
);

var httpRequest = require('request');
var User = require('../utils/models/user');
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
router.get('/oauth/:service', async function(req, res, next) {
	if(req.params.service == 'instagram') {
		var ig_code = req.query.code;
		console.log(ig_code)
		var options = {
			url: 'https://api.instagram.com/oauth/access_token',
			method: 'POST',
			form: {
				client_id: instagramConf.client_id,
				client_secret: instagramConf.client_secret,
				grant_type: 'authorization_code',
				redirect_uri: instagramConf.redirect_uri,
				code: ig_code
			}
		};

		httpRequest(options, function (error, response, body) {
			//if (!error && response.statusCode == 200) {
        if (error) res.redirect('/?err=instagram')
				var r = JSON.parse(body)
				console.log(r)
				db.findOne({username:r.user.username},(err, exists) => {
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
		});
	}

	if(req.params.service == 'google') {
		const {tokens} = await oauth2Client.getToken(req.query.code)
		httpRequest('https://www.googleapis.com/oauth2/v3/userinfo?access_token=' + tokens.access_token, function (error, response, body) {
			let user = JSON.parse(response.body);
			console.log(user);
			db.findOne({username: user.name},(err, exists) => {
				if(exists) {
					req.session._id = exists._id;
					req.session.user = exists.username;
					res.redirect('/')
				}
				else {
					console.log(user);
					var newUser = new User({
						id: user.sub,
						username: user.name,
						fistname: user.given_name,
						lastname: user.family_name,
						bio: "Hey!", //Is this correct?
						dob: "not set",
						//website: r.user.website,
						profile_pic: user.picture,
						password: tokens.access_token,
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
		})
	}
})




module.exports = router;
