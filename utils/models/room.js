// app/models/room.js
// load the things we need
var mongoose = require('mongoose');
var bcrypt   = require('bcrypt-nodejs');
// define the schema for our user model
var chatSchema = mongoose.Schema({
    users:String,
    chats:Array
});


module.exports = mongoose.model('room', chatSchema);

// create the model for users and expose it to our app