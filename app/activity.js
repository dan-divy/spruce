const express = require('express');
const router = express.Router();
const path = require('path');
const mongoose = require('mongoose'); 
const ta = require('time-ago');
const formidable = require('formidable');
const mv = require('mv');
const nodemailer = require('nodemailer');
const mime = require('mime-types');

mongoose.connect("mongodb://uohbduorkfqofhp:3ZhDHgCpy75R1i0TULax@b6eo0yayiuwct4v-mongodb.services.clever-cloud.com:27017/b6eo0yayiuwct4v");
/*
mongoose.connect('mongodb://localhost:27017/pudding',{
    user:'divysrivastava',
    pass:'Pinewood@123',
    authSource:'admin'
});*/

const user = require('./models/user');
const feeds = require('./models/feeds')
    // =====================================
    // HOME PAGE (with post links) ========
    // =====================================
router.get('/', isLoggedIn, (req, res) => {
	user
	.findOne({username:req.session.user})
	.exec((err, results) => {
		
	if(!results) {
		res.redirect('/auth/signup')
	}
	else {
		var postArray = []
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
		res.render('activity' , {
    	layout: false,
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
	
router.post('/', (req, res) => {
	var post = new formidable.IncomingForm();
	post.parse(req, (err, fields, files) => {
	 
	});
});

function isLoggedIn(req, res, next) {

    // if user is authenticated in the session, carry on 
    if (req.session.user)
        return next();

    // if they aren't redirect them to the home page
    res.redirect('/');
}
module.exports = router;