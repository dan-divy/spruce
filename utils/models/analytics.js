// app/models/analytics.js
// load the things we need
var mongoose = require("mongoose");
// define the schema for our user model
mongoose.connect(require("../../config/app").db.connectionUri, {
  useNewUrlParser: true
});

var analyticsSchema = mongoose.Schema({
  name: String, // "2019-01-01"
  stats: Object // {time:new Date(), visitor: 120}
});

module.exports = mongoose.model("analytics", analyticsSchema);

// create the model for users and expose it to our app
