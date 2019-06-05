// app/models/room.js
// load the things we need
var mongoose = require('mongoose');
var bcrypt   = require('bcrypt-nodejs');
// define the schema for our user model
var chatSchema = mongoose.Schema({
    users:Array, // ["John", "Doe"]
    chats:Array // {txt:"Hi", by:"john", time:"10:35pm"}
});


module.exports = mongoose.model('room', chatSchema);

// create the model for users and expose it to our app
