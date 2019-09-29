'use strict';
const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const communitySchema = Schema({
  name: {
    type: String,
    required: [true, 'Community name is required!'],
    trim: true
  },
  description: String,
  private: { type: Boolean, default: false },
  managers: [{ 
    type : Schema.Types.ObjectId,
    required: [true, 'Community manager ID is required!'],
    ref: 'user' 
  }],
  members: [{ type : Schema.Types.ObjectId, ref: 'user' }],
  pending: [{ type : Schema.Types.ObjectId, ref: 'user' }],
  updated_by : Schema.Types.ObjectId,
  created_at : { type: Date, default: Date.now },
  updated_at : { type: Date, default: Date.now }
});

communitySchema.pre('save', function(next) {
  var community = this;
  community.updated_at = new Date();
  next();
});

module.exports = mongoose.model('community', communitySchema);