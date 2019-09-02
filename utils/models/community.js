'use strict';

const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const communitySchema = mongoose.Schema({
  name: String,
  description: String,
  private: Boolean,
  managers: [{ type : Schema.Types.ObjectId, ref: 'user' }],
  members: [{ type : Schema.Types.ObjectId, ref: 'user' }],
  updated_by : Schema.Types.ObjectId,
  created_at : String,
  updated_at : String
});

communitySchema.pre('save', function(next) {
  var community = this;
  community.updated_at = new Date();
  next();
});

module.exports = mongoose.model('community', communitySchema);

/*
var User = schemas.User;
User
 .find()
 .populate('friends')
 .exec(...)
*/