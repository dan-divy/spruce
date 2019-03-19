var express = require('express');
var router = express.Router();
var path = require('path');
var db = require('../../../utils/handlers/user');
var formParser = require('../../../utils/form-parser.js');
var ig = require('../../../config/instagram');

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
 	//	console.log('disabled')
 		res.status(200).send('disabled')
 	}
 	else {
 	//	console.log('done')
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
