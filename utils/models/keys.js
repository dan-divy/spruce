// app/models/keys.js
// load the things we need
var mongoose = require("mongoose");
var bcrypt = require("bcrypt-nodejs");
// define the schema for our user model
mongoose.connect(require("../../config/app").db.connectionUri, {
  useNewUrlParser: true
});

var keySchema = mongoose.Schema({
  apiKey: String, // "12ojahsdbi2qwbdoihabfqyyegr8uyadf823798w791"
  invokes: Number, // 2
  stats: Array // {time:new Date(), request: reqArrayGoesHere}
});

module.exports = mongoose.model("key", keySchema);

// create the model for users and expose it to our app
