'use strict';
const mongoose = require("mongoose");
const Schema = mongoose.Schema;

require('./community');
require('./user');

const chatroomSchema = Schema({
  community: { 
    type : Schema.Types.ObjectId,
    ref: 'community' 
  },
  member: [{ 
    type : Schema.Types.ObjectId,
    ref: 'user' 
  }],
  created_at: { type: Date, default: Date.now }
});

module.exports = mongoose.model('room', chatroomSchema);