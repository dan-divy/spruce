const express = require('express');
const router = express.Router();
const path = require('path');
const mongoose = require('mongoose'); 
const ta = require('time-ago');
const formidable = require('formidable');
const mv = require('mv');
const nodemailer = require('nodemailer');
const mime = require('mime-types');

//mongoose.connect("mongodb://uohbduorkfqofhp:3ZhDHgCpy75R1i0TULax@b6eo0yayiuwct4v-mongodb.services.clever-cloud.com:27017/b6eo0yayiuwct4v");

mongoose.connect(require('../config/db').url);

const user = require('./models/user');

    // =====================================
    // HOME PAGE (with post links) ========
    // =====================================
router.get('/', (req, res) => {
	if(req.session.user) {
    res.render('chat', {
    	layout: false,
    	user: req.session.user,
    	roomid: req.session.user
    })   
}
else {
	res.render('login', {
		layout: false,
		redirect:'chat'
	})
}
});
	


module.exports = router;