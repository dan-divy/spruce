const express = require('express');
const router = express.Router();
const path = require('path');
const mongoose = require('mongoose'); 
const ta = require('time-ago');
const formidable = require('formidable');
const mv = require('mv');
const bcrypt = require('bcrypt-nodejs');
const mime = require('mime-types');

// mongoose.connect("mongodb://uohbduorkfqofhp:3ZhDHgCpy75R1i0TULax@b6eo0yayiuwct4v-mongodb.services.clever-cloud.com:27017/b6eo0yayiuwct4v");

mongoose.connect(require('../config/db').url);

const User = require('./models/user')


    // =====================================
    // HOME PAGE (with login links) ========
    // =====================================
router.get('/', function(req, res) {
    res.redirect('/auth/login')
 
});

router.get('/settings', function(req, res) {
    res.render('settings', {
        layout: false,
        user: req.session.user
    })
 
});

    // =====================================
    // LOGIN ===============================
    // =====================================
    // show the login form
router.get('/login', function(req, res) {
    // render the page and pass in any flash data if it exists
    res.render('login.hbs', { 
        layout: false
    }); 
});

    // process the login form
    router.post('/login', (req, res) => {
        var form = new formidable.IncomingForm()
        form.parse(req, (err, fields, files) => {
        User
        .findOne({username:fields.username})
        .exec((err, user) => {
            if (err) throw err;
            if(user) {
                bcrypt.compare(fields.password, user.password, (err ,bool) => {
                    if(bool) { 
                    req.session.user = fields.username;
                    res.redirect('/') 
                    
                    }
                    else {
                        res.render('login', {
                    layout: false,
                    message:'Naah! Check your credentials again.'
                    })
                    }
                })
                    }
                else {
                    res.render('login', {
                    layout: false,
                    message:'Naah! Check your credentials again.'
                })
                }    
                
            
    
        })
        
        });
    });

    // =====================================
    // SIGNUP ==============================
    // =====================================
    // show the signup form
router.get('/signup', function(req, res) {

    // render the page and pass in any flash data if it exists
    res.render('signup.hbs', { 
        layout:false
    });
});

    // process the signup form
    router.post('/signup',  (req, res) =>{
        // Use formidable TODO

        var form = new formidable.IncomingForm()
        form.parse(req, (err, fields, files) => {
        User
        .findOne({username:fields.username})
        .exec((err, user) => {
            if(user) {
                res.render('signup', {
                    layout:false,
                    err: 'Already exists.'
                })
            }
            else {
                var newUser = new User({
                    username:fields.username,
                    
                    profilePic:'/lib/user.png',
                    posts:0,
                    followers:0
                });
                newUser.password = newUser.generateHash(fields.password)
                newUser.save((err) => {
                    req.session.user = fields.username;
                    res.redirect('/')
                })
            }
    
        })
        
    });
        });

    // =====================================
    // PROFILE SECTION =====================
    // =====================================
    // we will want this protected so you have to be logged in to visit
    // we will use route middleware to verify this (the isLoggedIn function)


    // =====================================
    // LOGOUT ==============================
    // =====================================
router.get('/logout', function(req, res) {
    req.session.destroy(() => {
        res.redirect('/');    
    })
    
});

module.exports = router;