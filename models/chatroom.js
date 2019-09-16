'use strict';
const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const chatroomSchema = Schema({
  user_id: [{ 
    type : Schema.Types.ObjectId,
    required: [true, 'User ID is required!'],
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