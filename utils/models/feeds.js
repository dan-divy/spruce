// utils/models/feed.js
// load the things we need
var mongoose = require('mongoose');
var bcrypt   = require('bcrypt-nodejs');

// define the schema for our user model
var feed = new mongoose.Schema({
   	author:String,
   	pudding: String,
   	likes: Number,
   	caption:String,
	//tags:String,
	type:String,
	disabledFor:Array,
	comments:Array,
	time:String,
	timeago:String
});
	

module.exports = mongoose.model('post', pudding);

// create the model for users and expose it to our app