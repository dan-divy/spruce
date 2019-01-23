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
});
*/
const user = require('./models/user')
    // =====================================
    // HOME PAGE (with search links) ========
    // =====================================
router.get('/', (req, res) => {
    res.redirect('/#!search')    
});
	// $http.get() GET Route for SEARCH.HBS AngularJS controller
router.get('/:username', (req, res) => {
	this.search = req.params.username;
	user
	.find({username:this.search})
	.exec((err, results) => {
		var users = []
		if(results[0] == undefined) {
		res.send(false);
	}
	else {
		results.map(function (name, index) {	
		users.push({
				username:name.username,
    			followers:name.followers,
    			posts:name.posts,
    			dp:name.profilePic
			});
		});
		res.send(users);
		
	}
	})
});

module.exports = router;