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
	// $http.get() GET Route for SEARCH.HBS AngularJS controller
router.post('/', (req, res) => {
	var form = new formidable.IncomingForm()
    form.parse(req, (err, fields, files) => {
    this.search = fields.search;
	user
	.find({username:this.search})
	.exec((err, results) => {
		var users = []
		if(results[0] == undefined) {
		res.render('search', {
			layout: false,
			searchedFor: this.search,
			notFound: true,
			normal:true
		})
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
		res.render('search',{ 
			layout: false,
			id:users,
			normal:true 
		});
		
	}
	})
   });
 }); 

module.exports = router;