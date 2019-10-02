'use strict';
const mongoose = require('mongoose');
const Schema = mongoose.Schema;

require('./chatroom');
require('./collection');
require('./user');

const communitySchema = Schema({
  name: {
    type: String,
    required: [true, 'Community name is required!'],
    trim: true
  },
  chatroom: { 
    type : Schema.Types.ObjectId,
    ref: 'room' 
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
  collections: [{ type : Schema.Types.ObjectId, ref: 'collection' }],
  updated_by : { type : Schema.Types.ObjectId, ref: 'user' },
  created_at : { type: Date, default: Date.now },
  updated_at : { type: Date, default: Date.now }
});

communitySchema.pre('save', function(next) {
  var community = this;
  community.updated_at = new Date();
  next();
});

module.exports = mongoose.model('community', communitySchema);