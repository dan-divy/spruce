// app/models/room.js
// load the things we need
var mongoose = require("mongoose");
var bcrypt = require("bcrypt-nodejs");
// define the schema for our user model
mongoose.connect(require("../../config/app").db.connectionUri, {
  useNewUrlParser: true
});

var chatSchema = mongoose.Schema({
  id: String, // "12ojahsdbi2qwbdoihabfqyyegr8uyadf823798w791" Combined _id of users
  users: Array, // ["John", "Doe"]
  chats: Array // {txt:"Hi", by:"john", time:"10:35pm"}
});

module.exports = mongoose.model("room", chatSchema);

// create the model for users and expose it to our app
