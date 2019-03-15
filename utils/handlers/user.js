// utils/handlers/user.js
var mongoose = require('mongoose');
var User = require("../models/user");
var bcrypt = require("bcrypt-nodejs")
const _ = require('lodash/_arrayIncludes')

mongoose.connect(require('../../config/app').db.connectionUri);

function checkSpace(name) {
	var charSplit = name.split('')
    //console.log(charSplit)
	return _(charSplit, ' ');
}

/*****
usage: 
	var opt = {
		username:'my_name',
		password:'P@sSW0rD',
		fn:'Divy',
		ln:'Srivastava',
		day:23,
		month:'July',
		year:2004
	}
	createNew(opt, (error, result)=> {
		if(!result) return false;
		// Do some post-save stuff here
	})
*****/
function createNew(obj, cb) {
	if (checkSpace(obj.username)) {
		return cb(null, false);
	}
    else {
        User
        .findOne({username:obj.username})
        .exec((err, user) => {
            if(user) {
                return cb(null, false)
            }
            else {
                var bio = `Hey there! I'm ${obj.fn} ;)! Wish me on ${obj.day} ${obj.month}`
                var dob = (obj.day+' '+obj.month+' '+obj.year)
                var newUser = new User({
                    username:obj.username,
                    firstname:obj.fn,
                    lastname:obj.ln,
                    dob:dob,
                    bio:bio,
                    profilePic:'/images/logo/logo.png',
                    posts:[],
                    followers:[]
                });
                newUser.password = newUser.generateHash(obj.password)
                newUser.save((err, res) => {
                    return cb(err, res);
                })
            }
    
        })
    }
}

/*****
usage: 
	var opt = {
		username:'my_name',
		password:'P@sSW0rD'
	}
	checkUser(opt, (error, result) => {
		if (!result) return false;
		// Do something after log in...
	})
*****/	

function checkUser(obj, cb) {
		User
        .findOne({username:obj.username})
        .exec((err, user) => {
            if (err) return cb(err, false);
            if(user) {
                bcrypt.compare(obj.password, user.password, (err ,bool) => {
                    if(bool) { 
                    	return cb(null,  user);
                    }
                    else {
                        return cb(null,  false);
                    }
                })
                    }
                else {
                    return cb(null,  false);
                }    
                
            
    
        })
        
}

/*****
usage: 
    var opt = {
        username:'my_name'
    }
    findOne(opt, (error, result) => {
        if (!result) return false;
        // Do something after finding...
    })
*****/  

function findOne(obj, cb) {

    User
    .findOne(obj)
    .exec((err, user) => {
        if (err) return cb(err, false);
        if(user) {
            return cb(err, user);
        }
        else {
            return cb(null, false)
        }
    })
}

/*****
usage: 
   getAll((error, result) => {
        if (!result) return false;
        // Do something after...
    })
*****/  

function getAll(cb) {
    User
    .find({})
    .exec((err, users) => {
        if (err) return cb(err, false);
        if(users) {
            return cb(null, users);
        }
        else {
            return cb(null, false)
        }
    })
}

// Expose all the functions...
module.exports = {
    createNew:createNew,
    checkUser:checkUser,
    findOne:findOne,
    getAll:getAll
}