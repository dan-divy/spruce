const express = require('express');
const router = express.Router();
const path = require('path');
const mongoose = require('mongoose'); 
const ta = require('time-ago');
const formidable = require('formidable');
const mv = require('mv');
const nodemailer = require('nodemailer');
const mime = require('mime-types');

// mongoose.connect("mongodb://uohbduorkfqofhp:3ZhDHgCpy75R1i0TULax@b6eo0yayiuwct4v-mongodb.services.clever-cloud.com:27017/b6eo0yayiuwct4v");

mongoose.connect(require('../config/db').url);

const feeds = require('./models/feeds');
const user = require('./models/user')
    // =====================================
    // HOME PAGE (with search links) ========
    // =====================================
router.get('/', (req, res) => {
	if(req.query.light) {
	res.render('search', {
    	layout: false,
    	data: req.session.user,
    	light: true
    })    	
	}
	else {
		res.render('search', {
    	layout: false,
    	data: req.session.user,
    	normal: true
    })    
	}
    
});

router.get('/:username', (req, res) => {
	user
	.findOne({username:req.params.username})
	.exec((err, results) => {
		if(results) {
			var postArray = []
			    notFollowed = false;
			results.posts.map( (posts, index) => {
				feeds
				.findOne({_id:posts.id})
				.exec((err, thePosts) => {
					if(thePosts) {
					postArray.push({
						src:thePosts.pudding
					})
					} 
				})
			})
			results.followers.map((people, theirIndex)=> {
				if(people = req.session.user) {
					return notFollowed=true;
				}
			})
					
			res.render('profile' , {
	    	layout: false,
	    	normal:true,
	    	user: {
					username:results.username,
	    			followers:results.followers,
	    			posts:postArray,
	    			dp:results.profilePic
				}
	    	}) 
			
					
		}
	})
});	

module.exports = router;