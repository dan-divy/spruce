'use strict';
const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const chatroomSchema = Schema({
  // either a Community ID is required OR a manager ID
  community: { 
    type : Schema.Types.ObjectId,
    ref: 'user' 
  },
  manager: [{ 
    type : Schema.Types.ObjectId,
    ref: 'user' 
  }],
  member: [{ 
    type : Schema.Types.ObjectId,
    ref: 'user' 
  }],
  message: [{ 
    type : Schema.Types.ObjectId,
    required: [true, 'Message ID is required!'],
    ref: 'message' 
  }],
  created_at: { type: Date, default: Date.now }
});

module.exports = mongoose.model("room", chatroomSchema);