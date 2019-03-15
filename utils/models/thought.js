// app/models/feeds.js
// load the things we need
var mongoose = require('mongoose');
var bcrypt   = require('bcrypt-nodejs');

// define the schema for our user model
var pudding = new mongoose.Schema({
   	author:String,
   	text: String,
   	likes: Number,
   	type:String,
	disabledFor:Array,
	comments:Array,
	time:String,
	timeago:String
});
	

// methods ======================
// generating a hash
pudding.methods.generateHash = function(password) {
    return bcrypt.hashSync(password, bcrypt.genSaltSync(8), null);
};

// checking if password is valid
pudding.methods.validPassword = function(password) {
    return bcrypt.compareSync(password, this.local.password);
};

module.exports = mongoose.model('thought', pudding);

// create the model for users and expose it to our app