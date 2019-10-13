// app/models/analytics.js
// load the things we need

"use strict";
const mongoose = require("mongoose");
const Schema = mongoose.Schema;

require("./community");
require("./user");

var analyticsSchema = mongoose.Schema({
  name: String, // "2019-01-01"
  stats: Array // {time:new Date(), visitor: 120}
});

var model = mongoose.model("analytics", analyticsSchema);

module.exports = model;
module.exports.data = function(cb) {
  var data = [];
  let keys = Object.keys(mongoose.models);
  keys.forEach(async model => {
    let docCount = mongoose.models[model].countDocuments(function(
      err,
      docCount
    ) {
      data.push({ name: model, count: docCount });
      if (keys[keys.length - 1] == model) {
        cb(data, mongoose);
      }
    });
  });
};
// create the model for users and expose it to our app
