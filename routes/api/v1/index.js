var express = require('express');
var router = express.Router();
var path = require('path');
var tool = require('array-tools')
var db = require('../../../utils/handlers/user');
var formParser = require('../../../utils/form-parser.js');
var ig = require('../../../config/instagram');

router.post('/v1/comment', function(req, res, next) {
	db.findOne({username:req.body.author}, (err, user) => {
			for (var i = user.posts.length - 1; i >= 0; i--) {
				if(user.posts[i]._id == req.body._id) {
				    user.posts[i].comments.push({
						by:req.session.user,
					    text:req.body.text
					})
					
				}
			}
			console.log(user.posts[1].comments)
			user.save((error) => {
				res.send(true)
			})
		})
})

router.post('/v1/like', function(req, res, next) {
	db.findOne({username:req.body.author}, (err, user) => {
		for (var i = user.posts.length - 1; i >= 0; i--) {
			if(user.posts[i]._id == req.body._id) {
				    user.posts[i].likes.push({
						by:req.session.user,
					    id:req.session._id
					})
					
				}
		}
		user.save((error) => {
			res.send(true)
		});
	})
});

router.post('/v1/follow', function(req, res, next) {
 
	 db.findOne(req.body, (err, user) => {
 
 	var disabled = false;
 	for(var i=0;i<user.followers.length;i++) {
 		if(user.followers[i] == req.session._id) {
 			console.log(i)
 			return disabled=true;
 		}
 	}
 	if(disabled) {
 		res.status(200).send('disabled')
 	}
 	else {
 		user.followers.push(req.session._id);
 		user.save((err) => {
 			res.status(200).send('done')
 		})
 		
 	}
  	
  
  })
});

router.get('/v1/oauth/instagram', function(req, res, next) {
	res.redirect(ig.instagram.auth_url)
});	

module.exports = router;
