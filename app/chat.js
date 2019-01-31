const express = require('express');
const router = express.Router();
const path = require('path');
const mongoose = require('mongoose'); 
const ta = require('time-ago');
const formidable = require('formidable');
const mv = require('mv');
const nodemailer = require('nodemailer');
const mime = require('mime-types');
const guid = require("guid");
//mongoose.connect("mongodb://uohbduorkfqofhp:3ZhDHgCpy75R1i0TULax@b6eo0yayiuwct4v-mongodb.services.clever-cloud.com:27017/b6eo0yayiuwct4v");

mongoose.connect(require('../config/db').url);

const user = require('./models/user');
const room = require('./models/room');

    // =====================================
    // HOME PAGE (with post links) ========
    // =====================================
router.get('/', (req, res) => {
	if(req.session.user) {
	user
	.find({})
	.exec((err,all) => {

	res.render('chatList', {
    	layout: false,
    	source_user: req.session.user,
    	target_users: all
    })   	
	})	
    
}
else {
	res.render('login', {
		layout: false,
		redirect:'chat'
	})
}
});
router.get('/:username', (req, res)=>{
	if(req.session.user) {
	var users = [req.params.username,req.session.user].sort();
	users = users[0]+users[1]
	//var ulta_users = req.params.username+req.session.username;
	user
	.find({})
	.exec((err,all) => {
		room
		.findOne({users:users})
		.exec((err ,comm) => {
			console.log(comm)
		if(comm == null || !comm) {
					var newRoom = new room({
						users:users,
						chats:[{txt:"Let's chat on Pudding!",by:req.session.user,time:new Date()}]
					})
					newRoom.save((err,result) => {
						res.render('chat', {
					    	layout: false,
					    	roomid: result._id,
					    	source_user: req.session.user,
					    	target_user: req.params.username
					    }) 
					
				
				})
			
		}
		else {	
		res.render('chat', {
	    	layout: false,
	    	roomid: comm._id,
	    	already:true,
	    	chats:comm.chats,
	    	source_user: req.session.user,
	    	target_user: req.params.username
	    })   
	    	}
	    	})	
	})	
    
}
else {
	res.render('login', {
		layout: false,
		redirect:'chat'
	})
}
})	


module.exports = router;