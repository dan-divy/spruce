const express = require('express');
const router = express.Router();
const path = require('path');
const mongoose = require('mongoose'); 
const ta = require('time-ago');
const formidable = require('formidable');
const mv = require('mv');
const nodemailer = require('nodemailer');
const mime = require('mime-types');


mongoose.connect('mongodb://localhost:27017/pudding',{
    user:'divysrivastava',
    pass:'Pinewood@123',
    authSource:'admin'
});

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
		res.render('activity' , {
    	layout: false,
    	user: {
				username:results.username,
    			followers:results.followers,
    			posts:results.posts,
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