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
router.get('/', (req, res) => {
    res.redirect('/#!upload')    
});
	
router.post('/', (req, res) => {
	var post = new formidable.IncomingForm();
	post.parse(req, (err, fields, files) => {
	 var oldpath = files.filetoupload.path;
     var newpath = path.join(__dirname, '../bin/upload/' + files.filetoupload.name);
     var static_url = '/upload/'+ files.filetoupload.name;
	 var auth = req.session.user;
	 var caption = fields.caption;
	 var tags = fields.tag;
	 var type = mime.lookup(files.filetoupload.name);
	 type = type.split('/')[0];
	 if (type == 'image') {
		mv(oldpath, newpath, function (err) {
        	if (err) throw err;
         	var newPosts = new feeds({
         		author:auth,
	 			pudding:static_url,
				likes:0,
				caption:caption,
				tags:tags,
				type:type,
				time:(new Date()).getTime(),
				timeago:new Date()
         	})
         	newPosts.save(function(error, callback) {
		 		if (error) return; 
		 		user
		 		.findOne({username:auth})
		 		.exec((err, theAuthor) => {
		 			if(theAuthor) {
		 				theAuthor.posts.push({
		 					id: callback._id
		 				})
		 				theAuthor.save((err) => {
		 					req.app.io.emit('yes');
		 					res.redirect('/');
		 				})
		 			}
		 		})
		 		
		});
		});
	}
	else {
		res.redirect('/#!upload')
	}
});
	});

module.exports = router;