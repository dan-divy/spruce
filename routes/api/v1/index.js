var express = require('express');
var router = express.Router();
var path = require('path');
var tool = require('array-tools')
var db = require('../../../utils/handlers/user');
var formParser = require('../../../utils/form-parser.js');
var ig = require('../../../config/instagram');
var g = require('../../../config/google');

router.post('/v1/comment', function(req, res, next) {
	db.comment({username:req.body.author},{by:req.session.user,text:req.body.text},req.body._id, (err, result)=> {
		if(result) {
			res.send(true)
		}
		else {
			res.send(false)
		}
	})
})

router.post('/v1/like', function(req, res, next) {
	//console.log(req.body);
	db.like({username:req.body.author},{by:req.session.user},req.body._id, (err, result) => {
		if(result) {
				res.send({event:true,msg:"Liked!"})
			//	console.log(result)
			}
			else {
				res.send({event:false,msg:"Already liked."})
			}
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

router.get('/v1/search', function(req, res, next) {
	db.search(req.query.q, (err, results) => {
		res.send(results);
	})
});

router.get('/v1/oauth/:service', function(req, res, next) {
	if(req.params.service == 'instagram') res.redirect(ig.instagram.auth_url);
	if(req.params.service == 'google') res.redirect(g.auth_url);
});

module.exports = router;
